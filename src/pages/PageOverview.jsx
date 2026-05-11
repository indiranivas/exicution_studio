import { C } from '../constants/palette.js';
import { MetricTile } from '../components/ui.jsx';
import { AgentTable, EventTimeline, ThroughputChart, FailureDist, ConfGauges, HeatmapPanel, LogStream, LearningPanel } from '../components/panels.jsx';

export default function PageOverview({ st }) {
  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
        <MetricTile label="Tasks / 24h"     value={st.metrics.tasks.toLocaleString()} delta="↑ 12% vs yesterday"   dir="up"   accent="green" />
        <MetricTile label="Success rate"    value={`${st.metrics.success}%`}           delta="↑ 1.8pp this window"  dir="up"   accent="green" />
        <MetricTile label="Avg latency"     value={`${st.metrics.latency}s`}           delta="p99 → 11.8s"          dir="flat" accent="blue" />
        <MetricTile label="Human handoffs"  value={st.metrics.handoffs}                delta="↑ 8 from last window" dir="down" accent="amber" />
        <MetricTile label="Token cost"      value={`$${st.metrics.cost}`}              delta="$0.014 / task avg"     dir="flat" accent="purple" />
        <MetricTile label="Tool calls"      value={st.metrics.toolCalls.toLocaleString()} delta="7.6 avg per task"  dir="up"   accent="cyan" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <AgentTable agents={st.agents.slice(0,5)} />
        <EventTimeline events={st.events} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
        <ThroughputChart data={st.throughput} />
        <FailureDist data={st.failDist} />
        <ConfGauges data={st.confByType} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <HeatmapPanel />
          <LogStream logs={st.logs} />
        </div>
        <LearningPanel />
      </div>
    </div>
  );
}
