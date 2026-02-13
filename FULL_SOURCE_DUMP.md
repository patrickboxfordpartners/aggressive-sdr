# Aggressive SDR — Full Source Code Dump

This file contains a summary of the Aggressive SDR application source code.
Due to GitHub API limitations (single-file push), the full 150+ file project
couldn't be pushed atomically. See README.md for comprehensive documentation.

## How to Reconstruct

1. Export the app from the Vybe platform (contact support)
2. Or contact the repo owner for a full zip export
3. The README.md in this repo contains the complete architecture documentation

## Project Structure

```
src/
├── app/                          # Next.js 15 App Router
│   ├── page.tsx                  # Home — SDR Strike Team chat UI
│   ├── layout.tsx                # Root layout with sidebar
│   ├── automations/page.tsx      # Automation rules, logs, analytics, reports
│   ├── export-dashboard/page.tsx # CRM export monitoring dashboard
│   ├── crm-mapping/page.tsx      # Custom CRM field mapping
│   └── api/                      # API routes
│       ├── conversations/        # CRUD for SDR conversations
│       ├── crm-exports/          # Export dashboard + bulk actions
│       ├── crm-tables/           # CRM schema definitions
│       ├── crm-mappings/         # Field mapping configs
│       ├── crm-test-exports/     # Test export runs
│       ├── bulk-export/          # Bulk lead export
│       ├── automation-rules/     # Automation CRUD + bulk ops
│       ├── automation-logs/      # Execution logs + analytics
│       ├── automation-trigger/   # Tag-based rule triggering
│       ├── scheduled-reports/    # Scheduled report CRUD + runs
│       ├── email-templates/      # Reusable email templates
│       ├── saved-views/          # Dashboard saved filters
│       └── inngest/              # Inngest webhook handler
├── components/                   # React components
│   ├── ui/                       # Shadcn primitives (40+ components)
│   ├── Sidebar.tsx               # App navigation
│   ├── ChatView.tsx              # SDR chat interface
│   ├── ConversationList.tsx      # Lead list with bulk select
│   ├── LeadSummary.tsx           # Lead intel panel
│   ├── CrmExportPanel.tsx        # One-click CRM export
│   ├── BulkExportDialog.tsx      # Multi-lead export
│   ├── AutomationRuleCard.tsx    # Rule display cards
│   ├── AutomationRuleForm.tsx    # Rule create/edit dialog
│   ├── ExecutionLogTable.tsx     # Full log table with filters
│   ├── ExecutionLogDetail.tsx    # Log detail modal
│   ├── AutomationAnalytics.tsx   # Analytics dashboard
│   ├── ScheduledReports.tsx      # Report management UI
│   ├── ScheduledReportForm.tsx   # Report create/edit form
│   ├── EmailTemplateEditor.tsx   # Template variable system
│   ├── BulkReportsToolbar.tsx    # Bulk report actions
│   ├── BulkExportActions.tsx     # Export bulk toolbar
│   ├── BulkRulesToolbar.tsx      # Rule bulk toolbar
│   ├── BulkLogsToolbar.tsx       # Log bulk toolbar
│   ├── ExportLogTable.tsx        # Export log with filters
│   ├── SavedViewsBar.tsx         # Saved filter views
│   ├── TagEditorPanel.tsx        # Tag management panel
│   └── export-detail/            # Export detail modal
├── client-lib/                   # Client-side utilities
│   ├── api-client.ts             # SWR hooks + mutations
│   ├── automation-client.ts      # Automation types + hooks
│   ├── scheduled-reports-client.ts # Report types + hooks
│   ├── pdf-report-generator.ts   # HTML PDF generation
│   ├── auth-client.ts            # Auth session
│   ├── integrations-client.ts    # Pipedream integrations
│   └── built-in-integrations/    # PDL, AI, Crustdata, Forager
├── server-lib/                   # Server-side utilities
│   ├── sdr-agents.ts             # AI agent prompts + handoff
│   ├── internal-db-query.ts      # Postgres query wrapper
│   ├── scheduled-reports-helpers.ts # Email + report generation
│   └── server-integrations-client.ts # Server-side Pipedream
├── inngest/                      # Background jobs
│   ├── client.ts                 # Inngest client config
│   ├── functions/
│   │   ├── execute-automation.ts # Async rule execution
│   │   └── generate-scheduled-reports.ts # Hourly cron job
├── hooks/                        # React hooks
│   ├── use-sdr-chat.ts           # Chat orchestration
│   ├── use-crm-export.ts         # CRM export state
│   └── use-lead-enrichment.ts    # PDL auto-enrichment
└── shared/models/                # Shared TypeScript types
    ├── sdr.ts                    # Core SDR types (50+ interfaces)
    ├── crm-mapping.ts            # CRM field mapping logic
    └── crm-field-resolver.ts     # Source field resolution
```

## Key Technologies

- **Framework**: Next.js 15 (App Router)
- **UI**: React 18, Shadcn/Radix, Tailwind CSS, Lucide icons
- **Charts**: Recharts via Shadcn chart wrapper
- **State**: SWR for data fetching, React hooks for local state
- **Database**: Neon Postgres (serverless)
- **Background Jobs**: Inngest (cron + event-driven)
- **AI**: OpenAI via built-in integration
- **Enrichment**: People Data Labs
- **Integrations**: GitHub (connected), Stripe (connected), Mailgun (available)
- **Testing**: Jest + ts-jest (240+ tests)

## Database Tables

- `sdr_conversations` — Lead conversations with qualification/enrichment/export data
- `sdr_messages` — Chat messages (user + agent)
- `crm_table_definitions` — Custom CRM schema definitions
- `crm_field_mappings` — SDR→CRM field mapping configs
- `crm_test_exports` — Test export results
- `crm_exports` — Export activity log with tags, validation, status history
- `saved_views` — Saved dashboard filter combinations
- `automation_rules` — Tag-triggered automation configs
- `automation_logs` — Automation execution history
- `scheduled_reports` — Scheduled report configurations
- `report_runs` — Report generation history with delivery tracking
- `email_templates` — Reusable email template definitions

## Features (v1-v21)

See README.md for the complete 21-version changelog covering:
- 5-stage AI SDR pipeline (Scout→Qualifier→Challenger→Closer→Coordinator)
- People Data Labs lead enrichment
- Custom CRM mapping + export (single & bulk)
- Export dashboard with charts, filters, saved views
- Tag system with 7 presets + custom tags
- Tag-triggered automation workflows (GitHub Issues, notifications, escalations)
- Full execution log with filtering, sorting, PDF export
- Automation analytics dashboard
- Scheduled reports (daily/weekly) with email delivery
- Customizable email templates with variable interpolation
- Bulk management for rules, logs, reports, and templates
