import { C, mono, sans } from '../constants/palette.js';
import { MetricTile, Panel, Bar } from '../components/ui.jsx';

const MODEL_COLORS = [C.gr, C.bl, C.cy, C.pu, C.am];

export default function PageCostTokens({ st }) {
  const { agents, modelDist, metrics } = st;

  /* Real cost per task (message) */
  const costPerTask = metrics.tasks > 0
    ? `$${(metrics.cost / metrics.tasks).toFixed(5)}`
    : '—';

  /* Real total tokens */
  const totalTokensK = metrics.totalTokens >= 1000
    ? `${(metrics.totalTokens / 1000).toFixed(1)}K`
    : String(metrics.totalTokens || 0);

  /* Real cost per session */
  const costPerSession = metrics.sessionCount > 0
    ? `$${(metrics.cost / metrics.sessionCount).toFixed(4)}`
    : '—';

  /* Agent cost bars — real percentages */
  const totalCost = agents.reduce((a, ag) => a + (ag.tokenCost || 0), 0) || 1;

  /* Real model token distribution */
  const modelEntries = Object.entries(modelDist || {});
  const totalModelTokens = modelEntries.reduce((a, [, v]) => a + (v.tokens || 0), 0) || 1;

  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        <MetricTile label="Total cost"    value={`$${metrics.cost}`}    delta="all sessions combined"   dir="flat" accent="purple" />
        <MetricTile label="Cost / task"   value={costPerTask}           delta="avg per message"         dir="flat" accent="blue" />
        <MetricTile label="Total tokens"  value={totalTokensK}          delta="input + output combined" dir="flat" accent="cyan" />
        <MetricTile label="Cost / session" value={costPerSession}       delta={`across ${metrics.sessionCount} sessions`} dir="flat" accent="amber" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Panel title="Cost by agent">
          <div style={{ padding:'14px 16px' }}>
            {agents.map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ fontFamily:mono, fontSize:10, color:C.mu, width:120, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</span>
                <Bar pct={(a.tokenCost / totalCost) * 100} color={C.pu} h={5} />
                <span style={{ fontFamily:mono, fontSize:10, color:C.pu, width:50, textAlign:'right' }}>${a.tokenCost}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Token usage by model">
          <div style={{ padding:'14px 16px' }}>
            {modelEntries.length === 0 ? (
              <div style={{ fontFamily:mono, fontSize:11, color:C.dm, paddingTop:20, textAlign:'center' }}>No LLM call data available</div>
            ) : modelEntries.map(([model, { calls, tokens }], i) => {
              const pct = Math.round((tokens / totalModelTokens) * 100);
              return (
                <div key={model} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontFamily:mono, fontSize:10, marginBottom:4 }}>
                    <span style={{ color:C.mu }}>{model}</span>
                    <span style={{ color:C.tx }}>{pct}% · {calls} calls</span>
                  </div>
                  <Bar pct={pct} color={MODEL_COLORS[i % MODEL_COLORS.length]} h={6} />
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

