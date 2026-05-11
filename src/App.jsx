import { useState, useEffect, useCallback } from 'react';
import { C, mono, sans } from './constants/palette.js';
import { NAV, BREADCRUMB, PAGE_TITLE } from './constants/nav.js';
import { STATUSES } from './constants/agentDefs.js';
import {
  makeAgents, makeMetrics, makeLogLine, makeEvent,
  makeHandoff, makeThroughput, makeFailDist, makeConfByType,
  rnd, pick, fmtTime, fmtMs,
} from './utils/dataHelpers.js';

import Logo from './components/Logo.jsx';
import DeployModal from './components/DeployModal.jsx';
import { LearningPanel } from './components/panels.jsx';

// Technical pages
import PageOverview        from './pages/PageOverview.jsx';
import PageAgentFleet      from './pages/PageAgentFleet.jsx';
import PageTaskQueue       from './pages/PageTaskQueue.jsx';
import PageAlerts          from './pages/PageAlerts.jsx';
import PageTelemetry       from './pages/PageTelemetry.jsx';
import PageFailureExplorer from './pages/PageFailureExplorer.jsx';
import PageConfidence      from './pages/PageConfidence.jsx';
import PageHandoffs        from './pages/PageHandoffs.jsx';
import PageCostTokens      from './pages/PageCostTokens.jsx';
import PageSettings        from './pages/PageSettings.jsx';

// Business pages
import PageBizOverview     from './pages/business/PageBizOverview.jsx';
import PageBizPerformance  from './pages/business/PageBizPerformance.jsx';
import PageBizCost         from './pages/business/PageBizCost.jsx';
import PageBizApprovals    from './pages/business/PageBizApprovals.jsx';

const ACCENT = '#009ADA';

/* ── Business nav ── */
const BIZ_NAV = [
  { section: 'Executive', items: [
    { id: 'biz-overview',   icon: '⬡', label: 'Executive Summary' },
    { id: 'biz-perf',       icon: '◑', label: 'Performance'       },
    { id: 'biz-cost',       icon: '⊘', label: 'Cost & ROI'        },
    { id: 'biz-approvals',  icon: '⤵', label: 'Approvals',  count: () => 6, alert: true },
  ]},
];

const BIZ_TITLE = {
  'biz-overview':  'Executive Summary',
  'biz-perf':      'Performance',
  'biz-cost':      'Cost & ROI',
  'biz-approvals': 'Approvals',
};

/* ── View toggle button ── */
function ViewToggle({ view, onChange }) {
  return (
    <div style={{ display: 'flex', border: `1px solid ${C.b2}`, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
      {[
        { key: 'business',   label: '◈ Business',  title: 'Executive KPIs & insights' },
        { key: 'technical',  label: '⌘ Technical', title: 'Full engineering telemetry' },
      ].map(v => (
        <button
          key={v.key}
          title={v.title}
          onClick={() => onChange(v.key)}
          style={{
            fontFamily: mono, fontSize: 11, padding: '5px 14px',
            border: 'none', cursor: 'pointer', transition: 'all .15s',
            background: view === v.key ? ACCENT : 'transparent',
            color: view === v.key ? '#fff' : C.mu,
            fontWeight: view === v.key ? 500 : 400,
          }}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [page, setPage]               = useState('overview');
  const [view, setView]               = useState('technical');  // 'business' | 'technical'
  const [agents, setAgents]           = useState(makeAgents);
  const [metrics, setMetrics]         = useState(makeMetrics);
  const [logs, setLogs]               = useState(() => Array.from({ length: 8 }, makeLogLine));
  const [events, setEvents]           = useState(() => Array.from({ length: 6 }, makeEvent));
  const [throughput, setThroughput]   = useState(makeThroughput);
  const [failDist]                    = useState(makeFailDist);
  const [confByType, setConfByType]   = useState(makeConfByType);
  const [handoffs]                    = useState(() => Array.from({ length: 12 }, makeHandoff));
  const [tick, setTick]               = useState(0);
  const [showDeploy, setShowDeploy]   = useState(false);
  const [theme, setTheme]             = useState('light');
  const [clock, setClock]             = useState(fmtTime);

  // Switch to correct default page when view changes
  useEffect(() => {
    if (view === 'business') setPage('biz-overview');
    else setPage('overview');
  }, [view]);

  useEffect(() => { document.documentElement.className = theme === 'light' ? 'light' : ''; }, [theme]);
  useEffect(() => { const id = setInterval(() => setClock(fmtTime()), 1000); return () => clearInterval(id); }, []);

  const handleDeployAgent = useCallback((cfg) => {
    const typeMap = { BRAND_AMBASSADOR:'support', ANALYST:'analytics', ADVISOR:'report_gen', CONCIERGE:'support', ENGINEER:'data_enrich', EXECUTIVE:'report_gen' };
    const newAgent = {
      id: `agt_${Math.random().toString(16).slice(2,6)}`,
      name: cfg.name, model: cfg.model,
      type: typeMap[cfg.persona] || 'analytics',
      status: 'running', step: 1, totalSteps: Math.max(7, cfg.max_iterations),
      conf: Math.min(.99, cfg.conf_min + 0.08 + Math.random() * .10),
      tasks: 0, errors: 0, latency: rnd(300, 1400), tokenCost: 0,
      _deployed: true, _persona: cfg.persona,
      _tools: cfg.tools, _melt: cfg.melt_layers, _conf_min: cfg.conf_min,
    };
    setAgents(prev => [...prev, newAgent]);
    setEvents(prev => [{
      color: C.gr, title: `${cfg.name} deployed`,
      desc: `${cfg.persona} · ${cfg.model} · ${cfg.tools.length} tools · MELT ${cfg.melt_layers.length} layers`,
      ts: fmtMs(), id: Math.random(),
    }, ...prev.slice(0, 9)]);
    setPage('fleet');
    setView('technical');
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setAgents(prev => {
        const idx = rnd(1, prev.length);
        return prev.map((a, i) => i === idx ? {
          ...a,
          status: Math.random() > .95 ? pick(STATUSES) : a.status,
          step: Math.min(a.totalSteps, a.step + (Math.random() > .85 ? 1 : 0)),
          conf: Math.max(.05, Math.min(.99, a.conf + (Math.random() - .5) * .015)),
          tasks: a.tasks + (Math.random() > .7 ? 1 : 0),
          errors: a.errors + (Math.random() > .93 ? 1 : 0),
        } : a);
      });
      if (Math.random() > .4) setLogs(prev => [makeLogLine(), ...prev.slice(0, 30)]);
      if (Math.random() > .8)  setEvents(prev => [makeEvent(), ...prev.slice(0, 9)]);
      setMetrics(prev => ({
        tasks: prev.tasks + rnd(0, 1),
        success: Math.max(88, Math.min(99, +(prev.success + (Math.random() - .5) * .06).toFixed(1))),
        latency: Math.max(1, +(prev.latency + (Math.random() - .5) * .05).toFixed(1)),
        handoffs: Math.max(0, prev.handoffs + (Math.random() > .9 ? 1 : Math.random() > .95 ? -1 : 0)),
        cost: +(prev.cost + Math.random() * .008).toFixed(2),
        toolCalls: prev.toolCalls + rnd(0, 2),
      }));
      setConfByType(prev => {
        if (tick % 8 !== 0) return prev;
        const next = { ...prev };
        const k = pick(Object.keys(next));
        next[k] = Math.max(.1, Math.min(.98, next[k] + (Math.random() - .5) * .025));
        return next;
      });
      setThroughput(prev => {
        const n = [...prev];
        n[n.length - 1] = Math.max(5, n[n.length - 1] + rnd(-2, 3));
        return n;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [tick]);

  const st = { agents, metrics, logs, events, throughput, failDist, confByType, handoffs };

  /* ── Page routing ── */
  const pageEl = (() => {
    if (view === 'business') {
      switch (page) {
        case 'biz-overview':  return <PageBizOverview st={st} />;
        case 'biz-perf':      return <PageBizPerformance st={st} />;
        case 'biz-cost':      return <PageBizCost st={st} />;
        case 'biz-approvals': return <PageBizApprovals st={st} />;
        default:              return <PageBizOverview st={st} />;
      }
    }
    switch (page) {
      case 'overview':   return <PageOverview st={st} />;
      case 'fleet':      return <PageAgentFleet st={st} />;
      case 'queue':      return <PageTaskQueue />;
      case 'alerts':     return <PageAlerts />;
      case 'telemetry':  return <PageTelemetry st={st} />;
      case 'failures':   return <PageFailureExplorer />;
      case 'confidence': return <PageConfidence st={st} />;
      case 'learning':   return <LearningPanel />;
      case 'handoffs':   return <PageHandoffs st={st} />;
      case 'cost':       return <PageCostTokens st={st} />;
      case 'settings':   return <PageSettings />;
      default:           return <div style={{ color:C.mu, fontFamily:mono, fontSize:12 }}>Page not found</div>;
    }
  })();

  const activeNav  = view === 'business' ? BIZ_NAV : NAV;
  const pageTitle  = view === 'business' ? (BIZ_TITLE[page] || 'Executive Summary') : (PAGE_TITLE[page] || page);
  const breadcrumb = view === 'business' ? (BIZ_TITLE[page] || 'Executive Summary') : (BREADCRUMB[page] || page);

  const isBiz = view === 'business';

  return (
    <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gridTemplateRows:'48px 1fr', minHeight:'100vh', background:C.bg, fontFamily:sans, color:C.tx, fontSize:13 }}>

      {/* ── TOPBAR ── */}
      <div style={{ gridColumn:'1/-1', background:C.sf, borderBottom:`1px solid ${C.b}`, display:'flex', alignItems:'center', padding:'0 20px', gap:14, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Logo />
          <div style={{ width:1, height:20, background:C.b2, flexShrink:0 }} />
          <div style={{ width:6, height:6, borderRadius:'50%', background:C.gr, boxShadow:`0 0 7px ${C.gr}`, animation:'pulse 2s ease-in-out infinite', flexShrink:0 }} />
        </div>
        <div style={{ width:1, height:20, background:C.b2 }} />
        <span style={{ fontFamily:mono, fontSize:12, color:C.mu }}>{breadcrumb}</span>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:12 }}>
          {/* View toggle — central UI element */}
          <ViewToggle view={view} onChange={v => setView(v)} />

          <div style={{ width:1, height:20, background:C.b2 }} />
          <span style={{ fontFamily:mono, fontSize:11, padding:'3px 10px', borderRadius:2, border:`1px solid ${C.b2}`, color:C.mu }}>prod-us-east-1</span>
          <span style={{ fontFamily:mono, fontSize:11, padding:'3px 10px', borderRadius:2, border:`1px solid ${C.grBd}`, color:C.gr, background:C.grBg }}>● LIVE</span>
          <span style={{ fontFamily:mono, fontSize:11, color:C.mu }}>{clock}</span>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{ display:'flex', alignItems:'center', gap:6, fontFamily:mono, fontSize:11, padding:'4px 12px', borderRadius:3, border:`1px solid ${C.b2}`, background:'transparent', color:C.mu, cursor:'pointer', transition:'all .2s', flexShrink:0 }}
          >
            {theme === 'dark' ? '☀︎ Light' : '☾ Dark'}
          </button>
        </div>
      </div>

      {/* ── SIDEBAR ── */}
      <nav style={{ background:C.sf, borderRight:`1px solid ${C.b}`, padding:'16px 0', display:'flex', flexDirection:'column', position:'sticky', top:48, height:'calc(100vh - 48px)', overflowY:'auto' }}>
        {/* View label in sidebar */}
        <div style={{ margin:'0 12px 12px', padding:'8px 12px', borderRadius:4, background: isBiz ? 'rgba(0,154,218,.1)' : 'rgba(167,139,250,.1)', border:`1px solid ${isBiz ? 'rgba(0,154,218,.25)' : 'rgba(167,139,250,.25)'}` }}>
          <div style={{ fontFamily:mono, fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', color: isBiz ? ACCENT : C.pu, marginBottom:2 }}>{isBiz ? 'Business View' : 'Technical View'}</div>
          <div style={{ fontFamily:sans, fontSize:11, color:C.mu }}>{isBiz ? 'For executives & heads' : 'For engineers & devops'}</div>
        </div>

        {activeNav.map(section => (
          <div key={section.section}>
            <div style={{ fontFamily:mono, fontSize:10, letterSpacing:'.1em', color:C.dm, padding:'12px 20px 6px', textTransform:'uppercase' }}>{section.section}</div>
            {section.items.map(item => (
              <div key={item.id} onClick={() => setPage(item.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 20px', fontSize:13, color:page===item.id?C.tx:C.mu, cursor:'pointer', background:page===item.id?'rgba(255,255,255,.05)':'transparent', borderLeft:`2px solid ${page===item.id ? (isBiz ? ACCENT : C.bl) : 'transparent'}`, transition:'all .15s' }}>
                <span style={{ width:16, textAlign:'center', fontSize:14, opacity:.7 }}>{item.icon}</span>
                {item.label}
                {item.count && (
                  <span style={{ marginLeft:'auto', fontFamily:mono, fontSize:10, padding:'1px 6px', borderRadius:10, background:item.alert?C.reBg:C.sf2, color:item.alert?C.re:C.mu }}>
                    {item.count()}
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}

        <div style={{ marginTop:'auto', padding:'16px 20px', borderTop:`1px solid ${C.b}`, fontFamily:mono, fontSize:11, color:C.dm, lineHeight:1.7 }}>
          v2.4.1 · build 20f3a91<br />Last deploy: 2h ago
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main style={{ padding:24, overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:20, fontWeight:300, letterSpacing:'-.01em' }}>{pageTitle}</div>
            <div style={{ color:C.mu, fontSize:12, marginTop:4, fontFamily:mono }}>
              {isBiz
                ? `LevelShift AI Platform · ${agents.length} agents · ${agents.filter(a=>a.status==='running').length} running`
                : page === 'overview' ? `agent_fleet · ${agents.length} agents (1 lead + ${agents.length-1} workers) · refreshed every 5s`
                : page === 'fleet'    ? `${agents.filter(a=>a.status==='running').length} running · ${agents.filter(a=>a.status==='failed').length} failed`
                : `${new Date().toLocaleDateString()} · prod-us-east-1`}
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={{ fontFamily:mono, fontSize:11, padding:'6px 14px', borderRadius:3, border:`1px solid ${C.b2}`, background:'transparent', color:C.mu, cursor:'pointer' }}>↺ Refresh</button>
            {!isBiz && <button style={{ fontFamily:mono, fontSize:11, padding:'6px 14px', borderRadius:3, border:`1px solid ${C.b2}`, background:'transparent', color:C.mu, cursor:'pointer' }}>⬇ Export</button>}
            {isBiz
              ? <button style={{ fontFamily:mono, fontSize:11, padding:'6px 16px', borderRadius:3, border:`1px solid ${ACCENT}44`, background:`rgba(0,154,218,.1)`, color:ACCENT, cursor:'pointer' }}>⬇ Export Report</button>
              : <button onClick={() => page !== 'settings' && setShowDeploy(true)} style={{ fontFamily:mono, fontSize:11, padding:'6px 14px', borderRadius:3, border:`1px solid ${C.blBd}`, background:C.blBg, color:C.bl, cursor:'pointer' }}>
                  {page === 'settings' ? '💾 Save' : '+ Deploy Agent'}
                </button>
            }
          </div>
        </div>
        {pageEl}
      </main>

      {showDeploy && <DeployModal onClose={() => setShowDeploy(false)} onDeploy={handleDeployAgent} />}
    </div>
  );
}
