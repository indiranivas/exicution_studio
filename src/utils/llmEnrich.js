/**
 * llmEnrich.js
 * Calls Azure OpenAI to compute fields that cannot be derived mathematically.
 *
 * LLM-CALCULATED FIELDS (report of what this module computes):
 * ─────────────────────────────────────────────────────────────
 * 1. agentRiskScores    — per-agent risk score (0-100) derived from pattern analysis
 *                         of errors, guardrail blocks, quality drops, and escalations.
 *                         Cannot be a simple formula: requires semantic weighing of
 *                         multiple independent signals.
 *
 * 2. sessionInsights    — per-session one-line narrative (e.g. "Healthy sales assist
 *                         session; PII masked, BANT scored 92, lead converted").
 *                         Requires reading tool inputs/outputs and producing language.
 *
 * 3. alertItems         — list of detected anomalies/violations with severity and
 *                         recommended action. Requires reasoning about what constitutes
 *                         a risk in this domain (e.g. 33% guardrail pass rate = alert).
 *
 * 4. executiveBullets   — 3-5 plain-English bullet points for the executive view.
 *                         Requires distilling many signals into business language.
 *
 * 5. taskQueueItems     — inferred from incomplete/partial sessions; the JSON only
 *                         records completed spans. LLM infers what likely follow-up
 *                         tasks exist based on session outcomes.
 */

const ENDPOINT   = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT?.replace(/\/$/, '');
const API_KEY    = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
const DEPLOYMENT = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT || 'gpt-5.4-nano';
const API_VER    = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2025-04-01-preview';

async function callLLM(systemPrompt, userContent, maxTokens = 1500) {
  const url = `${ENDPOINT}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VER}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': API_KEY },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userContent  },
      ],
      max_completion_tokens: maxTokens,
      temperature: 0.1,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Azure OpenAI error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Main enrichment function — takes the parsed l2oData and returns enriched fields.
 * Returns a promise that resolves with { agentRiskScores, sessionInsights, alertItems,
 * executiveBullets, taskQueueItems }.
 *
 * Progress callback: onProgress(step, total, label)
 */
export async function enrichWithLLM(l2oData, onProgress = () => {}) {
  const { agents, sessions, guardrails, toolCalls, llmCalls, feedback, metrics, spans } = l2oData;

  const STEPS = 5;
  let step = 0;
  const tick = (label) => { step++; onProgress(step, STEPS, label); };

  // ─── 1. Agent risk scores ──────────────────────────────────────────────────
  tick('Calculating agent risk scores…');
  const agentRiskScores = await (async () => {
    const agentSummaries = agents.map(a => ({
      name: a.displayName,
      status: a.status,
      errors: a.errors,
      tasks: a.tasks,
      conf: a.conf,
      guardrailBlocks: guardrails.filter(g => !g.passed && g.agent === a.displayName).length,
      escalations: sessions.filter(s => s.agentDevName?.includes(a.name?.split('-')[0]) && s.escalation === 'Escalated').length,
      avgQuality: +(llmCalls.filter(l => l.agent === a.displayName).reduce((s, l) => s + (l.qualityScore || 0), 0) / Math.max(1, llmCalls.filter(l => l.agent === a.displayName).length)).toFixed(3),
    }));

    const prompt = `You are an AI operations analyst. Compute a risk score 0-100 for each agent based on:
- errors vs tasks ratio
- guardrail blocks (especially Policy/Toxicity)
- escalation count  
- average quality score (lower = higher risk)
- agent status (failed = high risk)

0 = no risk, 100 = critical risk.

Respond ONLY with valid JSON: { "AgentDisplayName": riskScore, ... }
No markdown, no explanation.`;

    const raw = await callLLM(prompt, JSON.stringify(agentSummaries)).catch(() => '{}');
    try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { return {}; }
  })();

  // ─── 2. Session insights ───────────────────────────────────────────────────
  tick('Generating session insights…');
  const sessionInsights = await (async () => {
    const sessData = sessions.map(s => {
      const myTools = toolCalls.filter(t => t.sessionId === s.id).map(t => ({ name: t.name, success: t.success }));
      const myLLM   = llmCalls.filter(l => l.sessionId === s.id).map(l => ({ quality: l.qualityScore, feedback: l.actionType }));
      const myGuards= guardrails.filter(g => g.sessionId === s.id).map(g => ({ type: g.type, passed: g.passed, reason: g.reasonCode }));
      return {
        id: s.id,
        agent: s.agentDevName,
        channel: s.channel,
        engagement: s.engagement,
        escalation: s.escalation,
        deflection: s.deflection,
        messages: s.messageCount,
        topics: s.topics,
        tools: myTools,
        llm: myLLM,
        guardrails: myGuards,
        durationSec: Math.round((s.durationMs || 0) / 1000),
      };
    });

    const prompt = `You are an AI observability analyst for a Salesforce Lead-to-Order system.
For each session, write a single concise sentence (max 20 words) describing what happened and any notable outcomes.
Respond ONLY with valid JSON: { "SESSION_ID": "insight text", ... }
No markdown, no extra text.`;

    const raw = await callLLM(prompt, JSON.stringify(sessData), 600).catch(() => '{}');
    try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { return {}; }
  })();

  // ─── 3. Alert items ────────────────────────────────────────────────────────
  tick('Detecting anomalies and alerts…');
  const alertItems = await (async () => {
    const snapshot = {
      guardrailPassRate: metrics.guardrailPassRate,
      feedbackAcceptRate: metrics.feedbackAcceptRate,
      successRate: metrics.success,
      escalatedCount: metrics.escalatedCount,
      toxicCount: llmCalls.filter(l => l.isToxic).length,
      failedTools: toolCalls.filter(t => !t.success).map(t => t.name),
      blockedGuardrails: guardrails.filter(g => !g.passed).map(g => ({ name: g.name, reason: g.reasonCode })),
      avgQuality: +(llmCalls.reduce((a, l) => a + (l.qualityScore || 0), 0) / Math.max(1, llmCalls.length)).toFixed(3),
      sessionCount: sessions.length,
    };

    const prompt = `You are an AI ops monitoring system. Analyse the telemetry snapshot and generate a list of alerts.
Each alert must have: id (string), severity ("critical"|"high"|"medium"|"low"), title (short), description (1 sentence), recommendation (1 sentence).
Only flag real issues — do not invent problems that aren't supported by the numbers.
Respond ONLY with valid JSON array: [{ "id":"ALT-001", "severity":"high", "title":"...", "description":"...", "recommendation":"..." }, ...]
No markdown, no extra text.`;

    const raw = await callLLM(prompt, JSON.stringify(snapshot), 800).catch(() => '[]');
    try { return JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { return []; }
  })();

  // ─── 4. Executive bullets ─────────────────────────────────────────────────
  tick('Writing executive summary…');
  const executiveBullets = await (async () => {
    const summary = {
      sessions: sessions.length,
      agents: agents.map(a => ({ name: a.displayName, status: a.status, conf: a.conf })),
      metrics: {
        successRate: metrics.success,
        guardrailPassRate: metrics.guardrailPassRate,
        feedbackAcceptRate: metrics.feedbackAcceptRate,
        avgBantScore: metrics.avgBantScore,
        totalTokens: metrics.totalTokens,
        costUsd: metrics.cost,
        handoffs: metrics.handoffs,
        escalations: metrics.escalatedCount,
      },
      topInsights: {
        guardrailBlocks: guardrails.filter(g => !g.passed).map(g => g.reasonCode),
        feedbackSentiment: feedback.map(f => f.sentiment),
        failedTools: toolCalls.filter(t => !t.success).map(t => t.name),
      },
    };

    const prompt = `You are a senior AI operations analyst. Write exactly 5 concise bullet points for an executive dashboard summary of a Lead-to-Order AI agent system.
Each bullet should start with a bold keyword (one word), then a colon, then a single sentence fact or insight.
Be specific — use the numbers provided. No vague platitudes.
Respond ONLY as a JSON array of 5 strings: ["**Keyword**: sentence.", ...]
No markdown code fences, no extra text.`;

    const raw = await callLLM(prompt, JSON.stringify(summary), 500).catch(() => '[]');
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      return Array.isArray(parsed) ? parsed : [];
    }
    catch { return []; }
  })();

  // ─── 5. Task queue — inferred from session outcomes ────────────────────────
  tick('Inferring task queue…');
  const taskQueueItems = await (async () => {
    const completed = sessions.filter(s => s.deflection === 'Resolved' || s.deflection === 'Deflected');
    const escalated = sessions.filter(s => s.escalation === 'Escalated');
    const context = {
      completedSessions: completed.map(s => ({ id: s.id, topics: s.topics, agent: s.agentDevName, deflection: s.deflection })),
      escalatedSessions: escalated.map(s => ({ id: s.id, topics: s.topics, reason: s.engagement })),
      pendingHandoffs: l2oData.handoffs.filter(h => h.status !== 'resolved').length,
    };

    const prompt = `You are a CRM workflow analyst. Based on these completed and escalated AI agent sessions, infer the most likely follow-up tasks that a sales rep would need to do next.
Each task: id (string), title (short), description (1 sentence), priority ("high"|"medium"|"low"), assignedTo ("Sales Rep"|"Quote Specialist"|"Manager"), relatedSessionId (string or null).
Return max 6 tasks. Only infer tasks that logically follow from the session data.
Respond ONLY with valid JSON array. No markdown.`;

    const raw = await callLLM(prompt, JSON.stringify(context), 700).catch(() => '[]');
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      return Array.isArray(parsed) ? parsed : [];
    }
    catch { return []; }
  })();

  return {
    agentRiskScores,
    sessionInsights,
    alertItems,
    executiveBullets,
    taskQueueItems,
  };
}
