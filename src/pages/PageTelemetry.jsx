import { useState } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { MELT_FIELDS } from '../constants/meltSchema.js';
import { MetricTile } from '../components/ui.jsx';
import { AgentTelemetryView } from '../components/MeltTelemetry.jsx';

export default function PageTelemetry({ st }) {
  const { agents } = st;
  const [selId, setSelId] = useState(agents[0]?.id);
  const selAgent = agents.find(a => a.id === selId) || agents[0];
  const enabledLayers = selAgent ? (selAgent._melt || ['L1','L2','L3','L4','L5','L6']) : [];
  const totalFields = enabledLayers.reduce((s,id) => s+(MELT_FIELDS[id]?.fields.length||0), 0);

  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Summary tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
        <MetricTile label="Selected agent"  value={selAgent?.name||'—'}                                                         delta={`${selAgent?.model||'—'} · ${selAgent?.type?.replace(/_/g,' ')||'—'}`}     dir="flat" accent="blue" />
        <MetricTile label="Confidence"      value={selAgent?.conf?.toFixed(2)||'—'}                                              delta={`threshold ${selAgent?._conf_min||0.70}`}                                     dir={selAgent?.conf>=(selAgent?._conf_min||0.70)?'up':'down'} accent={selAgent?.conf>=.75?'green':selAgent?.conf>=.4?'amber':'red'} />
        <MetricTile label="Latency (p50)"   value={`${selAgent?Math.round(selAgent.latency*.7):0}ms`}                           delta={`p99 → ${selAgent?Math.round(selAgent.latency*2.2):0}ms`}                    dir="flat" accent="cyan" />
        <MetricTile label="Tasks processed" value={selAgent?.tasks?.toLocaleString()||0}                                         delta={`${selAgent?.errors||0} errors`}                                              dir="up"   accent="green" />
        <MetricTile label="MELT coverage"   value={`${enabledLayers.length} / 6 layers`}                                        delta={`${totalFields} fields instrumented`}                                          dir="up"   accent="purple" />
      </div>

      {/* Agent selector + telemetry body */}
      <div style={{ background:C.sf, border:`1px solid ${C.b}`, borderRadius:4 }}>
        {/* Selector row */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:`1px solid ${C.b}`, flexWrap:'wrap' }}>
          <span style={{ fontFamily:mono, fontSize:10, color:C.mu, textTransform:'uppercase', letterSpacing:'.07em', flexShrink:0 }}>Select agent</span>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
            {agents.map(a => {
              const isActive = selId === a.id;
              const dot = a.status==='running' ? C.gr : a.status==='failed' ? C.re : C.am;
              return (
                <button key={a.id} onClick={() => setSelId(a.id)} style={{ display:'flex', alignItems:'center', gap:6, fontFamily:mono, fontSize:10, padding:'5px 12px', borderRadius:3, cursor:'pointer', transition:'all .15s', background:isActive?C.blBg:'transparent', border:`1px solid ${isActive?C.blBd:C.b2}`, color:isActive?C.bl:C.mu }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:dot, flexShrink:0 }} />
                  {a.name}
                  {a.role==='lead' && <span style={{ fontSize:8, color:C.am }}> ★</span>}
                  {a._deployed && <span style={{ fontSize:8, color:C.cy }}> ⬡</span>}
                </button>
              );
            })}
          </div>
          <span style={{ fontFamily:mono, fontSize:9, padding:'3px 10px', borderRadius:2, background:C.grBg, color:C.gr, border:`1px solid ${C.grBd}`, flexShrink:0 }}>● LIVE · 5s</span>
        </div>

        {/* Telemetry body */}
        <div style={{ padding:'16px' }}>
          {selAgent
            ? <AgentTelemetryView agent={selAgent} st={st} key={selAgent.id} />
            : <div style={{ textAlign:'center', padding:'60px 0', fontFamily:mono, fontSize:12, color:C.dm }}>Select an agent above to view its MELT telemetry</div>
          }
        </div>
      </div>
    </div>
  );
}
