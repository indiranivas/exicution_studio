import { useState } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { Panel } from '../components/ui.jsx';

export default function PageSettings() {
  const [thresh, setThresh] = useState(0.40);
  const [autoEsc, setAutoEsc] = useState(true);
  const [notif, setNotif] = useState(true);
  const [retries, setRetries] = useState(3);

  const Toggle = ({ val, onChange }) => (
    <div onClick={() => onChange(!val)} style={{ width:36, height:20, borderRadius:10, background:val?C.gr:'transparent', border:`1px solid ${val?C.gr:C.b2}`, position:'relative', cursor:'pointer', transition:'all .2s' }}>
      <div style={{ position:'absolute', top:2, left:val?17:2, width:14, height:14, borderRadius:'50%', background:C.tx, transition:'left .2s' }} />
    </div>
  );

  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <Panel title="Confidence thresholds">
        <div style={{ padding:'20px 16px', display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, color:C.tx }}>Escalation threshold</span>
              <span style={{ fontFamily:mono, fontSize:12, color:C.am }}>{thresh.toFixed(2)}</span>
            </div>
            <input type="range" min={0.1} max={0.8} step={0.01} value={thresh} onChange={e=>setThresh(parseFloat(e.target.value))} style={{ width:'100%', accentColor:C.am }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontFamily:mono, fontSize:10, color:C.dm, marginTop:4 }}>
              <span>0.10 (aggressive)</span><span>0.80 (conservative)</span>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[{label:'Auto-escalate on low confidence',val:autoEsc,set:setAutoEsc},{label:'Enable desktop notifications',val:notif,set:setNotif}].map(({label,val,set}) => (
              <label key={label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
                <span style={{ fontSize:12, color:C.tx }}>{label}</span>
                <Toggle val={val} onChange={set} />
              </label>
            ))}
          </div>
        </div>
      </Panel>
      <Panel title="Agent defaults">
        <div style={{ padding:'20px 16px', display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontSize:12, color:C.tx }}>Max retries per task</span>
              <span style={{ fontFamily:mono, fontSize:12, color:C.bl }}>{retries}</span>
            </div>
            <input type="range" min={1} max={10} step={1} value={retries} onChange={e=>setRetries(parseInt(e.target.value))} style={{ width:'100%', accentColor:C.bl }} />
          </div>
          <div style={{ background:C.sf2, borderRadius:3, padding:'12px 14px', fontFamily:mono, fontSize:11, color:C.mu, lineHeight:1.8 }}>
            Environment: <span style={{ color:C.tx }}>prod-us-east-1</span><br />
            Data source: <span style={{ color:C.tx }}>Salesforce Data Cloud · L2O observability rows</span><br />
            Platform: <span style={{ color:C.tx }}>LevelShift AgentOps</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
