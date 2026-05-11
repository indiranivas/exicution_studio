import { C } from './palette.js';

export const PILLAR_META = {
  T:{ label:'Trace',  color:C.bl, bg:'rgba(0,154,218,.1)' },
  M:{ label:'Metric', color:C.gr, bg:'rgba(34,197,94,.1)' },
  E:{ label:'Event',  color:C.am, bg:'rgba(245,158,11,.1)' },
  L:{ label:'Log',    color:C.pu, bg:'rgba(167,139,250,.1)' },
};

export const LAYER_COLORS = { L1:C.gr, L2:C.bl, L3:C.am, L4:C.re, L5:C.pu, L6:C.cy };

export const MELT_FIELDS = {
  L1:{ key:'L1_task_runtime', pillar:'Traces + Events + Metrics', fields:[
    { f:'task_id',       p:'T', desc:'UUID — root span, links all child events' },
    { f:'agent_id',      p:'T', desc:'Agent instance that ran the task' },
    { f:'task_type',     p:'T', desc:'Category of work; filters traces by type' },
    { f:'status',        p:'E', desc:'State change: running → complete / failed / escalated' },
    { f:'current_step',  p:'T', desc:'Step counter on the active root span' },
    { f:'total_steps',   p:'T', desc:'Total planned steps — sets trace tree depth' },
    { f:'started_at',    p:'T', desc:'Root span start time' },
    { f:'ended_at',      p:'T', desc:'Root span end time' },
    { f:'duration_ms',   p:'M', desc:'Total wall-clock time; rolled into p50/p99' },
    { f:'outcome',       p:'E', desc:'Final result: success / failure / escalated / partial' },
    { f:'error_count',   p:'M', desc:'Count of errored/retried steps per task' },
    { f:'model_id',      p:'T', desc:'Model used — resource attribute on root span' },
  ]},
  L2:{ key:'L2_step_tool_calls', pillar:'Traces + Events + Metrics', fields:[
    { f:'step_id',          p:'T', desc:'Child span ID — links back to task_id trace' },
    { f:'step_name',        p:'T', desc:'Span name shown in waterfall view' },
    { f:'tool_name',        p:'E', desc:'Which tool was invoked' },
    { f:'tool_inputs',      p:'T', desc:'Parameters passed (sanitised span attributes)' },
    { f:'tool_outputs',     p:'T', desc:'Tool response recorded as span events' },
    { f:'tool_latency_ms',  p:'M', desc:'Tool round-trip duration; p99 rollup' },
    { f:'tool_success',     p:'E', desc:'Binary outcome — success or failure' },
    { f:'retry_attempt',    p:'E', desc:'Each retry is a new event; >0 is the signal' },
    { f:'token_count_in',   p:'M', desc:'Input tokens per LLM call; summed for cost' },
    { f:'token_count_out',  p:'M', desc:'Output tokens per LLM call' },
    { f:'total_tool_calls', p:'M', desc:'Aggregated tool calls per task' },
  ]},
  L3:{ key:'L3_confidence_signals', pillar:'Metrics', fields:[
    { f:'confidence_score',     p:'M', desc:'Composite 0–1 score; drives HITL escalation' },
    { f:'conf_tool_agreement',  p:'M', desc:'Sub-score for tool result consistency' },
    { f:'conf_schema_match',    p:'M', desc:'Sub-score for output schema conformance' },
    { f:'conf_retrieval_score', p:'M', desc:'RAG/search relevance score' },
    { f:'conf_self_check',      p:'M', desc:'Agent self-evaluation score' },
    { f:'threshold_at_time',    p:'M', desc:'Threshold value used at decision time' },
  ]},
  L4:{ key:'L4_failure_escalation', pillar:'Traces + Events + Logs', fields:[
    { f:'failure_reason',     p:'E', desc:'Structured code: CORE_LOW_CONF / CORE_TECH_FAIL…' },
    { f:'failure_step',       p:'T', desc:'Step number where failure occurred' },
    { f:'failure_message',    p:'L', desc:'Free-text explanation by agent (audit only)' },
    { f:'escalation_flag',    p:'E', desc:'Boolean — escalation occurred at this moment' },
    { f:'escalation_trigger', p:'E', desc:'Specific reason; structured classification' },
    { f:'conf_at_escalation', p:'M', desc:'Confidence snapshot at escalation time' },
    { f:'decision_trace',     p:'T', desc:'Ordered step→action→note causal chain' },
  ]},
  L5:{ key:'L5_human_handoff', pillar:'Events + Metrics + Logs', fields:[
    { f:'human_decision',          p:'E', desc:'Outcome: approved / corrected / rejected' },
    { f:'correction_content',      p:'L', desc:'Free-text of what the human changed' },
    { f:'correction_reason_label', p:'E', desc:'Structured tag on the correction event' },
    { f:'resolution_time_s',       p:'M', desc:'Handoff-to-resolution duration; SLA metric' },
    { f:'override_flag',           p:'M', desc:'Boolean feeding override_rate metric' },
    { f:'reviewer_id',             p:'L', desc:'Who resolved — audit trail, not a signal' },
  ]},
  L6:{ key:'L6_derived_metrics', pillar:'Metrics (rollup every 60s)', fields:[
    { f:'tasks_per_window',    p:'M', desc:'Task throughput count per time window' },
    { f:'success_rate',        p:'M', desc:'success_count / total_tasks % — primary SLO' },
    { f:'p50_latency_ms',      p:'M', desc:'Median task duration' },
    { f:'p99_latency_ms',      p:'M', desc:'Tail latency — 99th percentile' },
    { f:'token_cost_usd',      p:'M', desc:'Cumulative cost per window' },
    { f:'handoff_count',       p:'M', desc:'Escalations per window by trigger' },
    { f:'avg_conf_by_type',    p:'M', desc:'Mean confidence per task_type' },
    { f:'failure_reason_dist', p:'M', desc:'Failure reason breakdown as % distribution' },
    { f:'handoffs_by_hour',    p:'M', desc:'24-slot hourly handoff array for heatmap' },
    { f:'override_rate',       p:'M', desc:'override_flag=true / total_handoffs' },
    { f:'pattern_count',       p:'M', desc:'Failure triplets appearing ≥5× this week' },
    { f:'prompt_version',      p:'E', desc:'Prompt config version-change event' },
  ]},
};

export const MELT_LAYERS_DEF = [
  { id:'L1', label:'L1 · Task Runtime',         desc:'task_id · status · duration_ms · outcome',              color:C.gr },
  { id:'L2', label:'L2 · Step & Tool Calls',    desc:'step_id · tool_name · latency · retry_attempt',         color:C.bl },
  { id:'L3', label:'L3 · Confidence Signals',   desc:'confidence_score · conf_tool_agreement · threshold',    color:C.am },
  { id:'L4', label:'L4 · Failure & Escalation', desc:'failure_reason · escalation_trigger · conf_at_escalation', color:C.re },
  { id:'L5', label:'L5 · Human Handoff',        desc:'human_decision · resolution_time_s · override_flag',   color:C.pu },
  { id:'L6', label:'L6 · Derived Metrics',      desc:'success_rate · p50/p99_latency · token_cost_usd',      color:C.cy },
];

export const TELEMETRY_SINKS = [
  { label:'Metrics', val:'Prometheus / Grafana' },
  { label:'Events',  val:'Kafka · agent.events' },
  { label:'Logs',    val:'Azure Monitor / Loki' },
  { label:'Traces',  val:'OpenTelemetry → Tempo' },
];
