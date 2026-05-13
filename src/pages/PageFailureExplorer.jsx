import { useState, useMemo } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { MetricTile, Panel } from '../components/ui.jsx';

/* Map raw span_kind to a short action label */
function kindToAction(kind) {
  return { PLANNER:'plan', TOOL_CALL:'tool_call', GUARDRAIL:'guardrail',
           LLM_CALL:'llm_call', INTERNAL:'internal' }[kind] || kind.toLowerCase();
}

/* Build a human-readable note from a raw span row */
function buildNote(s) {
  switch (s.span_kind__c) {
    case 'TOOL_CALL':
      return `${s.tool_name__c} (${s.tool_type__c || 'tool'}) · ${s.tool_success__c ? 'success' : s.tool_error_message__c || 'failed'} · ${s.tool_duration_ms__c || s.span_duration_ms__c || 0}ms`;
    case 'GUARDRAIL':
      return `${s.guardrail_name__c || 'guardrail'} · ${s.guardrail_passed__c ? 'passed' : s.guardrail_reason_code__c || 'blocked'} · confidence ${s.guardrail_confidence__c ?? '—'}`;
    case 'LLM_CALL':
      return `${s.model_name__c || 'LLM'} · quality ${s.overall_quality_score__c ?? '—'} · ${s.total_tokens__c || 0} tokens · ${s.latency_ms__c || 0}ms`;
    case 'PLANNER':
      return `${s.span_name__c || 'plan'} · ${s.span_duration_ms__c || 0}ms`;
    default:
      return `${s.span_name__c || s.span_kind__c} · ${s.span_status_message__c || s.span_duration_ms__c + 'ms' || ''}`;
  }
}

/* Colour coding for trace steps */
const ACTION_COLOR = {
  plan:'#009ada', tool_call:'#a78bfa', guardrail:'#f59e0b',
  llm_call:'#22c55e', internal:'#06b6d4',
};

export default function PageFailureExplorer({ st }) {
  const [sel, setSel] = useState(null);
  const { spans, sessions } = st;

  /* Build failure list from real span data */
  const failures = useMemo(() => {
    const raw = spans.filter(s =>
      s.span_status__c !== 'Ok' ||
      (s.span_kind__c === 'GUARDRAIL' && s.guardrail_passed__c === false)
    );
    return raw.map((s, i) => {
      const sess = sessions.find(ss => ss.id === s.session_id__c);
      const agentName = s.agent_dev_name__c?.replace(/([A-Z])/g, ' $1').trim() || s.agent_dev_name__c || '—';
      const reason = s.span_status_message__c || s.guardrail_reason_code__c
        || s.tool_error_message__c || s.span_kind__c.toLowerCase().replace(/_/g,' ');
      const conf = s.guardrail_confidence__c ?? s.overall_quality_score__c ?? null;
      const ts = s.span_start__c
        ? new Date(s.span_start__c).toTimeString().slice(0, 8)
        : '—';
      const spanIndexInSession = sess
        ? spans.filter(x => x.session_id__c === s.session_id__c && x.span_start__c <= s.span_start__c).length
        : 1;
      return { id: i, spanId: s.span_id__c, sessionId: s.session_id__c, agent: agentName,
               reason, conf, ts, step: spanIndexInSession, escalated: sess?.escalation === 'Escalated' };
    });
  }, [spans, sessions]);

  const escalatedCount = failures.filter(f => f.escalated).length;
  const autoResolvedCount = failures.filter(f => !f.escalated).length;

  /* Build decision trace for selected failure */
  const traceSteps = useMemo(() => {
    if (sel == null) return [];
    const f = failures.find(x => x.id === sel);
    if (!f) return [];
    return spans
      .filter(s => s.session_id__c === f.sessionId)
      .sort((a, b) => new Date(a.span_start__c) - new Date(b.span_start__c))
      .map((s, i) => ({
        n: i + 1,
        action: kindToAction(s.span_kind__c),
        note: buildNote(s),
        failed: s.span_status__c !== 'Ok' || (s.span_kind__c === 'GUARDRAIL' && s.guardrail_passed__c === false),
      }));
  }, [sel, failures, spans]);

  const selected = sel != null ? failures.find(f => f.id === sel) : null;

  if (!spans || spans.length === 0) {
    return (
      <div className="anim-in" style={{ padding:40, textAlign:'center', fontFamily:mono, fontSize:12, color:C.dm }}>
        No span data loaded. Upload a JSON file to see real failure data.
      </div>
    );
  }

  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
        <MetricTile label="Total failures"  value={failures.length}     delta="from real spans"        dir="flat" accent="red" />
        <MetricTile label="Escalated"       value={escalatedCount}      delta="reached human queue"    dir="flat" accent="amber" />
        <MetricTile label="Auto-resolved"   value={autoResolvedCount}   delta="non-escalated failures" dir="up"   accent="green" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, alignItems:'start' }}>
        <Panel title="Recent failures">
          {failures.length === 0 ? (
            <div style={{ padding:'40px 16px', textAlign:'center', fontFamily:mono, fontSize:11, color:C.gr }}>
              ✓ No failures detected in current dataset
            </div>
          ) : (
            <div style={{ padding:'0 16px' }}>
              {failures.map(f => (
                <div key={f.id} onClick={() => setSel(f.id)}
                  style={{ display:'flex', alignItems:'center', gap:12, margin:'0 -16px', padding:'10px 16px',
                    cursor:'pointer', background:sel===f.id?C.sf2:'transparent',
                    borderBottom:`1px solid ${C.b}`, transition:'background .15s' }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:C.re, flexShrink:0,
                    boxShadow:`0 0 5px ${C.re}` }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:2 }}>
                      <span style={{ fontWeight:500, fontSize:12, fontFamily:sans }}>{f.agent}</span>
                      <span style={{ fontFamily:mono, fontSize:10, color:C.mu }}>step {f.step}</span>
                      {f.escalated && <span style={{ fontFamily:mono, fontSize:9, color:C.am, padding:'1px 5px', borderRadius:2, background:C.amBg }}>escalated</span>}
                    </div>
                    <div style={{ fontFamily:mono, fontSize:10, color:C.mu, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.reason}</div>
                  </div>
                  <span style={{ fontFamily:mono, fontSize:10, color:C.dm, flexShrink:0 }}>{f.ts}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
        {selected ? (
          <Panel title="Decision trace" style={{ alignSelf:'start' }}>
            <div style={{ padding:'14px 16px' }}>
              <div style={{ background:C.reBg, border:`1px solid ${C.re}22`, borderRadius:3, padding:'10px 12px', marginBottom:14, fontSize:11, color:C.mu, lineHeight:1.7 }}>
                <b style={{ color:C.re }}>{selected.agent}</b> failure at step {selected.step} in session{' '}
                <span style={{ fontFamily:mono, color:C.bl }}>{selected.sessionId}</span>.{' '}
                Reason: <span style={{ color:C.am }}>{selected.reason}</span>.
                {selected.conf != null && <> Confidence: <span style={{ color:C.re }}>{selected.conf}</span></>}
              </div>
              {traceSteps.map(t => (
                <div key={t.n} style={{ display:'flex', gap:10, marginBottom:10 }}>
                  <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0,
                    background: t.failed ? C.reBg : C.blBg,
                    border:`1px solid ${t.failed ? C.re+'44' : C.bl+'44'}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:mono, fontSize:9, color: t.failed ? C.re : C.bl }}>{t.n}</div>
                  <div style={{ minWidth:0 }}>
                    <span style={{ fontFamily:mono, fontSize:10, fontWeight:500, color: ACTION_COLOR[t.action] || C.tx }}>
                      {t.action}:{' '}
                    </span>
                    <span style={{ fontSize:11, color:t.failed ? C.re : C.mu }}>{t.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : (
          <Panel title="Decision trace" style={{ alignSelf:'start' }}>
            <div style={{ padding:'50px 16px', textAlign:'center', fontFamily:mono, fontSize:11, color:C.dm }}>
              ← select a failure to see the full session trace
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

