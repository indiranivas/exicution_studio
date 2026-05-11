import { useState } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { MetricTile, Panel } from '../components/ui.jsx';

const initAlerts = [
  { id:1, sev:'critical', msg:'data-enrich-01 confidence below 0.25 for 10+ consecutive tasks',      agent:'data-enrich-01',  ts:'14:32:11' },
  { id:2, sev:'warning',  msg:'report-gen-02 API timeout rate exceeds 15% in last 30 minutes',       agent:'report-gen-02',   ts:'14:19:04' },
  { id:3, sev:'warning',  msg:'Token cost trending 22% above daily budget projection',               agent:'system',          ts:'13:55:30' },
  { id:4, sev:'info',     msg:'invoice-parse-02 prompt v1.5 deployed — A/B test running',            agent:'invoice-parse-02',ts:'13:51:00' },
  { id:5, sev:'info',     msg:'Handoff queue depth above normal: 37 pending (threshold: 30)',        agent:'system',          ts:'13:44:12' },
  { id:6, sev:'critical', msg:'order-proc-01 error rate spiked to 18% in last 5 minutes',           agent:'order-proc-01',   ts:'13:30:08' },
];

export default function PageAlerts() {
  const [acked, setAcked] = useState([4, 5]);
  const sc = { critical:C.re, warning:C.am, info:C.bl };
  const sb = { critical:C.reBg, warning:C.amBg, info:C.blBg };
  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        <MetricTile label="Critical"      value={initAlerts.filter(a=>a.sev==='critical'&&!acked.includes(a.id)).length} delta="unacknowledged"       dir="down" accent="red" />
        <MetricTile label="Warnings"      value={initAlerts.filter(a=>a.sev==='warning'&&!acked.includes(a.id)).length}  delta="need review"          dir="flat" accent="amber" />
        <MetricTile label="Acknowledged"  value={acked.length}                                                            delta="cleared this session" dir="up"   accent="green" />
      </div>
      <Panel title="Active alerts">
        <div style={{ padding:'0 16px' }}>
          {initAlerts.map(al => (
            <div key={al.id} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 0', borderBottom:`1px solid ${C.b}`, opacity:acked.includes(al.id)?.35:1, transition:'opacity .25s' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:sc[al.sev], flexShrink:0, marginTop:5, boxShadow:acked.includes(al.id)?'none':`0 0 8px ${sc[al.sev]}` }} />
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <span style={{ fontFamily:mono, fontSize:10, padding:'1px 7px', borderRadius:2, background:sb[al.sev], color:sc[al.sev], border:`1px solid ${sc[al.sev]}33` }}>{al.sev}</span>
                  <span style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{al.agent}</span>
                  <span style={{ fontFamily:mono, fontSize:10, color:C.dm, marginLeft:'auto' }}>{al.ts}</span>
                </div>
                <div style={{ fontSize:12, color:C.tx, fontFamily:sans }}>{al.msg}</div>
              </div>
              {!acked.includes(al.id) && (
                <button onClick={() => setAcked(p=>[...p,al.id])} style={{ fontFamily:mono, fontSize:10, padding:'4px 10px', borderRadius:2, border:`1px solid ${C.b2}`, background:'transparent', color:C.mu, cursor:'pointer', flexShrink:0, transition:'all .15s' }}>Ack</button>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
