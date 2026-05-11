import { useState } from 'react';
import { C, mono, sans } from '../../constants/palette.js';
import { rnd } from '../../utils/dataHelpers.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

const APPROVALS = [
  { id:1,  type:'Order Amendment',     agent:'Order Processing AI',     summary:'Customer CX-9841 requests order #ORD-44821 increase from 50 to 200 units — exceeds auto-approve limit of 100',  urgency:'high',   time:'2m ago',   value:'$3,400' },
  { id:2,  type:'Invoice Discrepancy', agent:'Invoice Parsing AI',      summary:'Invoice INV-2291 amount $12,840 does not match PO-8872 ($11,200). Difference $1,640 requires finance sign-off',  urgency:'high',   time:'8m ago',   value:'$1,640' },
  { id:3,  type:'Email Communication', agent:'Email Drafting AI',       summary:'Proposed response to customer complaint includes a discount offer of 15% — agent confidence 0.62, below threshold', urgency:'medium', time:'22m ago',  value: null },
  { id:4,  type:'Data Enrichment',     agent:'Data Enrichment AI',      summary:'7 account records have conflicting firmographic data. AI matched 3 candidates per record — needs human selection',  urgency:'medium', time:'41m ago',  value: null },
  { id:5,  type:'Report Distribution', agent:'Report Generation AI',    summary:'Weekly KPI report flagged 2 anomalous metrics — AI paused distribution pending review of anomaly explanation',  urgency:'low',    time:'1h ago',   value: null },
  { id:6,  type:'CRM Record Merge',    agent:'CRM Sync AI',             summary:'Detected potential duplicate accounts: Acme Corp (ID 4421) and Acme Corporation (ID 7892). Merge requires approval', urgency:'low',    time:'2h ago',   value: null },
];

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
        <div style={{ marginTop: 10, fontFamily: mono, fontSize: 11, color: C.dm }}>✓ Decision recorded · AI will continue processing</div>
      )}
    </div>
  );
}

export default function PageBizApprovals({ st }) {
  const { handoffs } = st;
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const pending = APPROVALS.filter(a => !approved.includes(a.id) && !rejected.includes(a.id));
  const resolved = APPROVALS.filter(a => approved.includes(a.id) || rejected.includes(a.id));
  const slaBreached = handoffs.filter(h => h.resTime > 900 && h.status !== 'resolved').length;

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Pending Your Decision',  val: pending.length,    col: pending.length > 3 ? '#ef4444' : '#f59e0b', sub: 'need human input' },
          { label: 'Resolved This Session',  val: resolved.length,   col: '#22c55e',  sub: 'approved or rejected' },
          { label: 'SLA Risk',               val: slaBreached,       col: slaBreached > 0 ? '#ef4444' : '#22c55e', sub: slaBreached > 0 ? 'items past 15 min' : 'all within SLA' },
          { label: 'AI Auto-Resolved Today', val: rnd(140,180),      col: ACCENT,     sub: 'no human input needed' },
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

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16, alignItems: 'start' }}>
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
              { label: 'Avg decision time',     val: '4.2 min',  col: '#22c55e' },
              { label: 'Approval rate',          val: '76%',      col: ACCENT },
              { label: 'Rejection rate',         val: '12%',      col: '#ef4444' },
              { label: 'Delegated',              val: '12%',      col: '#a78bfa' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.b}` }}>
                <span style={{ fontFamily: sans, fontSize: 12, color: C.mu }}>{r.label}</span>
                <span style={{ fontFamily: mono, fontSize: 13, color: r.col, fontWeight: 500 }}>{r.val}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: '10px 12px', background: C.sf2, borderRadius: 4, fontFamily: sans, fontSize: 11, color: C.mu, lineHeight: 1.7 }}>
              Most common reason for human review:<br />
              <span style={{ color: C.tx, fontWeight: 500 }}>Low confidence (58%)</span><br />
              Policy threshold exceeded (24%)<br />
              Ambiguous input data (18%)
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
