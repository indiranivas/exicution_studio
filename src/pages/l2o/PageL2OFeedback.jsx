import { C, mono, sans } from '../../constants/palette.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

const SENTIMENT_COLOR = { positive: '#4ade80', negative: '#f87171', neutral: '#94a3b8' };
const ACTION_COLOR    = { accepted: '#4ade80', edited: '#f59e0b', rejected: '#f87171' };
const ACTION_ICON     = { accepted: '✓', edited: '✎', rejected: '✗' };

function FeedbackRow({ fb }) {
  const sc = SENTIMENT_COLOR[fb.sentiment] || C.mu;
  const ac = ACTION_COLOR[fb.actionType]   || C.mu;
  const ai = ACTION_ICON[fb.actionType]    || '?';
  return (
    <tr style={{ borderBottom: `1px solid ${C.b2}` }}>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '8px 10px', color: C.dm, whiteSpace: 'nowrap' }}>{new Date(fb.ts).toLocaleTimeString()}</td>
      <td style={{ fontFamily: sans, fontSize: 12, padding: '8px 10px', color: C.mu }}>{fb.agent}</td>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '8px 10px' }}>
        <span style={{ padding: '2px 6px', borderRadius: 3, background: sc + '22', color: sc }}>
          {fb.sentiment}
        </span>
      </td>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '8px 10px', color: ac, fontWeight: 600 }}>
        {ai} {fb.actionType}
      </td>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '8px 10px', color: C.mu }}>
        {fb.editDistance > 0 ? `${fb.editDistance} chars edited` : '—'}
      </td>
      <td style={{ fontFamily: sans, fontSize: 12, padding: '8px 10px', color: C.tx, maxWidth: 280 }}>
        {fb.text || '—'}
      </td>
      <td style={{ fontFamily: mono, fontSize: 10, padding: '8px 10px', color: ACCENT }}>
        {(fb.intent || fb.topic || '').replace(/_/g, ' ')}
      </td>
    </tr>
  );
}

function QualityBar({ llmCalls }) {
  if (!llmCalls.length) return null;
  const buckets = [
    { label: '≥ 95%',   min: 0.95, max: 1.01, color: '#4ade80' },
    { label: '80–94%',  min: 0.80, max: 0.95, color: '#a3e635' },
    { label: '60–79%',  min: 0.60, max: 0.80, color: '#f59e0b' },
    { label: '< 60%',   min: 0,    max: 0.60, color: '#f87171' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {buckets.map(b => {
        const count = llmCalls.filter(c => (c.qualityScore || 0) >= b.min && (c.qualityScore || 0) < b.max).length;
        const pct   = Math.round(count / llmCalls.length * 100);
        return (
          <div key={b.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 11, marginBottom: 3 }}>
              <span style={{ color: C.mu }}>{b.label}</span>
              <span style={{ color: b.color }}>{count} calls ({pct}%)</span>
            </div>
            <div style={{ height: 6, background: C.b2, borderRadius: 3 }}>
              <div style={{ height: '100%', width: pct + '%', background: b.color, borderRadius: 3 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PageL2OFeedback({ st }) {
  const { feedback = [], llmCalls = [], modelDist = {} } = st;

  const accepted    = feedback.filter(f => f.actionType === 'accepted').length;
  const edited      = feedback.filter(f => f.actionType === 'edited').length;
  const rejected    = feedback.filter(f => f.actionType === 'rejected').length;
  const positive    = feedback.filter(f => f.sentiment === 'positive').length;
  const negative    = feedback.filter(f => f.sentiment === 'negative').length;
  const acceptRate  = feedback.length ? Math.round(accepted / feedback.length * 100) : 0;
  const avgEditDist = edited > 0
    ? Math.round(feedback.filter(f => f.editDistance > 0).reduce((a, f) => a + f.editDistance, 0) / edited)
    : 0;
  const avgQuality  = llmCalls.length
    ? (llmCalls.reduce((a, c) => a + (c.qualityScore || 0), 0) / llmCalls.length * 100).toFixed(1)
    : '—';

  // Token efficiency by model
  const modelRows = Object.entries(modelDist).map(([model, d]) => ({
    model,
    calls:  d.calls,
    tokens: d.tokens,
    avgTokens: d.calls ? Math.round(d.tokens / d.calls) : 0,
  })).sort((a, b) => b.tokens - a.tokens);

  const maxTokens = Math.max(...modelRows.map(m => m.tokens), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI strip */}
      <div className="grid-4">
        {[
          { label: 'Acceptance Rate',    value: acceptRate + '%',  color: acceptRate >= 80 ? C.gr : C.am },
          { label: 'Avg Quality Score',  value: avgQuality + '%',  color: parseFloat(avgQuality) >= 90 ? C.gr : C.am },
          { label: 'Explicit Feedback',  value: feedback.length,   color: ACCENT },
          { label: 'Avg Edit Distance',  value: avgEditDist + ' ch', color: avgEditDist < 30 ? C.gr : C.am },
        ].map(k => (
          <div key={k.label} style={{ background: C.sf, border: `1px solid ${C.b2}`, borderRadius: 6, padding: '14px 16px' }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 600, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Feedback table */}
        <Panel title="Explicit Feedback Log" subtitle={`Sales rep feedback on AI-generated responses`}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.b2}` }}>
                  {['Time', 'Agent', 'Sentiment', 'Action', 'Edit', 'Feedback Text', 'Intent'].map(h => (
                    <th key={h} style={{ fontFamily: mono, fontSize: 10, color: C.dm, textAlign: 'left', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feedback.map((fb, i) => <FeedbackRow key={i} fb={fb} />)}
              </tbody>
            </table>
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Action breakdown */}
          <Panel title="Action Breakdown">
            {[
              { label: 'Accepted (no edit)',  count: accepted, color: '#4ade80', icon: '✓' },
              { label: 'Edited before use',    count: edited,   color: '#f59e0b', icon: '✎' },
              { label: 'Rejected',             count: rejected, color: '#f87171', icon: '✗' },
            ].map(a => {
              const pct = feedback.length ? Math.round(a.count / feedback.length * 100) : 0;
              return (
                <div key={a.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 11, marginBottom: 4 }}>
                    <span style={{ color: C.mu }}>{a.icon} {a.label}</span>
                    <span style={{ color: a.color }}>{a.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 6, background: C.b2, borderRadius: 3 }}>
                    <div style={{ height: '100%', width: pct + '%', background: a.color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 10, padding: '8px 12px', background: negative > 0 ? C.re + '11' : C.gr + '11', borderRadius: 6, fontFamily: sans, fontSize: 12, color: C.mu }}>
              {negative > 0
                ? `⚠ ${negative} negative feedback item${negative > 1 ? 's' : ''} — review AI response quality for flagged intents.`
                : '✓ All explicit feedback is positive — AI responses are resonating with sales reps.'}
            </div>
          </Panel>

          {/* Quality distribution */}
          <Panel title="Quality Score Distribution" subtitle={`${llmCalls.length} LLM calls evaluated`}>
            <QualityBar llmCalls={llmCalls} />
          </Panel>

          {/* Model token usage */}
          <Panel title="Token Usage by Model">
            {modelRows.map(m => (
              <div key={m.model} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: C.mu }}>{m.model}</span>
                  <span style={{ color: ACCENT }}>{m.tokens.toLocaleString()} tok · {m.calls} calls</span>
                </div>
                <div style={{ height: 6, background: C.b2, borderRadius: 3 }}>
                  <div style={{ height: '100%', width: Math.round(m.tokens / maxTokens * 100) + '%', background: ACCENT, borderRadius: 3 }} />
                </div>
                <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, marginTop: 3 }}>avg {m.avgTokens} tokens/call</div>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
