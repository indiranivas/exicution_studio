import { AGENT_DEFS, SUB_AGENTS, STATUSES, FAIL_REASONS, TOOLS, CONF_BASE } from '../constants/agentDefs.js';
import { C } from '../constants/palette.js';

export function rnd(a, b) { return Math.floor(Math.random() * (b - a) + a); }
export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function fmtTime(d = new Date()) { return d.toTimeString().slice(0, 8); }
export function fmtMs(d = new Date()) { return d.toTimeString().slice(0, 5); }
export function genConf(type) {
  return Math.max(0.1, Math.min(0.99, (CONF_BASE[type] || .7) + (Math.random() - .5) * .08));
}

export function makeAgents() {
  return AGENT_DEFS.map(a => ({
    ...a,
    status: a.role === 'lead' ? 'running' : pick(STATUSES),
    step: a.role === 'lead' ? 7 : rnd(1, 7),
    totalSteps: 7,
    conf: a.role === 'lead' ? genConf('orchestrator') : genConf(a.type),
    tasks: a.role === 'lead' ? rnd(800, 1200) : rnd(50, 400),
    errors: a.role === 'lead' ? rnd(0, 5) : rnd(0, 30),
    latency: a.role === 'lead' ? rnd(200, 600) : rnd(600, 4200),
    tokenCost: a.role === 'lead' ? +(Math.random() * 4 + 2).toFixed(2) : +(Math.random() * 2 + .5).toFixed(2),
    dispatched: a.role === 'lead' ? rnd(300, 600) : undefined,
  }));
}

export function makeMetrics() {
  return { tasks: 1284, success: 94.2, latency: 2.4, handoffs: 37, cost: 18.40, toolCalls: 9712 };
}

export function makeLogLine() {
  const a = pick(AGENT_DEFS);
  const sub = pick(SUB_AGENTS);
  const t = pick(TOOLS);
  const templates = [
    [`${a.name} · tool_call ${t} · ${rnd(80, 380)}ms`, 'info'],
    [`${a.name} · step complete · conf ${(0.55 + Math.random() * .44).toFixed(2)}`, 'ok'],
    [`${a.name} · confidence ${(0.15 + Math.random() * .38).toFixed(2)} below threshold 0.40`, 'warn'],
    [`${a.name} · task complete · ${rnd(10, 80)} items processed`, 'ok'],
    [`${a.name} · ${t} timeout · retry ${rnd(1, 3)}/3`, 'warn'],
    [`${a.name} · escalated to human queue · conf ${(Math.random() * .35).toFixed(2)}`, 'err'],
    [`${a.name} · batch started · ${rnd(20, 100)} tasks queued`, 'info'],
    [`${a.name} · schema validation passed · ${rnd(1, 5)} fields`, 'ok'],
    [`lead-orchestrator-01 · dispatched ${rnd(1, 8)} tasks → ${sub.name}`, 'info'],
    [`lead-orchestrator-01 · routing order_processing batch → order-proc-01`, 'info'],
    [`lead-orchestrator-01 · reassigning task from ${sub.name} (low conf) → ${pick(SUB_AGENTS).name}`, 'warn'],
    [`lead-orchestrator-01 · all sub-agents nominal · ${rnd(2, 6)} queued`, 'ok'],
  ];
  const [msg, lvl] = pick(templates);
  return { id: Math.random(), ts: fmtTime(), level: lvl, agent: a.name, msg };
}

export function makeEvent() {
  const a = pick(AGENT_DEFS);
  const sub = pick(SUB_AGENTS);
  const evts = [
    { color:C.re, title:`${a.name} escalated`,       desc:`conf ${(Math.random()*.38).toFixed(2)} · ${pick(FAIL_REASONS).replace(/_/g,' ')}` },
    { color:C.gr, title:`${a.name} completed batch`, desc:`${rnd(10,80)} tasks · ${rnd(0,3)} errors · ${(Math.random()*2+.8).toFixed(1)}s avg` },
    { color:C.am, title:`${a.name} retrying`,        desc:`${pick(TOOLS)} timeout · attempt ${rnd(1,3)}/3` },
    { color:C.bl, title:`${a.name} awaiting approval`,desc:'action gated · human review' },
    { color:C.pu, title:'Prompt update deployed',    desc:`${a.type.replace('_','-')} v${rnd(1,3)}.${rnd(1,9)} deployed` },
    { color:C.cy, title:`${a.name} started`,         desc:`${rnd(5,60)} tasks queued` },
    { color:C.am, title:'lead-orchestrator-01 dispatched', desc:`${rnd(1,8)} tasks → ${sub.name}` },
    { color:C.gr, title:'lead-orchestrator-01 rebalanced', desc:`shifted load from ${sub.name} · queue depth normalised` },
    { color:C.re, title:'lead-orchestrator-01 reassigned', desc:`${sub.name} low conf · task rerouted → ${pick(SUB_AGENTS).name}` },
  ];
  return { ...pick(evts), ts: fmtMs(), id: Math.random() };
}

export function makeHandoff() {
  const a = pick(AGENT_DEFS);
  return {
    id: Math.random(),
    agent: a.name,
    reason: pick(FAIL_REASONS).replace(/_/g, ' '),
    conf: (Math.random() * .38).toFixed(2),
    ts: fmtTime(),
    status: pick(['pending', 'reviewing', 'resolved']),
    resTime: rnd(90, 1800),
  };
}

export function makeThroughput() {
  return [12,18,15,22,28,35,42,38,51,60,55,48,44,67,72,80,87,82,74,69,63,58,52,48]
    .map(v => Math.max(4, v + rnd(-10, 10)));
}

export function makeFailDist() {
  const raw = [rnd(45,62), rnd(16,26), rnd(10,17), rnd(5,11), rnd(1,4)];
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map(v => Math.round(v / sum * 100));
}

export function makeConfByType() {
  const res = {};
  AGENT_DEFS.forEach(a => { res[a.type] = genConf(a.type); });
  return res;
}

export function makeLiveData(agent) {
  return {
    L1: {
      task_id: `task_${Math.random().toString(16).slice(2, 10)}`,
      agent_id: agent.id, task_type: agent.type.replace(/_/g, ' '),
      status: agent.status, current_step: agent.step, total_steps: agent.totalSteps,
      started_at: fmtTime(), ended_at: '—', duration_ms: agent.latency,
      outcome: agent.status === 'complete' ? 'success' : 'running',
      error_count: agent.errors, model_id: agent.model,
    },
    L2: {
      step_id: `step_${Math.random().toString(16).slice(2, 8)}`,
      step_name: 'Processing task',
      tool_name: (agent._tools || TOOLS)[0] || 'db_query',
      tool_inputs: `{"id":"CX-${rnd(1000,9999)}"}`,
      tool_outputs: `{"status":"ok","rows":${rnd(1,12)}}`,
      tool_latency_ms: rnd(80, 900), tool_success: true, retry_attempt: 0,
      token_count_in: rnd(300, 900), token_count_out: rnd(80, 300),
      total_tool_calls: rnd(1, 8),
    },
    L3: {
      confidence_score: agent.conf.toFixed(3),
      conf_tool_agreement: (Math.min(.99, agent.conf + .01)).toFixed(3),
      conf_schema_match: (Math.min(.99, agent.conf + .02)).toFixed(3),
      conf_retrieval_score: (Math.max(.1, agent.conf - .01)).toFixed(3),
      conf_self_check: (Math.min(.99, agent.conf + .005)).toFixed(3),
      threshold_at_time: agent._conf_min || 0.70,
    },
    L4: {
      failure_reason: agent.errors > 15 ? 'CORE_TECH_FAIL' : '—',
      failure_step: agent.errors > 15 ? agent.step : '—',
      failure_message: agent.errors > 15 ? 'Tool timeout after 2 retries' : '—',
      escalation_flag: agent.conf < .4,
      escalation_trigger: agent.conf < .4 ? 'CORE_LOW_CONF' : '—',
      conf_at_escalation: agent.conf < .4 ? agent.conf.toFixed(3) : '—',
      decision_trace: '[plan→tool_call→eval→escalate]',
    },
    L5: {
      human_decision: '—', correction_content: '—',
      correction_reason_label: '—', resolution_time_s: '—',
      override_flag: false, reviewer_id: '—',
    },
    L6: {
      tasks_per_window: rnd(12, 55),
      success_rate: (88 + Math.random() * 10).toFixed(1) + '%',
      p50_latency_ms: Math.round(agent.latency * .7),
      p99_latency_ms: Math.round(agent.latency * 2.2),
      token_cost_usd: '$' + (Math.random() * .04).toFixed(4),
      handoff_count: agent.errors > 10 ? rnd(2, 8) : rnd(0, 2),
      avg_conf_by_type: agent.conf.toFixed(3),
      failure_reason_dist: 'low_conf:' + (agent.errors > 10 ? '48%' : '18%'),
      handoffs_by_hour: '[' + Array.from({ length:6 }, () => rnd(0, 4)).join(',') + ']',
      override_rate: (Math.random() * 4).toFixed(1) + '%',
      pattern_count: rnd(0, 3),
      prompt_version: 'v' + rnd(1, 3) + '.' + rnd(1, 9),
    },
  };
}
