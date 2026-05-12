import { useState } from 'react';
import { C, mono, sans } from '../../constants/palette.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

const KIND_COLOR = {
  PLANNER:   '#a78bfa',
  GUARDRAIL: '#f59e0b',
  TOOL_CALL: '#22d3ee',
  LLM_CALL:  '#4ade80',
  INTERNAL:  '#94a3b8',
};

const KIND_ICON = {
  PLANNER:   '⬡',
  GUARDRAIL: '⊟',
  TOOL_CALL: '⚙',
  LLM_CALL:  '◈',
  INTERNAL:  '→',
};

function SpanRow({ span, onClick, selected }) {
  const color  = KIND_COLOR[span.span_kind__c] || C.mu;
  const icon   = KIND_ICON[span.span_kind__c] || '·';
  const isOk   = span.span_status__c === 'Ok';
  const depth  = span.parent_span_id__c ? 1 : 0;
  return (
    <tr
      onClick={() => onClick(span)}
      style={{ cursor: 'pointer', background: selected ? ACCENT + '18' : 'transparent', borderBottom: `1px solid ${C.b2}` }}
    >
      <td style={{ padding: '7px 12px', paddingLeft: 12 + depth * 20 }}>
        <span style={{ color, fontFamily: mono, fontSize: 12 }}>{icon} {span.span_name__c}</span>
        {span.parent_span_id__c && (
          <span style={{ fontFamily: mono, fontSize: 9, color: C.dm, marginLeft: 6 }}>↳ child</span>
        )}
      </td>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '7px 8px' }}>
        <span style={{ padding: '2px 6px', borderRadius: 3, background: color + '22', color }}>{span.span_kind__c}</span>
      </td>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '7px 8px', color: isOk ? C.gr : C.re }}>{isOk ? '✓ Ok' : '✗ ' + span.span_status__c}</td>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '7px 8px', color: C.mu }}>{span.span_duration_ms__c}ms</td>
      <td style={{ fontFamily: mono, fontSize: 11, padding: '7px 8px', color: C.dm }}>{span.session_id__c}</td>
    </tr>
  );
}

function SpanDetail({ span }) {
  if (!span) return (
    <div style={{ padding: 24, color: C.dm, fontFamily: mono, fontSize: 12, textAlign: 'center' }}>
      ← Select a span to inspect
    </div>
  );

  const color = KIND_COLOR[span.span_kind__c] || C.mu;
  let attrs = null;
  try { attrs = JSON.parse(span.span_attributes_json__c); } catch (_) {}

  const fields = [
    ['Span ID',       span.span_id__c],
    ['Session',       span.session_id__c],
    ['Trace',         span.trace_id__c],
    ['Parent Span',   span.parent_span_id__c || '(root)'],
    ['Kind',          span.span_kind__c],
    ['Name',          span.span_name__c],
    ['Start',         new Date(span.span_start__c).toLocaleTimeString()],
    ['Duration',      span.span_duration_ms__c + 'ms'],
    ['Status',        span.span_status__c],
    ['Status Msg',    span.span_status_message__c || '—'],
    ['Agent',         span.agent_dev_name__c],
    ['Intent',        span.classified_intent__c || '—'],
    ['Topic',         span.topic__c || '—'],
    // Tool fields
    span.tool_name__c && ['Tool Name',   span.tool_name__c],
    span.tool_type__c && ['Tool Type',   span.tool_type__c],
    span.tool_success__c !== null && ['Tool Success', span.tool_success__c ? '✓ true' : '✗ false'],
    span.tool_duration_ms__c && ['Tool Duration', span.tool_duration_ms__c + 'ms'],
    span.tool_error_message__c && ['Tool Error', span.tool_error_message__c],
    // Guardrail fields
    span.guardrail_name__c && ['Guardrail',     span.guardrail_name__c],
    span.guardrail_type__c && ['Guardrail Type',span.guardrail_type__c],
    span.guardrail_passed__c !== null && ['Guardrail Passed', span.guardrail_passed__c ? '✓ true' : '✗ false'],
    span.guardrail_reason_code__c && ['Reason Code', span.guardrail_reason_code__c],
    span.guardrail_confidence__c && ['Guard Confidence', (span.guardrail_confidence__c * 100).toFixed(1) + '%'],
    // LLM fields
    span.model_name__c && ['Model',         span.model_name__c],
    span.provider__c   && ['Provider',       span.provider__c],
    span.total_tokens__c && ['Total Tokens', span.total_tokens__c],
    span.input_tokens__c && ['Input Tokens', span.input_tokens__c],
    span.output_tokens__c && ['Output Tokens', span.output_tokens__c],
    span.latency_ms__c && ['LLM Latency',   span.latency_ms__c + 'ms'],
    span.overall_quality_score__c && ['Quality Score', (span.overall_quality_score__c * 100).toFixed(0) + '%'],
    span.is_toxic__c !== null && ['Toxic',  span.is_toxic__c ? '⚠ YES' : '✓ No'],
    span.finish_reason__c && ['Finish Reason', span.finish_reason__c],
    // Feedback
    span.feedback_sentiment__c && ['Feedback', span.feedback_sentiment__c + ' · ' + (span.action_type__c || '')],
  ].filter(Boolean);

  return (
    <div style={{ padding: 16, overflowY: 'auto', height: '100%' }}>
      <div style={{ fontFamily: mono, fontSize: 12, color, marginBottom: 12, fontWeight: 600 }}>
        {KIND_ICON[span.span_kind__c]} {span.span_name__c}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <tbody>
          {fields.map(([k, v]) => v && (
            <tr key={k} style={{ borderBottom: `1px solid ${C.b2}` }}>
              <td style={{ fontFamily: mono, color: C.dm, padding: '5px 8px 5px 0', whiteSpace: 'nowrap', verticalAlign: 'top', width: '40%' }}>{k}</td>
              <td style={{ fontFamily: mono, color: C.tx, padding: '5px 0', wordBreak: 'break-all' }}>{String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {attrs && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Span Attributes</div>
          <pre style={{ fontFamily: mono, fontSize: 11, color: C.tx, background: C.sf2 || 'rgba(0,0,0,.06)', padding: 10, borderRadius: 4, overflowX: 'auto', margin: 0 }}>
            {JSON.stringify(attrs, null, 2)}
          </pre>
        </div>
      )}

      {span.masked_prompt__c && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Masked Prompt (PII Redacted)</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: C.mu, background: C.sf2 || 'rgba(0,0,0,.06)', padding: 10, borderRadius: 4, lineHeight: 1.6 }}>
            {span.masked_prompt__c}
          </div>
        </div>
      )}

      {span.tool_input_json__c && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Tool Input</div>
          <pre style={{ fontFamily: mono, fontSize: 11, color: C.tx, background: 'rgba(34,211,238,.06)', padding: 10, borderRadius: 4, overflowX: 'auto', margin: 0 }}>
            {JSON.stringify(JSON.parse(span.tool_input_json__c || '{}'), null, 2)}
          </pre>
        </div>
      )}

      {span.tool_output_json__c && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Tool Output</div>
          <pre style={{ fontFamily: mono, fontSize: 11, color: C.tx, background: 'rgba(74,222,128,.06)', padding: 10, borderRadius: 4, overflowX: 'auto', margin: 0 }}>
            {JSON.stringify(JSON.parse(span.tool_output_json__c || '{}'), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function PageL2OTraceExplorer({ st }) {
  const { spans = [], sessions = [] } = st;
  const [selected, setSelected]     = useState(null);
  const [filterKind, setFilterKind] = useState('ALL');
  const [filterSess, setFilterSess] = useState('ALL');

  const kinds    = ['ALL', ...new Set(spans.map(s => s.span_kind__c))];
  const sessIds  = ['ALL', ...sessions.map(s => s.id)];

  const filtered = spans.filter(s =>
    (filterKind === 'ALL' || s.span_kind__c === filterKind) &&
    (filterSess === 'ALL' || s.session_id__c === filterSess)
  ).sort((a, b) => new Date(a.span_start__c) - new Date(b.span_start__c));

  const btnStyle = (active) => ({
    fontFamily: mono, fontSize: 11, padding: '4px 10px', borderRadius: 3, cursor: 'pointer',
    border: `1px solid ${active ? ACCENT : C.b2}`,
    background: active ? ACCENT + '22' : 'transparent',
    color: active ? ACCENT : C.mu,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ background: C.sf, border: `1px solid ${C.b2}`, borderRadius: 6, padding: '12px 16px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: mono, fontSize: 10, color: C.dm, textTransform: 'uppercase', letterSpacing: '.08em' }}>Span kind</span>
          {kinds.map(k => (
            <button key={k} onClick={() => setFilterKind(k)} style={btnStyle(filterKind === k)}>
              {KIND_ICON[k] || '·'} {k}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontFamily: mono, fontSize: 10, color: C.dm, textTransform: 'uppercase', letterSpacing: '.08em' }}>Session</span>
          {sessIds.map(s => (
            <button key={s} onClick={() => setFilterSess(s)} style={btnStyle(filterSess === s)}>
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: mono, fontSize: 11, color: C.mu }}>
          {filtered.length} spans
        </div>
      </div>

      {/* Split view */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }}>
        {/* Span list */}
        <Panel title="Spans" subtitle="Click any span to inspect">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.b2}` }}>
                  {['Span Name', 'Kind', 'Status', 'Duration', 'Session'].map(h => (
                    <th key={h} style={{ fontFamily: mono, fontSize: 10, color: C.dm, textAlign: 'left', padding: '6px 8px', textTransform: 'uppercase', letterSpacing: '.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(span => (
                  <SpanRow
                    key={span.span_id__c}
                    span={span}
                    onClick={setSelected}
                    selected={selected?.span_id__c === span.span_id__c}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Detail panel */}
        <div style={{ background: C.sf, border: `1px solid ${C.b2}`, borderRadius: 6, minHeight: 400, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.b2}`, fontFamily: mono, fontSize: 10, color: C.dm, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Span Detail
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <SpanDetail span={selected} />
          </div>
        </div>
      </div>
    </div>
  );
}
