export const PERSONAS = ['BRAND_AMBASSADOR','ANALYST','ADVISOR','CONCIERGE','ENGINEER','EXECUTIVE'];

export const LLM_MODELS = [
  { v:'gpt-4o',           l:'GPT-4o' },
  { v:'gpt-4.1',          l:'GPT-4.1' },
  { v:'claude-sonnet-4-6',l:'Claude Sonnet 4.6' },
  { v:'claude-3',         l:'Claude 3 Opus' },
  { v:'claude-haiku-4-5', l:'Claude Haiku 4.5' },
];

export const DEPLOY_TOOLS = [
  'crm_get_account','crm_list_flows','erp_get_processes',
  'erp_idle_connectors','analyse_automation_gaps','generate_maturity_report',
];

export const WORKLOAD_PROFILES = [
  { name:'Tool selection',                temp:0.0, top_p:1.0, top_k:1 },
  { name:'Structured extraction (JSON)',  temp:0.1, top_p:0.9, top_k:20 },
  { name:'Customer-facing answers',       temp:0.4, top_p:0.9, top_k:40 },
  { name:'Summarisation',                 temp:0.5, top_p:0.9, top_k:40 },
  { name:'Code generation',               temp:0.2, top_p:0.95,top_k:40 },
];

export const DEFAULT_CFG = {
  name:'', description:'', persona:'ANALYST',
  model:'gpt-4o', workload:'Tool selection',
  temperature:0.0, top_p:1.0, top_k:1, max_tokens:1024,
  conf_min:0.70, max_iterations:10, max_tokens_run:30000, cost_cap:0.20, pii:true,
  tools:['crm_get_account','analyse_automation_gaps'],
  melt_layers:['L1','L2','L3','L4','L5','L6'],
};
