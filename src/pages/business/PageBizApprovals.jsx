import { useState, useMemo } from 'react';
import { C, mono, sans } from '../../constants/palette.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

const urgencyConfig = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,.08)',   bd: 'rgba(239,68,68,.25)',   label: 'High Priority' },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,.08)',  bd: 'rgba(245,158,11,.25)',  label: 'Medium' },
  low:    { color: ACCENT,    bg: 'rgba(0,154,218,.08)',   bd: 'rgba(0,154,218,.25)',   label: 'Low' },
};

function ApprovalCard({ item, onApprove, onReject, done }) {
  const u = urgencyConfig[item.urgency];
  return (
    <div style={{
      background: C.sf, border: `1px solid ${done ? C.b : u.bd}`,
      borderRadius: 6, padding: '16px 18px', marginBottom: 10,
      opacity: done ? .45 : 1, transition: 'all .3s',
      borderLeft: `4px solid ${done ? C.dm : u.color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.tx }}>{item.type}</span>
            <span style={{ fontFamily: mono, fontSize: 9, padding: '2px 8px', borderRadius: 20, background: u.bg, color: u.color, border: `1px solid ${u.bd}` }}>{u.label}</span>
            {item.value && <span style={{ fontFamily: mono, fontSize: 10, color: '#22c55e' }}>Value: {item.value}</span>}
            <span style={{ fontFamily: mono, fontSize: 10, color: C.dm, marginLeft: 'auto' }}>{item.time}</span>
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: ACCENT, marginBottom: 6 }}>Raised by: {item.agent}</div>
          <div style={{ fontFamily: sans, fontSize: 12, color: C.mu, lineHeight: 1.6 }}>{item.summary}</div>
        </div>
      </div>
      {!done && (
        <div style={{ display: 'flex', gap: 8, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.b}` }}>
          <button onClick={() => onApprove(item.id)} style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, padding: '7px 20px', borderRadius: 4, border: '1px solid rgba(34,197,94,.4)', background: 'rgba(34,197,94,.1)', color: '#22c55e', cursor: 'pointer', transition: 'all .15s' }}>
            ✓ Approve
          </button>
          <button onClick={() => onReject(item.id)} style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, padding: '7px 20px', borderRadius: 4, border: '1px solid rgba(239,68,68,.4)', background: 'rgba(239,68,68,.1)', color: '#ef4444', cursor: 'pointer', transition: 'all .15s' }}>
            ✗ Reject
          </button>
          <button style={{ fontFamily: sans, fontSize: 12, padding: '7px 16px', borderRadius: 4, border: `1px solid ${C.b2}`, background: 'transparent', color: C.mu, cursor: 'pointer', marginLeft: 'auto' }}>
            Delegate →
          </button>
        </div>
      )}
      {done && (
        <div style={{ marginTop: 10, fontFamily: mono, fontSize: 11, color: C.dm }}>✓ Decision recorded · AI will continue processing · Your response helps improve future decisions</div>
      )}
    </div>
  );
}

export default function PageBizApprovals({ st }) {
  const { handoffs, sessions, guardrails, toolCalls, agents, metrics } = st;
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);

  /* Build approval items from real data */
  const APPROVALS = useMemo(() => {
    const items = [];
    // Escalated sessions
    sessions.filter(s => s.escalation === 'Escalated').forEach(s => {
      const agent = agents.find(a => a.id === s.agentId);
      const intent = (s.intents[0] || s.topics[0] || 'L2O workflow').replace(/_/g, ' ');
      const time = s.start ? new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
      items.push({
        id: `sess-${s.id}`,
        type: 'Session Escalated to Human',
        agent: agent?.displayName || 'AI Agent',
        summary: `Session ${s.id} was escalated after ${s.messageCount} messages. Intent: ${intent}. Time before escalation: ${s.timeToEscMs ? (s.timeToEscMs / 1000).toFixed(0) + 's' : '—'}.`,
        urgency: 'high',
        time,
        value: null,
      });
    });
    // Failed guardrail checks
    guardrails.filter(g => !g.passed).forEach(g => {
      const time = g.ts ? new Date(g.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
      items.push({
        id: `guard-${g.id}`,
        type: 'Guardrail Block',
        agent: g.agent,
        summary: `"${g.name || 'Guardrail'}" blocked in session ${g.sessionId}. Reason: ${g.reasonCode || 'Policy violation'}. Confidence: ${g.confidence ?? '—'}.`,
        urgency: 'medium',
        time,
        value: null,
      });
    });
    // Failed tool calls
    toolCalls.filter(t => !t.success).forEach(t => {
      const time = t.ts ? new Date(t.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
      items.push({
        id: `tool-${t.id}`,
        type: 'Tool Failure',
        agent: t.agent,
        summary: `Tool "${t.name}" (${t.type || 'unknown'}) failed in session ${t.sessionId}.${t.error ? ' Error: ' + t.error : ''}`,
        urgency: 'medium',
        time,
        value: null,
      });
    });
    return items;
  }, [sessions, guardrails, toolCalls, agents]);

  const pending = APPROVALS.filter(a => !approved.includes(a.id) && !rejected.includes(a.id));
  const resolved = APPROVALS.filter(a => approved.includes(a.id) || rejected.includes(a.id));
  const slaBreached = handoffs.filter(h => h.resTime > 900 && h.status !== 'resolved').length;

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* What is this page? */}
      <div style={{ background: 'linear-gradient(135deg, rgba(0,154,218,.08) 0%, rgba(245,158,11,.05) 100%)', border: '1px solid rgba(0,154,218,.2)', borderRadius: 8, padding: '18px 22px' }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>What is this page?</div>
        <div style={{ fontFamily: sans, fontSize: 13, color: C.tx, lineHeight: 1.75, fontWeight: 300 }}>
          Your AI agents work autonomously most of the time. But when they encounter a situation that is <span style={{ color: '#f59e0b', fontWeight: 500 }}>high-value, ambiguous, or outside their confidence threshold</span>, they pause and ask for your decision rather than risk making the wrong call.
          {' '}This page shows those items. <span style={{ color: C.tx, fontWeight: 500 }}>Your decisions here unblock the AI and are remembered</span> to improve its future confidence on similar tasks.
        </div>
      </div>

      {/* Summary */}
      <div className="grid-4">
        {[
          { label: 'Pending Your Decision',  val: pending.length,    col: pending.length > 3 ? '#ef4444' : '#f59e0b', sub: 'need human input' },
          { label: 'Resolved This Session',  val: resolved.length,   col: '#22c55e',  sub: 'approved or rejected' },
          { label: 'SLA Risk',               val: slaBreached,       col: slaBreached > 0 ? '#ef4444' : '#22c55e', sub: slaBreached > 0 ? 'items past 15 min' : 'all within SLA' },
          { label: 'AI Auto-Resolved',     val: metrics.deflectedCount,  col: ACCENT,     sub: 'sessions deflected without escalation' },
        ].map(x => (
          <div key={x.label} style={{ background: C.sf, border: `1px solid ${C.b}`, borderRadius: 6, padding: '18px 20px', borderTop: `3px solid ${x.col}` }}>
            <div style={{ fontFamily: sans, fontSize: 11, color: C.mu, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{x.label}</div>
            <div style={{ fontFamily: sans, fontSize: 32, fontWeight: 300, color: x.col }}>{x.val}</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: C.dm, marginTop: 6 }}>{x.sub}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 6, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontFamily: sans, fontSize: 13, color: C.tx }}>
            <b>{pending.filter(a=>a.urgency==='high').length} high-priority</b> items need your decision · AI automation is paused on these tasks until resolved
          </span>
        </div>
      )}

      <div className="grid-sidebar">
        <div>
          <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: C.tx, marginBottom: 12 }}>
            {pending.length > 0 ? `${pending.length} Pending Approvals` : 'All caught up ✓'}
          </div>
          {APPROVALS.map(item => (
            <ApprovalCard
              key={item.id}
              item={item}
              done={approved.includes(item.id) || rejected.includes(item.id)}
              onApprove={id => setApproved(p => [...p, id])}
              onReject={id => setRejected(p => [...p, id])}
            />
          ))}
        </div>

        <Panel title="Approval Insights">
          <div style={{ padding: '14px 16px' }}>
            {[
              { label: 'Total items',        val: APPROVALS.length,                                                  col: C.tx },
              { label: 'Escalated sessions', val: sessions.filter(s => s.escalation === 'Escalated').length,        col: '#ef4444' },
              { label: 'Guardrail blocks',   val: guardrails.filter(g => !g.passed).length,                        col: '#f59e0b' },
              { label: 'Failed tool calls',  val: toolCalls.filter(t => !t.success).length,                        col: ACCENT },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.b}` }}>
                <span style={{ fontFamily: sans, fontSize: 12, color: C.mu }}>{r.label}</span>
                <span style={{ fontFamily: mono, fontSize: 13, color: r.col, fontWeight: 500 }}>{r.val}</span>
              </div>
            ))}
            {APPROVALS.length === 0 && (
              <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(34,197,94,.07)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 4, fontFamily: sans, fontSize: 11, color: '#22c55e', lineHeight: 1.6 }}>
                ✓ No items requiring approval in current dataset
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Why AI Asks For Approval">
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🎯', title: 'Low confidence', body: 'The AI recognised it was not certain enough to act without risking an error. It stops rather than guess wrong.' },
              { icon: '💰', title: 'High-value action', body: 'Transactions or changes above a set threshold are always escalated — an extra safety check for big decisions.' },
              { icon: '📋', title: 'Policy boundary', body: 'The action would exceed a business rule (e.g. order quantity, discount level). AI defers to you to authorise exceptions.' },
              { icon: '🔀', title: 'Ambiguous data', body: 'The input information was unclear or conflicting. The AI flags it rather than pick an answer that might be wrong.' },
            ].map(r => (
              <div key={r.title} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.b}` }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 600, color: C.tx, marginBottom: 3 }}>{r.title}</div>
                  <div style={{ fontFamily: sans, fontSize: 11, color: C.mu, lineHeight: 1.5 }}>{r.body}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 4, padding: '10px 12px', background: 'rgba(0,154,218,.07)', border: '1px solid rgba(0,154,218,.2)', borderRadius: 4, fontFamily: sans, fontSize: 11, color: C.mu, lineHeight: 1.6 }}>
              <span style={{ color: C.tx, fontWeight: 500 }}>Your decision improves the AI.</span> Every approval or rejection is fed back as a training signal — over time, the AI needs to ask less as it learns your preferences.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
