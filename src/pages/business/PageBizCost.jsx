import { C, mono, sans } from '../../constants/palette.js';
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
  const hourlyRate = 35; // industry baseline for knowledge-worker tasks
  const hoursSaved = Math.round(metrics.tasks * 0.27);
  const labourValue = hoursSaved * hourlyRate;
  const aiCost = metrics.cost;
  const netSaving = labourValue - aiCost;
  const roiMultiple = aiCost > 0 ? (labourValue / aiCost).toFixed(0) : 'N/A';
  const roi = aiCost > 0 ? ((netSaving / aiCost) * 100).toFixed(0) : '0';
  const budget = +(aiCost * 3).toFixed(2); // budget = 3× actual spend as a planning ceiling

  /* Real cost breakdown from actual agents */
  const DEPT_COLORS = [ACCENT, '#22c55e', '#a78bfa', '#f59e0b', '#06b6d4', '#ef4444'];
  const depts = agents.map((a, i) => ({
    dept: a.displayName,
    tasks: a.tasks,
    cost: a.tokenCost,
    pct: Math.round((a.tokenCost / Math.max(0.0001, aiCost)) * 100),
    color: DEPT_COLORS[i % DEPT_COLORS.length],
  }));

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Plain English ROI banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,.08) 0%, rgba(167,139,250,.06) 100%)', border: '1px solid rgba(34,197,94,.25)', borderRadius: 8, padding: '20px 24px' }}>
        <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#22c55e', marginBottom: 10 }}>Cost & ROI · In Plain English</div>
          <div className="roi-banner-inner" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
          <div style={{ fontFamily: sans, fontSize: 14, color: C.tx, lineHeight: 1.8, fontWeight: 300 }}>
            Today you spent <span style={{ color: ACCENT, fontWeight: 500 }}>${aiCost}</span> running the AI platform.
            {' '}In return, it saved your team <span style={{ color: '#22c55e', fontWeight: 500 }}>{hoursSaved} hours</span> of manual work,
            which at a <span style={{ color: C.tx, fontWeight: 500 }}>${hourlyRate}/hr knowledge-worker baseline</span> equals <span style={{ color: '#22c55e', fontWeight: 500 }}>${labourValue.toLocaleString()} in labour value</span>.
            {' '}That's a <span style={{ color: '#a78bfa', fontWeight: 600, fontSize: 16 }}>{roi}× return</span> on every dollar invested in AI today.
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0, padding: '0 20px' }}>
            <div style={{ fontFamily: sans, fontSize: 11, color: C.mu, marginBottom: 4 }}>For every $1 spent</div>
            <div style={{ fontFamily: sans, fontSize: 48, fontWeight: 200, color: '#22c55e', lineHeight: 1 }}>${roiMultiple}</div>
            <div style={{ fontFamily: sans, fontSize: 11, color: C.mu, marginTop: 4 }}>returned in value</div>
          </div>
        </div>
      </div>

      {/* ROI hero row */}
      <div className="grid-4">
        <RoiCard label="Labour Cost Offset"             value={`$${labourValue.toLocaleString()}`} sub={`${hoursSaved}h saved × $${hourlyRate}/hr knowledge-worker baseline`} accent="#22c55e" />
        <RoiCard label="AI Automation Cost"             value={`$${aiCost}`}                        sub={`avg $${metrics.tasks > 0 ? (aiCost / metrics.tasks).toFixed(5) : '0'} per task · ${metrics.tasks} tasks`} accent={ACCENT} />
        <RoiCard label="Net Saving"                     value={`$${netSaving.toFixed(2)}`}           sub="value delivered above automation cost"                       accent="#22c55e" />
        <RoiCard label="Return on AI Spend"             value={`${roiMultiple}×`}                    sub="labour value returned per $1 of AI cost"                    accent="#a78bfa" />
      </div>

      <div className="grid-2">

        {/* Cost by department + gauge */}
        <Panel title="AI Cost by Business Function" right={<span style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginLeft: 'auto' }}>actual token cost · planning ceiling ${budget}</span>}>
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
                { label: 'Projected annual net saving',     val: `$${(netSaving * 260).toLocaleString()}`,    col: '#a78bfa' },
                { label: 'Estimated payback period',        val: `< 1 day`,                                   col: '#22c55e' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '11px 0', borderBottom: `1px solid ${C.b}` }}>
                  <span style={{ fontFamily: sans, fontSize: 12, color: C.mu }}>{r.label}</span>
                  <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 300, color: r.col }}>{r.val}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(34,197,94,.07)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 4, fontFamily: sans, fontSize: 12, color: C.mu, lineHeight: 1.6 }}>
                Projections assume 22 working days/month and current task volume.
                Based on <span style={{ color: C.tx }}>${hourlyRate}/hr knowledge-worker baseline</span>.
              </div>
              <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(0,154,218,.07)', border: '1px solid rgba(0,154,218,.2)', borderRadius: 4, fontFamily: sans, fontSize: 12, color: C.mu, lineHeight: 1.7 }}>
                <span style={{ color: C.tx, fontWeight: 500 }}>What these numbers mean:</span><br />
                The AI platform costs less than one hour of an employee's time per day, yet saves the equivalent of {Math.round(hoursSaved / 8)} full-time employees' daily workload. As task volume grows, the cost per task falls further while value delivered scales proportionally.
              </div>
            </div>
          </Panel>

          {/* Cost efficiency by real agent */}
          <Panel title="Cost Efficiency by Agent">
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', gap: 20, marginBottom: 8, fontFamily: mono, fontSize: 9, color: C.dm }}>
                <span style={{ flex: 1 }}>Agent</span><span style={{ width: 70 }}>Cost</span><span style={{ width: 70 }}>Tasks</span><span style={{ width: 60 }}>Tokens</span>
              </div>
              {agents.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.b}` }}>
                  <span style={{ fontFamily: sans, fontSize: 12, color: C.tx, flex: 1 }}>{a.displayName}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, color: ACCENT, width: 70 }}>${a.tokenCost}</span>
                  <span style={{ fontFamily: mono, fontSize: 11, color: C.mu, width: 70 }}>{a.tasks} tasks</span>
                  <span style={{ fontFamily: mono, fontSize: 10, color: C.dm, width: 60 }}>{(a.totalTokens || 0).toLocaleString()}t</span>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 20, marginTop: 10, fontFamily: mono, fontSize: 9, color: C.dm }}>
                <span>Cost from real token usage at ~$3/1M tokens</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
