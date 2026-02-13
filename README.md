# SDR Strike Team

A coordinated, multi-agent SDR (Sales Development Representative) system for aggressively qualifying, challenging, and converting inbound leads.

The system operates as a 5-stage pipeline: **Scout → Qualifier → Challenger → Closer → Coordinator**, where each AI agent plays a specialized role with escalating pressure.

## Key Features (21 versions)

- **5-Stage AI Pipeline**: Scout (intent detection) → Qualifier (BANT extraction) → Challenger (urgency amplification) → Closer (conversion) → Coordinator (final payload)
- **PDL Lead Enrichment**: Auto-enrichment via People Data Labs when email or company+name detected
- **Custom CRM Mapping**: Visual field mapper for 35+ SDR source fields → custom CRM tables
- **Bulk Export**: Multi-select leads with validation, retry, and batch tracking
- **Export Dashboard**: Charts, filters, saved views, and per-record troubleshooting
- **Tag System**: 7 preset tags + custom tags with bulk operations
- **Automation Workflows**: Tag-triggered GitHub Issues, notifications, and escalations
- **Execution Log**: Advanced filtering, sorting, pagination, PDF export
- **Analytics Dashboard**: 30-day trends, status distribution, hourly activity charts
- **Scheduled Reports**: Daily/weekly automated report generation (CSV/PDF)
- **Email Delivery**: Mailgun integration with inline or file attachment modes
- **Email Templates**: Variable interpolation ({report_name}, {date}, {recipient}, etc.)
- **Bulk Management**: Multi-select for rules, logs, reports, and templates

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 18, Shadcn/Radix, Tailwind CSS, Lucide
- **Charts**: Recharts
- **Database**: Neon Postgres
- **Background Jobs**: Inngest
- **AI**: OpenAI (built-in)
- **Enrichment**: People Data Labs
- **Integrations**: GitHub, Stripe, Mailgun
- **Testing**: Jest (240+ tests)

See FULL_SOURCE_DUMP.md for the complete project structure and architecture documentation.
