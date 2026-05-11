import { useMemo } from 'react';
import { C, mono, sans } from '../../constants/palette.js';
import { rnd } from '../../utils/dataHelpers.js';
import { Panel } from '../../components/ui.jsx';

const ACCENT = '#009ADA';

function StatCard({ label, value, change, changeDir, note, accent }) {
  const cCol = changeDir === 'up' ? '#22c55e' : changeDir === 'down' ? '#ef4444' : C.mu;
  return (
    <div style={{ background: C.sf, border: `1px solid ${C.b}`, borderRadius: 6, padding: '18px 20px', borderTop: `3px solid ${accent || ACCENT}` }}>
      <div style={{ fontFamily: sans, fontSize: 11, color: C.mu, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: sans, fontSize: 28, fontWeight: 300, color: C.tx, letterSpacing: '-.02em' }}>{value}</div>
      {change && <div style={{ fontFamily: mono, fontSize: 11, color: cCol, marginTop: 6 }}>{change}</div>}
      {note && <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, marginTop: 4 }}>{note}</div>}
    </div>
  );
}

function HorizontalBar({ label, pct, value, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: sans, fontSize: 12, marginBottom: 6 }}>
        <span style={{ color: C.tx, fontWeight: 500 }}>{label}</span>
        <span style={{ fontFamily: mono, fontSize: 11, color: pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444' }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 10, background: C.sf2, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444', borderRadius: 5, transition: 'width .6s ease' }} />
        </div>
        <span style={{ fontFamily: mono, fontSize: 10, color: C.mu, width: 80, flexShrink: 0 }}>{value}</span>
      </div>
    </div>
  );
}

function TrendDot({ positive }) {
  return <span style={{ color: positive ? '#22c55e' : '#ef4444' }}>{positive ? '↑' : '↓'}</span>;
}

function SlaRow({ sla, target, actual, met }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${C.b}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: C.tx }}>{sla}</div>
        <div style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginTop: 2 }}>Target: {target}</div>
      </div>
      <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 500, color: met ? '#22c55e' : '#ef4444' }}>{actual}</div>
      <div style={{ fontFamily: mono, fontSize: 10, padding: '2px 10px', borderRadius: 20, background: met ? 'rgba(34,197,94,.1)' : 'rgba(239,68,68,.1)', color: met ? '#22c55e' : '#ef4444', border: `1px solid ${met ? 'rgba(34,197,94,.25)' : 'rgba(239,68,68,.25)'}` }}>
        {met ? '✓ Met' : '✗ Missed'}
      </div>
    </div>
  );
}

export default function PageBizPerformance({ st }) {
  const { agents, metrics } = st;

  const taskTypes = [
    { label: 'Order Processing',    pct: 99, value: `${agents[1]?.tasks||280} tasks` },
    { label: 'Email Drafting',      pct: 94, value: `${agents[4]?.tasks||210} tasks` },
    { label: 'Support Triage',      pct: 91, value: `${agents[7]?.tasks||190} tasks` },
    { label: 'Report Generation',   pct: 88, value: `${agents[2]?.tasks||140} tasks` },
    { label: 'CRM Sync',            pct: 96, value: `${agents[6]?.tasks||175} tasks` },
    { label: 'Analytics',           pct: 92, value: `${agents[8]?.tasks||155} tasks` },
    { label: 'Data Enrichment',     pct: 67, value: `${agents[3]?.tasks||95} tasks`  },
    { label: 'Invoice Parsing',     pct: 58, value: `${agents[5]?.tasks||60} tasks`  },
  ];

  const weekData = useMemo(() => [88.1, 89.4, 90.8, 91.2, 92.7, 93.5, metrics.success], []);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
  const maxW = Math.max(...weekData);

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <StatCard label="Overall Success Rate"    value={`${metrics.success}%`}     change="↑ 6.1pp vs last week"  changeDir="up"   note="target ≥ 90%"            accent="#22c55e" />
        <StatCard label="Avg Processing Time"     value={`${metrics.latency}s`}      change="↓ 0.8s improvement"   changeDir="up"   note="p99 tail: 11.8s"         accent={ACCENT} />
        <StatCard label="Human Overrides"         value="3.2%"                       change="↓ 1.4pp vs last week"  changeDir="up"   note="target < 5% — on track"  accent="#a78bfa" />
        <StatCard label="Throughput"              value={`${metrics.tasks}/day`}     change="↑ 12% vs yesterday"   changeDir="up"   note="peak 87 tasks/min"        accent="#06b6d4" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Success rate by function */}
        <Panel title="Success Rate by Business Function" right={<span style={{ fontFamily: mono, fontSize: 10, color: C.mu, marginLeft: 'auto' }}>today · all agents</span>}>
          <div style={{ padding: '14px 16px' }}>
            {taskTypes.map(t => <HorizontalBar key={t.label} {...t} />)}
            <div style={{ fontFamily: mono, fontSize: 10, color: C.dm, marginTop: 4, paddingTop: 10, borderTop: `1px solid ${C.b}` }}>
              Below 75%: candidates for prompt improvement or additional training data
            </div>
          </div>
        </Panel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 7-day success trend */}
          <Panel title="7-Day Success Rate Trend">
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: 10 }}>
                {weekData.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontFamily: mono, fontSize: 9, color: i === 6 ? ACCENT : C.dm }}>{v}%</div>
                    <div style={{ width: '100%', height: `${Math.round((v - 85) / (maxW - 85) * 100)}%`, minHeight: 4, background: i === 6 ? ACCENT : C.dm, borderRadius: '2px 2px 0 0', opacity: .6 + i * .06, transition: 'height .4s ease' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono, fontSize: 10, color: C.mu }}>
                {days.map(d => <span key={d} style={{ color: d === 'Today' ? ACCENT : C.mu }}>{d}</span>)}
              </div>
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(34,197,94,.07)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 4, fontFamily: sans, fontSize: 12, color: '#22c55e' }}>
                ↑ Consistent improvement this week — agents learning from corrections
              </div>
            </div>
          </Panel>

          {/* SLA dashboard */}
          <Panel title="SLA Performance">
            <div style={{ padding: '0 16px 8px' }}>
              <SlaRow sla="Order processing SLA"         target="< 30 min"  actual="18 min"   met={true} />
              <SlaRow sla="Support response time"        target="< 10 min"  actual="6.2 min"  met={true} />
              <SlaRow sla="Invoice processing SLA"       target="< 4 hr"    actual="6.1 hr"   met={false} />
              <SlaRow sla="Report delivery"              target="By 09:00"  actual="08:47"    met={true} />
              <SlaRow sla="Data enrichment turnaround"   target="< 2 hr"    actual="1.4 hr"   met={true} />
              <SlaRow sla="CRM sync latency"             target="< 5 min"   actual="2.8 min"  met={true} />
              <div style={{ marginTop: 10, fontFamily: mono, fontSize: 10, color: C.mu }}>
                5 / 6 SLAs met today · Invoice parsing flagged for improvement
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
