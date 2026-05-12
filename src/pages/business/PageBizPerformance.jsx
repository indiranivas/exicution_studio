import { useMemo } from 'react';
import { C, mono, sans } from '../../constants/palette.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

/* ── Insight callout ── */
function InsightCard({ icon, title, body, color = ACCENT }) {
  return (
    <div style={{ background: C.sf2, border: `1px solid ${C.b}`, borderRadius: 5, padding: '12px 16px', borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
        <div>
          <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: C.tx, marginBottom: 4 }}>{title}</div>
          <div style={{ fontFamily: sans, fontSize: 12, color: C.mu, lineHeight: 1.6 }}>{body}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Action item row ── */
function ActionRow({ fn, issue, action, urgency }) {
  const col = urgency === 'high' ? '#ef4444' : '#f59e0b';
  return (
    <div style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: `1px solid ${C.b}`, alignItems: 'flex-start' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0, marginTop: 4 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: C.tx, marginBottom: 3 }}>{fn}</div>
        <div style={{ fontFamily: sans, fontSize: 11, color: C.mu, marginBottom: 4 }}>{issue}</div>
        <div style={{ fontFamily: sans, fontSize: 11, color: ACCENT }}>→ {action}</div>
      </div>
      <div style={{ fontFamily: mono, fontSize: 9, padding: '2px 8px', borderRadius: 20, background: col + '18', color: col, border: `1px solid ${col}44`, flexShrink: 0 }}>
        {urgency === 'high' ? 'Act now' : 'Review soon'}
      </div>
    </div>
  );
}

function StatCard({ label, value, change, changeDir, note, accent }) {
  const cCol = changeDir === 'up' ? '#22c55e' : changeDir === 'down' ? '#ef4444' : C.mu;
  return (
    <div style={{ background: C.sf, border: `1px solid ${C.b}`, borderRadius: 6, padding: '18px 20px', borderTop: `3px solid ${accent || ACCENT}` }}>
      <div style={{ fontFamily: sans, fontSize: 11, color: C.mu, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: sans, fontSize: 28, fontWeight: 300, color: C.tx, letterSpacing: '-.02em' }}>{value}</div>
      {change && <div style={{ fontFamily: mono, fontSize: 11, color: cCol, marginTop: 6 }}>{change}</div>}
      {note && <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, marginTop: 4 }}>{note}</div>}
    </div>
  );
}

function HorizontalBar({ label, pct, value, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: sans, fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: C.tx, fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: mono, fontSize: 11, color: pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444' }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 10, background: C.sf2, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444', borderRadius: 5, transition: 'width .6s ease' }} />
        </div>
        <span style={{ fontFamily: mono, fontSize: 10, color: C.mu, width: 80, flexShrink: 0 }}>{value}</span>
      </div>
    </div>
  );
}

function TrendDot({ positive }) {
  return <span style={{ color: positive ? '#22c55e' : '#ef4444' }}>{positive ? '↑' : '↓'}</span>;
}

function SlaRow({ sla, target, actual, met }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.b}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: C.tx }}>{sla}</div>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginTop: 2 }}>Target: {target}</div>
      </div>
      <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, color: met ? '#22c55e' : '#ef4444' }}>{actual}</div>
      <div style={{ fontFamily: mono, fontSize: 10, padding: '2px 10px', borderRadius: 20, background: met ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', color: met ? '#22c55e' : '#ef4444', border: `1px solid ${met ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)'}` }}>
        {met ? '✓ Met' : '✗ Missed'}
      </div>
    </div>
  );
}

export default function PageBizPerformance({ st }) {
  const { agents, metrics, sessions, pipeline, llmCalls, toolCalls, feedback } = st;

  /* Real pipeline stage completion rates */
  const taskTypes = useMemo(() => pipeline
    .filter(p => p.count > 0)
    .map(p => ({
      label: p.label,
      pct: Math.round(p.count / Math.max(1, sessions.length) * 100),
      value: `${p.count} session${p.count !== 1 ? 's' : ''}`,
    })), [pipeline, sessions]);

  /* Real per-session quality scores for trend chart */
  const sessData = useMemo(() => sessions.map((s, i) => {
    const sq = llmCalls.filter(l => l.sessionId === s.id && l.qualityScore != null);
    const avgQ = sq.length ? Math.round(sq.reduce((a, l) => a + l.qualityScore, 0) / sq.length * 100) : null;
    return { label: `S${i + 1}`, value: avgQ };
  }), [sessions, llmCalls]);
  const validSess = sessData.filter(s => s.value != null);
  const maxSessQ = Math.max(...validSess.map(s => s.value), 1);

  /* Real human override rate = % feedback NOT accepted */
  const overrideRate = feedback.length
    ? `${(feedback.filter(f => f.actionType !== 'accepted').length / feedback.length * 100).toFixed(1)}%`
    : '—';

  /* Real tool call success rate */
  const toolSuccessRate = toolCalls.length
    ? (toolCalls.filter(t => t.success).length / toolCalls.length * 100).toFixed(1)
    : null;
  const toolCallSuccessStr = toolSuccessRate != null ? `${toolSuccessRate}%` : '—';

  /* Find underperforming stages (below 50% session completion) */
  const underperforming = pipeline.filter(p => p.count > 0 && p.count / Math.max(1, sessions.length) < 0.5);

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Plain English summary */}
      <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,.07) 0%, rgba(0,154,218,.05) 100%)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 8, padding: '16px 22px' }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#22c55e', marginBottom: 8 }}>Performance Summary · In Plain English</div>
        <div style={{ fontFamily: sans, fontSize: 14, color: C.tx, lineHeight: 1.75, fontWeight: 300 }}>
          Your AI platform is completing <span style={{ color: '#22c55e', fontWeight: 500 }}>{metrics.success}% of tasks successfully</span>.
          {' '}Processing speed is <span style={{ color: ACCENT, fontWeight: 500 }}>{metrics.latency}s average</span> per task, and human overrides are at <span style={{ color: overrideRate === '0.0%' || parseFloat(overrideRate) < 5 ? '#22c55e' : '#f59e0b', fontWeight: 500 }}>{overrideRate}</span> of all tasks (target &lt;5%).
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid-4">
        <StatCard label="Overall Success Rate"    value={`${metrics.success}%`}     change="real span data"        changeDir="up"   note="target ≥ 90%"                    accent="#22c55e" />
        <StatCard label="Avg Response Time"       value={`${metrics.latency}s`}      change="avg per LLM call"      changeDir="up"   note={`${llmCalls.length} LLM calls`}     accent={ACCENT} />
        <StatCard label="Human Overrides"         value={overrideRate}               change="feedback not accepted"  changeDir="up"   note={`${feedback.length} feedback rows`}  accent="#a78bfa" />
        <StatCard label="Sessions Processed"      value={`${sessions.length}`}       change="unique user sessions"  changeDir="up"   note={`${metrics.deflectedCount} deflected`} accent="#06b6d4" />
      </div>

      {/* Insight strip */}
      <div className="grid-3" style={{ marginBottom: 0 }}>
        <InsightCard icon="✓" color="#22c55e"
          title="Span Success Rate"
          body={`${metrics.success}% of all spans completed successfully. ${(100 - metrics.success).toFixed(1)}% had errors or were blocked by guardrails.`} />
        <InsightCard icon="⏱" color={ACCENT}
          title="Response Latency"
          body={`Avg ${metrics.latency}s per LLM call across ${llmCalls.length} calls. Guardrail pass rate: ${metrics.guardrailPassRate}%.`} />
        <InsightCard icon="👤" color="#a78bfa"
          title="AI Acceptance Rate"
          body={`${metrics.feedbackAcceptRate}% of AI responses were accepted as-is. ${feedback.filter(f => f.actionType === 'edited').length} were edited and ${feedback.filter(f => f.actionType === 'rejected').length} rejected.`} />
      </div>

      <div className="grid-2">

        {/* Success rate by function */}
        <Panel title="Pipeline Stage Completion Rate" right={<span style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginLeft: 'auto' }}>% of sessions reaching each stage</span>}>
          <div style={{ padding: '14px 16px' }}>
            {taskTypes.map(t => <HorizontalBar key={t.label} {...t} />)}
            <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, marginTop: 4, paddingTop: 10, borderTop: `1px solid ${C.b}` }}>
              Below 75%: candidates for prompt improvement or additional training data
            </div>
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 7-day success trend */}
          <Panel title="Session Quality Scores">
            <div style={{ padding: '14px 16px' }}>
              {validSess.length === 0 ? (
                <div style={{ fontFamily: mono, fontSize: 11, color: C.dm, textAlign: 'center', padding: '20px 0' }}>No quality scores in dataset</div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 10 }}>
                    {sessData.map((s, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ fontFamily: mono, fontSize: 9, color: i === sessData.length - 1 ? ACCENT : C.dm }}>{s.value != null ? s.value + '%' : '—'}</div>
                        <div style={{ width: '100%', height: s.value != null ? `${Math.round((s.value / maxSessQ) * 100)}%` : '4px', minHeight: 4, background: s.value != null ? ACCENT : C.sf2, borderRadius: '2px 2px 0 0', transition: 'height .4s ease' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 10, color: C.mu }}>
                    {sessData.map(s => <span key={s.label}>{s.label}</span>)}
                  </div>
                  <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(0,154,218,.07)', border: '1px solid rgba(0,154,218,.2)', borderRadius: 4, fontFamily: sans, fontSize: 12, color: ACCENT }}>
                    Quality scores from real LLM call evaluations in each session
                  </div>
                </>
              )}
            </div>
          </Panel>

          {/* SLA dashboard */}
          <Panel title="Key Performance Metrics">
            <div style={{ padding: '0 16px 8px' }}>
              <SlaRow sla="Span success rate"         target="≥ 90%"   actual={`${metrics.success}%`}                    met={metrics.success >= 90} />
              <SlaRow sla="Guardrail compliance"      target="≥ 95%"   actual={`${metrics.guardrailPassRate}%`}          met={metrics.guardrailPassRate >= 95} />
              <SlaRow sla="AI response acceptance"    target="≥ 80%"   actual={`${metrics.feedbackAcceptRate}%`}         met={metrics.feedbackAcceptRate >= 80} />
              <SlaRow sla="Session deflection rate"   target="≥ 60%"   actual={`${Math.round(metrics.deflectedCount / Math.max(1, metrics.sessionCount) * 100)}%`} met={metrics.deflectedCount / Math.max(1, metrics.sessionCount) >= 0.6} />
              <SlaRow sla="Tool call success"         target="100%"   actual={toolCallSuccessStr}                       met={toolCalls.length === 0 || toolCalls.every(t => t.success)} />
              <SlaRow sla="Avg LLM response time"     target="< 10s"  actual={`${metrics.latency}s`}                   met={metrics.latency < 10} />
              <div style={{ marginTop: 10, fontFamily: mono, fontSize: 10, color: C.mu }}>
                Based on real span data · {sessions.length} sessions analysed
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Action Required for underperformers */}
      {underperforming.length > 0 && (
      <Panel title="Pipeline Stages With Low Session Reach" right={
        <span style={{ fontFamily: mono, fontSize: 10, padding: '2px 8px', borderRadius: 2, background: 'rgba(245,158,11,.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.3)', marginLeft: 'auto' }}>{underperforming.length} stage{underperforming.length > 1 ? 's' : ''}</span>
      }>
        <div style={{ padding: '6px 16px 14px' }}>
          <div style={{ fontFamily: sans, fontSize: 12, color: C.mu, padding: '10px 0 8px', borderBottom: `1px solid ${C.b}` }}>
            These pipeline stages were reached by fewer than 50% of sessions, indicating potential bottlenecks in the lead-to-order flow.
          </div>
          {underperforming.map(p => (
            <ActionRow key={p.stage}
              fn={`${p.label} (${Math.round(p.count / Math.max(1, sessions.length) * 100)}% reach)`}
              issue={`Only ${p.count} of ${sessions.length} sessions reached this stage.`}
              action="Review upstream stage completion to identify where sessions are dropping off."
              urgency={p.count === 0 ? 'high' : 'medium'}
            />
          ))}
        </div>
      </Panel>
      )}
    </div>
  );
}
