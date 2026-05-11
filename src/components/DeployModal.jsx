import { useState } from 'react';
import { C, mono, sans } from '../constants/palette.js';
import { MELT_FIELDS, MELT_LAYERS_DEF, TELEMETRY_SINKS } from '../constants/meltSchema.js';
import { PERSONAS, LLM_MODELS, DEPLOY_TOOLS, WORKLOAD_PROFILES, DEFAULT_CFG } from '../constants/deployConfig.js';

function DField({ label, value, onChange, placeholder, half }) {
  return (
    <div style={{ marginBottom:12, flex:half?'0 0 calc(50% - 6px)':'1 1 100%' }}>
      <div style={{ fontFamily:mono, fontSize:10, color:C.mu, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
      <input value={value} onChange={onChange} placeholder={placeholder} style={{ width:'100%', background:C.sf2, border:`1px solid ${C.b2}`, borderRadius:3, padding:'7px 10px', fontFamily:mono, fontSize:12, color:C.tx, outline:'none' }} />
    </div>
  );
}

function DSelect({ label, value, onChange, options, half }) {
  return (
    <div style={{ marginBottom:12, flex:half?'0 0 calc(50% - 6px)':'1 1 100%' }}>
      <div style={{ fontFamily:mono, fontSize:10, color:C.mu, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4 }}>{label}</div>
      <select value={value} onChange={onChange} style={{ width:'100%', background:C.sf2, border:`1px solid ${C.b2}`, borderRadius:3, padding:'7px 10px', fontFamily:mono, fontSize:12, color:C.tx, outline:'none', cursor:'pointer' }}>
        {options.map(o => <option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
      </select>
    </div>
  );
}

function DSlider({ label, min, max, step, value, onChange, fmt }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontFamily:mono, fontSize:10, marginBottom:4 }}>
        <span style={{ color:C.mu, textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
        <span style={{ color:C.am }}>{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} style={{ width:'100%', accentColor:C.am }} />
    </div>
  );
}

function DToggle({ label, sub, value, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, padding:'8px 10px', background:C.sf2, borderRadius:3 }}>
      <div>
        <div style={{ fontSize:12, fontFamily:sans, color:C.tx }}>{label}</div>
        {sub && <div style={{ fontFamily:mono, fontSize:10, color:C.mu, marginTop:2 }}>{sub}</div>}
      </div>
      <div onClick={() => onChange(!value)} style={{ width:36, height:20, borderRadius:10, background:value?C.gr:'transparent', border:`1px solid ${value?C.gr:C.b2}`, position:'relative', cursor:'pointer', transition:'all .2s', flexShrink:0 }}>
        <div style={{ position:'absolute', top:2, left:value?17:2, width:14, height:14, borderRadius:'50%', background:C.tx, transition:'left .2s' }} />
      </div>
    </div>
  );
}

/* ── Step sub-components ── */
function StepConfigure({ cfg, upd, applyProfile }) {
  return (
    <div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:12 }}>
        <DField label="Agent Name *" half value={cfg.name} onChange={e=>upd('name',e.target.value)} placeholder="e.g., support-agent-alpha" />
        <DSelect label="Persona Type" half value={cfg.persona} onChange={e=>upd('persona',e.target.value)} options={PERSONAS} />
        <DField label="Description" value={cfg.description} onChange={e=>upd('description',e.target.value)} placeholder="Brief description of this agent's role and scope" />
        <DSelect label="Model" half value={cfg.model} onChange={e=>upd('model',e.target.value)} options={LLM_MODELS} />
        <DSelect label="Workload Profile" half value={cfg.workload} onChange={e=>applyProfile(e.target.value)} options={WORKLOAD_PROFILES.map(p=>({v:p.name,l:p.name}))} />
      </div>
      <div style={{ background:C.sf2, borderRadius:3, padding:'12px 14px', display:'flex', gap:28, fontFamily:mono, marginTop:4 }}>
        <div style={{ fontSize:10, color:C.dm }}>LLM Parameters from selected profile:</div>
        {[{l:'temperature',v:cfg.temperature},{l:'top_p',v:cfg.top_p},{l:'top_k',v:cfg.top_k}].map(x => (
          <div key={x.l} style={{ display:'flex', gap:6, alignItems:'baseline' }}>
            <span style={{ fontSize:10, color:C.dm }}>{x.l}</span>
            <span style={{ fontSize:13, color:C.am, fontWeight:500 }}>{x.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepGuardrails({ cfg, upd, toggleTool }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      <div>
        <div style={{ fontFamily:mono, fontSize:10, color:C.mu, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:12 }}>Guardrails</div>
        <DSlider label="Confidence Threshold" min={0.10} max={0.99} step={0.01} value={cfg.conf_min} onChange={e=>upd('conf_min',parseFloat(e.target.value))} fmt={v=>v.toFixed(2)+' (HITL below this)'} />
        <DSlider label="Max ReAct Iterations" min={1} max={20} step={1} value={cfg.max_iterations} onChange={e=>upd('max_iterations',parseInt(e.target.value))} fmt={v=>`${v} iterations`} />
        <DSlider label="Cost Cap (USD)" min={0.01} max={1.0} step={0.01} value={cfg.cost_cap} onChange={e=>upd('cost_cap',parseFloat(e.target.value))} fmt={v=>`$${v.toFixed(2)} hard cap`} />
        <DToggle label="PII Redaction" sub="STRICT — scrub names, emails, IDs before LLM calls" value={cfg.pii} onChange={v=>upd('pii',v)} />
        <DToggle label="Auto-Escalate on Low Confidence" sub={`Trigger HITL handoff when conf < ${cfg.conf_min}`} value={true} onChange={()=>{}} />
      </div>
      <div>
        <div style={{ fontFamily:mono, fontSize:10, color:C.mu, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Tool Registry</div>
        {DEPLOY_TOOLS.map(t => (
          <label key={t} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 10px', borderRadius:3, marginBottom:4, background:cfg.tools.includes(t)?'rgba(59,130,246,.06)':C.sf2, border:`1px solid ${cfg.tools.includes(t)?C.blBd:C.b}`, cursor:'pointer', transition:'all .15s' }}>
            <input type="checkbox" checked={cfg.tools.includes(t)} onChange={()=>toggleTool(t)} style={{ accentColor:C.bl, cursor:'pointer', flexShrink:0 }} />
            <span style={{ fontFamily:mono, fontSize:11, color:cfg.tools.includes(t)?C.tx:C.mu }}>{t}</span>
          </label>
        ))}
        <div style={{ fontFamily:mono, fontSize:10, color:C.dm, marginTop:8 }}>{cfg.tools.length} tools selected · max 20 calls/run</div>
      </div>
    </div>
  );
}

function StepMelt({ cfg, toggleLayer, yaml }) {
  const totalFields = cfg.melt_layers.reduce((s,id) => s+(MELT_FIELDS[id]?.fields.length||0), 0);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      <div>
        <div style={{ fontFamily:mono, fontSize:10, color:C.mu, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>MELT Telemetry Layers (40 fields)</div>
        {MELT_LAYERS_DEF.map(l => (
          <div key={l.id} onClick={()=>toggleLayer(l.id)} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 10px', borderRadius:3, marginBottom:5, background:cfg.melt_layers.includes(l.id)?C.sf2:'transparent', border:`1px solid ${cfg.melt_layers.includes(l.id)?l.color+'44':C.b}`, cursor:'pointer', transition:'all .15s' }}>
            <div style={{ width:10, height:10, borderRadius:2, background:cfg.melt_layers.includes(l.id)?l.color:'transparent', border:`1px solid ${l.color}`, flexShrink:0, marginTop:2 }} />
            <div>
              <div style={{ fontFamily:mono, fontSize:11, color:cfg.melt_layers.includes(l.id)?C.tx:C.mu }}>{l.label}</div>
              <div style={{ fontFamily:mono, fontSize:9, color:C.dm, marginTop:1 }}>{l.desc}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop:10, borderTop:`1px solid ${C.b}`, paddingTop:10 }}>
          <div style={{ fontFamily:mono, fontSize:10, color:C.mu, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Telemetry Sinks</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {TELEMETRY_SINKS.map(s => (
              <div key={s.label} style={{ display:'flex', gap:8, fontFamily:mono, fontSize:10 }}>
                <span style={{ color:C.dm, width:50, flexShrink:0 }}>{s.label}:</span>
                <span style={{ color:C.mu }}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div style={{ fontFamily:mono, fontSize:10, color:C.mu, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Agent YAML Preview</div>
        <div style={{ background:C.bg, borderRadius:3, padding:'12px', fontFamily:mono, fontSize:10, color:C.mu, lineHeight:1.8, maxHeight:320, overflowY:'auto', border:`1px solid ${C.b}`, whiteSpace:'pre' }}>{yaml}</div>
      </div>
    </div>
  );
}

export default function DeployModal({ onClose, onDeploy }) {
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState({ ...DEFAULT_CFG });
  const [deploying, setDeploying] = useState(false);

  const upd = (k, v) => setCfg(p => ({ ...p, [k]:v }));
  const applyProfile = name => {
    const p = WORKLOAD_PROFILES.find(x => x.name === name) || WORKLOAD_PROFILES[0];
    setCfg(prev => ({ ...prev, workload:name, temperature:p.temp, top_p:p.top_p, top_k:p.top_k }));
  };
  const toggleTool = t => upd('tools', cfg.tools.includes(t) ? cfg.tools.filter(x=>x!==t) : [...cfg.tools, t]);
  const toggleLayer = id => upd('melt_layers', cfg.melt_layers.includes(id) ? cfg.melt_layers.filter(x=>x!==id) : [...cfg.melt_layers, id]);

  const totalFields = cfg.melt_layers.reduce((s,id) => s+(MELT_FIELDS[id]?.fields.length||0), 0);

  const meltYaml = cfg.melt_layers.map(id => {
    const layer = MELT_FIELDS[id];
    if (!layer) return '';
    const fieldLines = layer.fields.map(({f,p,desc}) =>
      `        - field:       ${f}\n          melt_pillar: ${p}\n          description: "${desc}"`
    ).join('\n');
    return `      ${layer.key}:\n        pillar: "${layer.pillar}"\n        fields:\n${fieldLines}`;
  }).join('\n');

  const yaml = `agent:
  identity:
    name: "${cfg.name || '<AgentName>'}"
    description: "${cfg.description || '<description>'}"
  persona:
    type: ${cfg.persona}
    pivot_values: ["Security","Reliability","Customer Focus"]
  llm:
    model: "${cfg.model}"
    temperature: ${cfg.temperature}
    top_p: ${cfg.top_p}
    top_k: ${cfg.top_k}
    max_tokens: ${cfg.max_tokens}
  guardrails:
    confidence_min: ${cfg.conf_min}
    max_react_iterations: ${cfg.max_iterations}
    max_tokens_per_run: ${cfg.max_tokens_run}
    cost_cap_usd: ${cfg.cost_cap}
    pii_redaction: ${cfg.pii ? 'STRICT' : 'OFF'}
  tools:
${cfg.tools.map(t=>`    - ${t}`).join('\n') || '    []'}
  telemetry:
    model: MELT
    field_count: ${totalFields}
    sinks:
      metrics: prometheus
      events:  kafka:agent.events
      logs:    azure_monitor
      traces:  tempo
    layers:
${meltYaml}`;

  const handleDeploy = () => {
    if (!cfg.name.trim()) { alert('Agent name is required.'); return; }
    setDeploying(true);
    setTimeout(() => { setDeploying(false); onDeploy(cfg); onClose(); }, 1800);
  };

  const STEPS = ['Configure','Guardrails & Tools','MELT Telemetry'];

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,.72)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.sf, border:`1px solid ${C.b2}`, borderRadius:6, width:820, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 28px 80px rgba(0,0,0,.65)' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', borderBottom:`1px solid ${C.b}` }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:500, fontFamily:sans, marginBottom:2 }}>Deploy New Agent</div>
            <div style={{ fontFamily:mono, fontSize:11, color:C.mu }}>{STEPS[step]}</div>
          </div>
          <div style={{ display:'flex', gap:4, alignItems:'center' }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:mono, fontSize:10, background:i<step?C.grBg:i===step?C.blBg:C.sf2, border:`1px solid ${i<step?C.grBd:i===step?C.blBd:C.b}`, color:i<step?C.gr:i===step?C.bl:C.dm, transition:'all .2s' }}>
                  {i < step ? '✓' : (i+1)}
                </div>
                {i < STEPS.length-1 && <div style={{ width:20, height:1, background:i<step?C.gr:C.b }} />}
              </div>
            ))}
          </div>
          <div style={{ width:1, height:24, background:C.b2, margin:'0 8px' }} />
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:C.mu, cursor:'pointer', fontSize:18, lineHeight:1, padding:'2px 4px' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px', overflowY:'auto', flex:1 }}>
          {step === 0 && <StepConfigure cfg={cfg} upd={upd} applyProfile={applyProfile} />}
          {step === 1 && <StepGuardrails cfg={cfg} upd={upd} toggleTool={toggleTool} />}
          {step === 2 && <StepMelt cfg={cfg} toggleLayer={toggleLayer} yaml={yaml} />}
        </div>

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', padding:'14px 20px', borderTop:`1px solid ${C.b}`, gap:8 }}>
          <div style={{ fontFamily:mono, fontSize:10, color:C.dm, flex:1 }}>
            {step === 2 ? `${cfg.melt_layers.length} / 6 MELT layers · ${totalFields} fields · ${TELEMETRY_SINKS.length} sinks`
              : step === 1 ? `${cfg.tools.length} tools selected · conf threshold ${cfg.conf_min} · cost cap $${cfg.cost_cap}`
              : `${cfg.name ? `"${cfg.name}" · ` : ''}${cfg.persona} persona · ${cfg.model}`}
          </div>
          {step > 0 && (
            <button onClick={() => setStep(s=>s-1)} style={{ fontFamily:mono, fontSize:11, padding:'6px 14px', borderRadius:3, border:`1px solid ${C.b2}`, background:'transparent', color:C.mu, cursor:'pointer' }}>← Back</button>
          )}
          {step < STEPS.length-1 ? (
            <button onClick={() => setStep(s=>s+1)} style={{ fontFamily:mono, fontSize:11, padding:'6px 18px', borderRadius:3, border:`1px solid ${C.blBd}`, background:C.blBg, color:C.bl, cursor:'pointer' }}>Next →</button>
          ) : (
            <button onClick={handleDeploy} disabled={deploying} style={{ fontFamily:mono, fontSize:11, padding:'6px 20px', borderRadius:3, border:`1px solid ${deploying?C.b2:C.grBd}`, background:deploying?'transparent':C.grBg, color:deploying?C.mu:C.gr, cursor:deploying?'default':'pointer', transition:'all .2s' }}>
              {deploying ? '● Deploying…' : '⬡ Deploy Agent'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
