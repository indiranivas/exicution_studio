import { useState } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { MetricTile, Panel } from '../components/ui.jsx';

const SEV_COLOR = { critical:C.re, high:C.re, medium:C.am, low:C.bl, info:C.bl };
const SEV_BG    = { critical:C.reBg, high:C.reBg, medium:C.amBg, low:C.blBg, info:C.blBg };

export default function PageAlerts({ st = {} }) {
  const { alertItems = null, enrichLoading, enrichProgress, guardrails = [], llmCalls = [], metrics = {} } = st;
  const [acked, setAcked] = useState([]);

  if (enrichLoading) {
    return (
      <div style={{ padding:'40px', textAlign:'center', fontFamily:mono, fontSize:12, color:C.mu }}>
        <div style={{ fontSize:24, marginBottom:12 }}>⟳</div>
        {enrichProgress || 'AI is analysing telemetry for anomalies…'}
      </div>
    );
  }

  if (!alertItems || alertItems.length === 0) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ padding:'32px', textAlign:'center', fontFamily:mono, fontSize:12, color:C.gr, background:C.sf, borderRadius:8, border:`1px solid ${C.b2}` }}>
          <div style={{ fontSize:20, marginBottom:8 }}>✓</div>
          No alerts detected in current dataset — all signals are within normal range.<br />
          <span style={{ color:C.dm }}>Upload new observability data to re-run anomaly detection.</span>
        </div>
      </div>
    );
  }

  const active   = alertItems.filter(a => !acked.includes(a.id));
  const critical = active.filter(a => a.severity === 'critical' || a.severity === 'high').length;
  const warnings = active.filter(a => a.severity === 'medium').length;

  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        <MetricTile label="Critical / High"  value={critical}        delta="unacknowledged"       dir="down" accent="red" />
        <MetricTile label="Warnings"         value={warnings}        delta="need review"          dir="flat" accent="amber" />
        <MetricTile label="Acknowledged"     value={acked.length}    delta="cleared this session" dir="up"   accent="green" />
      </div>
      <div style={{ background:'rgba(0,154,218,.06)', border:'1px solid rgba(0,154,218,.2)', borderRadius:6, padding:'10px 16px', fontFamily:mono, fontSize:11, color:'#009ADA' }}>
        ⊛ Alerts detected by LLM analysis of your telemetry data — not static thresholds. Upload new data to re-run.
      </div>
      <Panel title="Active Alerts" subtitle={`${alertItems.length} issues detected from telemetry`}>
        <div style={{ padding:'0 16px' }}>
          {alertItems.map(al => {
            const isAcked = acked.includes(al.id);
            const col = SEV_COLOR[al.severity] || C.mu;
            const bg  = SEV_BG[al.severity]   || 'transparent';
            return (
              <div key={al.id} style={{ display:'flex', alignItems:'flex-start', gap:14, padding:'14px 0', borderBottom:`1px solid ${C.b}`, opacity:isAcked ? 0.35 : 1, transition:'opacity .25s' }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:col, flexShrink:0, marginTop:5, boxShadow:isAcked?'none':`0 0 8px ${col}` }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <span style={{ fontFamily:mono, fontSize:10, padding:'1px 7px', borderRadius:2, background:bg, color:col, border:`1px solid ${col}33` }}>{al.severity}</span>
                    <span style={{ fontFamily:sans, fontSize:12, color:C.tx, fontWeight:500 }}>{al.title}</span>
                    <span style={{ fontFamily:mono, fontSize:10, color:C.dm, marginLeft:'auto' }}>{al.id}</span>
                  </div>
                  <div style={{ fontSize:12, color:C.tx, fontFamily:sans, marginBottom:4 }}>{al.description}</div>
                  {al.recommendation && (
                    <div style={{ fontSize:11, color:C.mu, fontFamily:mono }}>→ {al.recommendation}</div>
                  )}
                </div>
                {!isAcked && (
                  <button onClick={() => setAcked(p => [...p, al.id])} style={{ fontFamily:mono, fontSize:10, padding:'4px 10px', borderRadius:2, border:`1px solid ${C.b2}`, background:'transparent', color:C.mu, cursor:'pointer', flexShrink:0, transition:'all .15s' }}>Ack</button>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}


