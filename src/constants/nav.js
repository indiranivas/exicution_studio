export const NAV = [
  { section:'Monitor', items:[
    { id:'overview',  icon:'⬡', label:'Overview' },
    { id:'fleet',     icon:'◈', label:'Agent Fleet', count:()=>9 },
    { id:'queue',     icon:'◎', label:'Task Queue',  count:()=>44 },
    { id:'alerts',    icon:'△', label:'Alerts',      count:()=>3, alert:true },
  ]},
  { section:'Analyse', items:[
    { id:'telemetry', icon:'⌘', label:'Telemetry' },
    { id:'failures',  icon:'⊞', label:'Failure Explorer' },
    { id:'confidence',icon:'◑', label:'Confidence' },
    { id:'learning',  icon:'↺', label:'Learning Log' },
  ]},
  { section:'Operate', items:[
    { id:'handoffs',  icon:'⤵', label:'Human Handoffs', count:()=>5, alert:true },
    { id:'cost',      icon:'⊘', label:'Cost & Tokens' },
    { id:'settings',  icon:'⚙', label:'Settings' },
  ]},
];

export const BREADCRUMB = {
  overview:'Overview / Production', fleet:'Agent Fleet', queue:'Task Queue',
  alerts:'Alerts', telemetry:'Telemetry', failures:'Failure Explorer',
  confidence:'Confidence', learning:'Learning Log', handoffs:'Human Handoffs',
  cost:'Cost & Tokens', settings:'Settings',
  'l2o-pipeline':   'L2O → Pipeline',
  'l2o-traces':     'L2O → Trace Explorer',
  'l2o-guardrails': 'L2O → Guardrails',
  'l2o-feedback':   'L2O → AI Feedback',
};

export const PAGE_TITLE = {
  overview:'Operations Overview', fleet:'Agent Fleet', queue:'Task Queue',
  alerts:'Alerts', telemetry:'Telemetry', failures:'Failure Explorer',
  confidence:'Confidence', learning:'Learning Log', handoffs:'Human Handoffs',
  cost:'Cost & Tokens', settings:'Settings',
  'l2o-pipeline':   'Lead → Order Pipeline',
  'l2o-traces':     'Trace Explorer',
  'l2o-guardrails': 'Guardrails & Trust',
  'l2o-feedback':   'AI Feedback & Quality',
};
