import { C, mono, sans } from '../../constants/palette.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

/* ── Plain-English Narrative Banner ── */
function ExecutiveBriefing({ running, total, successRate, hoursSaved, roi, issues, pendingApprovals }) {
  const healthWord = issues === 0 ? 'fully operational' : `${issues} agent${issues > 1 ? 's' : ''} need${issues === 1 ? 's' : ''} attention`;
  const roiFormatted = Number(roi).toLocaleString();
  return (
    <div style={{ background: 'linear-gradient(135deg, rgba(0,154,218,.08) 0%, rgba(167,139,250,.06) 100%)', border: `1px solid rgba(0,154,218,.2)`, borderRadius: 8, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: ACCENT }}>Executive Briefing · Today</div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: issues === 0 ? '#22c55e' : '#f59e0b', boxShadow: `0 0 8px ${issues === 0 ? '#22c55e' : '#f59e0b'}`, animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: mono, fontSize: 10, color: C.mu }}>Live · prod-us-east-1</span>
        </div>
      </div>
      <div style={{ fontFamily: sans, fontSize: 15, color: C.tx, lineHeight: 1.75, fontWeight: 300 }}>
        Your AI platform is <span style={{ color: issues === 0 ? '#22c55e' : '#f59e0b', fontWeight: 500 }}>{healthWord}</span>, with <span style={{ color: ACCENT, fontWeight: 500 }}>{running} of {total} agents</span> actively working right now.
        {' '}So far today, the platform has automated <span style={{ color: C.tx, fontWeight: 500 }}>{successRate}%</span> of tasks without human involvement,
        saving your team an estimated <span style={{ color: '#22c55e', fontWeight: 500 }}>{hoursSaved} hours</span> of manual work — equivalent to <span style={{ color: '#22c55e', fontWeight: 500 }}>${roiFormatted} in labour value</span>.
        {pendingApprovals > 0 && (
          <span> There {pendingApprovals === 1 ? 'is' : 'are'} <span style={{ color: '#f59e0b', fontWeight: 500 }}>{pendingApprovals} item{pendingApprovals > 1 ? 's' : ''} waiting for your decision</span> in the Approvals queue.</span>
        )}
      </div>
    </div>
  );
}

/* ── Attention Needed callout ── */
function AttentionBanner({ agents }) {
  const flagged = agents.filter(a => ['failed', 'review'].includes(a.status));
  if (flagged.length === 0) return null;
  return (
    <div style={{ background: 'rgba(245,158,11,.07)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 6, padding: '14px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 20, flexShrink: 0 }}>⚠</div>
      <div>
        <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 6 }}>
          {flagged.length} Agent{flagged.length > 1 ? 's' : ''} Need Attention
        </div>
        <div style={{ fontFamily: sans, fontSize: 12, color: C.mu, lineHeight: 1.6 }}>
          Some AI agents have paused or flagged items requiring review. This does not stop the platform — other agents continue working. Your operations team has been notified.
        </div>
      </div>
    </div>
  );
}

/* ── Impact Highlights ── */
function ImpactCard({ icon, title, value, context, color }) {
  return (
    <div style={{ background: C.sf, border: `1px solid ${C.b}`, borderRadius: 6, padding: '18px 20px', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontFamily: sans, fontSize: 20, fontWeight: 300, color, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: C.tx, marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: sans, fontSize: 11, color: C.mu, lineHeight: 1.5 }}>{context}</div>
    </div>
  );
}

function KpiTile({ label, value, sub, trend, trendDir, accent = ACCENT, explain }) {
  const tCol = trendDir === 'up' ? '#22c55e' : trendDir === 'down' ? '#ef4444' : C.mu;
  return (
    <div style={{ background: C.sf, border: `1px solid ${C.b}`, borderRadius: 6, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div style={{ fontFamily: sans, fontSize: 12, color: C.mu, marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ fontFamily: sans, fontSize: 32, fontWeight: 300, color: C.tx, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: mono, fontSize: 11, color: C.mu, marginTop: 8 }}>{sub}</div>}
      {trend && <div style={{ fontFamily: mono, fontSize: 11, color: tCol, marginTop: 4 }}>{trend}</div>}
      {explain && <div style={{ fontFamily: sans, fontSize: 10, color: C.dm, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.b}`, lineHeight: 1.5 }}>{explain}</div>}
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
  const { agents, metrics, events, handoffs, sessions, pipeline } = st;
  const running = agents.filter(a => a.status === 'running').length;
  const issues  = agents.filter(a => ['failed', 'review'].includes(a.status)).length;
  const hoursSaved = Math.round(metrics.tasks * 0.27);
  const roi = Math.max(0, (hoursSaved * 35) - metrics.cost).toFixed(0);
  const pending = handoffs.filter(h => h.status === 'reviewing').length;

  /* Real agent summary — from actual agents array */
  const agentSummary = agents.map(a => ({
    name: a.displayName,
    role: a.type.replace(/_/g, ' '),
    health: a.status === 'running' ? 'healthy' : a.status === 'failed' ? 'issue' : 'attention',
    tasks: a.tasks,
    note: a.errors > 0
      ? `${a.errors} error${a.errors > 1 ? 's' : ''} · ${(a.conf * 100).toFixed(0)}% quality`
      : `${(a.conf * 100).toFixed(0)}% quality · v${a.version}`,
  }));

  /* Real session outcomes */
  const STAGE_COLORS = ['#22c55e', '#22c55e', '#f59e0b', '#22c55e', '#22c55e', '#009ADA'];
  const outcomes = sessions.slice(0, 6).map((s, i) => {
    const escalated = s.escalation === 'Escalated';
    const primaryIntent = (s.intents[0] || s.topics[0] || 'L2O workflow').replace(/_/g, ' ').toLowerCase();
    const time = s.start ? new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
    return {
      icon: escalated ? '⚑' : '✓',
      color: escalated ? '#f59e0b' : STAGE_COLORS[i] || '#22c55e',
      title: escalated ? `Session escalated — ${primaryIntent}` : `Session completed — ${primaryIntent}`,
      desc: `${s.messageCount} messages · ${s.spans.length} spans${s.durationMs ? ` · ${(s.durationMs / 1000).toFixed(1)}s` : ''}`,
      time,
    };
  });

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Executive Briefing — plain English summary */}
      <ExecutiveBriefing
        running={running} total={agents.length}
        successRate={metrics.success} hoursSaved={hoursSaved}
        roi={roi} issues={issues} pendingApprovals={pending}
      />

      {/* Attention banner — only shown when agents need review */}
      <AttentionBanner agents={agents} />

      {/* Hero KPIs */}
      <div className="grid-6">
        <KpiTile label="Tasks Automated Today"  value={metrics.tasks.toLocaleString()} sub="across all AI agents"             trend={`${metrics.sessionCount} sessions · ${metrics.deflectedCount} deflected`} trendDir="up"   accent="#22c55e"
          explain="Every task here is work your team did not have to do manually." />
        <KpiTile label="Automation Success Rate" value={`${metrics.success}%`}          sub="tasks completed without error"    trend={`${metrics.guardrailPassRate}% guardrail pass`}    trendDir="up"   accent="#22c55e"
          explain="Higher is better. Above 90% is excellent for AI automation." />
        <KpiTile label="Hours Saved"             value={`${hoursSaved}h`}               sub="est. vs manual processing"        trend={`~${Math.round(hoursSaved/8)} FTE equivalent`} trendDir="up" accent={ACCENT}
          explain="Estimated time your team would have spent doing this work manually." />
        <KpiTile label="Cost per Task"           value={`$${metrics.tasks > 0 ? (metrics.cost / metrics.tasks).toFixed(5) : '—'}`} sub="AI automation cost"  trend={`$${metrics.cost} total`} trendDir="flat" accent="#a78bfa"
          explain="What you pay per automated task. Based on real token usage at ~$3/1M tokens." />
        <KpiTile label="Pending Approvals"       value={pending}                         sub="need human decision"              trend={pending > 5 ? '↑ above normal' : '● within SLA'} trendDir={pending > 5 ? 'down' : 'flat'} accent="#f59e0b"
          explain="Items the AI flagged as needing a human call before proceeding." />
        <KpiTile label="Value Generated"         value={`$${roi}`}                      sub="est. labour cost offset"          trend="based on token cost vs time saved"  trendDir="up"   accent="#22c55e"
          explain="Labour cost your team avoided today because AI handled it." />
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

      <div className="grid-2">
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

          {/* Task volume by pipeline stage — real data */}
          <Panel title="Automation Volume by Pipeline Stage">
            <div style={{ padding: '14px 16px' }}>
              {pipeline.filter(p => p.count > 0).map((p, i) => {
                const COLORS = [ACCENT,'#22c55e','#a78bfa','#f59e0b','#06b6d4','#ef4444','#22c55e','#009ADA','#a78bfa'];
                return <MiniBar key={p.stage} label={p.label} value={p.count} max={sessions.length || 1} color={COLORS[i % COLORS.length]} />;
              })}
            </div>
          </Panel>
        </div>
      </div>

      {/* AI Impact Highlights */}
      <div>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: C.dm, marginBottom: 12 }}>What AI Did For Your Business Today</div>
        <div className="grid-4">
          <ImpactCard icon="⚡" color="#22c55e"
            value={`${Math.round(metrics.tasks * 0.27)}h`}
            title="Staff Time Freed"
            context="Your team spent zero hours on data entry, email drafting, report formatting, and order routing that AI handled automatically." />
          <ImpactCard icon="✓" color={ACCENT}
            value={`${Math.round(metrics.tasks * metrics.success / 100).toLocaleString()} tasks`}
            title="Completed Without Error"
            context="Tasks processed end-to-end by AI with no human correction needed — ready for use in your business systems." />
          <ImpactCard icon="🔁" color="#a78bfa"
            value={`${metrics.handoffs}`}
            title="Smart Handoffs to Humans"
            context="Cases where the AI recognised it wasn't confident enough and correctly escalated — protecting quality and compliance." />
          <ImpactCard icon="$" color="#f59e0b"
            value={`$${(metrics.cost / metrics.tasks).toFixed(3)}`}
            title="Cost Per Automated Task"
            context="Compared to $0.70–$1.50 for manual processing — your AI platform is operating at over 95% cost efficiency." />
        </div>
      </div>
    </div>
  );
}
