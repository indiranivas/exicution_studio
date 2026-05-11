export const LEAD_AGENT = {
  id:'agt_0000',name:'lead-orchestrator-01',
  model:'claude-3',type:'orchestrator',role:'lead',
};

export const AGENT_DEFS = [
  LEAD_AGENT,
  {id:'agt_4f2a',name:'order-proc-01',    model:'gpt-4o',  type:'order_processing'},
  {id:'agt_7c1b',name:'report-gen-02',    model:'claude-3',type:'report_gen'},
  {id:'agt_9d3e',name:'data-enrich-01',   model:'gpt-4o',  type:'data_enrich'},
  {id:'agt_2a8f',name:'email-draft-03',   model:'claude-3',type:'email_draft'},
  {id:'agt_1e5c',name:'invoice-parse-02', model:'gpt-4o',  type:'invoice_parse'},
  {id:'agt_3b7a',name:'crm-sync-01',      model:'gpt-4o',  type:'crm_sync'},
  {id:'agt_5c2d',name:'support-triage-01',model:'claude-3',type:'support'},
  {id:'agt_8e4f',name:'analytics-01',     model:'gpt-4o',  type:'analytics'},
];

export const SUB_AGENTS = AGENT_DEFS.filter(a => a.role !== 'lead');

export const STATUSES = ['running','waiting','failed','review','idle','complete'];
export const FAIL_REASONS = ['low_confidence','ambiguous_input','policy_boundary','tool_failure','user_request'];
export const TOOLS = ['crm_lookup','db_query','web_search','send_email','pdf_parse','api_call','vector_search','code_exec'];

export const CONF_BASE = {
  orchestrator:.97, order_processing:.91, report_gen:.78,
  email_draft:.66, data_enrich:.55, invoice_parse:.38,
  crm_sync:.72, support:.69, analytics:.84,
};
