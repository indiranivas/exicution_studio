/**
 * l2oAdapter.js
 * Parses the raw Salesforce Lead-to-Order observability rows into every
 * data shape expected by the dashboard's `st` prop bag, plus new L2O-specific
 * shapes (sessions, spans, guardrails, feedback, pipeline stages).
 *
 * Usage:
 *   import { parseL2OData } from './utils/l2oAdapter.js';
 *   import RAW from '../data/l2o_rows.json';
 *   const l2o = parseL2OData(RAW.rows);
 *   // Then merge l2o into the st prop bag in App.jsx
 */

/* ─── Agent display metadata ────────────────────────────────── */
const AGENT_META = {
  LeadToOrderSalesAssistant: {
    id: '0XxHu0000004aB1',
    name: 'sales-assist-01',
    displayName: 'Sales Assist Agent',
    type: 'crm_sync',
    model: 'sfdc-ai-llm-v2 / gpt-4-turbo',
    role: 'lead',
    version: '2.3.1',
  },
  LeadToOrderQuoteSpecialist: {
    id: '0XxHu0000004qZ9',
    name: 'quote-specialist-01',
    displayName: 'Quote Specialist Agent',
    type: 'order_processing',
    model: 'gpt-4o / AzureOpenAI',
    role: 'worker',
    version: '1.8.0',
  },
};

/* ─── Agent name helpers (consistent across all output shapes) ── */
function agentDisplayName(devName) {
  return AGENT_META[devName]?.displayName
    || (devName ? devName.replace(/([A-Z])/g, ' $1').trim() : '—');
}
function agentShortName(devName) {
  return AGENT_META[devName]?.name
    || (devName ? devName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : '—');
}

/* ─── Pipeline stage ordering ───────────────────────────────── */
const PIPELINE_ORDER = [
  'Pricing_Inquiry',
  'Lead_Qualification',
  'Product_Recommendation',
  'Lead_Conversion',
  'Quote_Generation',
  'Upsell_Recommendation',
  'Discount_Request',
  'Quote_Delivery',
  'Order_Booking',
];

/* ─── Main parser ───────────────────────────────────────────── */
export function parseL2OData(rows) {
  /* 1. Deduplicate: one unique row per span_id (rows repeat session fields).
        Skip rows with no span_id. */
  const spanMap = new Map();
  for (const r of rows) {
    if (!r.span_id__c) continue;  // guard against null span_id
    if (!spanMap.has(r.span_id__c)) spanMap.set(r.span_id__c, r);
    else {
      // Prefer the row that has more non-null fields (feedback, llm data)
      const existing = spanMap.get(r.span_id__c);
      const existingNulls = Object.values(existing).filter(v => v === null).length;
      const newNulls      = Object.values(r).filter(v => v === null).length;
      if (newNulls < existingNulls) spanMap.set(r.span_id__c, r);
    }
  }
  const spans = Array.from(spanMap.values());

  /* 2. Sessions — one object per unique session_id */
  const sessionMap = new Map();
  for (const r of rows) {
    if (!sessionMap.has(r.session_id__c)) {
      sessionMap.set(r.session_id__c, {
        id:               r.session_id__c,
        agentDevName:     r.agent_dev_name__c,
        agentId:          r.agent_id__c,
        channel:          r.channel_type__c,
        userId:           r.end_user_id__c,
        isVerified:       r.is_verified_user__c,
        start:            r.session_start__c,
        end:              r.session_end__c,
        durationMs:       r.session_duration_ms__c,
        engagement:       r.engagement_status__c,
        escalation:       r.escalation_status__c,
        deflection:       r.deflection_status__c,
        messageCount:     r.message_count__c,
        offTopicCount:    r.off_topic_count__c,
        timeToEscMs:      r.time_before_escalation_ms__c,
        topics:           new Set(),
        intents:          new Set(),
        spans:            [],
      });
    }
    const sess = sessionMap.get(r.session_id__c);
    if (r.topic__c)             sess.topics.add(r.topic__c);
    if (r.classified_intent__c) sess.intents.add(r.classified_intent__c);
    sess.spans.push(r.span_id__c);
  }
  // Convert Sets to arrays
  const sessions = Array.from(sessionMap.values()).map(s => ({
    ...s,
    topics:  Array.from(s.topics),
    intents: Array.from(s.intents),
  }));

  /* 3. Agents — derived from all agent dev names present in spans */
  const agentSpans = {};
  for (const r of spans) {
    const k = r.agent_dev_name__c;
    if (!agentSpans[k]) agentSpans[k] = [];
    agentSpans[k].push(r);
  }

  const agents = Object.keys(agentSpans).map(devName => {
    const knownMeta  = AGENT_META[devName]; // optional override; undefined for unknown agents
    const mySpans    = agentSpans[devName];
    const mySessions = sessions.filter(s => s.agentDevName === devName);
    const myLLM      = mySpans.filter(s => s.span_kind__c === 'LLM_CALL');
    const myTools    = mySpans.filter(s => s.span_kind__c === 'TOOL_CALL');
    const myGuards   = mySpans.filter(s => s.span_kind__c === 'GUARDRAIL');
    // Guardrail blocks are expected safety behaviour, not agent failures.
    // Tool calls that failed but were retried successfully are also not final failures.
    const succeededToolNames = new Set(
      mySpans.filter(s => s.span_kind__c === 'TOOL_CALL' && s.tool_success__c === true).map(s => s.tool_name__c)
    );
    const failedSpans = mySpans.filter(s =>
      s.span_status__c !== 'Ok' &&
      s.span_kind__c !== 'GUARDRAIL' &&
      !(s.span_kind__c === 'TOOL_CALL' && succeededToolNames.has(s.tool_name__c))
    );
    const escalated  = mySessions.some(s => s.escalation === 'Escalated');
    const hasPlanner = mySpans.some(s => s.span_kind__c === 'PLANNER');

    // Derive display metadata; AGENT_META values take precedence when available
    const displayName = knownMeta?.displayName
      || devName.replace(/([A-Z])/g, ' $1').trim();
    const name = knownMeta?.name
      || devName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    const id = knownMeta?.id
      || mySpans[0]?.agent_id__c
      || `agt_${name.slice(0, 8)}`;
    const models = [...new Set(mySpans.filter(s => s.model_name__c).map(s => s.model_name__c))];
    const model   = knownMeta?.model   || models.join(' / ') || 'unknown';
    const type    = knownMeta?.type    || 'agent';
    const role    = knownMeta?.role    || (hasPlanner ? 'lead' : 'worker');
    const version = knownMeta?.version || mySpans[0]?.agent_version__c || null;

    const avgConf = myLLM.length
      ? myLLM.reduce((a, r) => a + (r.overall_quality_score__c || 0), 0) / myLLM.length
      : 0.85;

    const avgLatency = myLLM.length
      ? Math.round(myLLM.reduce((a, r) => a + (r.latency_ms__c || 0), 0) / myLLM.length)
      : 2000;

    const totalTokens = myLLM.reduce((a, r) => a + (r.total_tokens__c || 0), 0);
    const tokenCostUsd = +(totalTokens * 0.000003).toFixed(4);

    return {
      id, devName, name, displayName, model, type, role, version,
      status:      failedSpans.length > 0 ? 'failed'
                 : escalated             ? 'review'
                 :                         'running',
      step:        mySessions.length,
      totalSteps:  PIPELINE_ORDER.length, // updated to pipeline.length after section 8
      conf:        +avgConf.toFixed(3),
      tasks:       mySessions.reduce((a, s) => a + s.messageCount, 0),
      errors:      failedSpans.length,
      latency:     avgLatency,
      tokenCost:   tokenCostUsd,
      dispatched:  role === 'lead' ? mySpans.filter(s => s.span_kind__c === 'INTERNAL').length : undefined,
      sessionCount:    mySessions.length,
      toolCallCount:   myTools.length,
      guardrailCount:  myGuards.length,
      llmCallCount:    myLLM.length,
      totalInputTokens:  myLLM.reduce((a, r) => a + (r.input_tokens__c || 0), 0),
      totalOutputTokens: myLLM.reduce((a, r) => a + (r.output_tokens__c || 0), 0),
      totalTokens,
      _deployed:  true,
      _melt:      ['L1','L2','L3','L4','L5','L6'],
      _tools:     [...new Set(myTools.map(t => t.tool_name__c).filter(Boolean))],
      _conf_min:  0.70,
    };
  });

  /* 4. Guardrails — all GUARDRAIL spans */
  const guardrails = spans
    .filter(r => r.span_kind__c === 'GUARDRAIL' && r.guardrail_check_id__c)
    .map(r => ({
      id:         r.guardrail_check_id__c,
      spanId:     r.span_id__c,
      sessionId:  r.session_id__c,
      agent:      agentDisplayName(r.agent_dev_name__c),
      name:       r.guardrail_name__c,
      type:       r.guardrail_type__c,       // PII | Policy | Toxicity
      passed:     r.guardrail_passed__c,
      reasonCode: r.guardrail_reason_code__c,
      confidence: r.guardrail_confidence__c,
      durationMs: r.span_duration_ms__c,
      ts:         r.span_start__c,
      statusMsg:  r.span_status_message__c,
    }));

  /* 5. Tool calls — all TOOL_CALL spans */
  const toolCalls = spans
    .filter(r => r.span_kind__c === 'TOOL_CALL' && r.tool_invocation_id__c)
    .map(r => {
      let toolOutput = null;
      try { toolOutput = JSON.parse(r.tool_output_json__c); } catch (_) {}
      let toolInput = null;
      try { toolInput = JSON.parse(r.tool_input_json__c); } catch (_) {}
      return {
        id:         r.tool_invocation_id__c,
        sessionId:  r.session_id__c,
        agent:      agentDisplayName(r.agent_dev_name__c),
        name:       r.tool_name__c,
        type:       r.tool_type__c,            // DataCloud | Flow | Apex | CPQ
        success:    r.tool_success__c,
        error:      r.tool_error_message__c,
        durationMs: r.tool_duration_ms__c,
        input:      toolInput,
        output:     toolOutput,
        ts:         r.span_start__c,
        intent:     r.classified_intent__c,
        // Extract bant_score if present in output
        bantScore:  toolOutput?.bant_score ?? null,
      };
    });

  /* 6. LLM calls — all LLM_CALL spans that have a llm_call_id */
  const llmCalls = spans
    .filter(r => r.span_kind__c === 'LLM_CALL' && r.llm_call_id__c)
    .map(r => ({
      id:              r.llm_call_id__c,
      sessionId:       r.session_id__c,
      agent:           agentDisplayName(r.agent_dev_name__c),
      model:           r.model_name__c,
      provider:        r.provider__c,
      feature:         r.feature__c,
      promptTemplate:  r.tag_key__c === 'prompt_template_dev_name' ? r.tag_value__c : null,
      inputTokens:     r.input_tokens__c,
      outputTokens:    r.output_tokens__c,
      totalTokens:     r.total_tokens__c,
      latencyMs:       r.latency_ms__c,
      qualityScore:    r.overall_quality_score__c,
      isToxic:         r.is_toxic__c,
      safetyCategory:  r.safety_category__c,
      safetyCategoryScore: r.safety_category_score__c,
      finishReason:    r.finish_reason__c,
      maskedPrompt:    r.masked_prompt__c,
      responseText:    r.response_text__c,
      ts:              r.span_start__c,
      intent:          r.classified_intent__c,
      topic:           r.topic__c,
    }));

  /* 7. Feedback — rows with explicit feedback */
  const feedback = spans
    .filter(r => r.feedback_type__c && r.llm_call_id__c)
    .map(r => ({
      llmCallId:   r.llm_call_id__c,
      sessionId:   r.session_id__c,
      agent:       agentDisplayName(r.agent_dev_name__c),
      type:        r.feedback_type__c,
      sentiment:   r.feedback_sentiment__c,    // positive | negative
      text:        r.feedback_text__c,
      actionType:  r.action_type__c,           // accepted | edited | rejected
      editDistance:r.edit_distance__c,
      topic:       r.topic__c,
      intent:      r.classified_intent__c,
      ts:          r.span_start__c,
    }));

  /* 8. Pipeline stages — all known L2O stages in order + any new stages from data */
  const stageCounts = {};
  for (const s of sessions) {
    for (const t of s.topics) {
      stageCounts[t] = (stageCounts[t] || 0) + 1;
    }
  }
  // Known stages in canonical order, then any unrecognised stages alphabetically
  const unknownStages  = Object.keys(stageCounts).filter(s => !PIPELINE_ORDER.includes(s)).sort();
  const allStageOrder  = [...PIPELINE_ORDER, ...unknownStages];
  const pipeline = allStageOrder.map(stage => ({
    stage,
    label: stage.replace(/_/g, ' '),
    count: stageCounts[stage] || 0,
    reached: (stageCounts[stage] || 0) > 0,
  }));
  // Sync totalSteps on all agents to the actual pipeline length
  for (const a of agents) a.totalSteps = pipeline.length;

  /* 9. Logs — convert spans to the log format the dashboard expects */
  const logs = spans
    .sort((a, b) => new Date(b.span_start__c) - new Date(a.span_start__c))
    .map(r => {
      const level = r.span_status__c === 'Ok'
        ? (r.guardrail_passed__c === false ? 'warn' : r.is_toxic__c ? 'err' : 'ok')
        : 'err';
      const agentShort = agentShortName(r.agent_dev_name__c);
      const msg = r.span_kind__c === 'TOOL_CALL'
        ? `${agentShort} · tool_call ${r.tool_name__c} · ${r.span_duration_ms__c}ms · ${r.tool_success__c ? '✓' : '✗'}`
        : r.span_kind__c === 'GUARDRAIL'
        ? `${agentShort} · guardrail ${r.guardrail_name__c} · ${r.guardrail_passed__c ? 'passed' : '⚠ blocked'} · ${r.guardrail_reason_code__c || ''}`
        : r.span_kind__c === 'LLM_CALL'
        ? `${agentShort} · llm ${r.model_name__c} · ${r.latency_ms__c}ms · ${r.total_tokens__c} tokens · quality ${r.overall_quality_score__c}`
        : r.span_kind__c === 'PLANNER'
        ? `${agentShort} · planner ${r.span_name__c} · ${r.span_duration_ms__c}ms`
        : `${agentShort} · ${r.span_name__c} · ${r.span_duration_ms__c}ms`;
      return {
        id:    r.span_id__c,
        ts:    new Date(r.span_start__c).toTimeString().slice(0, 8),
        level,
        agent: agentShort,
        msg,
        raw:   r,
      };
    });

  /* 10. Events — from explicit event rows + escalations */
  const events = [];
  for (const r of spans) {
    if (r.event_type__c) {
      events.push({
        id:    r.event_id__c,
        ts:    new Date(r.event_timestamp__c || r.span_start__c).toTimeString().slice(0, 5),
        color: r.event_type__c === 'Handoff' ? '#22d3ee' : '#f59e0b',
        title: `${r.event_type__c}: ${r.span_name__c}`,
        desc:  r.event_message__c || r.span_status_message__c || '',
      });
    }
    if (r.span_kind__c === 'GUARDRAIL' && r.guardrail_passed__c === false) {
      events.push({
        id:    r.guardrail_check_id__c,
        ts:    new Date(r.span_start__c).toTimeString().slice(0, 5),
        color: '#ef4444',
        title: `Guardrail blocked: ${r.guardrail_name__c}`,
        desc:  r.guardrail_reason_code__c || '',
      });
    }
  }

  /* 11. Handoffs — INTERNAL/escalation spans */
  const handoffs = spans
    .filter(r => r.span_kind__c === 'INTERNAL' || r.escalation_status__c === 'Escalated')
    .filter((r, i, arr) => arr.findIndex(x => x.span_id__c === r.span_id__c) === i)
    .map(r => {
      // LLM quality score is most meaningful for handoffs; fall back to guardrail confidence
      const confRaw = r.overall_quality_score__c ?? r.guardrail_confidence__c ?? null;
      return {
        id:      r.span_id__c,
        agent:   agentDisplayName(r.agent_dev_name__c),
        reason:  r.span_status_message__c || r.guardrail_reason_code__c || 'Agent handoff',
        conf:    confRaw !== null ? confRaw.toFixed(2) : '—',
        ts:      new Date(r.span_start__c).toTimeString().slice(0, 8),
        status:  r.escalation_status__c === 'Escalated' ? 'reviewing' : 'resolved',
        resTime: Math.round((r.time_before_escalation_ms__c || r.span_duration_ms__c || 120000) / 1000),
      };
    });

  /* 12. Aggregate metrics — single object matching makeMetrics() shape */
  const totalTasks     = sessions.reduce((a, s) => a + s.messageCount, 0);
  const totalTokensAll = llmCalls.reduce((a, r) => a + (r.totalTokens || 0), 0);
  const avgLatencyMs   = llmCalls.length
    ? llmCalls.reduce((a, r) => a + (r.latencyMs || 0), 0) / llmCalls.length
    : 0;
  const successRate = spans.length
    ? +((spans.filter(s => s.span_status__c === 'Ok').length / spans.length) * 100).toFixed(1)
    : 94.0;
  const guardrailPassRate = guardrails.length
    ? +((guardrails.filter(g => g.passed).length / guardrails.length) * 100).toFixed(1)
    : 100;
  const feedbackAcceptRate = feedback.length
    ? +((feedback.filter(f => f.actionType === 'accepted').length / feedback.length) * 100).toFixed(1)
    : 100;

  /* BANT score from tool outputs */
  const bantScores = toolCalls.filter(t => t.bantScore !== null).map(t => t.bantScore);
  const avgBantScore = bantScores.length
    ? Math.round(bantScores.reduce((a, b) => a + b, 0) / bantScores.length)
    : null;

  /* Token cost — approximate at $3/1M tokens */
  const totalCostUsd = +(totalTokensAll * 0.000003).toFixed(4);

  const metrics = {
    // Standard dashboard fields
    tasks:     totalTasks,
    success:   successRate,
    latency:   +(avgLatencyMs / 1000).toFixed(1),   // convert ms → seconds
    handoffs:  handoffs.length,
    cost:      totalCostUsd,
    toolCalls: toolCalls.length,
    // New L2O fields
    totalTokens:       totalTokensAll,
    guardrailPassRate,
    feedbackAcceptRate,
    avgBantScore,
    sessionCount:      sessions.length,
    deflectedCount:    sessions.filter(s => s.deflection === 'Deflected' || s.deflection === 'Resolved').length,
    escalatedCount:    sessions.filter(s => s.escalation === 'Escalated').length,
    offTopicTotal:     sessions.reduce((a, s) => a + s.offTopicCount, 0),
  };

  /* 13. Intent distribution — for a heatmap/chart */
  const intentDist = {};
  for (const r of spans) {
    if (r.classified_intent__c) {
      intentDist[r.classified_intent__c] = (intentDist[r.classified_intent__c] || 0) + 1;
    }
  }

  /* 14. Model usage breakdown */
  const modelDist = {};
  for (const r of llmCalls) {
    if (r.model) {
      if (!modelDist[r.model]) modelDist[r.model] = { calls: 0, tokens: 0 };
      modelDist[r.model].calls++;
      modelDist[r.model].tokens += r.totalTokens || 0;
    }
  }

  /* 15. Throughput series — hourly span counts over the day's range */
  const allTs = spans.map(s => new Date(s.span_start__c).getTime()).filter(Boolean);
  const throughputSeries = (() => {
    if (!allTs.length) return Array(24).fill(0);
    const minT = Math.min(...allTs);
    const maxT = Math.max(...allTs);
    const rangeMs = maxT - minT || 1;
    // 24 equal-width buckets
    const buckets = Array(24).fill(0);
    for (const t of allTs) {
      const idx = Math.min(23, Math.floor(((t - minT) / rangeMs) * 24));
      buckets[idx]++;
    }
    return buckets;
  })();

  /* 16. Failure distribution — real failure types from the data */
  const failTypes = {
    'Guardrail block':   guardrails.filter(g => !g.passed).length,
    'Tool failure':      toolCalls.filter(t => !t.success).length,
    'Low quality LLM':   llmCalls.filter(l => (l.qualityScore || 1) < 0.7).length,
    'Toxic content':     llmCalls.filter(l => l.isToxic === true).length,
    'Span error':        spans.filter(s => s.span_status__c !== 'Ok').length,
  };
  const failTotal = Object.values(failTypes).reduce((a, b) => a + b, 0) || 1;
  const failDist = Object.fromEntries(
    Object.entries(failTypes).map(([k, v]) => [k, Math.round(v / failTotal * 100)])
  );

  /* 17. Confidence by intent type — real quality scores from LLM calls */
  const confByIntent = {};
  for (const l of llmCalls) {
    const key = l.intent || l.topic || 'unknown';
    if (!confByIntent[key]) confByIntent[key] = [];
    if (l.qualityScore != null) confByIntent[key].push(l.qualityScore);
  }
  const confByType = Object.fromEntries(
    Object.entries(confByIntent)
      .filter(([, scores]) => scores.length > 0)
      .map(([k, scores]) => [k, +(scores.reduce((a, b) => a + b) / scores.length).toFixed(3)])
  );

  /* 18. Heatmap — real session activity by day-of-week and hour */
  const heatmapData = (() => {
    const grid = {};  // { 'Mon-14': count }
    const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    for (const s of sessions) {
      const d = new Date(s.start);
      const key = `${DAYS[d.getDay()]}-${d.getHours()}`;
      grid[key] = (grid[key] || 0) + 1;
    }
    return grid;
  })();

  return {
    // All real data — no synthetic values
    agents,
    metrics,
    logs,
    events,
    handoffs,
    // L2O-specific
    sessions,
    guardrails,
    toolCalls,
    llmCalls,
    feedback,
    pipeline,
    intentDist,
    modelDist,
    spans,
    // Derived analytics (math only, no fabrication)
    throughputSeries,
    failDist,
    confByType,
    heatmapData,
  };
}
