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
  // data is either a number[] (throughputSeries) or empty
  const series = Array.isArray(data) && data.length > 0 ? data : Array(24).fill(0);
  const maxV = Math.max(...series, 1);
  const avg  = Math.round(series.reduce((a, b) => a + b, 0) / series.length);
  return (
    <Panel title="Span activity — session window">
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:tall?80:40, marginBottom:8 }}>
          {series.map((v, i) => (
            <div key={i} style={{ flex:1, borderRadius:'1px 1px 0 0', minWidth:4, height:`${Math.round(v/maxV*100)}%`, background:i>=series.length-4?C.bl:C.dm, opacity:.4+(i/series.length)*.6, transition:'height .4s ease' }} />
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', fontFamily:mono, fontSize:10, color:C.mu }}>
          <span>start</span><span>25%</span><span>50%</span><span>75%</span><span>end</span>
        </div>
        <div style={{ display:'flex', gap:20, marginTop:12 }}>
          {[{label:'PEAK',val:`${maxV} spans`},{label:'AVG',val:`${avg} spans`},{label:'BUCKETS',val:`${series.length}`}].map(x=>(
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
  // data is an object: { 'Guardrail block': 40, 'Tool failure': 20, ... }
  const entries = data && typeof data === 'object' ? Object.entries(data) : [];
  const COLORS = [C.re, C.am, C.bl, C.mu, C.gr, C.pu];
  if (entries.length === 0) {
    return (
      <Panel title="Failure distribution">
        <div style={{ padding:'14px 16px', fontFamily:mono, fontSize:11, color:C.mu }}>No failures in current dataset.</div>
      </Panel>
    );
  }
  const total = entries.reduce((a, [,v]) => a + v, 0);
  return (
    <Panel title="Failure distribution">
      <div style={{ padding:'14px 16px' }}>
        {entries.map(([label, pct], i) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <span style={{ fontSize:11, color:C.mu, width:130, flexShrink:0 }}>{label}</span>
            <Bar pct={pct} color={COLORS[i % COLORS.length]} />
            <span style={{ fontFamily:mono, fontSize:11, color:C.mu, width:34, textAlign:'right' }}>{pct}%</span>
          </div>
        ))}
        <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.b}`, fontFamily:mono, fontSize:10, color:C.mu }}>
          {total}% total weighted · real data only
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

export function HeatmapPanel({ data }) {
  // data: { 'Mon-14': count, 'Tue-9': count, ... } or undefined
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const maxCount = data ? Math.max(...Object.values(data), 1) : 1;
  const cells = DAYS.map(d => ({
    day: d,
    hours: Array.from({ length:24 }, (_, h) => {
      const count = data?.[`${d}-${h}`] || 0;
      const intensity = count / maxCount;
      return intensity < 0.01 ? null : intensity;
    }),
  }));
  const hasData = data && Object.keys(data).length > 0;
  return (
    <Panel title={`Session activity — ${hasData ? 'real data' : 'no data yet'}`}>
      <div style={{ padding:'14px 16px' }}>
        {!hasData && (
          <div style={{ fontFamily:mono, fontSize:11, color:C.mu, marginBottom:8 }}>Upload data to see real activity.</div>
        )}
        {cells.map(row => (
          <div key={row.day} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
            <span style={{ fontFamily:mono, fontSize:10, color:C.dm, width:24, textAlign:'right', flexShrink:0 }}>{row.day}</span>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(24,1fr)', gap:2, flex:1 }}>
              {row.hours.map((intensity, h) => (
                <div key={h} style={{ aspectRatio:'1', borderRadius:1, background: intensity ? `rgba(245,158,11,${(intensity*0.9).toFixed(2)})` : 'var(--sf2, #e5e7eb)' }} />
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

export function LearningPanel({ st }) {
  const { feedback = [], guardrails = [], agents = [], metrics = {} } = st || {};

  // Corrections = feedback items that were NOT accepted (human overrides)
  const corrections = feedback.filter(f => f.actionType !== 'accepted');
  const correctionCount = corrections.length;

  // Patterns = distinct failure reason codes from guardrail blocks
  const failedGR = guardrails.filter(g => !g.passed);
  const patternSet = new Set(failedGR.map(g => g.reasonCode || g.name).filter(Boolean));
  const patternCount = patternSet.size;

  // Prompts updated = number of distinct agents that have a version string
  const promptsUpdated = agents.filter(a => a.version).length;

  // Override rate = rejected feedback / total feedback
  const totalFeedback = feedback.length || 1;
  const overrideRate = ((correctionCount / totalFeedback) * 100).toFixed(1);
  const overrideOk = parseFloat(overrideRate) < 5;

  // Agent with most corrections
  const corrByAgent = {};
  corrections.forEach(f => { corrByAgent[f.agent] = (corrByAgent[f.agent] || 0) + 1; });
  const topCorrAgent = Object.entries(corrByAgent).sort((a, b) => b[1] - a[1])[0];
  const pendingAgent = topCorrAgent ? topCorrAgent[0] : (agents[0]?.displayName || 'N/A');
  const pendingExamples = topCorrAgent ? topCorrAgent[1] : correctionCount;

  // Top recurring failure pattern
  const patternFreq = {};
  failedGR.forEach(g => { const k = g.reasonCode || g.name || g.type; patternFreq[k] = (patternFreq[k] || 0) + 1; });
  const topPattern = Object.entries(patternFreq).sort((a, b) => b[1] - a[1])[0];
  const patternThresholdMet = topPattern && topPattern[1] >= 2;

  // Agent version info for prompt versioning row
  const versionedAgent = agents.find(a => a.version) || agents[0];
  const versionNote = versionedAgent
    ? `${versionedAgent.displayName} v${versionedAgent.version} · conf ${(versionedAgent.conf * 100).toFixed(0)}%`
    : 'No versioned agents';

  return (
    <Panel title="Learning & corrections">
      <div style={{ padding:'14px 16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
          {[
            { label:'Corrections', val: correctionCount, col: C.bl },
            { label:'Patterns',    val: patternCount,    col: C.am },
            { label:'Prompts updated', val: promptsUpdated, col: C.gr },
          ].map(x => (
            <div key={x.label} style={{ background:C.sf2, borderRadius:3, padding:'10px 12px' }}>
              <div style={{ fontSize:18, fontWeight:300, color:x.col, marginBottom:2, fontFamily:sans }}>{x.val}</div>
              <div style={{ fontFamily:mono, fontSize:10, color:C.mu, textTransform:'uppercase', letterSpacing:'.05em' }}>{x.label}</div>
            </div>
          ))}
        </div>
        {[
          ['✏','Correction logging','Every human override captured with context, label, and original output.'],
          ['⊞','Pattern detection', patternThresholdMet
            ? `Same failure ≥2× triggers prompt-update candidate. ${patternCount} distinct pattern${patternCount !== 1 ? 's' : ''} flagged.`
            : `${failedGR.length} guardrail block${failedGR.length !== 1 ? 's' : ''} recorded — ${patternCount} unique reason${patternCount !== 1 ? 's' : ''}.`],
          ['↺','Threshold recalibration',`Thresholds tuned when override rate exceeds 5%. Current override rate: ${overrideRate}%.`],
          ['◈','Prompt versioning', versionNote],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'9px 0', borderBottom:`1px solid ${C.b}`, fontSize:12 }}>
            <div style={{ width:28, height:28, borderRadius:3, background:C.sf2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>{icon}</div>
            <div style={{ color:C.mu, lineHeight:1.5 }}>
              <b style={{ color:C.tx, fontWeight:500 }}>{title}</b><br />{desc}
            </div>
          </div>
        ))}
        <div style={{ marginTop:12, padding:'10px 12px', background:C.sf2, borderRadius:3, fontFamily:mono, fontSize:10, color:C.mu, lineHeight:1.8 }}>
          Override rate: <span style={{ color: overrideOk ? C.gr : C.am }}>{overrideRate}%</span> (target &lt;5%)<br />
          Guardrail pass rate: <span style={{ color: metrics.guardrailPassRate >= 90 ? C.gr : C.am }}>{metrics.guardrailPassRate ?? 100}%</span><br />
          {correctionCount > 0
            ? <>Pending review: <span style={{ color:C.am }}>{pendingAgent} · {pendingExamples} override{pendingExamples !== 1 ? 's' : ''}</span></>
            : <span style={{ color:C.gr }}>No pending corrections</span>
          }
        </div>
      </div>
    </Panel>
  );
}
