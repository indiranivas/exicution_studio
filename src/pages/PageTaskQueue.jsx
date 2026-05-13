import { C, mono, sans } from '../constants/palette.js';
import { MetricTile, Panel, Pill } from '../components/ui.jsx';

const PRIORITY_COLOR = { high: C.re, medium: C.am, low: C.mu };

export default function PageTaskQueue({ st = {} }) {
  const { taskQueueItems = null, enrichLoading, enrichProgress, sessions = [] } = st;

  if (enrichLoading) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ padding:'40px', textAlign:'center', fontFamily:mono, fontSize:12, color:C.mu }}>
          <div style={{ fontSize:24, marginBottom:12 }}>⟳</div>
          {enrichProgress || 'AI is inferring task queue from session data…'}
        </div>
      </div>
    );
  }

  if (!taskQueueItems || taskQueueItems.length === 0) {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ padding:'32px', textAlign:'center', fontFamily:mono, fontSize:12, color:C.mu, background:C.sf, borderRadius:8, border:`1px solid ${C.b2}` }}>
          <div style={{ fontSize:20, marginBottom:8 }}>◎</div>
          No pending tasks — all sessions in the current dataset are completed.<br />
          <span style={{ color:C.dm }}>Upload a dataset with in-progress sessions to populate this queue.</span>
        </div>
        <Panel title="Session Outcomes" subtitle={`${sessions.length} sessions in dataset`}>
          <div style={{ padding:'0 16px' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>{['Session','Agent','Status','Msgs','Duration'].map(h => (
                <th key={h} style={{ fontFamily:mono, fontSize:10, color:C.dm, textAlign:'left', padding:'6px 10px', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:`1px solid ${C.b2}` }}>{h}</th>
              ))}</tr></thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} style={{ borderBottom:`1px solid ${C.b2}` }}>
                    <td style={{ fontFamily:mono, fontSize:11, padding:'8px 10px', color:'#009ADA' }}>{s.id}</td>
                    <td style={{ fontFamily:sans, fontSize:12, padding:'8px 10px', color:C.mu }}>{s.agentDevName?.replace(/([A-Z])/g, ' $1').trim() || '—'}</td>
                    <td style={{ padding:'8px 10px' }}><Pill status={s.deflection === 'Resolved' ? 'complete' : s.escalation === 'Escalated' ? 'failed' : 'running'} /></td>
                    <td style={{ fontFamily:mono, fontSize:11, padding:'8px 10px', color:C.mu }}>{s.messageCount}</td>
                    <td style={{ fontFamily:mono, fontSize:11, padding:'8px 10px', color:C.dm }}>{s.durationMs ? `${Math.round(s.durationMs/1000)}s` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
        <MetricTile label="Inferred Tasks"  value={taskQueueItems.length}  delta="AI-inferred from sessions" dir="flat" accent="blue" />
        <MetricTile label="High Priority"   value={taskQueueItems.filter(t=>t.priority==='high').length}   delta="requires immediate action" dir="down" accent="red" />
        <MetricTile label="Medium"          value={taskQueueItems.filter(t=>t.priority==='medium').length} delta="standard follow-up"        dir="flat" accent="amber" />
        <MetricTile label="Low"             value={taskQueueItems.filter(t=>t.priority==='low').length}    delta="when convenient"           dir="up"   accent="green" />
      </div>
      <div style={{ background:'rgba(0,154,218,.06)', border:'1px solid rgba(0,154,218,.2)', borderRadius:6, padding:'10px 16px', fontFamily:mono, fontSize:11, color:'#009ADA' }}>
        ⊛ These tasks were inferred by LLM from session outcomes — not raw records. Upload new data to refresh.
      </div>
      <Panel title="AI-Inferred Task Queue" subtitle="Follow-up tasks based on session outcomes">
        <div style={{ padding:'0 16px' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr>{['Title','Description','Priority','Assigned To','Session'].map(h => (
              <th key={h} style={{ fontFamily:mono, fontSize:10, color:C.dm, textAlign:'left', padding:'6px 10px', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:`1px solid ${C.b2}` }}>{h}</th>
            ))}</tr></thead>
            <tbody>
              {taskQueueItems.map((t, i) => (
                <tr key={t.id || i} style={{ borderBottom:`1px solid ${C.b2}` }}>
                  <td style={{ fontFamily:sans, fontSize:12, padding:'10px 10px', color:C.tx, fontWeight:500 }}>{t.title}</td>
                  <td style={{ fontFamily:sans, fontSize:11, padding:'10px 10px', color:C.mu, maxWidth:280 }}>{t.description}</td>
                  <td style={{ padding:'10px 10px' }}>
                    <span style={{ fontFamily:mono, fontSize:10, padding:'2px 7px', borderRadius:3, background:(PRIORITY_COLOR[t.priority]||C.mu)+'22', color:PRIORITY_COLOR[t.priority]||C.mu }}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ fontFamily:mono, fontSize:11, padding:'10px 10px', color:'#009ADA' }}>{t.assignedTo}</td>
                  <td style={{ fontFamily:mono, fontSize:10, padding:'10px 10px', color:C.dm }}>{t.relatedSessionId || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
