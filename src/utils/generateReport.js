/**
 * Builds a structured data payload from live telemetry (`st`)
 * and requests a detailed business report from Azure OpenAI.
 * Returns the report as a markdown string.
 */

const ENDPOINT  = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT?.replace(/\/$/, '');
const API_KEY   = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
const API_VER   = import.meta.env.VITE_AZURE_OPENAI_API_VERSION;
const DEPLOY    = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT;

/** Build a compact JSON snapshot from the live `st` prop bag — business view */
function buildSnapshot(st) {
  const { agents, metrics, logs, events, handoffs } = st;

  const running   = agents.filter(a => a.status === 'running').length;
  const failed    = agents.filter(a => a.status === 'failed').length;
  const degraded  = agents.filter(a => a.status === 'degraded').length;
  const idle      = agents.filter(a => a.status === 'idle').length;
  const avgConf   = (agents.reduce((s, a) => s + a.conf, 0) / agents.length * 100).toFixed(1);
  const totalTasks= agents.reduce((s, a) => s + (a.tasks || 0), 0);
  const totalCost = agents.reduce((s, a) => s + (a.tokenCost || 0), 0).toFixed(2);
  const hoursSaved= Math.round(metrics.latency * totalTasks / 3600);
  const roi       = ((hoursSaved * 18) / parseFloat(totalCost)).toFixed(0);

  const pendingHandoffs  = handoffs.filter(h => h.status === 'pending').length;
  const resolvedHandoffs = handoffs.filter(h => h.status === 'resolved').length;
  const avgResTime = (handoffs.reduce((s, h) => s + h.resTime, 0) / handoffs.length / 60).toFixed(1);

  const recentAlerts = logs.filter(l => l.level === 'err' || l.level === 'warn').slice(0, 5)
    .map(l => `[${l.ts}] ${l.agent}: ${l.msg}`);

  const recentEvents = events.slice(0, 6)
    .map(e => `[${e.ts}] ${e.title} — ${e.desc}`);

  const agentDetails = agents.map(a => ({
    name:    a.name,
    type:    a.type,
    status:  a.status,
    conf:    (a.conf * 100).toFixed(1) + '%',
    tasks:   a.tasks,
    errors:  a.errors,
    latency: a.latency + 'ms',
    cost:    '$' + a.tokenCost,
  }));

  return {
    generated_at:    new Date().toISOString(),
    platform:        'LevelShift AgentOps',
    environment:     'prod-us-east-1',
    summary: {
      total_agents:     agents.length,
      running,
      failed,
      degraded,
      idle,
      avg_confidence:   avgConf + '%',
      total_tasks_today: totalTasks,
      success_rate:     metrics.success + '%',
      avg_latency_s:    metrics.latency,
      total_ai_cost:    '$' + totalCost,
      estimated_hours_saved: hoursSaved,
      labour_value_saved:    '$' + (hoursSaved * 18).toLocaleString(),
      roi_ratio:             roi + 'x',
    },
    human_oversight: {
      pending_approvals:  pendingHandoffs,
      resolved_approvals: resolvedHandoffs,
      avg_resolution_min: avgResTime,
    },
    agents: agentDetails,
    recent_alerts:  recentAlerts,
    recent_events:  recentEvents,
  };
}

const SYSTEM_PROMPT_BUSINESS = `You are a senior AI operations analyst writing a board-level report.
You will be given a JSON telemetry snapshot from an enterprise AI agent platform.
Generate a detailed, professional executive business report in Markdown. Be thorough — this is a formal document.

The report MUST include ALL of these sections in order:

# AI Operations Report — LevelShift AgentOps

1. **Executive Summary** – 5–6 sentences: platform status, key wins, risks, and the single most important action needed today. Write for a C-suite audience.
2. **Key Business Metrics** – A table with columns: Metric | Value | Target | Status. Include: Tasks Automated, Success Rate, Hours Saved, Labour Value Offset, AI Cost, ROI Multiple, Pending Approvals, Escalations.
3. **Performance Highlights** – Bullet list of 6–8 standout achievements with specific numbers and business interpretation for each.
4. **Agent Fleet Status** – A Markdown table: Agent Name | Type | Version | Status | Confidence | Tasks Handled | Errors | Avg Latency | Token Cost. Flag ⚠ for any agent with errors > 0 or status not 'running'.
5. **Session & Workflow Analysis** – Table of all sessions: Session | Agent | Stage | Messages | Outcome | Quality Score. Summarise deflection and escalation patterns.
6. **Cost & ROI Deep Dive** – Total AI spend, labour value, net saving, ROI multiple. Monthly and annual projections. Cost breakdown per agent. 3–4 sentence business narrative on value delivered.
7. **Guardrail & Compliance Summary** – How many guardrail checks ran, pass rate, types checked (PII/Policy/Toxicity), any blocks and what triggered them. Rate the compliance posture: Excellent / Good / At Risk.
8. **Human Oversight & Approvals** – Escalated sessions, pending approvals, avg resolution time. Assess whether escalation rate is acceptable.
9. **Incidents & Alerts** – List every error event with timestamp, agent, description. Classify each: 🔴 Critical / 🟡 Warning / 🔵 Informational.
10. **Trend Analysis** – Based on quality scores across sessions, identify if quality is improving, stable, or declining. Identify any pipeline stages with low coverage.
11. **Recommendations** – 5–7 specific, numbered, actionable recommendations for the operations team. Each must reference actual data from the snapshot.
12. **Risk Register** – Table: Risk | Likelihood (H/M/L) | Impact (H/M/L) | Current Status | Recommended Mitigation.
13. **Appendix: Data Confidence** – Note which metrics are real (from spans) vs. estimated (e.g. hours saved uses 0.27h/message assumption). Timestamp of report.

Formatting rules:
- Use Markdown tables wherever data is tabular
- Use ✅ for healthy, ⚠ for warning, 🔴 for critical status indicators
- Bold all numbers that are key metrics
- Non-technical language for sections 1, 6, 8. Technical precision everywhere else.
- Do NOT include any preamble before the first heading.
- Total length: aim for 800–1200 words of substance.`;

const SYSTEM_PROMPT_TECHNICAL = `You are a senior platform reliability engineer and AI systems expert writing a formal technical report.
You will be given a detailed JSON telemetry snapshot from an enterprise AI agent observability platform.
Generate a comprehensive technical engineering report in Markdown for an engineering and DevOps team.

The report MUST include ALL of these sections in order:

# Technical Engineering Report — LevelShift AgentOps

1. **System Health Summary** – Overall health: span success rate, guardrail pass rate, feedback acceptance rate, error count, session deflection/escalation ratio. One-line verdict: HEALTHY / DEGRADED / CRITICAL.
2. **MELT Telemetry — Agent Breakdown** – Per-agent table: Agent | Version | Status | Spans | LLM Calls | Tool Calls | Guardrail Checks | Avg Latency (ms) | Input Tokens | Output Tokens | Token Cost | Avg Quality Score. Mark anomalies.
3. **Span & Trace Analysis** – Full breakdown table: Span Kind | Total | Succeeded | Failed | Failure Rate. List all failed span IDs with agent, session, kind, and error message.
4. **LLM Call Performance** – Table: Model | Calls | Avg Input Tokens | Avg Output Tokens | Avg Latency (ms) | Avg Quality Score | Toxic Responses. Flag quality < 0.7 as ⚠. Flag toxic responses as 🔴.
5. **Guardrail Performance** – Table per guardrail type: Type | Checks | Passed | Blocked | Pass Rate | Top Block Reason. Highlight any type below 95% pass rate. List each individual blocked event with session and reason code.
6. **Tool Call Reliability** – Table: Tool Name | Type | Calls | Succeeded | Failed | Success Rate | Avg Duration (ms) | Top Error. List all failed tool calls with full error messages.
7. **Session Quality Analysis** – Full table: Session | Agent | Pipeline Stage | Messages | Spans | Deflected | Escalated | Avg Quality Score | Notes. Highlight sessions with quality < 0.7 or escalated.
8. **Pipeline Coverage** – Table: Stage | Sessions Reached | Coverage % | Status. Identify gaps (stages with 0 coverage).
9. **Feedback & Human Override Analysis** – Table: Agent | Feedback Events | Accepted | Edited | Rejected | Accept Rate | Avg Edit Distance. Flag agents with accept rate < 80%.
10. **Token & Cost Breakdown** – Per-agent token usage (input/output/total), cost at $3/1M tokens. Total platform cost. Projected monthly at 22 working days.
11. **Failure Root Cause Analysis** – Numbered list of every error/failure with: Span ID, Kind, Agent, Session, Error Message, Root Cause Hypothesis, Recommended Fix.
12. **Performance Baseline** – Compute p50 and p99 latency across all LLM calls. Identify any calls > 2× the p50 as outliers. Note if any retry patterns exist in tool calls.
13. **Action Items** – Numbered list of specific, prioritised engineering tasks (P0/P1/P2). Each must cite the exact metric or span that motivates it.
14. **Appendix: Raw Metric Dump** – Key aggregate numbers in a code block for easy copy-paste into monitoring systems.

Formatting rules:
- Use Markdown tables for all structured data
- Use ✅ 🟡 🔴 status indicators throughout
- Exact numbers everywhere — no rounding unless specified
- Technical precision throughout — no business language
- Do NOT include any preamble before the first heading.
- Total length: aim for 1200–1800 words of substance.`;

/** Build a richer technical snapshot with spans, guardrails, LLM calls, tool calls */
function buildTechnicalSnapshot(st) {
  const { agents, metrics, logs, spans = [], guardrails = [], llmCalls = [], toolCalls = [], sessions = [], pipeline = [], feedback = [] } = st;

  // Span kind breakdown
  const spanKinds = {};
  for (const s of spans) {
    const k = s.span_kind__c || 'UNKNOWN';
    if (!spanKinds[k]) spanKinds[k] = { total: 0, ok: 0, failed: 0 };
    spanKinds[k].total++;
    if (s.span_status__c === 'Ok') spanKinds[k].ok++;
    else spanKinds[k].failed++;
  }

  // Guardrail breakdown by type
  const grByType = {};
  for (const g of guardrails) {
    if (!grByType[g.type]) grByType[g.type] = { total: 0, passed: 0, failed: 0, reasons: {} };
    grByType[g.type].total++;
    if (g.passed) grByType[g.type].passed++;
    else {
      grByType[g.type].failed++;
      const r = g.reasonCode || 'unknown';
      grByType[g.type].reasons[r] = (grByType[g.type].reasons[r] || 0) + 1;
    }
  }
  const grSummary = Object.entries(grByType).map(([type, d]) => ({
    type,
    total: d.total,
    passed: d.passed,
    failed: d.failed,
    pass_rate: d.total ? ((d.passed / d.total) * 100).toFixed(1) + '%' : '—',
    top_reason: Object.entries(d.reasons).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
  }));

  // LLM stats
  const avgLLMLatency = llmCalls.length ? Math.round(llmCalls.reduce((a, l) => a + (l.latencyMs || 0), 0) / llmCalls.length) : 0;
  const avgQuality    = llmCalls.filter(l => l.qualityScore != null).length
    ? (llmCalls.filter(l => l.qualityScore != null).reduce((a, l) => a + l.qualityScore, 0) / llmCalls.filter(l => l.qualityScore != null).length).toFixed(3) : '—';
  const toxicCount    = llmCalls.filter(l => l.isToxic).length;
  const modelUsage    = {};
  for (const l of llmCalls) {
    if (!modelUsage[l.model]) modelUsage[l.model] = { calls: 0, tokens: 0 };
    modelUsage[l.model].calls++;
    modelUsage[l.model].tokens += l.totalTokens || 0;
  }

  // Tool stats
  const toolByType = {};
  for (const t of toolCalls) {
    const k = t.type || t.name || 'unknown';
    if (!toolByType[k]) toolByType[k] = { calls: 0, success: 0, totalMs: 0, errors: [] };
    toolByType[k].calls++;
    if (t.success) toolByType[k].success++;
    toolByType[k].totalMs += t.durationMs || 0;
    if (t.error) toolByType[k].errors.push(t.error);
  }

  // Failed spans
  const failedSpans = spans
    .filter(s => s.span_status__c !== 'Ok')
    .slice(0, 10)
    .map(s => ({
      span_id:  s.span_id__c,
      kind:     s.span_kind__c,
      agent:    s.agent_dev_name__c,
      session:  s.session_id__c,
      message:  s.span_status_message__c || s.guardrail_reason_code__c || s.tool_error_message__c || '—',
    }));

  // Session quality
  const sessionSummary = sessions.map(s => {
    const sq = llmCalls.filter(l => l.sessionId === s.id && l.qualityScore != null);
    const avgQ = sq.length ? (sq.reduce((a, l) => a + l.qualityScore, 0) / sq.length).toFixed(3) : '—';
    return {
      id: s.id,
      agent: s.agentDevName?.replace(/([A-Z])/g, ' $1').trim() || s.agentDevName,
      messages: s.messageCount,
      deflected: s.deflection,
      escalated: s.escalation,
      quality: avgQ,
    };
  });

  return {
    generated_at:  new Date().toISOString(),
    platform:      'LevelShift AgentOps — Technical Report',
    environment:   'prod-us-east-1',
    metrics: {
      total_spans:        spans.length,
      span_success_rate:  metrics.success + '%',
      guardrail_pass_rate:metrics.guardrailPassRate + '%',
      feedback_accept_rate:metrics.feedbackAcceptRate + '%',
      avg_latency_ms:     Math.round((metrics.latency || 0) * 1000),
      total_llm_calls:    llmCalls.length,
      total_tool_calls:   toolCalls.length,
      total_guardrail_checks: guardrails.length,
      total_sessions:     sessions.length,
      deflected:          metrics.deflectedCount,
      escalated:          metrics.escalatedCount,
      total_tokens:       metrics.totalTokens,
      total_cost_usd:     '$' + metrics.cost,
    },
    agents: agents.map(a => ({
      name:        a.name,
      type:        a.type,
      version:     a.version,
      status:      a.status,
      conf:        a.conf,
      tasks:       a.tasks,
      errors:      a.errors,
      latency_ms:  a.latency,
      llm_calls:   a.llmCallCount,
      tool_calls:  a.toolCallCount,
      guardrails:  a.guardrailCount,
      token_cost:  '$' + a.tokenCost,
    })),
    span_kinds:       spanKinds,
    guardrail_summary: grSummary,
    llm_performance: {
      avg_latency_ms: avgLLMLatency,
      avg_quality_score: avgQuality,
      toxic_responses: toxicCount,
      model_usage: modelUsage,
    },
    tool_performance: Object.entries(toolByType).map(([type, d]) => ({
      type,
      calls: d.calls,
      success_rate: ((d.success / d.calls) * 100).toFixed(1) + '%',
      avg_latency_ms: d.calls ? Math.round(d.totalMs / d.calls) : 0,
      sample_errors: d.errors.slice(0, 2),
    })),
    failed_spans: failedSpans,
    session_summary: sessionSummary,
    pipeline_coverage: pipeline.map(p => ({
      stage: p.stage,
      sessions_reached: p.count,
      coverage_pct: sessions.length ? ((p.count / sessions.length) * 100).toFixed(1) + '%' : '0%',
    })),
    recent_errors: logs.filter(l => l.level === 'err' || l.level === 'warn').slice(0, 8)
      .map(l => `[${l.ts}] ${l.agent}: ${l.msg}`),
  };
}

/**
 * Calls Azure OpenAI and returns a markdown report string.
 * @param {object} st - The live telemetry prop bag from App.jsx
 * @param {string} mode - 'business' | 'technical'
 * @returns {Promise<{markdown: string, snapshot: object}>}
 */
export async function generateReport(st, mode = 'business') {
  if (!ENDPOINT || !API_KEY) {
    throw new Error('Azure OpenAI credentials not configured. Check your .env file.');
  }

  const isTechnical = mode === 'technical';
  const snapshot    = isTechnical ? buildTechnicalSnapshot(st) : buildSnapshot(st);
  const systemPrompt = isTechnical ? SYSTEM_PROMPT_TECHNICAL : SYSTEM_PROMPT_BUSINESS;
  const userMsg     = isTechnical
    ? `Here is the engineering telemetry snapshot:\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\`\n\nGenerate the full technical engineering report now.`
    : `Here is the telemetry snapshot:\n\`\`\`json\n${JSON.stringify(snapshot, null, 2)}\n\`\`\`\n\nGenerate the full executive report now.`;

  const url = `${ENDPOINT}/openai/deployments/${DEPLOY}/chat/completions?api-version=${API_VER}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'api-key':       API_KEY,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system',  content: systemPrompt },
        { role: 'user',    content: userMsg },
      ],
      temperature:            0.3,
      max_completion_tokens:  isTechnical ? 6000 : 5000,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Azure OpenAI error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from Azure OpenAI');
  return { markdown: content, snapshot };
}
