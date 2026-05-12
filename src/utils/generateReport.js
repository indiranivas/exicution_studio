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

const SYSTEM_PROMPT_BUSINESS = `You are a senior AI operations analyst. 
You will be given a JSON telemetry snapshot from an enterprise AI agent platform.
Generate a detailed, professional executive business report in Markdown.

The report MUST include these sections in order:
1. **Executive Summary** – 3–4 sentence plain-English overview of today's AI platform status, key wins, and risks.
2. **Performance Highlights** – Bullet list of 4–6 standout metrics with brief business interpretation.
3. **Agent Fleet Status** – A Markdown table of all agents: Name | Status | Confidence | Tasks | Errors | Latency | Cost. Flag any agent with status "failed" or "degraded" with ⚠.
4. **Cost & ROI Analysis** – Total spend, labour value offset, ROI ratio, and a 2–3 sentence interpretation.
5. **Human Oversight & Approvals** – Pending vs resolved approvals, avg resolution time, and risk assessment.
6. **Recent Incidents & Alerts** – List the recent alerts/events and classify each as Critical / Warning / Informational.
7. **Recommendations** – 3–5 specific, actionable recommendations for the operations team based on the data.
8. **Risk Register** – Short table: Risk | Likelihood | Impact | Mitigation.

Use clear, non-technical language for Sections 1, 4, and 5. Use technical precision for 3 and 6.
Do NOT include any preamble before the first heading.`;

const SYSTEM_PROMPT_TECHNICAL = `You are a senior platform reliability engineer and AI systems expert.
You will be given a detailed JSON telemetry snapshot from an enterprise AI agent observability platform.
Generate a comprehensive technical engineering report in Markdown for an engineering team.

The report MUST include these sections in order:
1. **System Health Summary** – Brief technical overview: span success rate, guardrail pass rate, latency p50/p99, error distribution.
2. **MELT Telemetry Analysis** – Per-agent table: Agent | Spans | LLM Calls | Tool Calls | Guardrails | Avg Latency (ms) | Token Cost | Quality Score. Highlight anomalies.
3. **Span & Trace Analysis** – Breakdown of span kinds (LLM_CALL, TOOL_CALL, GUARDRAIL, PLANNER, INTERNAL), success vs failure counts, top error messages.
4. **Guardrail Performance** – Table per guardrail type (PII / Policy / Toxicity): Check Count | Pass | Fail | Pass Rate | Top Reason Code. Flag any type below 90%.
5. **LLM Call Performance** – Model usage, avg input/output tokens, avg latency, quality score distribution, toxic flags.
6. **Tool Call Reliability** – Per tool type: call count, success rate, avg duration, top errors.
7. **Session Quality Analysis** – Per-session table: Session ID | Agent | Messages | Deflected | Escalated | Quality Score.
8. **Pipeline Stage Coverage** – Table of L2O pipeline stages reached: Stage | Sessions | Coverage %.
9. **Failure Root Cause Analysis** – List all failed/blocked spans with reason, agent, session, and recommended remediation.
10. **Action Items** – Numbered list of specific engineering tasks to improve reliability, latency, and guardrail coverage.

Use precise technical language throughout. Include exact numbers. Do NOT simplify or abstract.
Do NOT include any preamble before the first heading.`;

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
      agent: s.agentDevName?.replace('LeadToOrder', ''),
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
      max_completion_tokens:  isTechnical ? 4000 : 3000,
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
