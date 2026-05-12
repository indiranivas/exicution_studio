import { C } from '../constants/palette.js';
import { MetricTile } from '../components/ui.jsx';
import { AgentTable, EventTimeline, ThroughputChart, FailureDist, ConfGauges, HeatmapPanel, LogStream, LearningPanel } from '../components/panels.jsx';

export default function PageOverview({ st }) {
  const m = st.metrics || {};
  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:10 }}>
        <MetricTile label="Sessions"        value={m.sessionCount ?? st.sessions?.length ?? 0}     delta={`${m.deflectedCount ?? 0} deflected`}         dir="up"   accent="green" />
        <MetricTile label="Success rate"    value={`${m.success}%`}                                delta={`${m.guardrailPassRate}% guardrail pass`}      dir="up"   accent="green" />
        <MetricTile label="Avg latency"     value={`${m.latency}s`}                                delta="LLM call average"                              dir="flat" accent="blue" />
        <MetricTile label="Escalations"     value={m.escalatedCount ?? m.handoffs ?? 0}             delta={`${m.handoffs} total handoffs`}                dir="down" accent="amber" />
        <MetricTile label="Token cost"      value={`$${m.cost}`}                                   delta={`${(m.totalTokens||0).toLocaleString()} tokens`} dir="flat" accent="purple" />
        <MetricTile label="Tool calls"      value={m.toolCalls}                                    delta={`${st.toolCalls?.length ?? 0} recorded spans`}  dir="up"   accent="cyan" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <AgentTable agents={st.agents?.slice(0,5)} />
        <EventTimeline events={st.events} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
        <ThroughputChart data={st.throughput} />
        <FailureDist data={st.failDist} />
        <ConfGauges data={st.confByType} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <HeatmapPanel data={st.heatmapData} />
          <LogStream logs={st.logs} />
        </div>
        <LearningPanel st={st} />
      </div>
    </div>
  );
}
