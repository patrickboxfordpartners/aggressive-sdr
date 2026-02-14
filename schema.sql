-- Aggressive SDR Database Schema
-- Creates all tables with organization_id from the start

-- ============================================================================
-- SDR Conversations & Messages
-- ============================================================================

CREATE TABLE IF NOT EXISTS sdr_conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  current_agent TEXT NOT NULL DEFAULT 'scout',
  status TEXT NOT NULL DEFAULT 'active',
  qualification_data JSONB DEFAULT '{}',
  enrichment_data JSONB DEFAULT '{"status":"idle"}',
  export_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sdr_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES sdr_conversations(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CRM Tables & Mappings
-- ============================================================================

CREATE TABLE IF NOT EXISTS crm_table_definitions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_field_mappings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  table_id TEXT NOT NULL REFERENCES crm_table_definitions(id) ON DELETE CASCADE,
  mappings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_test_exports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  conversation_id TEXT REFERENCES sdr_conversations(id) ON DELETE CASCADE,
  table_id TEXT REFERENCES crm_table_definitions(id) ON DELETE SET NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_exports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  conversation_id TEXT REFERENCES sdr_conversations(id) ON DELETE CASCADE,
  table_id TEXT REFERENCES crm_table_definitions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tags TEXT[] DEFAULT '{}',
  validation_errors JSONB DEFAULT '[]',
  exported_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Saved Views
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_views (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Automation Rules & Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_tags TEXT[] NOT NULL,
  trigger_mode TEXT DEFAULT 'any',
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS automation_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  rule_id TEXT REFERENCES automation_rules(id) ON DELETE CASCADE,
  export_id TEXT REFERENCES crm_exports(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Scheduled Reports & Runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  schedule TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv',
  filters JSONB DEFAULT '{}',
  recipients TEXT[] NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  report_id TEXT REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  file_url TEXT,
  record_count INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Email Templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  shared BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  owner_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Organization indexes (every query filters by org)
CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON sdr_conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON sdr_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_tables_org_id ON crm_table_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_mappings_org_id ON crm_field_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_test_exports_org_id ON crm_test_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_exports_org_id ON crm_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_org_id ON saved_views(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_org_id ON automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_org_id ON automation_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_org_id ON scheduled_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_org_id ON report_runs(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_org_id ON email_templates(organization_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_conversations_org_status ON sdr_conversations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_exports_org_status_created ON crm_exports(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rules_org_enabled ON automation_rules(organization_id, enabled);
CREATE INDEX IF NOT EXISTS idx_logs_org_status_created ON automation_logs(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_org_enabled ON scheduled_reports(organization_id, enabled);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON sdr_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_crm_mappings_table_id ON crm_field_mappings(table_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_export_id ON automation_logs(export_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_report_id ON report_runs(report_id);
