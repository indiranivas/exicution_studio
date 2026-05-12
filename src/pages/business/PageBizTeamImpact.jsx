import { useMemo } from 'react';
import { C, mono, sans } from '../../constants/palette.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

function AgentImpactCard({ agent, llmCalls, toolCalls, feedback, color }) {
  const myTools = toolCalls.filter(t => t.agent === agent.displayName);
  const myFb    = feedback.filter(f => f.agent === agent.displayName);
  const acceptPct = myFb.length ? Math.round(myFb.filter(f => f.actionType === 'accepted').length / myFb.length * 100) : null;
  const hoursSaved = Math.round(agent.tasks * 0.27);
  return (
    <div style={{ background: C.sf, border: `1px solid ${C.b}`, borderRadius: 6, padding: '16px 18px', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.tx }}>{agent.displayName}</div>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginTop: 2 }}>{agent.type.replace(/_/g, ' ')} · v{agent.version}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.mu }}>quality score</div>
          <div style={{ fontFamily: sans, fontSize: 16, fontWeight: 300, color, lineHeight: 1.2 }}>{(agent.conf * 100).toFixed(0)}%</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div style={{ background: C.sf2, borderRadius: 4, padding: '10px 12px' }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, marginBottom: 4 }}>Est. hours saved</div>
          <div style={{ fontFamily: sans, fontSize: 20, fontWeight: 300, color }}>{hoursSaved}h</div>
        </div>
        <div style={{ background: C.sf2, borderRadius: 4, padding: '10px 12px' }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, marginBottom: 4 }}>Messages handled</div>
          <div style={{ fontFamily: sans, fontSize: 20, fontWeight: 300, color: C.tx }}>{agent.tasks}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <div style={{ background: C.sf2, borderRadius: 4, padding: '8px 10px' }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: C.dm, marginBottom: 2 }}>Tool calls</div>
          <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, color: C.tx }}>{myTools.length || agent.toolCallCount || 0}</div>
        </div>
        <div style={{ background: C.sf2, borderRadius: 4, padding: '8px 10px' }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: C.dm, marginBottom: 2 }}>LLM calls</div>
          <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, color: C.tx }}>{agent.llmCallCount || 0}</div>
        </div>
        <div style={{ background: C.sf2, borderRadius: 4, padding: '8px 10px' }}>
          <div style={{ fontFamily: mono, fontSize: 9, color: C.dm, marginBottom: 2 }}>AI accepted</div>
          <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, color: acceptPct != null ? (acceptPct >= 80 ? '#22c55e' : '#f59e0b') : C.dm }}>
            {acceptPct != null ? `${acceptPct}%` : '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineStageRow({ stage, label, count, total }) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0;
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : pct > 0 ? '#ef4444' : C.dm;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.b}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: C.tx }}>{label}</div>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginTop: 2 }}>{count} of {total} sessions reached this stage</div>
      </div>
      <div style={{ width: 120 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 9, color: C.dm, marginBottom: 3 }}>
          <span>{pct}%</span>
          <span style={{ color }}>{count > 0 ? 'active' : 'not reached'}</span>
        </div>
        <div style={{ height: 5, background: C.sf2, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
        </div>
      </div>
    </div>
  );
}

function SessionQualityRow({ session, llmCalls, index }) {
  const myLLM = llmCalls.filter(l => l.sessionId === session.id && l.qualityScore != null);
  const avgQ = myLLM.length ? (myLLM.reduce((a, l) => a + l.qualityScore, 0) / myLLM.length).toFixed(2) : null;
  const deflected = session.deflection === 'Deflected' || session.deflection === 'Resolved';
  const escalated = session.escalation === 'Escalated';
  const intent = (session.intents[0] || session.topics[0] || 'L2O').replace(/_/g, ' ').toLowerCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.b}` }}>
      <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, width: 24, flexShrink: 0 }}>#{index + 1}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 12, color: C.tx }}>{intent}</div>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginTop: 2 }}>{session.messageCount} messages · {session.spans.length} spans</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {deflected && <span style={{ fontFamily: mono, fontSize: 9, padding: '1px 6px', borderRadius: 20, background: 'rgba(34,197,94,.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,.25)' }}>deflected</span>}
        {escalated && <span style={{ fontFamily: mono, fontSize: 9, padding: '1px 6px', borderRadius: 20, background: 'rgba(245,158,11,.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.25)' }}>escalated</span>}
      </div>
      <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 500, color: avgQ != null ? (avgQ >= 0.8 ? '#22c55e' : avgQ >= 0.6 ? '#f59e0b' : '#ef4444') : C.dm, width: 40, textAlign: 'right' }}>
        {avgQ != null ? avgQ : '—'}
      </div>
    </div>
  );
}

export default function PageBizTeamImpact({ st }) {
  const { agents, metrics, sessions, pipeline, llmCalls, toolCalls, feedback, guardrails } = st;

  const totalHours = Math.round(metrics.tasks * 0.27);
  const scoredLLM = llmCalls.filter(l => l.qualityScore != null);
  const avgQuality = scoredLLM.length
    ? (scoredLLM.reduce((a, l) => a + l.qualityScore, 0) / scoredLLM.length * 100).toFixed(1)
    : null;

  const agentColors = [ACCENT, '#22c55e', '#a78bfa', '#f59e0b'];
  const activePipeline = pipeline.filter(p => p.count > 0);

  const sessQualData = useMemo(() => sessions.map(s => {
    const sq = llmCalls.filter(l => l.sessionId === s.id && l.qualityScore != null);
    return sq.length ? +(sq.reduce((a, l) => a + l.qualityScore, 0) / sq.length * 100).toFixed(0) : null;
  }), [sessions, llmCalls]);
  const maxQ = Math.max(...sessQualData.filter(Boolean), 1);

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ background: 'linear-gradient(135deg, rgba(6,182,212,.08) 0%, rgba(34,197,94,.06) 100%)', border: '1px solid rgba(6,182,212,.2)', borderRadius: 8, padding: '18px 22px' }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#06b6d4', marginBottom: 8 }}>Team Impact · Real Data</div>
        <div style={{ fontFamily: sans, fontSize: 14, color: C.tx, lineHeight: 1.75, fontWeight: 300 }}>
          Across <span style={{ color: '#06b6d4', fontWeight: 500 }}>{sessions.length} sessions</span> and <span style={{ color: ACCENT, fontWeight: 500 }}>{agents.length} AI agents</span>,
          your lead-to-order automation handled <span style={{ color: C.tx, fontWeight: 500 }}>{metrics.tasks} messages</span>,
          saving an estimated <span style={{ color: '#22c55e', fontWeight: 500 }}>{totalHours} hours</span> of manual work.
          {' '}<span style={{ color: '#22c55e', fontWeight: 500 }}>{metrics.deflectedCount} of {sessions.length} sessions</span> were fully deflected without escalation.
          {avgQuality && <> Average AI quality score: <span style={{ color: ACCENT, fontWeight: 500 }}>{avgQuality}%</span>.</>}
        </div>
      </div>

      <div className="grid-4">
        {[
          { label: 'Messages Handled',    val: metrics.tasks,
            sub: 'across all sessions',              col: '#22c55e', note: `≈ ${totalHours}h manual work avoided` },
          { label: 'Sessions Deflected',  val: `${metrics.deflectedCount}/${sessions.length}`,
            sub: 'resolved without escalation',      col: ACCENT,    note: `${metrics.escalatedCount} escalated to human` },
          { label: 'Avg Quality Score',   val: avgQuality ? `${avgQuality}%` : '—',
            sub: 'from LLM evaluation scores',       col: avgQuality >= 80 ? '#22c55e' : '#f59e0b',
            note: `${scoredLLM.length} LLM calls scored` },
          { label: 'AI Acceptance Rate',  val: `${metrics.feedbackAcceptRate}%`,
            sub: 'responses accepted without edit',  col: metrics.feedbackAcceptRate >= 80 ? '#22c55e' : '#f59e0b',
            note: `${feedback.length} feedback events` },
        ].map(x => (
          <div key={x.label} style={{ background: C.sf, border: `1px solid ${C.b}`, borderRadius: 6, padding: '18px 20px', borderTop: `3px solid ${x.col}` }}>
            <div style={{ fontFamily: sans, fontSize: 11, color: C.mu, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{x.label}</div>
            <div style={{ fontFamily: sans, fontSize: 28, fontWeight: 300, color: x.col, lineHeight: 1.2 }}>{x.val}</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: x.col, marginTop: 6 }}>{x.sub}</div>
            <div style={{ fontFamily: sans, fontSize: 11, color: C.dm, marginTop: 4 }}>{x.note}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: C.dm, marginBottom: 12 }}>Agent Performance · Real Data</div>
        <div className="grid-2">
          {agents.map((a, i) => (
            <AgentImpactCard key={a.id} agent={a} llmCalls={llmCalls}
              toolCalls={toolCalls} feedback={feedback} color={agentColors[i % agentColors.length]} />
          ))}
        </div>
      </div>

      <div className="grid-2">

        <Panel title="Session-by-Session Quality">
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70, marginBottom: 8 }}>
              {sessions.map((s, i) => {
                const v = sessQualData[i];
                return (
                  <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ fontFamily: mono, fontSize: 8, color: v != null ? ACCENT : C.dm }}>{v != null ? v + '%' : '—'}</div>
                    <div style={{ width: '80%', minHeight: 4,
                      height: v != null ? `${Math.round((v / maxQ) * 60)}px` : '4px',
                      background: v != null ? (v >= 80 ? '#22c55e' : v >= 60 ? '#f59e0b' : '#ef4444') : C.sf2,
                      borderRadius: '2px 2px 0 0', transition: 'height .4s ease' }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 9, color: C.dm, marginBottom: 12, borderTop: `1px solid ${C.b}`, paddingTop: 6 }}>
              {sessions.map((s, i) => <span key={s.id} style={{ flex: 1, textAlign: 'center' }}>S{i + 1}</span>)}
            </div>
            {sessions.map((s, i) => <SessionQualityRow key={s.id} session={s} llmCalls={llmCalls} index={i} />)}
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Panel title="Workflow Stage Coverage">
            <div style={{ padding: '6px 16px 12px' }}>
              <div style={{ fontFamily: sans, fontSize: 11, color: C.dm, padding: '8px 0 10px', borderBottom: `1px solid ${C.b}` }}>
                Pipeline stages reached · {activePipeline.length} of {pipeline.length} stages active
              </div>
              {activePipeline.length === 0 ? (
                <div style={{ fontFamily: mono, fontSize: 11, color: C.dm, padding: '20px 0', textAlign: 'center' }}>No pipeline stage data</div>
              ) : activePipeline.map(p => (
                <PipelineStageRow key={p.stage} {...p} total={sessions.length} />
              ))}
            </div>
          </Panel>

          <Panel title="Guardrail Impact">
            <div style={{ padding: '14px 16px' }}>
              {[
                { label: 'Total guardrail checks', val: guardrails.length,                           col: ACCENT },
                { label: 'Checks passed',           val: guardrails.filter(g => g.passed).length,   col: '#22c55e' },
                { label: 'Checks blocked',          val: guardrails.filter(g => !g.passed).length,  col: '#ef4444' },
                { label: 'Guardrail pass rate',     val: `${metrics.guardrailPassRate}%`,            col: metrics.guardrailPassRate >= 90 ? '#22c55e' : '#f59e0b' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.b}` }}>
                  <span style={{ fontFamily: sans, fontSize: 12, color: C.mu }}>{r.label}</span>
                  <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 500, color: r.col }}>{r.val}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(0,154,218,.07)', border: '1px solid rgba(0,154,218,.2)', borderRadius: 4, fontFamily: sans, fontSize: 11, color: C.mu, lineHeight: 1.6 }}>
                Guardrails protect teams — each blocked interaction prevented a potentially incorrect automated action.
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
