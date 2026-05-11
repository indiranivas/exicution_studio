import { C, mono, sans } from '../../constants/palette.js';
import { rnd } from '../../utils/dataHelpers.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

function RoiCard({ label, value, sub, accent, big }) {
  return (
    <div style={{ background: C.sf, border: `1px solid ${C.b}`, borderRadius: 6, padding: big ? '24px 26px' : '18px 20px', borderTop: `3px solid ${accent}`, gridColumn: big ? 'span 2' : 'span 1' }}>
      <div style={{ fontFamily: sans, fontSize: 11, color: C.mu, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: sans, fontSize: big ? 40 : 28, fontWeight: 300, color: accent, letterSpacing: '-.02em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: sans, fontSize: 12, color: C.mu, marginTop: 8 }}>{sub}</div>}
    </div>
  );
}

function CostRow({ dept, tasks, cost, pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.b}` }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: C.tx }}>{dept}</div>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginTop: 2 }}>{tasks.toLocaleString()} tasks automated today</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: mono, fontSize: 12, color: C.tx }}>${cost.toFixed(2)}</div>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.dm }}>{pct}% of budget</div>
      </div>
      <div style={{ width: 80 }}>
        <div style={{ height: 6, background: C.sf2, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
        </div>
      </div>
    </div>
  );
}

function BudgetGauge({ used, total }) {
  const pct = Math.min(100, (used / total) * 100);
  const col = pct < 70 ? '#22c55e' : pct < 90 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - pct / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0 20px' }}>
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle cx={65} cy={65} r={54} fill="none" stroke={C.sf2} strokeWidth={10} />
        <circle cx={65} cy={65} r={54} fill="none" stroke={col} strokeWidth={10}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset .8s ease' }}
        />
        <text x={65} y={58} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={20} fontWeight={300} fill={col}>${used.toFixed(0)}</text>
        <text x={65} y={76} textAnchor="middle" fontFamily="IBM Plex Sans" fontSize={11} fill={C.mu}>of ${total} budget</text>
        <text x={65} y={93} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize={13} fill={col}>{pct.toFixed(0)}% used</text>
      </svg>
      <div style={{ fontFamily: mono, fontSize: 11, color: C.mu, textAlign: 'center', marginTop: 4 }}>${(total - used).toFixed(2)} remaining today</div>
    </div>
  );
}

export default function PageBizCost({ st }) {
  const { agents, metrics } = st;
  const hourlyRate = 18;
  const hoursSaved = Math.round(metrics.tasks * 0.27);
  const labourValue = hoursSaved * hourlyRate;
  const aiCost = metrics.cost;
  const netSaving = labourValue - aiCost;
  const roi = ((netSaving / aiCost) * 100).toFixed(0);
  const budget = 25;

  const depts = [
    { dept: 'Order Management',     tasks: agents[1]?.tasks||280, cost: 3.92, pct: 16, color: ACCENT },
    { dept: 'Customer Support',     tasks: agents[7]?.tasks||190, cost: 2.66, pct: 11, color: '#22c55e' },
    { dept: 'Finance & Invoicing',  tasks: (agents[5]?.tasks||60)+(agents[2]?.tasks||140), cost: 2.80, pct: 11, color: '#a78bfa' },
    { dept: 'CRM & Data',           tasks: (agents[6]?.tasks||175)+(agents[3]?.tasks||95), cost: 3.78, pct: 15, color: '#f59e0b' },
    { dept: 'Analytics & Reports',  tasks: agents[8]?.tasks||155, cost: 2.17, pct: 9,  color: '#06b6d4' },
    { dept: 'Orchestration',        tasks: agents[0]?.tasks||920, cost: 3.07, pct: 12, color: '#ef4444' },
  ];

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ROI hero row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <RoiCard label="Labour Cost Offset (Today)"     value={`$${labourValue.toLocaleString()}`} sub={`${hoursSaved}h saved × $${hourlyRate}/hr baseline`}     accent="#22c55e" />
        <RoiCard label="AI Automation Cost (Today)"     value={`$${aiCost}`}                        sub={`$0.014 per task · ${metrics.tasks.toLocaleString()} tasks`} accent={ACCENT} />
        <RoiCard label="Net Saving (Today)"             value={`$${netSaving.toLocaleString()}`}     sub="value delivered above automation cost"                       accent="#22c55e" />
        <RoiCard label="Return on AI Spend"             value={`${roi}%`}                            sub="net saving ÷ AI cost · today"                               accent="#a78bfa" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Cost by department + gauge */}
        <Panel title="AI Cost by Business Function" right={<span style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginLeft: 'auto' }}>today · $25 daily budget</span>}>
          <div style={{ padding: '0 16px' }}>
            <BudgetGauge used={aiCost} total={budget} />
            <div style={{ borderTop: `1px solid ${C.b}`, paddingTop: 8 }}>
              {depts.map(d => <CostRow key={d.dept} {...d} />)}
            </div>
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Monthly projection */}
          <Panel title="Monthly Cost & Value Projection">
            <div style={{ padding: '14px 16px' }}>
              {[
                { label: 'Projected AI cost (month)',       val: `$${(aiCost * 22).toFixed(0)}`,             col: ACCENT },
                { label: 'Projected labour offset (month)', val: `$${(labourValue * 22).toLocaleString()}`,   col: '#22c55e' },
                { label: 'Projected net saving (month)',    val: `$${(netSaving * 22).toLocaleString()}`,     col: '#22c55e' },
                { label: 'Projected annual ROI',            val: `$${(netSaving * 260).toLocaleString()}`,    col: '#a78bfa' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '11px 0', borderBottom: `1px solid ${C.b}` }}>
                  <span style={{ fontFamily: sans, fontSize: 12, color: C.mu }}>{r.label}</span>
                  <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 300, color: r.col }}>{r.val}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(34,197,94,.07)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 4, fontFamily: sans, fontSize: 12, color: C.mu, lineHeight: 1.6 }}>
                Projections assume 22 working days/month and current task volume.
                Based on <span style={{ color: C.tx }}>$18/hr baseline</span> labour cost.
              </div>
            </div>
          </Panel>

          {/* Cost per task type */}
          <Panel title="Cost Efficiency by Function">
            <div style={{ padding: '14px 16px' }}>
              {[
                { fn: 'Order Processing',   cpp: '$0.014', benchmark: '$0.80',  saving: '98%' },
                { fn: 'Report Generation',  cpp: '$0.020', benchmark: '$1.20',  saving: '98%' },
                { fn: 'Email Drafting',     cpp: '$0.013', benchmark: '$0.60',  saving: '98%' },
                { fn: 'Invoice Parsing',    cpp: '$0.047', benchmark: '$1.50',  saving: '97%' },
                { fn: 'CRM Sync',           cpp: '$0.022', benchmark: '$0.45',  saving: '95%' },
                { fn: 'Support Triage',     cpp: '$0.014', benchmark: '$0.90',  saving: '98%' },
              ].map(r => (
                <div key={r.fn} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.b}` }}>
                  <span style={{ fontFamily: sans, fontSize: 12, color: C.tx, flex: 1 }}>{r.fn}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, color: ACCENT, width: 50, textAlign: 'right' }}>{r.cpp}</span>
                  <span style={{ fontFamily: mono, fontSize: 10, color: C.dm, width: 45, textAlign: 'right' }}>{r.benchmark}</span>
                  <span style={{ fontFamily: mono, fontSize: 10, color: '#22c55e', width: 35, textAlign: 'right' }}>{r.saving}</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 20, marginTop: 10, fontFamily: mono, fontSize: 9, color: C.dm }}>
                <span>AI cost/task</span><span>Manual baseline</span><span>Saving</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
