import { C, mono, sans } from '../../constants/palette.js';
import { rnd } from '../../utils/dataHelpers.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

function KpiTile({ label, value, sub, trend, trendDir, accent = ACCENT }) {
  const tCol = trendDir === 'up' ? '#22c55e' : trendDir === 'down' ? '#ef4444' : C.mu;
  return (
    <div style={{ background: C.sf, border: `1px solid ${C.b}`, borderRadius: 6, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div style={{ fontFamily: sans, fontSize: 12, color: C.mu, marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ fontFamily: sans, fontSize: 32, fontWeight: 300, color: C.tx, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: mono, fontSize: 11, color: C.mu, marginTop: 8 }}>{sub}</div>}
      {trend && <div style={{ fontFamily: mono, fontSize: 11, color: tCol, marginTop: 4 }}>{trend}</div>}
    </div>
  );
}

function AgentHealthRow({ name, role, health, tasks, note }) {
  const dot = health === 'healthy' ? '#22c55e' : health === 'attention' ? '#f59e0b' : '#ef4444';
  const label = health === 'healthy' ? 'Healthy' : health === 'attention' ? 'Needs review' : 'Issue';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: `1px solid ${C.b}` }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0, boxShadow: `0 0 6px ${dot}` }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: C.tx }}>{name}</div>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginTop: 2 }}>{role}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: C.tx }}>{tasks.toLocaleString()} tasks</div>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginTop: 2 }}>{note}</div>
      </div>
      <div style={{ fontFamily: mono, fontSize: 10, padding: '3px 10px', borderRadius: 20, background: dot + '18', color: dot, border: `1px solid ${dot}44`, flexShrink: 0 }}>{label}</div>
    </div>
  );
}

function OutcomeItem({ icon, title, desc, time, color }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.b}` }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: color + '18', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: C.tx, marginBottom: 2 }}>{title}</div>
        <div style={{ fontFamily: sans, fontSize: 11, color: C.mu }}>{desc}</div>
      </div>
      <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, flexShrink: 0 }}>{time}</div>
    </div>
  );
}

function MiniBar({ label, value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: sans, fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: C.mu }}>{label}</span>
        <span style={{ color: C.tx, fontWeight: 500 }}>{value.toLocaleString()}</span>
      </div>
      <div style={{ height: 6, background: C.sf2, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .6s ease' }} />
      </div>
    </div>
  );
}

export default function PageBizOverview({ st }) {
  const { agents, metrics, events, handoffs } = st;
  const running = agents.filter(a => a.status === 'running').length;
  const issues  = agents.filter(a => ['failed', 'review'].includes(a.status)).length;
  const hoursSaved = Math.round(metrics.tasks * 0.27);
  const roi = (metrics.tasks * 0.014 * 18.4).toFixed(0);
  const pending = handoffs.filter(h => h.status === 'pending').length;

  const agentSummary = [
    { name: 'Lead Orchestrator',        role: 'Routes & coordinates all automation',   health: 'healthy',   tasks: agents[0]?.tasks || 920,   note: 'Always on · dispatching' },
    { name: 'Order Processing',         role: 'Processes customer orders end-to-end',   health: 'healthy',   tasks: agents[1]?.tasks || 280,   note: '99.1% success rate' },
    { name: 'Report Generation',        role: 'Produces scheduled business reports',    health: 'healthy',   tasks: agents[2]?.tasks || 140,   note: 'On schedule' },
    { name: 'Data Enrichment',          role: 'Augments records with external data',    health: 'attention', tasks: agents[3]?.tasks || 95,    note: 'Low confidence · review' },
    { name: 'Email Drafting',           role: 'Composes customer communications',       health: 'healthy',   tasks: agents[4]?.tasks || 210,   note: '94% approved as-is' },
    { name: 'Invoice Parsing',          role: 'Extracts invoice data for ERP',          health: 'attention', tasks: agents[5]?.tasks || 60,    note: 'Prompt update pending' },
    { name: 'CRM Sync',                 role: 'Keeps CRM records up to date',           health: 'healthy',   tasks: agents[6]?.tasks || 175,   note: 'Real-time sync active' },
    { name: 'Support Triage',           role: 'Categorises and routes support tickets', health: 'healthy',   tasks: agents[7]?.tasks || 190,   note: '6.2 min avg response' },
    { name: 'Analytics',                role: 'Generates insights from operational data',health:'healthy',   tasks: agents[8]?.tasks || 155,   note: 'Daily summaries live' },
  ];

  const outcomes = [
    { icon: '✓', title: 'Order batch completed',            desc: '142 orders processed · zero errors',               time: '2m ago',  color: '#22c55e' },
    { icon: '✓', title: 'Weekly performance report ready',  desc: 'Distributed to 12 stakeholders automatically',     time: '18m ago', color: '#22c55e' },
    { icon: '⚑', title: 'Invoice requires human review',    desc: '3 invoices flagged · low match confidence',        time: '34m ago', color: '#f59e0b' },
    { icon: '✓', title: 'CRM records enriched',             desc: '1,840 accounts updated with firmographic data',    time: '51m ago', color: '#22c55e' },
    { icon: '✓', title: '94 support tickets triaged',       desc: 'Avg response time 6.2 min · SLA met',             time: '1h ago',  color: '#22c55e' },
    { icon: '⚑', title: 'Human approval requested',         desc: 'Order amendment exceeds auto-approve threshold',   time: '1h ago',  color: '#009ADA' },
  ];

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Hero KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12 }}>
        <KpiTile label="Tasks Automated Today"  value={metrics.tasks.toLocaleString()} sub="across all AI agents"             trend="↑ 12% vs yesterday"      trendDir="up"   accent="#22c55e" />
        <KpiTile label="Automation Success Rate" value={`${metrics.success}%`}          sub="tasks completed without error"    trend="↑ 1.8pp this window"     trendDir="up"   accent="#22c55e" />
        <KpiTile label="Hours Saved"             value={`${hoursSaved}h`}               sub="vs manual processing today"       trend={`~${Math.round(hoursSaved/8)} FTE equivalent`} trendDir="up" accent={ACCENT} />
        <KpiTile label="Cost per Task"           value="$0.014"                         sub="AI automation cost"               trend={`$${metrics.cost} total today`} trendDir="flat" accent="#a78bfa" />
        <KpiTile label="Pending Approvals"       value={pending}                         sub="need human decision"              trend={pending > 5 ? '↑ above normal' : '● within SLA'} trendDir={pending > 5 ? 'down' : 'flat'} accent="#f59e0b" />
        <KpiTile label="Value Generated"         value={`$${roi}`}                      sub="est. labour cost offset"          trend="based on $18/hr baseline"  trendDir="up"   accent="#22c55e" />
      </div>

      {/* Status banner */}
      <div style={{ background: issues === 0 ? 'rgba(34,197,94,.07)' : 'rgba(245,158,11,.07)', border: `1px solid ${issues === 0 ? 'rgba(34,197,94,.25)' : 'rgba(245,158,11,.25)'}`, borderRadius: 6, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: issues === 0 ? '#22c55e' : '#f59e0b', boxShadow: `0 0 8px ${issues === 0 ? '#22c55e' : '#f59e0b'}`, animation: 'pulse 2s ease-in-out infinite' }} />
        <div style={{ fontFamily: sans, fontSize: 13, color: C.tx, fontWeight: 500 }}>
          {issues === 0
            ? `All ${running} AI agents operating normally · Automation running at full capacity`
            : `${running} agents running normally · ${issues} agent${issues > 1 ? 's' : ''} need${issues === 1 ? 's' : ''} attention`}
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 11, color: C.mu }}>prod-us-east-1 · updated now</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Agent health */}
        <Panel title="AI Agent Status" right={<span style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginLeft: 'auto' }}>{agents.length} agents · {agents.length - issues} healthy · {issues} need attention</span>}>
          <div style={{ padding: '0 16px 6px' }}>
            {agentSummary.map(a => <AgentHealthRow key={a.name} {...a} />)}
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Recent outcomes */}
          <Panel title="Recent Automation Outcomes" right={<span style={{ fontFamily: mono, fontSize: 10, padding: '1px 8px', borderRadius: 2, background: 'rgba(34,197,94,.1)', color: '#22c55e', marginLeft: 'auto' }}>● Live</span>}>
            <div style={{ padding: '0 16px 4px' }}>
              {outcomes.map((o, i) => <OutcomeItem key={i} {...o} />)}
            </div>
          </Panel>

          {/* Task volume by function */}
          <Panel title="Automation Volume by Function">
            <div style={{ padding: '14px 16px' }}>
              <MiniBar label="Order Processing"   value={agents[1]?.tasks || 280} max={400} color={ACCENT} />
              <MiniBar label="Email Drafting"     value={agents[4]?.tasks || 210} max={400} color="#22c55e" />
              <MiniBar label="Support Triage"     value={agents[7]?.tasks || 190} max={400} color="#a78bfa" />
              <MiniBar label="CRM Sync"           value={agents[6]?.tasks || 175} max={400} color="#f59e0b" />
              <MiniBar label="Analytics"          value={agents[8]?.tasks || 155} max={400} color="#06b6d4" />
              <MiniBar label="Report Generation"  value={agents[2]?.tasks || 140} max={400} color="#22c55e" />
              <MiniBar label="Data Enrichment"    value={agents[3]?.tasks || 95}  max={400} color="#f59e0b" />
              <MiniBar label="Invoice Parsing"    value={agents[5]?.tasks || 60}  max={400} color="#ef4444" />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
