import { useState, useEffect, useCallback } from 'react';
import { C, mono, sans } from './constants/palette.js';
import { NAV, BREADCRUMB, PAGE_TITLE } from './constants/nav.js';
import { fmtTime } from './utils/dataHelpers.js';
import { parseL2OData } from './utils/l2oAdapter.js';
import { enrichWithLLM } from './utils/llmEnrich.js';
import L2O_RAW from './data/l2o_rows.json';
import DataUploadModal, { loadSavedRows, clearSavedRows } from './components/DataUploadModal.jsx';

/* Parse real data — from localStorage upload or bundled sample */
function initL2O() {
  const saved = loadSavedRows();
  return saved ? parseL2OData(saved) : parseL2OData(L2O_RAW.rows);
}
const SAMPLE_FILE_NAME = 'sample · lead_to_order_observability_rows.json';

import Logo from './components/Logo.jsx';
import DeployModal from './components/DeployModal.jsx';
import ExportReportModal from './components/ExportReportModal.jsx';
import { LearningPanel } from './components/panels.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

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
import PageBizCompliance   from './pages/business/PageBizCompliance.jsx';
import PageBizTeamImpact   from './pages/business/PageBizTeamImpact.jsx';

// L2O pages
import PageL2OPipeline     from './pages/l2o/PageL2OPipeline.jsx';
import PageL2OTraceExplorer from './pages/l2o/PageL2OTraceExplorer.jsx';
import PageL2OGuardrails   from './pages/l2o/PageL2OGuardrails.jsx';
import PageL2OFeedback     from './pages/l2o/PageL2OFeedback.jsx';

const ACCENT = '#009ADA';

/* ── L2O nav section (injected into Technical view) ── */
const L2O_NAV_SECTION = {
  section: 'Lead-to-Order (Live)',
  items: [
    { id: 'l2o-pipeline',  icon: '⟶', label: 'L2O Pipeline'    },
    { id: 'l2o-traces',   icon: '◎', label: 'Trace Explorer'   },
    { id: 'l2o-guardrails',icon: '⊛', label: 'Guardrails'      },
    { id: 'l2o-feedback', icon: '◈', label: 'AI Feedback'      },
  ],
};

/* ── Business nav ── */
const BIZ_NAV = [
  { section: 'Executive', items: [
    { id: 'biz-overview',   icon: '⬡', label: 'Executive Summary' },
    { id: 'biz-perf',       icon: '◑', label: 'Performance'       },
    { id: 'biz-cost',       icon: '⊘', label: 'Cost & ROI'        },
    { id: 'biz-approvals',  icon: '⤵', label: 'Approvals',  count: () => 6, alert: true },
  ]},
  { section: 'Operations & Trust', items: [
    { id: 'biz-team',       icon: '◫', label: 'Team Impact'        },
    { id: 'biz-compliance', icon: '⊟', label: 'Compliance & Audit' },
  ]},
];

const BIZ_TITLE = {
  'biz-overview':   'Executive Summary',
  'biz-perf':       'Performance',
  'biz-cost':       'Cost & ROI',
  'biz-approvals':  'Approvals',
  'biz-team':       'Team Impact',
  'biz-compliance': 'Compliance & Audit',
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
  const [view, setView]               = useState('technical');
  const [l2oData, setL2oData]         = useState(initL2O);
  const [enriched, setEnriched]       = useState(null);    // LLM-computed fields
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState('');  // status message
  const [showDeploy, setShowDeploy]   = useState(false);
  const [showReport, setShowReport]   = useState(false);
  const [theme, setTheme]             = useState('light');
  const [clock, setClock]             = useState(fmtTime);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(() => loadSavedRows() ? 'uploaded data' : null);
  const [showUpload, setShowUpload]   = useState(false);

  /* Run LLM enrichment whenever l2oData changes */
  const runEnrichment = useCallback(async (data) => {
    setEnrichLoading(true);
    setEnrichProgress('Enriching with AI…');
    try {
      const result = await enrichWithLLM(data, (step, total, label) => {
        setEnrichProgress(`[${step}/${total}] ${label}`);
      });
      setEnriched(result);
    } catch (err) {
      console.warn('LLM enrichment failed:', err.message);
      setEnriched(null);
    } finally {
      setEnrichLoading(false);
      setEnrichProgress('');
    }
  }, []);

  /* Enrich on first load */
  useEffect(() => { runEnrichment(l2oData); }, []); // eslint-disable-line

  // Hash-based routing — sync page ↔ URL so back/forward works
  useEffect(() => {
    const onHashChange = () => {
      const h = window.location.hash.slice(1);
      if (!h) return;
      if (h.startsWith('biz-')) setView('business');
      else setView('technical');
      setPage(h);
    };
    window.addEventListener('hashchange', onHashChange);
    const initial = window.location.hash.slice(1);
    if (initial) {
      if (initial.startsWith('biz-')) setView('business');
      setPage(initial);
    }
    // Close drawer on any hash navigation
    window.addEventListener('hashchange', () => setSidebarOpen(false));
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => { window.location.hash = page; }, [page]);

  useEffect(() => { document.documentElement.className = theme === 'light' ? 'light' : ''; }, [theme]);
  useEffect(() => { const id = setInterval(() => setClock(fmtTime()), 1000); return () => clearInterval(id); }, []);

  /* ── Handle new data upload ── */
  const handleDataUpload = useCallback((parsed) => {
    const src = parsed || parseL2OData(L2O_RAW.rows);
    setL2oData(src);
    if (!parsed) {
      clearSavedRows();
      setUploadedFileName(null);
    } else {
      setUploadedFileName('uploaded data');
    }
    setPage('overview');
    runEnrichment(src);   // re-enrich with new data
  }, [runEnrichment]);

  const st = {
    // All from real data only
    agents:      l2oData.agents,
    metrics:     l2oData.metrics,
    logs:        l2oData.logs,
    events:      l2oData.events,
    handoffs:    l2oData.handoffs,
    // Derived analytics (math, no fabrication)
    throughput:  l2oData.throughputSeries,
    failDist:    l2oData.failDist,
    confByType:  l2oData.confByType,
    heatmapData: l2oData.heatmapData,
    // L2O-specific
    sessions:    l2oData.sessions,
    guardrails:  l2oData.guardrails,
    toolCalls:   l2oData.toolCalls,
    llmCalls:    l2oData.llmCalls,
    feedback:    l2oData.feedback,
    pipeline:    l2oData.pipeline,
    intentDist:  l2oData.intentDist,
    modelDist:   l2oData.modelDist,
    spans:       l2oData.spans,
    // LLM-enriched fields (null while loading)
    agentRiskScores:   enriched?.agentRiskScores   ?? null,
    sessionInsights:   enriched?.sessionInsights   ?? null,
    alertItems:        enriched?.alertItems        ?? null,
    executiveBullets:  enriched?.executiveBullets  ?? null,
    taskQueueItems:    enriched?.taskQueueItems    ?? null,
    // Enrichment status
    enrichLoading,
    enrichProgress,
  };

  /* ── Page routing ── */
  const pageEl = (() => {
    if (view === 'business') {
      switch (page) {
        case 'biz-overview':  return <PageBizOverview st={st} />;
        case 'biz-perf':      return <PageBizPerformance st={st} />;
        case 'biz-cost':      return <PageBizCost st={st} />;
        case 'biz-approvals':  return <PageBizApprovals st={st} />;
      case 'biz-team':       return <PageBizTeamImpact st={st} />;
      case 'biz-compliance': return <PageBizCompliance st={st} />;
        default:              return <PageBizOverview st={st} />;
      }
    }
    switch (page) {
      case 'overview':   return <PageOverview st={st} />;
      case 'fleet':      return <PageAgentFleet st={st} />;
      case 'queue':      return <PageTaskQueue st={st} />;
      case 'alerts':     return <PageAlerts st={st} />;
      case 'telemetry':  return <PageTelemetry st={st} />;
      case 'failures':   return <PageFailureExplorer st={st} />;
      case 'confidence': return <PageConfidence st={st} />;
      case 'learning':   return <LearningPanel st={st} />;
      case 'handoffs':   return <PageHandoffs st={st} />;
      case 'cost':       return <PageCostTokens st={st} />;
      case 'settings':   return <PageSettings />;
      case 'l2o-pipeline':   return <PageL2OPipeline st={st} />;
      case 'l2o-traces':     return <PageL2OTraceExplorer st={st} />;
      case 'l2o-guardrails': return <PageL2OGuardrails st={st} />;
      case 'l2o-feedback':   return <PageL2OFeedback st={st} />;
      default:           return <div style={{ color:C.mu, fontFamily:mono, fontSize:12 }}>Page not found</div>;
    }
  })();

  const activeNav  = view === 'business' ? BIZ_NAV
    : [...NAV, L2O_NAV_SECTION];
  const pageTitle  = view === 'business' ? (BIZ_TITLE[page] || 'Executive Summary') : (PAGE_TITLE[page] || page);
  const breadcrumb = view === 'business' ? (BIZ_TITLE[page] || 'Executive Summary') : (BREADCRUMB[page] || page);

  const isBiz = view === 'business';

  return (
    <div className="app-shell" style={{ background:C.bg, fontFamily:sans, color:C.tx, fontSize:13 }}>

      {/* ── TOPBAR ── */}
      <div style={{ gridColumn:'1/-1', background:C.sf, borderBottom:`1px solid ${C.b}`, display:'flex', alignItems:'center', padding:'0 16px', gap:10, position:'sticky', top:0, zIndex:100, height:'var(--topbar-h)' }}>
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Toggle menu"
          style={{ display:'none', flexDirection:'column', gap:4, padding:'6px', background:'transparent', border:'none', cursor:'pointer', flexShrink:0 }}
          className="hamburger"
        >
          <span style={{ display:'block', width:18, height:2, background:C.mu, borderRadius:1, transition:'all .2s', transform: sidebarOpen ? 'rotate(45deg) translate(4px,4px)' : 'none' }} />
          <span style={{ display:'block', width:18, height:2, background:C.mu, borderRadius:1, transition:'all .2s', opacity: sidebarOpen ? 0 : 1 }} />
          <span style={{ display:'block', width:18, height:2, background:C.mu, borderRadius:1, transition:'all .2s', transform: sidebarOpen ? 'rotate(-45deg) translate(4px,-4px)' : 'none' }} />
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Logo />
          <div style={{ width:1, height:20, background:C.b2, flexShrink:0 }} />
          <div style={{ width:6, height:6, borderRadius:'50%', background:C.gr, boxShadow:`0 0 7px ${C.gr}`, animation:'pulse 2s ease-in-out infinite', flexShrink:0 }} />
        </div>
        <div className="topbar-breadcrumb-sep" style={{ width:1, height:20, background:C.b2, flexShrink:0 }} />
        <span className="topbar-breadcrumb-label" style={{ fontFamily:mono, fontSize:12, color:C.mu, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', minWidth:0 }}>{breadcrumb}</span>

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          {/* View toggle */}
          <ViewToggle view={view} onChange={v => { setView(v); setPage(v === 'business' ? 'biz-overview' : 'overview'); setSidebarOpen(false); }} />

          <div className="topbar-env-badges" style={{ alignItems:'center', gap:8 }}>
            <div style={{ width:1, height:20, background:C.b2 }} />
            <span style={{ fontFamily:mono, fontSize:11, padding:'3px 10px', borderRadius:2, border:`1px solid ${C.b2}`, color:C.mu }}>prod-us-east-1</span>
            <span style={{ fontFamily:mono, fontSize:11, padding:'3px 10px', borderRadius:2, border:`1px solid ${C.grBd}`, color:C.gr, background:C.grBg }}>● LIVE</span>
            <span style={{ fontFamily:mono, fontSize:11, color:C.mu }}>{clock}</span>
          </div>
          <button
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            style={{ display:'flex', alignItems:'center', gap:6, fontFamily:mono, fontSize:11, padding:'4px 10px', borderRadius:3, border:`1px solid ${C.b2}`, background:'transparent', color:C.mu, cursor:'pointer', transition:'all .2s', flexShrink:0 }}
          >
            {theme === 'dark' ? '☀︎' : '☾'}
          </button>
        </div>
      </div>

      {/* Overlay behind drawer on mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ── SIDEBAR ── */}
      <nav className={`sidebar-drawer${sidebarOpen ? ' open' : ''}`} style={{ background:C.sf, borderRight:`1px solid ${C.b}`, padding:'16px 0', display:'flex', flexDirection:'column' }}>
        {/* View label in sidebar */}
        <div style={{ margin:'0 12px 12px', padding:'8px 12px', borderRadius:4, background: isBiz ? 'rgba(0,154,218,.1)' : 'rgba(167,139,250,.1)', border:`1px solid ${isBiz ? 'rgba(0,154,218,.25)' : 'rgba(167,139,250,.25)'}` }}>
          <div style={{ fontFamily:mono, fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', color: isBiz ? ACCENT : C.pu, marginBottom:2 }}>{isBiz ? 'Business View' : 'Technical View'}</div>
          <div style={{ fontFamily:sans, fontSize:11, color:C.mu }}>{isBiz ? 'For executives & heads' : 'For engineers & devops'}</div>
        </div>

        {activeNav.map(section => (
          <div key={section.section}>
            <div style={{ fontFamily:mono, fontSize:10, letterSpacing:'.1em', color:C.dm, padding:'12px 20px 6px', textTransform:'uppercase' }}>{section.section}</div>
            {section.items.map(item => (
              <div key={item.id} onClick={() => { setPage(item.id); setSidebarOpen(false); }} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 20px', fontSize:13, color:page===item.id?C.tx:C.mu, cursor:'pointer', background:page===item.id?'rgba(255,255,255,.05)':'transparent', borderLeft:`2px solid ${page===item.id ? (isBiz ? ACCENT : C.bl) : 'transparent'}`, transition:'all .15s' }}>
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

        <div style={{ marginTop:'auto', borderTop:`1px solid ${C.b}` }}>
          {/* Upload data button */}
          <button
            onClick={() => setShowUpload(true)}
            style={{
              display:'flex', alignItems:'center', gap:8, width:'100%',
              padding:'12px 20px', background:'transparent', border:'none',
              borderBottom:`1px solid ${C.b}`, cursor:'pointer',
              fontFamily:mono, fontSize:11, color: uploadedFileName ? ACCENT : C.mu,
              transition:'all .15s',
            }}
          >
            <span style={{ fontSize:13 }}>⬆</span>
            <span style={{ flex:1, textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {uploadedFileName ? uploadedFileName : 'Upload Observability Data'}
            </span>
            {uploadedFileName && <span style={{ fontSize:9, opacity:.6 }}>●</span>}
          </button>
          <div style={{ padding:'12px 20px', fontFamily:mono, fontSize:11, color:C.dm, lineHeight:1.7 }}>
            {st.agents.map(a => `${a.name} v${a.version}`).join(' · ')}<br />
            {st.sessions.length} sessions · {st.metrics.sessionCount} total
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="app-main" style={{ padding:24, overflowY:'auto' }}>
        <ErrorBoundary key={page}>
        <div className="page-header">
          <div>
            <div style={{ fontSize:20, fontWeight:300, letterSpacing:'-.01em' }}>{pageTitle}</div>
            <div style={{ color:C.mu, fontSize:12, marginTop:4, fontFamily:mono }}>
              {isBiz
                ? `LevelShift AI Platform · ${st.agents.length} agents · ${st.agents.filter(a=>a.status==='running').length} running`
                : page === 'overview' ? `agent_fleet · ${st.agents.length} agents · ${st.agents.filter(a=>a.status==='running').length} running · real data`
                : page === 'fleet'    ? `${st.agents.filter(a=>a.status==='running').length} running · ${st.agents.filter(a=>a.status==='failed').length} failed`
                : `${new Date().toLocaleDateString()} · prod-us-east-1`}
            </div>
          </div>
          <div className="page-header-actions">
            <button style={{ fontFamily:mono, fontSize:11, padding:'6px 14px', borderRadius:3, border:`1px solid ${C.b2}`, background:'transparent', color:C.mu, cursor:'pointer' }}>↺ Refresh</button>
            {!isBiz && <button onClick={() => setShowReport(true)} style={{ fontFamily:mono, fontSize:11, padding:'6px 14px', borderRadius:3, border:`1px solid ${C.b2}`, background:'transparent', color:C.mu, cursor:'pointer' }}>⬇ Export</button>}
            {isBiz
              ? <button onClick={() => setShowReport(true)} style={{ fontFamily:mono, fontSize:11, padding:'6px 16px', borderRadius:3, border:`1px solid ${ACCENT}44`, background:`rgba(0,154,218,.1)`, color:ACCENT, cursor:'pointer' }}>⬇ Export Report</button>
              : <button onClick={() => page !== 'settings' && setShowDeploy(true)} style={{ fontFamily:mono, fontSize:11, padding:'6px 14px', borderRadius:3, border:`1px solid ${C.blBd}`, background:C.blBg, color:C.bl, cursor:'pointer' }}>
                  {page === 'settings' ? '💾 Save' : '+ Deploy Agent'}
                </button>
            }
          </div>
        </div>
          {pageEl}
        </ErrorBoundary>
      </main>

      {showDeploy && <DeployModal onClose={() => setShowDeploy(false)} onDeploy={() => {}} />}
      {showReport && <ExportReportModal st={st} mode={isBiz ? 'business' : 'technical'} onClose={() => setShowReport(false)} />}
      {showUpload && (
        <DataUploadModal
          currentFileName={uploadedFileName || null}
          onLoad={(parsed) => { handleDataUpload(parsed); }}
          onClose={() => setShowUpload(false)}
        />
      )}
      {/* LLM enrichment progress indicator */}
      {enrichLoading && (
        <div style={{ position:'fixed', bottom:20, right:20, zIndex:999, background:C.sf, border:`1px solid ${C.b2}`, borderRadius:8, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, fontFamily:mono, fontSize:11, color:C.mu, boxShadow:'0 4px 20px rgba(0,0,0,.15)' }}>
          <span style={{ color:'#009ADA', animation:'pulse 1s ease-in-out infinite' }}>⟳</span>
          {enrichProgress || 'AI enrichment running…'}
        </div>
      )}
    </div>
  );
}
