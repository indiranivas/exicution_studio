import { C, mono, sans } from '../../constants/palette.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

const TYPE_COLOR = {
  PII:     '#a78bfa',
  Policy:  '#f59e0b',
  Toxicity:'#f87171',
};

function GuardrailBadge({ type }) {
  const color = TYPE_COLOR[type] || C.mu;
  return (
    <span style={{ fontFamily: mono, fontSize: 10, padding: '2px 7px', borderRadius: 3, background: color + '22', color, border: `1px solid ${color}44` }}>
      {type}
    </span>
  );
}

export default function PageL2OGuardrails({ st }) {
  const { guardrails = [], spans = [], sessions = [] } = st;

  // Summary stats
  const total   = guardrails.length;
  const passed  = guardrails.filter(g => g.passed).length;
  const blocked = guardrails.filter(g => !g.passed).length;
  const passRate = total ? Math.round(passed / total * 100) : 100;

  const byType = {};
  for (const g of guardrails) {
    if (!byType[g.type]) byType[g.type] = { passed: 0, blocked: 0 };
    g.passed ? byType[g.type].passed++ : byType[g.type].blocked++;
  }

  // All LLM rows that have safety scores (even if not a guardrail span)
  const llmRows = spans.filter(s => s.span_kind__c === 'LLM_CALL' && s.is_toxic__c !== null);
  const toxicRows   = llmRows.filter(s => s.is_toxic__c === true);
  const avgSafetyScore = llmRows.length
    ? (llmRows.reduce((a, s) => a + (s.safety_category_score__c || 0), 0) / llmRows.length).toFixed(3)
    : '0.000';

  // Masked prompt audit from LLM rows
  const maskedPrompts = spans
    .filter(s => s.masked_prompt__c)
    .map(s => ({
      ts:     new Date(s.span_start__c).toLocaleTimeString(),
      agent:  s.agent_dev_name__c === 'LeadToOrderSalesAssistant' ? 'Sales Assist' : 'Quote Specialist',
      prompt: s.masked_prompt__c,
      session: s.session_id__c,
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI strip */}
      <div className="grid-4">
        {[
          { label: 'Guardrail Checks',  value: total,          color: ACCENT },
          { label: 'Passed',            value: passed,         color: C.gr   },
          { label: 'Blocked / Flagged', value: blocked,        color: blocked > 0 ? C.re : C.gr },
          { label: 'Pass Rate',         value: passRate + '%', color: passRate >= 90 ? C.gr : C.am },
        ].map(k => (
          <div key={k.label} style={{ background: C.sf, border: `1px solid ${C.b2}`, borderRadius: 6, padding: '14px 16px' }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontFamily: mono, fontSize: 26, fontWeight: 600, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Guardrail table */}
        <Panel title="Guardrail Checks" subtitle={`${total} checks from Einstein Trust Layer`}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.b2}` }}>
                {['Time', 'Guardrail', 'Type', 'Result', 'Reason Code', 'Confidence', 'Agent'].map(h => (
                  <th key={h} style={{ fontFamily: mono, fontSize: 10, color: C.dm, textAlign: 'left', padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {guardrails.map(g => (
                <tr key={g.id} style={{ borderBottom: `1px solid ${C.b2}` }}>
                  <td style={{ fontFamily: mono, fontSize: 11, padding: '7px 10px', color: C.dm, whiteSpace: 'nowrap' }}>{new Date(g.ts).toLocaleTimeString()}</td>
                  <td style={{ fontFamily: sans, fontSize: 12, padding: '7px 10px', color: C.tx }}>{g.name}</td>
                  <td style={{ padding: '7px 10px' }}><GuardrailBadge type={g.type} /></td>
                  <td style={{ fontFamily: mono, fontSize: 12, padding: '7px 10px', color: g.passed ? C.gr : C.re, fontWeight: 600 }}>
                    {g.passed ? '✓ Passed' : '✗ Blocked'}
                  </td>
                  <td style={{ fontFamily: mono, fontSize: 11, padding: '7px 10px', color: C.mu }}>{g.reasonCode || '—'}</td>
                  <td style={{ fontFamily: mono, fontSize: 11, padding: '7px 10px', color: C.mu }}>{g.confidence != null ? (g.confidence * 100).toFixed(1) + '%' : '—'}</td>
                  <td style={{ fontFamily: mono, fontSize: 11, padding: '7px 10px', color: C.dm }}>{g.agent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* By type */}
          <Panel title="By Guardrail Type">
            {Object.entries(byType).map(([type, counts]) => {
              const color = TYPE_COLOR[type] || C.mu;
              const total = counts.passed + counts.blocked;
              const pct   = Math.round(counts.passed / total * 100);
              return (
                <div key={type} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <GuardrailBadge type={type} />
                    <span style={{ fontFamily: mono, fontSize: 11, color: C.mu }}>{counts.passed}/{total} passed</span>
                  </div>
                  <div style={{ height: 6, background: C.b2, borderRadius: 3 }}>
                    <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </Panel>

          {/* Safety scores from LLM calls */}
          <Panel title="AI Safety Scores" subtitle={`From ${llmRows.length} LLM calls`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: mono, fontSize: 12, color: C.mu }}>Avg safety category score</span>
                <span style={{ fontFamily: mono, fontSize: 14, color: parseFloat(avgSafetyScore) < 0.1 ? C.gr : C.am, fontWeight: 600 }}>{avgSafetyScore}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: mono, fontSize: 12, color: C.mu }}>Toxic responses</span>
                <span style={{ fontFamily: mono, fontSize: 14, color: toxicRows.length > 0 ? C.re : C.gr, fontWeight: 600 }}>{toxicRows.length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: mono, fontSize: 12, color: C.mu }}>LLM calls evaluated</span>
                <span style={{ fontFamily: mono, fontSize: 14, color: C.mu }}>{llmRows.length}</span>
              </div>
            </div>
            {llmRows.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {[...new Set(llmRows.map(r => r.safety_category__c))].filter(Boolean).map(cat => {
                  const rows = llmRows.filter(r => r.safety_category__c === cat);
                  const avg  = (rows.reduce((a, r) => a + (r.safety_category_score__c || 0), 0) / rows.length).toFixed(3);
                  return (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${C.b2}` }}>
                      <span style={{ color: C.mu }}>{cat}</span>
                      <span style={{ color: parseFloat(avg) < 0.1 ? C.gr : C.am }}>avg {avg}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>

      {/* PII Masked Prompts Audit */}
      <Panel title="PII Masking Audit" subtitle={`${maskedPrompts.length} prompts with PII redacted before LLM send`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {maskedPrompts.map((m, i) => (
            <div key={i} style={{ background: C.sf2 || 'rgba(0,0,0,.04)', borderRadius: 6, padding: '10px 14px', border: `1px solid ${C.b2}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: mono, fontSize: 10, color: C.mu }}>{m.agent} · {m.session}</span>
                <span style={{ fontFamily: mono, fontSize: 10, color: C.dm }}>{m.ts}</span>
              </div>
              <div style={{ fontFamily: mono, fontSize: 11, color: C.tx, lineHeight: 1.6 }}>
                {m.prompt}
              </div>
              <div style={{ marginTop: 6, fontFamily: mono, fontSize: 10, color: '#a78bfa' }}>
                ⊟ PII entities replaced with [PERSON_*], [ORG_*], [LEAD_*] tokens before send
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
