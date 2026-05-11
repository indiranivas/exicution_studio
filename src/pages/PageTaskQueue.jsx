import { useMemo } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { AGENT_DEFS } from '../constants/agentDefs.js';
import { rnd, pick } from '../utils/dataHelpers.js';
import { MetricTile, Panel, Pill, Th, Td } from '../components/ui.jsx';

export default function PageTaskQueue() {
  const tasks = useMemo(() => Array.from({ length:22 }, (_, i) => ({
    id: `TASK-${(4000+i).toString(16).toUpperCase()}`,
    agent: pick(AGENT_DEFS).name,
    type: pick(['order_processing','report_gen','email_draft','data_enrich','invoice_parse']).replace(/_/g,' '),
    priority: pick(['high','normal','low']),
    status: pick(['queued','running','waiting']),
    eta: `${rnd(5,180)}s`,
    created: `${rnd(1,45)}m ago`,
    steps: `${rnd(0,5)}/7`,
  })), []);
  const pc = { high:C.re, normal:C.am, low:C.mu };
  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        <MetricTile label="Queued"    value={tasks.filter(t=>t.status==='queued').length}  delta="waiting for slot"  dir="flat" accent="amber" />
        <MetricTile label="Running"   value={tasks.filter(t=>t.status==='running').length} delta="currently active"  dir="up"   accent="green" />
        <MetricTile label="Waiting"   value={tasks.filter(t=>t.status==='waiting').length} delta="blocked on I/O"    dir="flat" accent="blue" />
        <MetricTile label="Avg wait"  value={`${rnd(8,30)}s`}                              delta="before execution"  dir="flat" accent="cyan" />
      </div>
      <Panel title="Task queue" right={<span style={{ fontFamily:mono, fontSize:10, padding:'1px 8px', borderRadius:2, background:C.amBg, color:C.am, marginLeft:'auto' }}>Live</span>}>
        <div style={{ padding:'0 16px' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Task ID','Agent','Type','Priority','Status','Steps','ETA','Queued'].map(h=><Th key={h}>{h}</Th>)}</tr></thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <Td style={{ fontFamily:mono, fontSize:11, color:C.bl }}>{t.id}</Td>
                  <Td style={{ fontSize:12, fontFamily:sans }}>{t.agent}</Td>
                  <Td style={{ fontFamily:mono, fontSize:10, color:C.mu }}>{t.type}</Td>
                  <Td style={{ fontFamily:mono, fontSize:10, color:pc[t.priority] }}>{t.priority}</Td>
                  <Td><Pill status={t.status} /></Td>
                  <Td style={{ fontFamily:mono, fontSize:11 }}>{t.steps}</Td>
                  <Td style={{ fontFamily:mono, fontSize:11, color:C.mu }}>{t.eta}</Td>
                  <Td style={{ fontFamily:mono, fontSize:10, color:C.dm }}>{t.created}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
