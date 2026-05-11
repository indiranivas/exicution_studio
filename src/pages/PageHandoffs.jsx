import { C, mono, sans } from '../constants/palette.js';
import { rnd } from '../utils/dataHelpers.js';
import { MetricTile, Panel, Pill, ConfVal, Bar, Th, Td } from '../components/ui.jsx';

export default function PageHandoffs({ st }) {
  const { handoffs } = st;
  const reasons = {};
  handoffs.forEach(h => { reasons[h.reason] = (reasons[h.reason]||0)+1; });
  const total = Math.max(1, handoffs.length);
  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        <MetricTile label="Total handoffs" value={total}                                           delta="last 24h"           dir="flat" accent="amber" />
        <MetricTile label="Pending"        value={handoffs.filter(h=>h.status==='pending').length} delta="awaiting reviewer"  dir="down" accent="red" />
        <MetricTile label="Resolved"       value={handoffs.filter(h=>h.status==='resolved').length}delta="today"             dir="up"   accent="green" />
        <MetricTile label="Avg resolve"    value={`${rnd(8,20)}m`}                                 delta="time to close"     dir="flat" accent="blue" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <Panel title="Handoff queue">
          <div style={{ padding:'0 16px' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['Agent','Reason','Conf.','Time','Status','Resolve time'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
              <tbody>
                {handoffs.map(h => (
                  <tr key={h.id}>
                    <Td style={{ fontSize:12, fontFamily:sans }}>{h.agent}</Td>
                    <Td style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{h.reason}</Td>
                    <Td><ConfVal v={parseFloat(h.conf)||0.1} /></Td>
                    <Td style={{ fontFamily:mono, fontSize:10, color:C.dm }}>{h.ts}</Td>
                    <Td><Pill status={h.status} /></Td>
                    <Td style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{h.status==='resolved'?`${Math.round(h.resTime/60)}m`:'—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="By reason">
          <div style={{ padding:'14px 16px' }}>
            {Object.entries(reasons).map(([reason, count]) => (
              <div key={reason} style={{ marginBottom:10 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontFamily:mono, fontSize:10, marginBottom:3 }}>
                  <span style={{ color:C.mu }}>{reason}</span>
                  <span style={{ color:C.tx }}>{Math.round(count/total*100)}%</span>
                </div>
                <Bar pct={count/total*100} color={C.am} h={4} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
