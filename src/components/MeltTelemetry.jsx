import { useState, useEffect } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { MELT_FIELDS, PILLAR_META, LAYER_COLORS } from '../constants/meltSchema.js';
import { TOOLS } from '../constants/agentDefs.js';
import { rnd, fmtTime } from '../utils/dataHelpers.js';
import { LeadBadge } from './ui.jsx';

function makeLiveData(agent) {
  return {
    L1: {
      task_id: `task_${Math.random().toString(16).slice(2,10)}`,
      agent_id: agent.id, task_type: agent.type.replace(/_/g,' '),
      status: agent.status, current_step: agent.step, total_steps: agent.totalSteps,
      started_at: fmtTime(), ended_at: '—', duration_ms: agent.latency,
      outcome: agent.status==='complete' ? 'success' : 'running',
      error_count: agent.errors, model_id: agent.model,
    },
    L2: {
      step_id: `step_${Math.random().toString(16).slice(2,8)}`,
      step_name: 'Processing task',
      tool_name: (agent._tools||TOOLS)[0]||'db_query',
      tool_inputs: `{"id":"CX-${rnd(1000,9999)}"}`,
      tool_outputs: `{"status":"ok","rows":${rnd(1,12)}}`,
      tool_latency_ms: rnd(80,900), tool_success: true, retry_attempt: 0,
      token_count_in: rnd(300,900), token_count_out: rnd(80,300), total_tool_calls: rnd(1,8),
    },
    L3: {
      confidence_score: agent.conf.toFixed(3),
      conf_tool_agreement: (Math.min(.99,agent.conf+.01)).toFixed(3),
      conf_schema_match: (Math.min(.99,agent.conf+.02)).toFixed(3),
      conf_retrieval_score: (Math.max(.1,agent.conf-.01)).toFixed(3),
      conf_self_check: (Math.min(.99,agent.conf+.005)).toFixed(3),
      threshold_at_time: agent._conf_min||0.70,
    },
    L4: {
      failure_reason: agent.errors>15?'CORE_TECH_FAIL':'—',
      failure_step: agent.errors>15?agent.step:'—',
      failure_message: agent.errors>15?'Tool timeout after 2 retries':'—',
      escalation_flag: agent.conf<.4,
      escalation_trigger: agent.conf<.4?'CORE_LOW_CONF':'—',
      conf_at_escalation: agent.conf<.4?agent.conf.toFixed(3):'—',
      decision_trace: '[plan→tool_call→eval→escalate]',
    },
    L5: {
      human_decision:'—', correction_content:'—',
      correction_reason_label:'—', resolution_time_s:'—',
      override_flag: false, reviewer_id:'—',
    },
    L6: {
      tasks_per_window: rnd(12,55),
      success_rate: (88+Math.random()*10).toFixed(1)+'%',
      p50_latency_ms: Math.round(agent.latency*.7),
      p99_latency_ms: Math.round(agent.latency*2.2),
      token_cost_usd: '$'+(Math.random()*.04).toFixed(4),
      handoff_count: agent.errors>10?rnd(2,8):rnd(0,2),
      avg_conf_by_type: agent.conf.toFixed(3),
      failure_reason_dist: 'low_conf:'+(agent.errors>10?'48%':'18%'),
      handoffs_by_hour: '['+Array.from({length:6},()=>rnd(0,4)).join(',')+']',
      override_rate: (Math.random()*4).toFixed(1)+'%',
      pattern_count: rnd(0,3),
      prompt_version: 'v'+rnd(1,3)+'.'+rnd(1,9),
    },
  };
}

export function AgentTelemetryView({ agent }) {
  const enabledLayers = agent._melt || ['L1','L2','L3','L4','L5','L6'];
  const [live, setLive] = useState(() => makeLiveData(agent));

  useEffect(() => {
    setLive(makeLiveData(agent));
    const id = setInterval(() => setLive(prev => ({
      ...prev,
      L1: { ...prev.L1, duration_ms: prev.L1.duration_ms+rnd(5,40), current_step: Math.min(agent.totalSteps, prev.L1.current_step+(Math.random()>.8?1:0)) },
      L2: { ...prev.L2, tool_latency_ms: rnd(80,900), total_tool_calls: prev.L2.total_tool_calls+(Math.random()>.55?1:0), token_count_in: prev.L2.token_count_in+rnd(0,40), token_count_out: prev.L2.token_count_out+rnd(0,15) },
      L3: { ...prev.L3, confidence_score: Math.max(.1,Math.min(.99,parseFloat(prev.L3.confidence_score)+(Math.random()-.5)*.008)).toFixed(3) },
      L6: { ...prev.L6, tasks_per_window: prev.L6.tasks_per_window+(Math.random()>.6?1:0), token_cost_usd: '$'+(parseFloat(prev.L6.token_cost_usd.slice(1))+Math.random()*.0008).toFixed(4) },
    })), 5000);
    return () => clearInterval(id);
  }, [agent.id]);

  function valueColor(fieldName, val) {
    if (val === false || val === '—') return C.dm;
    if (val === true) return C.gr;
    if (fieldName.includes('conf') || fieldName.includes('score')) return C.am;
    if (fieldName.includes('error') || fieldName.includes('fail') || fieldName === 'escalation_flag') return C.re;
    return C.tx;
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Agent identity bar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:4, background:C.sf2, border:`1px solid ${C.b}` }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:agent.status==='running'?C.gr:C.am, animation:agent.status==='running'?'pulse 2s ease-in-out infinite':'none' }} />
        <span style={{ fontFamily:mono, fontSize:12, fontWeight:500, color:C.tx }}>{agent.name}</span>
        {agent.role==='lead' && <LeadBadge />}
        {agent._deployed && <span style={{ fontFamily:mono, fontSize:9, padding:'1px 6px', borderRadius:2, background:C.cyBg, color:C.cy, border:'1px solid rgba(6,182,212,.3)' }}>DEPLOYED</span>}
        <span style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{agent.id} · {agent.model} · {agent.type.replace(/_/g,' ')}</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
          {Object.entries(PILLAR_META).map(([p, m]) => (
            <span key={p} style={{ fontFamily:mono, fontSize:9, padding:'2px 6px', borderRadius:2, background:m.bg, color:m.color, border:`1px solid ${m.color}33` }}>{p} = {m.label}</span>
          ))}
          <div style={{ width:1, height:14, background:C.b2 }} />
          <span style={{ fontFamily:mono, fontSize:9, padding:'2px 8px', borderRadius:2, background:C.grBg, color:C.gr, border:`1px solid ${C.grBd}` }}>● LIVE · 5s</span>
        </div>
      </div>

      {/* MELT layers grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {enabledLayers.filter(id => live[id] && MELT_FIELDS[id]).map(layerId => {
          const col = LAYER_COLORS[layerId] || C.bl;
          const layerDef = MELT_FIELDS[layerId];
          const liveVals = live[layerId];
          return (
            <div key={layerId} style={{ background:C.sf, border:`1px solid ${C.b}`, borderRadius:4, borderTop:`3px solid ${col}`, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', borderBottom:`1px solid ${C.b}`, background:C.sf2 }}>
                <div style={{ fontFamily:mono, fontSize:11, fontWeight:500, color:col, marginBottom:2 }}>{layerDef.key.replace(/_/g,' ')}</div>
                <div style={{ fontFamily:mono, fontSize:9, color:C.dm }}>{layerDef.pillar} · {layerDef.fields.length} fields</div>
              </div>
              <div style={{ padding:'4px 0' }}>
                {layerDef.fields.map(({ f, p, desc }) => {
                  const val = liveVals[f];
                  const pm = PILLAR_META[p] || PILLAR_META.M;
                  return (
                    <div key={f} style={{ display:'grid', gridTemplateColumns:'1fr auto', alignItems:'start', padding:'5px 14px', borderBottom:`1px solid ${C.b}`, gap:8 }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                          <span style={{ fontFamily:mono, fontSize:10, color:C.tx, fontWeight:500 }}>{f}</span>
                          <span style={{ fontFamily:mono, fontSize:8, padding:'1px 4px', borderRadius:2, background:pm.bg, color:pm.color, border:`1px solid ${pm.color}33`, flexShrink:0 }}>{p}</span>
                        </div>
                        <div style={{ fontFamily:mono, fontSize:9, color:C.dm, lineHeight:1.4 }}>{desc}</div>
                      </div>
                      <div style={{ fontFamily:mono, fontSize:11, fontWeight:500, textAlign:'right', color:valueColor(f,val), marginTop:2, wordBreak:'break-all', maxWidth:110 }}>
                        {String(val ?? '—')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MeltTelemetryPanel({ agent }) {
  const [data, setData] = useState(() => ({
    L1: { task_id:`task_${Math.random().toString(16).slice(2,10)}`, status:'running', duration_ms:rnd(400,2200), outcome:'—', error_count:0, model_id:agent.model },
    L2: { step_name:'Lookup account profile', tool_name:agent._tools?.[0]||'crm_get_account', tool_latency_ms:rnd(120,900), tool_success:true, retry_attempt:0, token_count_in:rnd(300,800), token_count_out:rnd(80,300), total_tool_calls:rnd(1,6) },
    L3: { confidence_score:agent.conf.toFixed(3), conf_tool_agreement:(agent.conf-.02+Math.random()*.04).toFixed(3), conf_schema_match:(agent.conf+.01+Math.random()*.03).toFixed(3), conf_retrieval_score:(agent.conf-.03+Math.random()*.05).toFixed(3), conf_self_check:(agent.conf+Math.random()*.04).toFixed(3), threshold_at_time:agent._conf_min||0.70 },
    L4: { failure_reason:'—', failure_step:'—', escalation_flag:false, escalation_trigger:'—', conf_at_escalation:'—' },
    L5: { human_decision:'—', resolution_time_s:'—', override_flag:false, reviewer_id:'—' },
    L6: { tasks_per_window:rnd(8,40), success_rate:(88+Math.random()*10).toFixed(1)+'%', p50_latency_ms:rnd(400,900), p99_latency_ms:rnd(1800,4200), token_cost_usd:'$'+(Math.random()*.04).toFixed(4), override_rate:'2.1%' },
  }));

  useEffect(() => {
    const id = setInterval(() => setData(prev => ({
      ...prev,
      L1: { ...prev.L1, duration_ms: prev.L1.duration_ms+rnd(10,60), error_count: prev.L1.error_count+(Math.random()>.96?1:0) },
      L2: { ...prev.L2, tool_latency_ms: rnd(120,900), total_tool_calls: prev.L2.total_tool_calls+(Math.random()>.6?1:0), token_count_in: prev.L2.token_count_in+rnd(0,30) },
      L3: { ...prev.L3, confidence_score: Math.max(.1,Math.min(.99,parseFloat(prev.L3.confidence_score)+(Math.random()-.5)*.01)).toFixed(3) },
      L6: { ...prev.L6, tasks_per_window: prev.L6.tasks_per_window+(Math.random()>.6?1:0), token_cost_usd: '$'+(parseFloat(prev.L6.token_cost_usd.slice(1))+Math.random()*.001).toFixed(4) },
    })), 5000);
    return () => clearInterval(id);
  }, []);

  const layers = [
    { id:'L1', label:'L1 · Task Runtime',         color:C.gr, fields:Object.entries(data.L1) },
    { id:'L2', label:'L2 · Step & Tool Calls',    color:C.bl, fields:Object.entries(data.L2) },
    { id:'L3', label:'L3 · Confidence',           color:C.am, fields:Object.entries(data.L3) },
    { id:'L4', label:'L4 · Failure & Escalation', color:C.re, fields:Object.entries(data.L4) },
    { id:'L5', label:'L5 · Human Handoff',        color:C.pu, fields:Object.entries(data.L5) },
    { id:'L6', label:'L6 · Derived Metrics',      color:C.cy, fields:Object.entries(data.L6) },
  ];
  const enabledIds = agent._melt || ['L1','L2','L3','L4','L5','L6'];

  return (
    <div style={{ marginTop:16 }}>
      <div style={{ fontFamily:mono, fontSize:10, color:C.am, letterSpacing:'.07em', textTransform:'uppercase', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:C.gr, animation:'pulse 2s ease-in-out infinite' }} />
        Live MELT Telemetry · 40 fields · 6 layers · refreshes every 5s
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {layers.filter(l => enabledIds.includes(l.id)).map(l => (
          <div key={l.id} style={{ background:C.sf2, borderRadius:3, padding:'10px 12px', borderTop:`2px solid ${l.color}` }}>
            <div style={{ fontFamily:mono, fontSize:10, color:l.color, marginBottom:8, letterSpacing:'.04em' }}>{l.label}</div>
            {l.fields.map(([k, v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', fontFamily:mono, fontSize:10, marginBottom:4 }}>
                <span style={{ color:C.dm, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'55%' }}>{k}</span>
                <span style={{ color:v===false||v==='—'?C.dm:v===true?C.gr:C.tx, textAlign:'right' }}>{String(v)}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
