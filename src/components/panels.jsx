import { useState, useEffect, useRef, useMemo } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { AGENT_DEFS } from '../constants/agentDefs.js';
import { rnd, pick } from '../utils/dataHelpers.js';
import { Panel, Pill, ConfVal, Bar, LeadBadge, Th, Td } from './ui.jsx';

export function AgentTable({ agents }) {
  return (
    <Panel
      title="Active agents"
      right={<span style={{ fontFamily:mono, fontSize:10, color:C.mu, marginLeft:'auto' }}>{agents.length} total · {agents.filter(a=>a.status==='running').length} active</span>}
    >
      <div style={{ padding:'0 16px' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr>
            <Th>Agent</Th><Th>Status</Th><Th>Progress</Th>
            <Th>Conf.</Th><Th>Tasks</Th><Th>Errors</Th>
          </tr></thead>
          <tbody>
            {agents.map(a => {
              const barCol = a.role==='lead' ? C.am : ({running:C.gr,waiting:C.am,failed:C.re,review:C.bl,idle:C.dm,complete:C.cy}[a.status]||C.bl);
              return (
                <tr key={a.id} style={{ background:a.role==='lead'?'rgba(245,158,11,.04)':'transparent', borderLeft:a.role==='lead'?`2px solid ${C.am}`:'2px solid transparent' }}>
                  <Td>
                    <div style={{ display:'flex', alignItems:'center', fontWeight:500, fontSize:13, fontFamily:sans }}>
                      {a.name}{a.role==='lead' && <LeadBadge />}
                    </div>
                    <div style={{ fontFamily:mono, fontSize:10, color:C.mu, marginTop:2 }}>{a.id} · {a.model}</div>
                  </Td>
                  <Td><Pill status={a.status} /></Td>
                  <Td>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:70, height:4, background:C.sf2, borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${Math.round(a.step/a.totalSteps*100)}%`, background:barCol, borderRadius:2, transition:'width .5s' }} />
                      </div>
                      <span style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{a.step}/{a.totalSteps}</span>
                    </div>
                  </Td>
                  <Td><ConfVal v={a.conf} /></Td>
                  <Td style={{ fontFamily:mono, fontSize:12 }}>{a.tasks.toLocaleString()}</Td>
                  <Td style={{ fontFamily:mono, fontSize:12, color:a.errors>15?C.re:a.errors>5?C.am:C.gr }}>{a.errors}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

export function EventTimeline({ events }) {
  return (
    <Panel
      title="Event timeline"
      right={<span style={{ fontFamily:mono, fontSize:10, padding:'1px 8px', borderRadius:2, background:C.grBg, color:C.gr, marginLeft:'auto' }}>● Live</span>}
    >
      <div style={{ padding:'0 16px' }}>
        {events.slice(0, 8).map((ev, i) => (
          <div key={ev.id || i} style={{ display:'flex', gap:12, padding:'9px 0', borderBottom:i<7?`1px solid ${C.b}`:'none', animation:`slideIn .2s ease ${i*.04}s both` }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0, width:40 }}>
              <span style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{ev.ts}</span>
              <div style={{ width:8, height:8, borderRadius:'50%', background:ev.color, flexShrink:0 }} />
              {i < 7 && <div style={{ width:1, flex:1, background:C.b }} />}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:500, marginBottom:2, fontFamily:sans }}>{ev.title}</div>
              <div style={{ fontSize:11, color:C.mu, fontFamily:mono }}>{ev.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function ThroughputChart({ data, tall = false }) {
  const maxV = Math.max(...data);
  return (
    <Panel title="Task throughput — 24h">
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:tall?80:40, marginBottom:8 }}>
          {data.map((v, i) => (
            <div key={i} style={{ flex:1, borderRadius:'1px 1px 0 0', minWidth:4, height:`${Math.round(v/maxV*100)}%`, background:i>=data.length-4?C.bl:C.dm, opacity:.4+(i/data.length)*.6, transition:'height .4s ease' }} />
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontFamily:mono, fontSize:10, color:C.mu }}>
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>now</span>
        </div>
        <div style={{ display:'flex', gap:20, marginTop:12 }}>
          {[{label:'PEAK',val:`${maxV}/min`},{label:'AVG',val:`${Math.round(data.reduce((a,b)=>a+b)/data.length)}/min`},{label:'QUEUED',val:rnd(30,60)}].map(x=>(
            <div key={x.label}>
              <div style={{ fontFamily:mono, fontSize:10, color:C.mu, marginBottom:3 }}>{x.label}</div>
              <div style={{ fontSize:18, fontWeight:300, fontFamily:sans }}>{x.val}</div>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function FailureDist({ data }) {
  const labels = ['Low confidence','Ambiguous input','Policy boundary','Tool failure','User request'];
  const colors = [C.bl, C.am, C.re, C.mu, C.gr];
  return (
    <Panel title="Failure distribution">
      <div style={{ padding:'14px 16px' }}>
        {labels.map((l, i) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:11, color:C.mu, width:120, flexShrink:0 }}>{l}</span>
            <Bar pct={data[i]} color={colors[i]} />
            <span style={{ fontFamily:mono, fontSize:11, color:C.mu, width:30, textAlign:'right' }}>{data[i]}%</span>
          </div>
        ))}
        <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.b}`, fontFamily:mono, fontSize:10, color:C.mu }}>
          {data.reduce((a,b)=>a+b)} failures tracked · 24h window
        </div>
      </div>
    </Panel>
  );
}

export function ConfGauges({ data }) {
  const labels = { orchestrator:'orchestrator', order_processing:'order-proc', report_gen:'report-gen', email_draft:'email-draft', data_enrich:'data-enrich', invoice_parse:'invoice-parse', crm_sync:'crm-sync', support:'support', analytics:'analytics' };
  return (
    <Panel title="Confidence by task type">
      <div style={{ padding:'14px 16px' }}>
        {Object.entries(data).map(([type, val]) => {
          const col = val >= .75 ? C.gr : val >= .4 ? C.am : C.re;
          return (
            <div key={type} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontFamily:mono, fontSize:11, color:C.mu, width:110, flexShrink:0 }}>{labels[type]||type}</span>
              <div style={{ flex:1, height:6, background:C.sf2, borderRadius:3, overflow:'hidden', position:'relative' }}>
                <div style={{ height:'100%', width:`${val*100}%`, background:col, borderRadius:3, transition:'width .5s' }} />
                <div style={{ position:'absolute', right:'25%', top:-2, bottom:-2, width:1, background:C.dm }} />
              </div>
              <span style={{ fontFamily:mono, fontSize:11, width:34, textAlign:'right', color:col }}>{val.toFixed(2)}</span>
            </div>
          );
        })}
        <div style={{ fontFamily:mono, fontSize:10, color:C.dm, marginTop:4 }}>│ threshold at 0.75</div>
      </div>
    </Panel>
  );
}

export function HeatmapPanel() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const cells = useMemo(() => days.map(d => ({
    day: d,
    hours: Array.from({ length:24 }, (_, h) => {
      const work = h >= 8 && h <= 18;
      const v = work ? Math.random() * .9 + .05 : Math.random() * .25;
      return v < .1 ? 'transparent' : `rgba(245,158,11,${(v*.9).toFixed(2)})`;
    })
  })), []);
  return (
    <Panel title="Handoff activity — 7-day heatmap">
      <div style={{ padding:'14px 16px' }}>
        {cells.map(row => (
          <div key={row.day} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            <span style={{ fontFamily:mono, fontSize:10, color:C.dm, width:24, textAlign:'right', flexShrink:0 }}>{row.day}</span>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(24,1fr)', gap:2, flex:1 }}>
              {row.hours.map((bg, h) => (
                <div key={h} style={{ aspectRatio:'1', borderRadius:1, background:bg||C.sf2 }} />
              ))}
            </div>
          </div>
        ))}
        <div style={{ display:'flex', justifyContent:'space-between', fontFamily:mono, fontSize:10, color:C.dm, marginTop:6, paddingLeft:30 }}>
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
        </div>
      </div>
    </Panel>
  );
}

export function LogStream({ logs, maxHeight = 180 }) {
  const ref = useRef();
  const lvlCol = { info:C.bl, ok:C.gr, warn:C.am, err:C.re };
  return (
    <Panel title="Live log stream">
      <div style={{ padding:'10px 14px' }}>
        <div ref={ref} style={{ background:C.bg, borderRadius:3, padding:12, fontFamily:mono, fontSize:11, lineHeight:1.8, maxHeight, overflowY:'auto' }}>
          {logs.map((l, i) => (
            <div key={l.id||i} style={{ display:'flex', gap:10, animation:i===0?'slideIn .2s ease both':'none' }}>
              <span style={{ color:C.dm, flexShrink:0 }}>{l.ts}</span>
              <span style={{ width:36, flexShrink:0, color:lvlCol[l.level]||C.mu }}>{l.level.toUpperCase()}</span>
              <span style={{ color:C.mu }}>{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function LearningPanel() {
  const [corrections, setCorrections] = useState(142);
  const [patterns] = useState(8);
  const [prompts] = useState(3);
  useEffect(() => {
    const t = setInterval(() => setCorrections(c => c + rnd(0, 2)), 12000);
    return () => clearInterval(t);
  }, []);
  return (
    <Panel title="Learning & corrections">
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
          {[{label:'Corrections',val:corrections,col:C.bl},{label:'Patterns',val:patterns,col:C.am},{label:'Prompts updated',val:prompts,col:C.gr}].map(x => (
            <div key={x.label} style={{ background:C.sf2, borderRadius:3, padding:'10px 12px' }}>
              <div style={{ fontSize:18, fontWeight:300, color:x.col, marginBottom:2, fontFamily:sans }}>{x.val}</div>
              <div style={{ fontFamily:mono, fontSize:10, color:C.mu, textTransform:'uppercase', letterSpacing:'.05em' }}>{x.label}</div>
            </div>
          ))}
        </div>
        {[
          ['✏','Correction logging','Every human override captured with context, label, and original output.'],
          ['⊞','Pattern detection',`Same failure ≥5× triggers prompt-update candidate. ${patterns} flagged this week.`],
          ['↺','Threshold recalibration','Thresholds tuned when override rate exceeds 5%.'],
          ['◈','Prompt versioning','invoice-parse v1.5 deployed. A/B running. +6pp conf so far.'],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'9px 0', borderBottom:`1px solid ${C.b}`, fontSize:12 }}>
            <div style={{ width:28, height:28, borderRadius:3, background:C.sf2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>{icon}</div>
            <div style={{ color:C.mu, lineHeight:1.5 }}>
              <b style={{ color:C.tx, fontWeight:500 }}>{title}</b><br />{desc}
            </div>
          </div>
        ))}
        <div style={{ marginTop:12, padding:'10px 12px', background:C.sf2, borderRadius:3, fontFamily:mono, fontSize:10, color:C.mu, lineHeight:1.8 }}>
          Override rate: <span style={{ color:C.gr }}>3.2%</span> (target &lt;5%)<br />
          Next review: <span style={{ color:C.tx }}>today 18:00</span><br />
          Pending fine-tune: <span style={{ color:C.am }}>invoice-parse · 142 examples</span>
        </div>
      </div>
    </Panel>
  );
}
