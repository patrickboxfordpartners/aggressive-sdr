export type AgentName = "scout" | "qualifier" | "challenger" | "closer" | "coordinator";

export type ConversationStatus = "active" | "completed" | "disqualified";

export type EnrichmentStatus = "idle" | "enriching" | "enriched" | "failed" | "no_data";

export interface EnrichmentData {
  status: EnrichmentStatus;
  enriched_at?: string;
  source?: "email" | "identify";
  full_name?: string;
  first_name?: string;
  last_name?: string;
  linkedin_url?: string | null;
  github_url?: string | null;
  twitter_url?: string | null;
  job_title?: string | null;
  job_title_role?: string | null;
  job_title_levels?: string[];
  job_company_name?: string | null;
  job_company_website?: string | null;
  job_company_size?: string | null;
  job_company_founded?: number | null;
  job_company_industry?: string | null;
  job_company_linkedin_url?: string | null;
  job_company_location_name?: string | null;
  job_company_employee_count?: number | null;
  job_company_inferred_revenue?: string | null;
  job_company_total_funding_raised?: number | null;
  job_company_type?: string | null;
  location_name?: string | boolean;
  location_country?: string;
  industry?: string | null;
  skills?: string[];
  interests?: string[];
  inferred_years_experience?: number | null;
  experience_count?: number;
  education_count?: number;
  linkedin_connections?: number | null;
  work_email?: string | boolean;
  mobile_phone?: string | boolean;
  match_score?: number;
  error_message?: string;
}

export interface SdrConversation {
  id: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_company: string | null;
  current_agent: AgentName;
  status: ConversationStatus;
  qualification_data: QualificationData;
  enrichment_data: EnrichmentData;
  crm_export_data: CrmExportData;
  created_at: string;
  updated_at: string;
}

export interface SdrMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  agent: AgentName | null;
  content: string;
  created_at: string;
}

export interface QualificationData {
  intent?: string;
  need?: string;
  timeline?: string;
  authority?: string;
  budget?: string;
  pain_points?: string[];
  urgency?: string;
  stakes?: string;
  next_step?: string;
  final_payload?: SdrPayload;
}

export interface SdrPayload {
  intent: "book_meeting" | "send_resources" | "escalate";
  summary: string;
  confidence: number;
  metadata: {
    email: string;
    company: string;
    timeline: string;
    pain_points: string[];
    authority: string;
    budget: string;
  };
  next_step_payload: Record<string, unknown>;
}

export const AGENT_ORDER: AgentName[] = ["scout", "qualifier", "challenger", "closer", "coordinator"];

export const AGENT_LABELS: Record<AgentName, string> = {
  scout: "Scout",
  qualifier: "Qualifier",
  challenger: "Challenger",
  closer: "Closer",
  coordinator: "Coordinator",
};

export const AGENT_COLORS: Record<AgentName, string> = {
  scout: "bg-blue-500",
  qualifier: "bg-amber-500",
  challenger: "bg-red-500",
  closer: "bg-emerald-500",
  coordinator: "bg-purple-500",
};

export type CrmProvider = "salesforce" | "hubspot";
export type CrmExportStatus = "not_exported" | "exporting" | "exported" | "failed";

export interface CrmExportData {
  status: CrmExportStatus;
  provider?: CrmProvider;
  exported_at?: string;
  record_id?: string;
  record_url?: string;
  error_message?: string;
}

export interface CrmContactPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company: string;
  title?: string;
  lead_source: string;
  lead_status: string;
  description: string;
  industry?: string;
  website?: string;
  linkedin_url?: string;
  employee_count?: number;
  annual_revenue?: string;
  pain_points?: string;
  timeline?: string;
  budget?: string;
  authority?: string;
  urgency?: string;
  confidence_score?: number;
  intent?: string;
}

export interface CrmColumnDefinition {
  name: string;
  type: "text" | "number" | "boolean" | "date" | "email" | "url" | "json";
  required?: boolean;
  description?: string;
}

export interface CrmTableDefinition {
  id: string;
  table_name: string;
  table_type: "contact" | "deal";
  columns: CrmColumnDefinition[];
  created_at: string;
  updated_at: string;
}

export type SdrSourceField =
  | "qual.need" | "qual.timeline" | "qual.authority" | "qual.budget"
  | "qual.urgency" | "qual.stakes" | "qual.pain_points" | "qual.intent"
  | "qual.summary" | "qual.confidence"
  | "enrichment.full_name" | "enrichment.first_name" | "enrichment.last_name"
  | "enrichment.email" | "enrichment.phone" | "enrichment.job_title"
  | "enrichment.company" | "enrichment.industry" | "enrichment.website"
  | "enrichment.linkedin" | "enrichment.employee_count" | "enrichment.revenue"
  | "enrichment.funding" | "enrichment.company_size" | "enrichment.company_type"
  | "enrichment.company_founded" | "enrichment.location" | "enrichment.skills"
  | "enrichment.experience_years"
  | "conv.lead_name" | "conv.lead_email" | "conv.lead_company"
  | "conv.current_agent" | "conv.status" | "conv.created_at"
  | "computed.lead_source" | "computed.lead_status" | "computed.description";

export interface CrmFieldMapping {
  source_field: SdrSourceField;
  target_column: string;
  transform?: "none" | "uppercase" | "lowercase" | "join_semicolons";
}

export interface CrmMappingConfig {
  id: string;
  name: string;
  table_type: "contact" | "deal";
  mappings: CrmFieldMapping[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrmTestExport {
  id: string;
  conversation_id: string | null;
  table_type: string;
  mapped_data: Record<string, unknown>;
  status: "pending" | "success" | "error";
  error_message: string | null;
  created_at: string;
}

export const SDR_SOURCE_FIELDS: { field: SdrSourceField; label: string; category: string }[] = [
  { field: "conv.lead_name", label: "Lead Name", category: "Conversation" },
  { field: "conv.lead_email", label: "Lead Email", category: "Conversation" },
  { field: "conv.lead_company", label: "Lead Company", category: "Conversation" },
  { field: "conv.current_agent", label: "Current Agent", category: "Conversation" },
  { field: "conv.status", label: "Status", category: "Conversation" },
  { field: "conv.created_at", label: "Created At", category: "Conversation" },
  { field: "qual.need", label: "Need", category: "Qualification" },
  { field: "qual.timeline", label: "Timeline", category: "Qualification" },
  { field: "qual.authority", label: "Authority", category: "Qualification" },
  { field: "qual.budget", label: "Budget", category: "Qualification" },
  { field: "qual.urgency", label: "Urgency", category: "Qualification" },
  { field: "qual.stakes", label: "Stakes", category: "Qualification" },
  { field: "qual.pain_points", label: "Pain Points", category: "Qualification" },
  { field: "qual.intent", label: "Intent", category: "Qualification" },
  { field: "qual.summary", label: "Summary", category: "Qualification" },
  { field: "qual.confidence", label: "Confidence Score", category: "Qualification" },
  { field: "enrichment.full_name", label: "Full Name", category: "Enrichment (PDL)" },
  { field: "enrichment.first_name", label: "First Name", category: "Enrichment (PDL)" },
  { field: "enrichment.last_name", label: "Last Name", category: "Enrichment (PDL)" },
  { field: "enrichment.email", label: "Work Email", category: "Enrichment (PDL)" },
  { field: "enrichment.phone", label: "Mobile Phone", category: "Enrichment (PDL)" },
  { field: "enrichment.job_title", label: "Job Title", category: "Enrichment (PDL)" },
  { field: "enrichment.company", label: "Company Name", category: "Enrichment (PDL)" },
  { field: "enrichment.industry", label: "Industry", category: "Enrichment (PDL)" },
  { field: "enrichment.website", label: "Company Website", category: "Enrichment (PDL)" },
  { field: "enrichment.linkedin", label: "LinkedIn URL", category: "Enrichment (PDL)" },
  { field: "enrichment.employee_count", label: "Employee Count", category: "Enrichment (PDL)" },
  { field: "enrichment.revenue", label: "Revenue", category: "Enrichment (PDL)" },
  { field: "enrichment.funding", label: "Total Funding", category: "Enrichment (PDL)" },
  { field: "enrichment.company_size", label: "Company Size", category: "Enrichment (PDL)" },
  { field: "enrichment.company_type", label: "Company Type", category: "Enrichment (PDL)" },
  { field: "enrichment.company_founded", label: "Company Founded", category: "Enrichment (PDL)" },
  { field: "enrichment.location", label: "Location", category: "Enrichment (PDL)" },
  { field: "enrichment.skills", label: "Skills", category: "Enrichment (PDL)" },
  { field: "enrichment.experience_years", label: "Years of Experience", category: "Enrichment (PDL)" },
  { field: "computed.lead_source", label: "Lead Source", category: "Computed" },
  { field: "computed.lead_status", label: "Lead Status", category: "Computed" },
  { field: "computed.description", label: "Full Description", category: "Computed" },
];
