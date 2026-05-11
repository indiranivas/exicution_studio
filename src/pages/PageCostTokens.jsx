import { C, mono, sans } from '../constants/palette.js';
import { rnd } from '../utils/dataHelpers.js';
import { MetricTile, Panel, Bar } from '../components/ui.jsx';

export default function PageCostTokens({ st }) {
  const { agents } = st;
  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        <MetricTile label="Total cost today" value={`$${st.metrics.cost}`}                              delta="↑ 8% vs yesterday"        dir="down" accent="purple" />
        <MetricTile label="Cost / task"      value="$0.014"                                             delta="avg across all types"     dir="flat" accent="blue" />
        <MetricTile label="Total tokens"     value={`${(st.metrics.toolCalls*140/1000).toFixed(0)}K`}  delta="input + output combined"  dir="flat" accent="cyan" />
        <MetricTile label="Budget used"      value={`${rnd(62,78)}%`}                                  delta="of daily $25 budget"      dir="flat" accent="amber" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Panel title="Cost by agent">
          <div style={{ padding:'14px 16px' }}>
            {agents.map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <span style={{ fontFamily:mono, fontSize:10, color:C.mu, width:120, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</span>
                <Bar pct={rnd(8,90)} color={C.pu} h={5} />
                <span style={{ fontFamily:mono, fontSize:10, color:C.pu, width:40, textAlign:'right' }}>${a.tokenCost}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Token usage by model">
          <div style={{ padding:'14px 16px' }}>
            {[['gpt-4o',rnd(45,65),C.gr],['claude-3',rnd(25,40),C.bl],['gpt-4o-mini',rnd(5,15),C.cy]].map(([m,p,col]) => (
              <div key={m} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontFamily:mono, fontSize:10, marginBottom:4 }}>
                  <span style={{ color:C.mu }}>{m}</span>
                  <span style={{ color:C.tx }}>{p}%</span>
                </div>
                <Bar pct={p} color={col} h={6} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
