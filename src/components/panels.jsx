import { useState, useEffect, useRef, useMemo } from 'react';
import { C, mono, sans } from '../constants/palette.js';
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
  const { feedback = [], guardrails = [], agents = [], metrics = {}, sessions = [] } = st || {};

  const corrections   = feedback.filter(f => f.actionType !== 'accepted');
  const correctionCount = corrections.length;
  const failedGR      = guardrails.filter(g => !g.passed);
  const totalFeedback = feedback.length || 1;
  const overrideRate  = ((correctionCount / totalFeedback) * 100).toFixed(1);
  const overrideOk    = parseFloat(overrideRate) < 5;

  // Group guardrail blocks by reason code for pattern analysis
  const patternFreq = {};
  failedGR.forEach(g => {
    const k = g.reasonCode || g.name || g.type || 'Unknown';
    if (!patternFreq[k]) patternFreq[k] = { count: 0, type: g.type, name: g.name, sessions: new Set() };
    patternFreq[k].count++;
    if (g.sessionId) patternFreq[k].sessions.add(g.sessionId);
  });
  const patterns     = Object.entries(patternFreq).sort((a, b) => b[1].count - a[1].count);
  const patternCount = patterns.length;
  const versionedAgents = agents.filter(a => a.version);

  const ACTION_COL  = { rejected: C.re, edited: C.am, corrected: C.am };
  const TYPE_COL    = { PII: '#a78bfa', Policy: C.am, Toxicity: C.re };
  const statusBadge = (s) => ({ ok: C.gr, warn: C.am, err: C.re }[s] || C.mu);

  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* KPI strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          { label:'Human Corrections', val: correctionCount, col: C.bl,
            sub: `${feedback.length} total feedback event${feedback.length !== 1 ? 's' : ''} · ${feedback.filter(f => f.actionType === 'accepted').length} accepted` },
          { label:'Failure Patterns',  val: patternCount,    col: C.am,
            sub: `${failedGR.length} guardrail block${failedGR.length !== 1 ? 's' : ''} · ${patterns.filter(([,v]) => v.count >= 2).length} at threshold` },
          { label:'Agents Versioned',  val: versionedAgents.length, col: C.gr,
            sub: versionedAgents.map(a => `${a.displayName} v${a.version}`).join(' · ') || 'none' },
        ].map(x => (
          <div key={x.label} style={{ background:C.sf, border:`1px solid ${C.b}`, borderRadius:6, padding:'16px 18px' }}>
            <div style={{ fontFamily:sans, fontSize:34, fontWeight:200, color:x.col, lineHeight:1 }}>{x.val}</div>
            <div style={{ fontFamily:mono, fontSize:10, color:C.mu, textTransform:'uppercase', letterSpacing:'.06em', marginTop:6 }}>{x.label}</div>
            <div style={{ fontFamily:mono, fontSize:10, color:C.dm, marginTop:3 }}>{x.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems:'start' }}>

        {/* Correction detail */}
        <Panel title="Human Corrections"
          subtitle={correctionCount === 0 ? 'All agent outputs accepted — no overrides recorded' : `${correctionCount} output${correctionCount !== 1 ? 's' : ''} were edited or rejected by a human reviewer`}>
          {correctionCount === 0 ? (
            <div style={{ padding:'28px 16px', textAlign:'center', fontFamily:mono, fontSize:11, color:C.gr }}>
              ✓ No corrections needed this session
            </div>
          ) : corrections.map((c, i) => (
            <div key={i} style={{ padding:'10px 16px', borderBottom:`1px solid ${C.b}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                <div style={{ display:'flex', gap:7, alignItems:'center' }}>
                  <span style={{ fontFamily:sans, fontSize:12, fontWeight:500, color:C.tx }}>{c.agent}</span>
                  <span style={{ fontFamily:mono, fontSize:9, padding:'1px 6px', borderRadius:2,
                    background:(ACTION_COL[c.actionType]||C.mu)+'22', color:ACTION_COL[c.actionType]||C.mu,
                    border:`1px solid ${(ACTION_COL[c.actionType]||C.mu)}44`, textTransform:'uppercase' }}>
                    {c.actionType}
                  </span>
                  {c.sentiment && <span style={{ fontFamily:mono, fontSize:9, color:c.sentiment==='negative'?C.re:C.gr }}>{c.sentiment}</span>}
                </div>
                <span style={{ fontFamily:mono, fontSize:10, color:C.dm }}>{c.ts ? new Date(c.ts).toLocaleTimeString() : '—'}</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:10, fontFamily:mono, fontSize:10, color:C.mu, marginBottom: c.text ? 5 : 0 }}>
                {c.intent  && <span>intent: <span style={{ color:C.tx }}>{c.intent.replace(/_/g,' ')}</span></span>}
                {c.topic   && <span>topic: <span style={{ color:C.tx }}>{c.topic.replace(/_/g,' ')}</span></span>}
                {c.editDistance != null && <span>edit Δ: <span style={{ color:c.editDistance > 10 ? C.re : C.am }}>{c.editDistance} chars</span></span>}
                <span style={{ color:C.bl }}>session {c.sessionId}</span>
              </div>
              {c.text && (
                <div style={{ padding:'6px 10px', background:C.sf2, borderRadius:3, fontFamily:mono, fontSize:10, color:C.mu, fontStyle:'italic', lineHeight:1.5 }}>
                  "{c.text.length > 140 ? c.text.slice(0,140)+'…' : c.text}"
                </div>
              )}
            </div>
          ))}
          {correctionCount > 0 && (
            <div style={{ padding:'8px 16px', fontFamily:mono, fontSize:10, color:C.dm }}>
              Each correction is stored with original output, edit delta, and intent label to feed future fine-tuning runs.
            </div>
          )}
        </Panel>

        {/* Failure patterns */}
        <Panel title="Failure Patterns"
          subtitle="Guardrail blocks grouped by reason code — ≥2 occurrences flags a prompt-update candidate">
          {patterns.length === 0 ? (
            <div style={{ padding:'28px 16px', textAlign:'center', fontFamily:mono, fontSize:11, color:C.gr }}>
              ✓ No repeated failure patterns detected
            </div>
          ) : patterns.map(([code, info]) => {
            const isPattern = info.count >= 2;
            const typeCol   = TYPE_COL[info.type] || C.mu;
            return (
              <div key={code} style={{ padding:'10px 16px', borderBottom:`1px solid ${C.b}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                  <div>
                    <span style={{ fontFamily:sans, fontSize:12, fontWeight:500, color:C.tx }}>
                      {code.replace(/_/g,' ')}
                    </span>
                    {isPattern && (
                      <span style={{ marginLeft:8, fontFamily:mono, fontSize:9, padding:'1px 6px', borderRadius:2,
                        background:C.am+'22', color:C.am, border:`1px solid ${C.am}44` }}>PATTERN</span>
                    )}
                  </div>
                  <span style={{ fontFamily:mono, fontSize:22, fontWeight:200, color:isPattern ? C.am : C.mu }}>{info.count}×</span>
                </div>
                <div style={{ display:'flex', gap:10, fontFamily:mono, fontSize:10, color:C.mu, marginBottom: isPattern ? 5 : 0 }}>
                  <span>type: <span style={{ color:typeCol }}>{info.type || '—'}</span></span>
                  <span>guardrail: <span style={{ color:C.tx }}>{info.name || '—'}</span></span>
                  <span>sessions: <span style={{ color:C.bl }}>{info.sessions.size}</span></span>
                </div>
                {isPattern && (
                  <div style={{ padding:'5px 8px', background:C.am+'11', borderRadius:3, fontFamily:mono, fontSize:10, color:C.am, border:`1px solid ${C.am}22` }}>
                    ↺ Flagged for prompt review — same failure reason triggered {info.count}× across {info.sessions.size} session{info.sessions.size !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })}
          {patterns.length > 0 && (
            <div style={{ padding:'8px 16px', fontFamily:mono, fontSize:10, color:C.dm }}>
              Any reason code appearing ≥2× is a candidate for prompt tuning or threshold adjustment.
            </div>
          )}
        </Panel>
      </div>

      <div className="grid-2" style={{ alignItems:'start' }}>

        {/* System status */}
        <Panel title="Learning System Status">
          <div style={{ padding:'0 16px 12px' }}>
            {[
              {
                icon:'✏', title:'Correction logging',
                status: correctionCount === 0 ? 'ok' : correctionCount < 3 ? 'warn' : 'err',
                desc: correctionCount > 0
                  ? `${correctionCount} override${correctionCount !== 1 ? 's' : ''} captured this session. Each includes the original output, correction content, and a classification label for the training pipeline.`
                  : 'All agent outputs accepted without modification — system performing within expectations.',
              },
              {
                icon:'⊞', title:'Pattern detection',
                status: patternCount === 0 ? 'ok' : 'warn',
                desc: failedGR.length > 0
                  ? `${failedGR.length} guardrail block${failedGR.length !== 1 ? 's' : ''} across ${patternCount} distinct reason code${patternCount !== 1 ? 's' : ''}. ${patterns.filter(([,v]) => v.count >= 2).length > 0 ? 'Patterns at threshold: ' + patterns.filter(([,v]) => v.count >= 2).map(([k]) => k.replace(/_/g,' ')).join(', ') + '.' : 'No codes at threshold yet.'}`
                  : 'No guardrail blocks recorded — all safety checks passed.',
              },
              {
                icon:'↺', title:'Threshold recalibration',
                status: overrideOk ? 'ok' : 'warn',
                desc: `Thresholds auto-tune when override rate exceeds 5%. Current rate: ${overrideRate}% (${correctionCount} overrides / ${feedback.length} feedback events). ${overrideOk ? 'Within target — no recalibration triggered.' : 'Above target — recalibration candidate.'}`,
              },
              {
                icon:'◈', title:'Prompt versioning',
                status: 'ok',
                desc: versionedAgents.length > 0
                  ? versionedAgents.map(a => `${a.displayName} v${a.version} — avg quality ${(a.conf*100).toFixed(0)}%, ${a.llmCallCount||0} LLM call${a.llmCallCount !== 1 ? 's' : ''} this session`).join('. ')
                  : 'No version metadata in current dataset.',
              },
            ].map(({ icon, title, status, desc }) => (
              <div key={title} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 0', borderBottom:`1px solid ${C.b}`, fontSize:12 }}>
                <div style={{ width:28, height:28, borderRadius:3, background:C.sf2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, flexShrink:0 }}>{icon}</div>
                <div style={{ flex:1, color:C.mu, lineHeight:1.6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                    <b style={{ color:C.tx, fontWeight:500, fontSize:12 }}>{title}</b>
                    <span style={{ fontFamily:mono, fontSize:9, padding:'1px 6px', borderRadius:2,
                      background:statusBadge(status)+'22', color:statusBadge(status), border:`1px solid ${statusBadge(status)}44` }}>
                      {status.toUpperCase()}
                    </span>
                  </div>
                  {desc}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Per-agent breakdown */}
        <Panel title="Agent Quality Registry" subtitle="Per-agent correction and guardrail breakdown this session">
          <div style={{ padding:'0 16px 12px' }}>
            {agents.length === 0 ? (
              <div style={{ padding:'28px 0', textAlign:'center', fontFamily:mono, fontSize:11, color:C.dm }}>No agent data loaded.</div>
            ) : agents.map(a => {
              const myFB   = feedback.filter(f  => f.agent === a.displayName);
              const myCorr = myFB.filter(f => f.actionType !== 'accepted');
              const myBlocks = guardrails.filter(g => g.agent === a.displayName && !g.passed);
              const qualOk   = a.conf >= 0.75;
              return (
                <div key={a.id} style={{ padding:'12px 0', borderBottom:`1px solid ${C.b}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div>
                      <div style={{ fontFamily:sans, fontSize:13, fontWeight:500, color:C.tx }}>{a.displayName}</div>
                      <div style={{ fontFamily:mono, fontSize:10, color:C.mu, marginTop:2 }}>
                        {a.version ? `v${a.version}` : 'unversioned'} · {a.model} · {a.type.replace(/_/g,' ')}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:mono, fontSize:22, fontWeight:300, color: qualOk ? C.gr : C.am, lineHeight:1 }}>{(a.conf*100).toFixed(0)}%</div>
                      <div style={{ fontFamily:mono, fontSize:9, color:C.dm }}>avg quality</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:8 }}>
                    {[
                      { label:'Feedback',   val: myFB.length,      col: C.bl },
                      { label:'Overrides',  val: myCorr.length,    col: myCorr.length > 0 ? C.am : C.gr },
                      { label:'GR blocks',  val: myBlocks.length,  col: myBlocks.length > 0 ? C.re : C.gr },
                      { label:'LLM calls',  val: a.llmCallCount||0, col: C.mu },
                    ].map(m => (
                      <div key={m.label} style={{ background:C.sf2, borderRadius:3, padding:'6px 8px', textAlign:'center' }}>
                        <div style={{ fontFamily:mono, fontSize:14, fontWeight:300, color:m.col }}>{m.val}</div>
                        <div style={{ fontFamily:mono, fontSize:9, color:C.dm, marginTop:1 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                  {myCorr.length > 0 && (
                    <div style={{ fontFamily:mono, fontSize:10, color:C.am, padding:'4px 8px', background:C.am+'11', borderRadius:3 }}>
                      {myCorr.length} override{myCorr.length !== 1 ? 's' : ''} — topics: {[...new Set(myCorr.map(c => c.topic||c.intent||'unknown').filter(Boolean))].join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ marginTop:10, padding:'8px 10px', background:C.sf2, borderRadius:3, fontFamily:mono, fontSize:10, color:C.mu, lineHeight:1.8 }}>
              Override rate: <span style={{ color: overrideOk ? C.gr : C.am }}>{overrideRate}%</span> (target &lt;5%) ·{' '}
              Guardrail pass rate: <span style={{ color: (metrics.guardrailPassRate ?? 100) >= 90 ? C.gr : C.am }}>{metrics.guardrailPassRate ?? 100}%</span> ·{' '}
              Feedback accept rate: <span style={{ color: (metrics.feedbackAcceptRate ?? 100) >= 80 ? C.gr : C.am }}>{metrics.feedbackAcceptRate ?? 100}%</span>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
