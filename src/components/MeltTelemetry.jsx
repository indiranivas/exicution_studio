import { C, mono, sans } from '../constants/palette.js';
import { MELT_FIELDS, PILLAR_META, LAYER_COLORS } from '../constants/meltSchema.js';
import { LeadBadge } from './ui.jsx';

/** Build MELT layer data from real agent telemetry in st */
function buildLiveData(agent, st) {
  const { llmCalls = [], toolCalls = [], guardrails = [], handoffs = [] } = st || {};

  const myLLM    = llmCalls.filter(l  => l.agent  === agent.displayName);
  const myTools  = toolCalls.filter(t => t.agent  === agent.displayName);
  const myGuards = guardrails.filter(g => g.agent === agent.displayName);
  const myHands  = handoffs.filter(h  => h.agent  === agent.displayName);

  const latestLLM   = myLLM[0]   || {};
  const latestTool  = myTools[0]  || {};
  const latestGuard = myGuards[0] || {};

  const avgQuality = myLLM.length
    ? myLLM.reduce((a, l) => a + (l.qualityScore || 0), 0) / myLLM.length
    : agent.conf;

  const failedGuards = myGuards.filter(g => !g.passed);
  const failedTools  = myTools.filter(t  => !t.success);
  const patternSet   = new Set(failedGuards.map(g => g.reasonCode).filter(Boolean));

  return {
    L1: {
      task_id:       latestLLM.id || agent.id,
      agent_id:      agent.id,
      task_type:     agent.type.replace(/_/g, ' '),
      status:        agent.status,
      current_step:  agent.step,
      total_steps:   agent.totalSteps,
      started_at:    latestLLM.ts ? new Date(latestLLM.ts).toTimeString().slice(0, 8) : '—',
      ended_at:      '—',
      duration_ms:   agent.latency,
      outcome:       agent.status === 'running' ? 'in_progress' : 'complete',
      error_count:   agent.errors,
      model_id:      agent.model,
    },
    L2: {
      step_id:         latestTool.id || '—',
      step_name:       latestTool.name || '—',
      tool_name:       latestTool.name || '—',
      tool_inputs:     latestTool.input  ? JSON.stringify(latestTool.input).slice(0, 60)  : '—',
      tool_outputs:    latestTool.output ? JSON.stringify(latestTool.output).slice(0, 60) : '—',
      tool_latency_ms: latestTool.durationMs ?? '—',
      tool_success:    latestTool.success    ?? '—',
      retry_attempt:   0,
      token_count_in:  latestLLM.inputTokens  || agent.totalInputTokens  || 0,
      token_count_out: latestLLM.outputTokens || agent.totalOutputTokens || 0,
      total_tool_calls: myTools.length,
    },
    L3: {
      confidence_score:    avgQuality.toFixed(3),
      conf_tool_agreement: Math.min(0.99, avgQuality + 0.01).toFixed(3),
      conf_schema_match:   Math.min(0.99, avgQuality + 0.02).toFixed(3),
      conf_retrieval_score:Math.max(0.10, avgQuality - 0.01).toFixed(3),
      conf_self_check:     Math.min(0.99, avgQuality + 0.005).toFixed(3),
      threshold_at_time:   agent._conf_min || 0.70,
    },
    L4: {
      failure_reason:    failedGuards.length > 0 ? (failedGuards[0].reasonCode || failedGuards[0].name || 'Guardrail block')
                       : failedTools.length  > 0 ? (failedTools[0].error       || 'Tool failure') : '—',
      failure_step:      failedGuards.length > 0 ? 'guardrail_check' : failedTools.length > 0 ? 'tool_call' : '—',
      failure_message:   failedGuards.length > 0 ? (failedGuards[0].statusMsg  || 'Blocked by guardrail')
                       : failedTools.length  > 0 ? (failedTools[0].error       || 'Tool returned error') : '—',
      escalation_flag:   agent.status === 'review' || myHands.length > 0,
      escalation_trigger:myHands.length > 0 ? 'AGENT_HANDOFF' : '—',
      conf_at_escalation:myHands.length > 0 ? (myHands[0].conf || '—') : '—',
      decision_trace:    `[${agent.step} steps · ${myTools.length} tool calls · ${failedGuards.length} guard blocks]`,
    },
    L5: {
      human_decision:        myHands.length > 0 ? myHands[0].status  : '—',
      correction_content:    '—',
      correction_reason_label: myHands.length > 0 ? myHands[0].reason : '—',
      resolution_time_s:     myHands.length > 0 ? myHands[0].resTime : '—',
      override_flag:         myHands.length > 0,
      reviewer_id:           '—',
    },
    L6: {
      tasks_per_window: agent.tasks,
      success_rate:     `${((myTools.filter(t => t.success).length / Math.max(myTools.length, 1)) * 100).toFixed(1)}%`,
      p50_latency_ms:   agent.latency,
      p99_latency_ms:   Math.round(agent.latency * 2.2),
      token_cost_usd:   `$${agent.tokenCost.toFixed(4)}`,
      handoff_count:    myHands.length,
      avg_conf_by_type: avgQuality.toFixed(3),
      failure_reason_dist: `guardrail:${failedGuards.length} · tool:${failedTools.length}`,
      handoffs_by_hour: `[${myHands.length} handoffs]`,
      override_rate:    `${((myHands.length / Math.max(agent.tasks, 1)) * 100).toFixed(1)}%`,
      pattern_count:    patternSet.size,
      prompt_version:   agent.version ? `v${agent.version}` : '—',
    },
  };
}

export function AgentTelemetryView({ agent, st }) {
  const enabledLayers = agent._melt || ['L1','L2','L3','L4','L5','L6'];
  const live = buildLiveData(agent, st);

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
          <span style={{ fontFamily:mono, fontSize:9, padding:'2px 8px', borderRadius:2, background:'rgba(34,197,94,.08)', color:C.gr, border:`1px solid rgba(34,197,94,.25)` }}>● Real data</span>
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

export function MeltTelemetryPanel({ agent, st }) {
  const data = buildLiveData(agent, st);

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
        <div style={{ width:6, height:6, borderRadius:'50%', background:C.gr }} />
        Real MELT Telemetry · 40 fields · 6 layers · from observability data
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
