import { useState } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { MetricTile, Panel, Pill, ConfVal, LeadBadge, Th, Td } from '../components/ui.jsx';
import { MeltTelemetryPanel } from '../components/MeltTelemetry.jsx';

function OrchestrationFlow({ agents }) {
  const lead = agents.find(a => a.role === 'lead');
  const subs = agents.filter(a => a.role !== 'lead');
  const statusCol = { running:C.gr, waiting:C.am, failed:C.re, review:C.bl, idle:C.dm, complete:C.cy };
  return (
    <Panel title="Orchestration flow">
      <div style={{ padding:'16px' }}>
        <div style={{ background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.3)', borderRadius:4, padding:'10px 14px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:C.am, boxShadow:`0 0 8px ${C.am}`, animation:'pulse 2s ease-in-out infinite', flexShrink:0 }} />
          <div>
            <div style={{ fontSize:13, fontWeight:500, fontFamily:sans, display:'flex', alignItems:'center', gap:8 }}>
              {lead ? lead.name : 'lead-orchestrator-01'}
              <LeadBadge />
            </div>
            <div style={{ fontFamily:mono, fontSize:10, color:C.mu, marginTop:2 }}>
              dispatched {lead ? lead.dispatched||0 : 0} tasks · conf {lead ? lead.conf.toFixed(2) : '—'} · always running
            </div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {subs.map(a => (
            <div key={a.id} style={{ background:C.sf2, borderRadius:3, padding:'9px 10px', borderTop:`2px solid ${statusCol[a.status]||C.dm}`, position:'relative' }}>
              <div style={{ fontFamily:mono, fontSize:9, color:C.am, marginBottom:4, letterSpacing:'.05em' }}>← dispatches</div>
              <div style={{ fontSize:11, fontWeight:500, fontFamily:sans, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4 }}>
                <Pill status={a.status} />
              </div>
              <div style={{ fontFamily:mono, fontSize:10, color:C.mu, marginTop:5 }}>conf {a.conf.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export default function PageAgentFleet({ st }) {
  const { agents } = st;
  const [selectedId, setSelectedId] = useState(null);
  const selectedAgent = agents.find(a => a.id === selectedId);

  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        <MetricTile label="Total agents"    value={agents.length}                                                              delta={`${agents.filter(a=>a.status==='running').length} running now`}  dir="up"   accent="green" />
        <MetricTile label="Avg confidence"  value={(agents.reduce((s,a)=>s+a.conf,0)/agents.length).toFixed(2)}               delta="across all agents"                                                 dir="flat" accent="blue" />
        <MetricTile label="Failed / review" value={agents.filter(a=>['failed','review'].includes(a.status)).length}           delta="need attention"                                                    dir="down" accent="red" />
        <MetricTile label="Total tasks"     value={agents.reduce((s,a)=>s+a.tasks,0).toLocaleString()}                        delta="all agents combined"                                               dir="up"   accent="cyan" />
      </div>

      <OrchestrationFlow agents={agents} />

      {selectedAgent && selectedAgent._deployed && (
        <Panel
          title={`Live MELT Telemetry — ${selectedAgent.name}`}
          right={
            <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
              <span style={{ fontFamily:mono, fontSize:9, padding:'2px 8px', borderRadius:2, background:C.cyBg, color:C.cy, border:'1px solid rgba(6,182,212,.3)' }}>● LIVE</span>
              <span style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{selectedAgent._melt.length} layers · 40 fields · {selectedAgent._tools.length} tools</span>
              <button onClick={() => setSelectedId(null)} style={{ background:'transparent', border:'none', color:C.mu, cursor:'pointer', fontSize:14, padding:'0 4px', marginLeft:4 }}>✕</button>
            </div>
          }
        >
          <div style={{ padding:'0 16px 16px' }}>
            <MeltTelemetryPanel agent={selectedAgent} />
          </div>
        </Panel>
      )}

      <Panel
        title="Full agent fleet"
        right={<span style={{ fontFamily:mono, fontSize:10, color:C.mu, marginLeft:'auto' }}>{agents.length} agents registered · 1 lead · {agents.filter(a=>a._deployed).length} deployed</span>}
      >
        <div style={{ padding:'0 16px' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>
              {['Agent','Model','Type','Status','Progress','Confidence','Tasks','Errors','Latency'].map(h => <Th key={h}>{h}</Th>)}
            </tr></thead>
            <tbody>
              {agents.map(a => {
                const barCol = a.role==='lead' ? C.am : ({running:C.gr,waiting:C.am,failed:C.re,review:C.bl,idle:C.dm,complete:C.cy}[a.status]||C.bl);
                return (
                  <tr key={a.id}
                    onClick={() => a._deployed && setSelectedId(selectedId===a.id ? null : a.id)}
                    style={{ background:a.role==='lead'?'rgba(245,158,11,.04)':selectedId===a.id?'rgba(59,130,246,.06)':'transparent', borderLeft:a.role==='lead'?`2px solid ${C.am}`:selectedId===a.id?`2px solid ${C.bl}`:'2px solid transparent', cursor:a._deployed?'pointer':'default', transition:'background .15s' }}
                  >
                    <Td>
                      <div style={{ display:'flex', alignItems:'center', gap:6, fontWeight:500, fontFamily:sans }}>
                        {a.name}
                        {a.role==='lead' && <LeadBadge />}
                        {a._deployed && <span style={{ fontFamily:mono, fontSize:9, padding:'1px 6px', borderRadius:2, background:'rgba(6,182,212,.12)', color:C.cy, border:'1px solid rgba(6,182,212,.3)' }}>MELT</span>}
                      </div>
                      <div style={{ fontFamily:mono, fontSize:10, color:C.mu, marginTop:2 }}>{a.id}</div>
                    </Td>
                    <Td style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{a.model}</Td>
                    <Td style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{a.type.replace(/_/g,' ')}</Td>
                    <Td><Pill status={a.status} /></Td>
                    <Td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:70, height:4, background:C.sf2, borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${Math.round(a.step/a.totalSteps*100)}%`, background:barCol, transition:'width .5s', borderRadius:2 }} />
                        </div>
                        <span style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{a.step}/{a.totalSteps}</span>
                      </div>
                    </Td>
                    <Td><ConfVal v={a.conf} /></Td>
                    <Td style={{ fontFamily:mono, fontSize:12 }}>{a.tasks.toLocaleString()}</Td>
                    <Td style={{ fontFamily:mono, fontSize:12, color:a.errors>15?C.re:a.errors>5?C.am:C.gr }}>{a.errors}</Td>
                    <Td style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{a.latency}ms</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
