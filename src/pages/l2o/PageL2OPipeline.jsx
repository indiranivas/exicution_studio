import { C, mono, sans } from '../../constants/palette.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

const STAGE_COLOR = {
  Pricing_Inquiry:       '#22d3ee',
  Lead_Qualification:    '#a78bfa',
  Product_Recommendation:'#f59e0b',
  Lead_Conversion:       '#4ade80',
  Quote_Generation:      '#009ADA',
  Upsell_Recommendation: '#fb923c',
  Discount_Request:      '#f87171',
  Quote_Delivery:        '#34d399',
  Order_Booking:         '#4ade80',
};

function StageNode({ stage, idx, total, sessions }) {
  const color  = STAGE_COLOR[stage.stage] || ACCENT;
  const pct    = total > 0 ? Math.round((stage.count / Math.max(...sessions.map(s => s.messageCount || 1))) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
      {/* Connector line */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {idx > 0 && <div style={{ flex: 1, height: 2, background: stage.reached ? color + '55' : C.b2 }} />}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          background: stage.reached ? color + '22' : 'transparent',
          border: `2px solid ${stage.reached ? color : C.b2}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: stage.reached ? color : C.dm,
        }}>
          {stage.reached ? '✓' : '○'}
        </div>
        {idx < total - 1 && <div style={{ flex: 1, height: 2, background: stage.reached ? color + '55' : C.b2 }} />}
      </div>
      <div style={{ fontFamily: mono, fontSize: 9, color: stage.reached ? color : C.dm, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {stage.label.replace(/_/g, ' ')}
      </div>
      {stage.reached && (
        <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color }}>
          {stage.count}×
        </div>
      )}
    </div>
  );
}

function SessionRow({ sess, idx }) {
  const agent = sess.agentDevName?.replace(/([A-Z])/g, ' $1').trim() || sess.agentDevName || '—';
  const statusColor = sess.escalation === 'Escalated' ? C.re : sess.deflection === 'Resolved' ? C.gr : C.am;
  const durationSec = Math.round(sess.durationMs / 1000);
  return (
    <tr>
      <td style={{ fontFamily: mono, fontSize: 11, color: ACCENT, padding: '8px 12px' }}>{sess.id}</td>
      <td style={{ fontFamily: sans, fontSize: 12, padding: '8px 12px', color: C.mu }}>{agent}</td>
      <td style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {sess.intents.map(i => (
            <span key={i} style={{ fontFamily: mono, fontSize: 10, padding: '2px 6px', borderRadius: 3, background: ACCENT + '22', color: ACCENT }}>
              {i.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </td>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '8px 12px', color: C.mu }}>{sess.channel}</td>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '8px 12px' }}>
        <span style={{ color: statusColor }}>
          {sess.escalation === 'Escalated' ? '⚠ Escalated' : sess.deflection === 'Resolved' ? '✓ Resolved' : '→ ' + sess.deflection}
        </span>
      </td>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '8px 12px', color: C.mu }}>{sess.messageCount} msgs</td>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '8px 12px', color: C.mu }}>{durationSec}s</td>
    </tr>
  );
}

function IntentBar({ intent, count, max }) {
  const pct = Math.round((count / max) * 100);
  const color = STAGE_COLOR[intent.replace('REQUEST_PRICING', 'Pricing_Inquiry')] || ACCENT;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: C.mu }}>{intent.replace(/_/g, ' ')}</span>
        <span style={{ color }}>{count}×</span>
      </div>
      <div style={{ height: 6, background: C.b2, borderRadius: 3 }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 3, transition: 'width .4s ease' }} />
      </div>
    </div>
  );
}

export default function PageL2OPipeline({ st }) {
  const { sessions = [], pipeline = [], intentDist = {}, toolCalls = [], guardrails = [] } = st;

  const totalSessions   = sessions.length;
  const escalated       = sessions.filter(s => s.escalation === 'Escalated').length;
  const resolved        = sessions.filter(s => s.deflection === 'Resolved').length;
  const toolSuccessRate = toolCalls.length
    ? Math.round(toolCalls.filter(t => t.success).length / toolCalls.length * 100)
    : 100;
  const guardrailBlocked = guardrails.filter(g => !g.passed).length;
  const totalMessages    = sessions.reduce((a, s) => a + s.messageCount, 0);

  const maxIntent = Math.max(...Object.values(intentDist), 1);

  const reachedStages  = pipeline.filter(p => p.reached);
  const topIntents     = Object.entries(intentDist).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k.replace(/_/g, ' '));
  const discountBlock  = guardrails.find(g => !g.passed && (g.name?.toLowerCase().includes('discount') || g.reasonCode?.includes('DISCOUNT')));
  const orderReached   = pipeline.find(p => p.stage === 'Order_Booking' && p.reached);
  const narrative = [
    totalSessions > 0 && `${totalSessions} session${totalSessions !== 1 ? 's' : ''} processed.`,
    reachedStages.length > 0 && `${reachedStages.length} of ${pipeline.length} pipeline stages reached: ${reachedStages.map(p => p.label.replace(/_/g, ' ')).join(' → ')}.`,
    topIntents.length > 0 && `Top intent${topIntents.length > 1 ? 's' : ''}: ${topIntents.join(', ')}.`,
    discountBlock && `Discount request escalated — blocked by policy (${discountBlock.reasonCode || discountBlock.name}).`,
    orderReached ? 'Order booking stage reached — deal converted.' : escalated > 0 && `${escalated} escalation${escalated !== 1 ? 's' : ''} pending human review.`,
  ].filter(Boolean).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI strip */}
      <div className="grid-4">
        {[
          { label: 'Total Sessions',      value: totalSessions,    color: ACCENT },
          { label: 'Total Messages',       value: totalMessages,    color: C.gr  },
          { label: 'Tool Call Success',    value: toolSuccessRate + '%', color: C.gr },
          { label: 'Escalations',          value: escalated,        color: escalated > 0 ? C.re : C.gr },
        ].map(k => (
          <div key={k.label} style={{ background: C.sf, border: `1px solid ${C.b2}`, borderRadius: 6, padding: '14px 16px' }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 600, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Pipeline funnel */}
      <Panel title="Lead → Order Pipeline" subtitle={`${pipeline.filter(p => p.reached).length} of ${pipeline.length} stages reached`}>
        <div style={{ display: 'flex', alignItems: 'flex-start', padding: '16px 8px', overflowX: 'auto' }}>
          {pipeline.map((stage, i) => (
            <StageNode key={stage.stage} stage={stage} idx={i} total={pipeline.length} sessions={sessions} />
          ))}
        </div>
        <div style={{ marginTop: 12, padding: '10px 14px', background: C.gr + '11', border: `1px solid ${C.gr}33`, borderRadius: 6, fontFamily: sans, fontSize: 13, color: C.mu }}>
          <strong style={{ color: C.gr }}>Deal narrative:</strong> {narrative || 'No session data loaded yet.'}
        </div>
      </Panel>

      {/* Sessions table + Intent dist */}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Panel title="Session Log" subtitle={`${totalSessions} sessions · ${sessions.filter(s => s.channel === 'MIAW').length} MIAW · ${sessions.filter(s => s.channel === 'Web').length} Web · ${sessions.filter(s => s.channel === 'API').length} API`}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.b2}` }}>
                  {['Session', 'Agent', 'Intents', 'Channel', 'Outcome', 'Msgs', 'Duration'].map(h => (
                    <th key={h} style={{ fontFamily: mono, fontSize: 10, color: C.dm, textAlign: 'left', padding: '6px 12px', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((sess, i) => <SessionRow key={sess.id} sess={sess} idx={i} />)}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Intent Distribution" subtitle="What users asked the agents to do">
          <div style={{ padding: '4px 0' }}>
            {Object.entries(intentDist)
              .sort((a, b) => b[1] - a[1])
              .map(([intent, count]) => (
                <IntentBar key={intent} intent={intent} count={count} max={maxIntent} />
              ))
            }
          </div>
          <div style={{ marginTop: 14, padding: '10px 14px', background: C.sf2 || 'rgba(0,0,0,.04)', borderRadius: 6 }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Top tool calls</div>
            {toolCalls.slice(0, 5).map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 11, padding: '3px 0', borderBottom: `1px solid ${C.b2}` }}>
                <span style={{ color: C.mu }}>{t.name}</span>
                <span style={{ color: t.success ? C.gr : C.re }}>{t.type} · {t.durationMs}ms</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
