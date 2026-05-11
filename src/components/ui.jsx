import { C, mono, sans } from '../constants/palette.js';

export function MetricTile({ label, value, delta, dir, accent }) {
  const cols = { green:C.gr, amber:C.am, red:C.re, blue:C.bl, purple:C.pu, cyan:C.cy };
  const col = cols[accent] || C.dm;
  const dCol = dir === 'up' ? C.gr : dir === 'down' ? C.re : C.mu;
  return (
    <div style={{ background:C.sf, border:`1px solid ${C.b}`, borderRadius:4, padding:'14px 16px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:col, opacity:.7 }} />
      <div style={{ fontFamily:mono, fontSize:10, color:C.mu, letterSpacing:'.05em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:300, letterSpacing:'-.02em', color:C.tx, fontFamily:sans }}>{value}</div>
      <div style={{ fontFamily:mono, fontSize:10, marginTop:4, color:dCol }}>{delta}</div>
    </div>
  );
}

export function Panel({ title, right, children, style = {} }) {
  return (
    <div style={{ background:C.sf, border:`1px solid ${C.b}`, borderRadius:4, ...style }}>
      <div style={{ display:'flex', alignItems:'center', padding:'11px 16px', borderBottom:`1px solid ${C.b}`, gap:8 }}>
        <div style={{ fontSize:12, fontWeight:500, color:C.tx, fontFamily:sans }}>{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Pill({ status }) {
  const m = {
    running:  { c:C.gr, bg:C.grBg, bd:C.grBd, l:'Running' },
    waiting:  { c:C.am, bg:C.amBg, bd:C.amBd, l:'Waiting' },
    failed:   { c:C.re, bg:C.reBg, bd:C.reBd, l:'Failed' },
    review:   { c:C.bl, bg:C.blBg, bd:C.blBd, l:'Review' },
    idle:     { c:C.dm, bg:'transparent', bd:C.b2, l:'Idle' },
    complete: { c:C.cy, bg:C.cyBg, bd:'rgba(6,182,212,.28)', l:'Complete' },
    pending:  { c:C.am, bg:C.amBg, bd:C.amBd, l:'Pending' },
    reviewing:{ c:C.bl, bg:C.blBg, bd:C.blBd, l:'Reviewing' },
    resolved: { c:C.gr, bg:C.grBg, bd:C.grBd, l:'Resolved' },
    queued:   { c:C.mu, bg:'transparent', bd:C.b2, l:'Queued' },
  };
  const x = m[status] || m.idle;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontFamily:mono, fontSize:10, padding:'3px 8px', borderRadius:2, border:`1px solid ${x.bd}`, color:x.c, background:x.bg, whiteSpace:'nowrap' }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:x.c, flexShrink:0, animation:status==='waiting'?'pulse 1.5s ease-in-out infinite':'none' }} />
      {x.l}
    </span>
  );
}

export function ConfVal({ v }) {
  const c = v >= .75 ? C.gr : v >= .4 ? C.am : C.re;
  return <span style={{ fontFamily:mono, fontSize:12, color:c }}>{v.toFixed(2)}</span>;
}

export function Bar({ pct, color, h = 4 }) {
  return (
    <div style={{ height:h, background:C.sf2, borderRadius:2, overflow:'hidden', flex:1 }}>
      <div style={{ height:'100%', width:`${Math.min(100,pct)}%`, background:color, borderRadius:2, transition:'width .6s ease' }} />
    </div>
  );
}

export function Th({ children }) {
  return (
    <th style={{ fontFamily:mono, fontSize:10, letterSpacing:'.07em', textTransform:'uppercase', color:C.dm, textAlign:'left', padding:'0 12px 10px 0', borderBottom:`1px solid ${C.b}` }}>
      {children}
    </th>
  );
}

export function Td({ children, style = {} }) {
  return (
    <td style={{ padding:'9px 12px 9px 0', borderBottom:`1px solid ${C.b}`, verticalAlign:'middle', ...style }}>
      {children}
    </td>
  );
}

export function LeadBadge() {
  return (
    <span style={{ fontFamily:mono, fontSize:9, padding:'1px 6px', borderRadius:2, background:'rgba(245,158,11,.15)', color:C.am, border:'1px solid rgba(245,158,11,.35)', marginLeft:6, letterSpacing:'.06em', verticalAlign:'middle' }}>
      LEAD
    </span>
  );
}
