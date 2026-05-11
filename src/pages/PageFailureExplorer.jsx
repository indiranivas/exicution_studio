import { useState, useMemo } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { AGENT_DEFS, FAIL_REASONS, TOOLS } from '../constants/agentDefs.js';
import { rnd, pick, fmtTime } from '../utils/dataHelpers.js';
import { MetricTile, Panel } from '../components/ui.jsx';

export default function PageFailureExplorer() {
  const [sel, setSel] = useState(null);
  const failures = useMemo(() => Array.from({ length:14 }, (_, i) => {
    const a = pick(AGENT_DEFS);
    return {
      id: i, agent: a.name, type: a.type,
      reason: pick(FAIL_REASONS).replace(/_/g,' '),
      step: rnd(2,6), conf: (Math.random()*.38).toFixed(2),
      ts: fmtTime(new Date(Date.now()-rnd(0,7200000))),
      trace: [
        { n:1, action:'plan',      note:`Query ${pick(TOOLS)} with id = CX-${rnd(1000,9999)}` },
        { n:2, action:'tool_call', note:`${pick(TOOLS)} returned ${rnd(0,2)} results` },
        { n:3, action:'retry',     note:`Fuzzy match: ${rnd(2,5)} candidates, ambiguous` },
        { n:4, action:'eval',      note:`Confidence ${(Math.random()*.38).toFixed(2)}, below threshold 0.40` },
        { n:5, action:'escalate',  note:'Halt and hand off to human review queue' },
      ],
    };
  }), []);
  const selected = sel != null ? failures.find(f => f.id === sel) : null;
  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        <MetricTile label="Total failures"  value={failures.length}                             delta="last 24h"                  dir="flat" accent="red" />
        <MetricTile label="Escalated"       value={failures.filter((_,i)=>i%3===0).length}     delta="reached human queue"       dir="flat" accent="amber" />
        <MetricTile label="Auto-resolved"   value={failures.filter((_,i)=>i%3!==0).length}     delta="via retry or fallback"     dir="up"   accent="green" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>
        <Panel title="Recent failures">
          <div style={{ padding:'0 16px' }}>
            {failures.map(f => (
              <div key={f.id} onClick={() => setSel(f.id)} style={{ display:'flex', alignItems:'center', gap:12, margin:'0 -16px', padding:'10px 16px', cursor:'pointer', background:sel===f.id?C.sf2:'transparent', borderBottom:`1px solid ${C.b}`, transition:'background .15s' }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:C.re, flexShrink:0, boxShadow:`0 0 5px ${C.re}` }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:2 }}>
                    <span style={{ fontWeight:500, fontSize:12, fontFamily:sans }}>{f.agent}</span>
                    <span style={{ fontFamily:mono, fontSize:10, color:C.mu }}>step {f.step}/7</span>
                  </div>
                  <div style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{f.reason}</div>
                </div>
                <span style={{ fontFamily:mono, fontSize:10, color:C.dm }}>{f.ts}</span>
              </div>
            ))}
          </div>
        </Panel>
        {selected ? (
          <Panel title="Decision trace" style={{ alignSelf:'start' }}>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ background:C.reBg, border:`1px solid ${C.re}22`, borderRadius:3, padding:'10px 12px', marginBottom:14, fontSize:11, color:C.mu, lineHeight:1.7 }}>
                <b style={{ color:C.re }}>{selected.agent}</b> failed at step {selected.step}. Reason: <span style={{ color:C.am }}>{selected.reason}</span>. Confidence: <span style={{ color:C.re }}>{selected.conf}</span>
              </div>
              {selected.trace.map(t => (
                <div key={t.n} style={{ display:'flex', gap:10, marginBottom:10 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', background:C.blBg, border:`1px solid ${C.bl}44`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:mono, fontSize:9, color:C.bl, flexShrink:0 }}>{t.n}</div>
                  <div>
                    <span style={{ fontFamily:mono, fontSize:10, color:C.tx, fontWeight:500 }}>{t.action}: </span>
                    <span style={{ fontSize:11, color:C.mu }}>{t.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : (
          <Panel title="Decision trace" style={{ alignSelf:'start' }}>
            <div style={{ padding:'50px 16px', textAlign:'center', fontFamily:mono, fontSize:11, color:C.dm }}>← select a failure to see the full decision trace</div>
          </Panel>
        )}
      </div>
    </div>
  );
}
