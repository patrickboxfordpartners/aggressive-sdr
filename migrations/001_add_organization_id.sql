-- Migration: Add organization_id to all tables for multi-tenant isolation
-- Run this on your Neon database after deploying authentication changes

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add organization_id columns (initially nullable)
-- ─────────────────────────────────────────────────────────────────────────────

-- Conversations
ALTER TABLE sdr_conversations
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Messages (inherits org from conversation, but add for direct queries)
ALTER TABLE sdr_messages
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- CRM Tables
ALTER TABLE crm_table_definitions
ADD COLUMN IF NOT EXISTS organization_id TEXT;

ALTER TABLE crm_field_mappings
ADD COLUMN IF NOT EXISTS organization_id TEXT;

ALTER TABLE crm_test_exports
ADD COLUMN IF NOT EXISTS organization_id TEXT;

ALTER TABLE crm_exports
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Dashboard & Automation
ALTER TABLE saved_views
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- automation_rules and automation_logs likely already have organization_id
-- but add just in case:
ALTER TABLE automation_rules
ADD COLUMN IF NOT EXISTS organization_id TEXT;

ALTER TABLE automation_logs
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Reports
ALTER TABLE scheduled_reports
ADD COLUMN IF NOT EXISTS organization_id TEXT;

ALTER TABLE report_runs
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- Templates
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS organization_id TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Backfill existing data with a default organization
--    (Replace 'default-org-id' with your actual default organization ID)
-- ─────────────────────────────────────────────────────────────────────────────

-- NOTE: Before running these, determine your default organization ID
-- You can find it by running: SELECT id FROM organizations LIMIT 1;
-- Or create one if it doesn't exist

-- Uncomment and update after determining your organization ID:
-- UPDATE sdr_conversations SET organization_id = 'default-org-id' WHERE organization_id IS NULL;
-- UPDATE sdr_messages SET organization_id = 'default-org-id' WHERE organization_id IS NULL;
-- UPDATE crm_table_definitions SET organization_id = 'default-org-id' WHERE organization_id IS NULL;
-- UPDATE crm_field_mappings SET organization_id = 'default-org-id' WHERE organization_id IS NULL;
-- UPDATE crm_test_exports SET organization_id = 'default-org-id' WHERE organization_id IS NULL;
-- UPDATE crm_exports SET organization_id = 'default-org-id' WHERE organization_id IS NULL;
-- UPDATE saved_views SET organization_id = 'default-org-id' WHERE organization_id IS NULL;
-- UPDATE automation_rules SET organization_id = 'default-org-id' WHERE organization_id IS NULL;
-- UPDATE automation_logs SET organization_id = 'default-org-id' WHERE organization_id IS NULL;
-- UPDATE scheduled_reports SET organization_id = 'default-org-id' WHERE organization_id IS NULL;
-- UPDATE report_runs SET organization_id = 'default-org-id' WHERE organization_id IS NULL;
-- UPDATE email_templates SET organization_id = 'default-org-id' WHERE organization_id IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Make organization_id NOT NULL after backfilling
-- ─────────────────────────────────────────────────────────────────────────────

-- Uncomment after backfilling data:
-- ALTER TABLE sdr_conversations ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE sdr_messages ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE crm_table_definitions ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE crm_field_mappings ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE crm_test_exports ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE crm_exports ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE saved_views ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE automation_rules ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE automation_logs ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE scheduled_reports ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE report_runs ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE email_templates ALTER COLUMN organization_id SET NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Add indexes for performance (organization_id is in every query now)
-- ─────────────────────────────────────────────────────────────────────────────

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

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Composite indexes for common query patterns
-- ─────────────────────────────────────────────────────────────────────────────

-- Conversations: frequently filtered by org + status
CREATE INDEX IF NOT EXISTS idx_conversations_org_status ON sdr_conversations(organization_id, status);

-- Exports: frequently filtered by org + status + created_at
CREATE INDEX IF NOT EXISTS idx_exports_org_status_created ON crm_exports(organization_id, status, created_at DESC);

-- Automation rules: frequently filtered by org + enabled
CREATE INDEX IF NOT EXISTS idx_rules_org_enabled ON automation_rules(organization_id, enabled);

-- Automation logs: frequently filtered by org + status + created_at
CREATE INDEX IF NOT EXISTS idx_logs_org_status_created ON automation_logs(organization_id, status, created_at DESC);

-- Reports: frequently filtered by org + enabled
CREATE INDEX IF NOT EXISTS idx_reports_org_enabled ON scheduled_reports(organization_id, enabled);

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration Complete!
-- ─────────────────────────────────────────────────────────────────────────────
-- Next steps:
-- 1. Test authentication flow with a real user session
-- 2. Verify queries are properly filtered by organization_id
-- 3. Test bulk operations to ensure org isolation
-- 4. Monitor query performance (check EXPLAIN ANALYZE on slow queries)
