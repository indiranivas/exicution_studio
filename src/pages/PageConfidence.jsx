import { C, mono } from '../constants/palette.js';
import { MetricTile, Panel, ConfVal, Bar } from '../components/ui.jsx';
import { ConfGauges } from '../components/panels.jsx';

export default function PageConfidence({ st }) {
  const { agents, confByType } = st;
  const above = Object.values(confByType).filter(v => v >= .75).length;
  const below = Object.values(confByType).filter(v => v < .4).length;
  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        <MetricTile label="Fleet avg conf"  value={(agents.reduce((s,a)=>s+a.conf,0)/agents.length).toFixed(2)}          delta="all agents"            dir="flat" accent="blue" />
        <MetricTile label="Auto-complete"   value={`${above}/${Object.keys(confByType).length} types`}                    delta="≥ 0.75 threshold"      dir="up"   accent="green" />
        <MetricTile label="Auto-escalate"   value={`${below}/${Object.keys(confByType).length} types`}                    delta="< 0.40 threshold"      dir="down" accent="red" />
        <MetricTile label="Override rate"   value={`${100 - st.metrics.feedbackAcceptRate}%`}                             delta="target < 5%"           dir={100 - st.metrics.feedbackAcceptRate < 5 ? 'up' : 'down'} accent={100 - st.metrics.feedbackAcceptRate < 5 ? 'cyan' : 'red'} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <ConfGauges data={confByType} />
        <Panel title="Agent-level confidence">
          <div style={{ padding:'14px 16px' }}>
            {agents.map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:11 }}>
                <span style={{ fontFamily:mono, fontSize:10, color:C.mu, width:120, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</span>
                <Bar pct={a.conf*100} color={a.conf>=.75?C.gr:a.conf>=.4?C.am:C.re} h={5} />
                <ConfVal v={a.conf} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
