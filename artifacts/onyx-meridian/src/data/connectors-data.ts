export interface Connector {
  id: string;
  name: string;
  category: string;
  protocol: string;
  connected: boolean;
  buId: string;
  secret: string;
  lastSync: string;
}

export const CONNECTOR_CATALOG: Connector[] = [
  { id: "conn-sap",    name: "SAP ERP",            category: "ERP",                 protocol: "OData", connected: true,  buId: "finance",       secret: "SAP_ERP_SVC",       lastSync: "3m ago" },
  { id: "conn-scada",  name: "SCADA Gateway",      category: "Industrial Control",  protocol: "OPC-UA", connected: true,  buId: "manufacturing", secret: "SCADA_GATEWAY_KEY", lastSync: "1m ago" },
  { id: "conn-mes",    name: "MES System",         category: "Manufacturing Exec.", protocol: "REST",   connected: true,  buId: "manufacturing", secret: "MES_API_TOKEN",     lastSync: "4m ago" },
  { id: "conn-cmms",   name: "CMMS",               category: "Maintenance",         protocol: "REST",   connected: true,  buId: "manufacturing", secret: "CMMS_OAUTH",        lastSync: "12m ago" },
  { id: "conn-wms",    name: "WMS Platform",       category: "Warehouse",           protocol: "REST",   connected: true,  buId: "supply-chain",  secret: "WMS_API_KEY",       lastSync: "6m ago" },
  { id: "conn-plm",    name: "PLM System",         category: "Supplier / Contracts",protocol: "REST",   connected: true,  buId: "procurement",   secret: "PLM_OAUTH",         lastSync: "18m ago" },
  { id: "conn-sfdc",   name: "Salesforce CRM",     category: "CRM",                 protocol: "REST",   connected: true,  buId: "revenue",       secret: "SALESFORCE_OAUTH",  lastSync: "2m ago" },
  { id: "conn-docusign",name:"DocuSign",           category: "e-Signature",         protocol: "REST",   connected: false, buId: "procurement",   secret: "DOCUSIGN_OAUTH",    lastSync: "—" },
  { id: "conn-workday",name: "Workday",            category: "HRIS",                protocol: "REST",   connected: false, buId: "finance",       secret: "WORKDAY_TBA",       lastSync: "—" },
  { id: "conn-snowflake",name:"Snowflake",         category: "Data Warehouse",      protocol: "JDBC",   connected: true,  buId: "finance",       secret: "SNOWFLAKE_SVC",     lastSync: "9m ago" },
];
