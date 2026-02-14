# Authentication & Multi-Tenancy Implementation

**Status:** ✅ API Routes Complete | 🔄 Database Migration Pending | ⏳ Testing Required

---

## Overview

This document tracks the implementation of proper authentication and multi-tenant organization isolation across the Aggressive SDR application. Previously, the app used hardcoded `"john.doe@example.com"` throughout. Now it uses real user sessions with organization-scoped queries.

---

## What Was Changed

### 1. Created Authentication Helpers (`src/server-lib/auth-helpers.ts`)

**New Functions:**
- `getCurrentUser(request)` - Extracts authenticated user from session
- `addOrgFilter(sql, params, orgId)` - Adds organization filter to queries
- `createErrorResponse(message, status, code)` - Standardized error responses
- `handleAuthError(error)` - Consistent authentication error handling

**Interface:**
```typescript
interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  organizationId: string;
}
```

### 2. Updated API Routes

#### ✅ **Automation Rules** (`src/app/api/automation-rules/route.ts`)
**Methods:** GET, POST, PATCH, DELETE
- Added `getCurrentUser()` to all endpoints
- Added `organization_id` filters to all queries
- Replaced hardcoded email with `user.email`
- Updated bulk operations (bulk-toggle, bulk-delete) with org isolation
- Wrapped all methods in try-catch with `handleAuthError()`

**Key Changes:**
- GET single rule: `WHERE id = $1 AND organization_id = $2`
- GET all rules: `WHERE organization_id = $1`
- POST: Insert with `user.email` and `user.organizationId`
- PATCH: Update only within user's organization
- DELETE: Delete only within user's organization
- Bulk operations: Filter by `organization_id` in all IN clauses

#### ✅ **Automation Logs** (`src/app/api/automation-logs/route.ts`)
**Methods:** GET, DELETE
- Added `getCurrentUser()` to all endpoints
- Added `organization_id` as first condition in all WHERE clauses
- Updated DELETE bulk action with org isolation
- Updated DELETE clear action with org isolation

**Key Changes:**
- GET by ID: `WHERE al.id = $1 AND al.organization_id = $2`
- GET all: First condition is always `al.organization_id = $1`
- DELETE bulk: `WHERE organization_id = $1 AND id IN (...)`
- DELETE clear: Requires at least one filter beyond org_id

#### ✅ **Conversations** (`src/app/api/conversations/route.ts`)
**Methods:** GET, POST
- Added `getCurrentUser()` to both endpoints
- Added `organization_id` filter to GET query
- Added `organization_id` to INSERT statement

**Key Changes:**
- GET: `WHERE organization_id = $1 ORDER BY updated_at DESC`
- POST: Insert with `organization_id = $1`

#### ✅ **Email Templates** (`src/app/api/email-templates/route.ts`)
**Methods:** GET, POST, PATCH, DELETE
- Added `getCurrentUser()` to all endpoints
- Replaced all `"john.doe@example.com"` with `user.email`
- Added `organization_id` filters to all queries

**Key Changes:**
- GET single: `WHERE id = $1 AND organization_id = $2`
- GET all: `WHERE organization_id = $1 AND (owner_email = $2 OR shared = true)`
- POST: Insert with `user.email` and `user.organizationId`
- PATCH: Update only within user's organization
- DELETE: `WHERE id = $1 AND organization_id = $2 AND owner_email = $3`

---

## What Still Needs Implementation

### 🔄 **Database Migration Required**

**File:** `migrations/001_add_organization_id.sql`

**Steps:**
1. Add `organization_id` columns to all tables (currently nullable)
2. Backfill existing data with default organization ID
3. Make `organization_id` NOT NULL after backfilling
4. Add indexes for performance

**Tables That Need Migration:**
- ✅ `automation_rules` (may already have it)
- ✅ `automation_logs` (may already have it)
- ✅ `sdr_conversations`
- ✅ `sdr_messages`
- ✅ `crm_table_definitions`
- ✅ `crm_field_mappings`
- ✅ `crm_test_exports`
- ✅ `crm_exports`
- ✅ `saved_views`
- ✅ `scheduled_reports`
- ✅ `report_runs`
- ✅ `email_templates`

**How to Run:**
```bash
# Connect to Neon database
psql <your-neon-connection-string>

# Run migration
\i migrations/001_add_organization_id.sql

# Or copy-paste the SQL from the file
```

### ⏳ **Stubbed Routes (Need Implementation When Unstubbed)**

These routes are currently stubbed (empty exports) and will need authentication when they're implemented:

- `src/app/api/conversations/[id]/route.ts`
- `src/app/api/conversations/[id]/messages/route.ts`
- `src/app/api/crm-exports/route.ts`
- `src/app/api/crm-tables/route.ts`
- `src/app/api/crm-tables/[id]/route.ts`
- `src/app/api/crm-mappings/route.ts`
- `src/app/api/crm-mappings/[id]/route.ts`
- `src/app/api/bulk-export/route.ts`
- `src/app/api/scheduled-reports/route.ts`
- `src/app/api/saved-views/route.ts`
- `src/app/api/automation-trigger/route.ts`
- `src/app/api/crm-test-exports/route.ts`
- `src/app/api/automation-logs/analytics/route.ts`

**Pattern to Follow When Implementing:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, handleAuthError } from "@/server-lib/auth-helpers";
import { queryInternalDatabase } from "@/server-lib/internal-db-query";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user and org context
    const user = await getCurrentUser(request);

    // Your query with organization_id filter
    const rows = await queryInternalDatabase(
      `SELECT * FROM table_name WHERE organization_id = $1`,
      [user.organizationId]
    );

    return NextResponse.json(rows);
  } catch (error) {
    return handleAuthError(error);
  }
}
```

---

## Testing Checklist

### ⏳ **Manual Testing Needed**

1. **Authentication Flow**
   - [ ] Log in with a real user account
   - [ ] Verify session contains `organizationId`
   - [ ] Test unauthenticated requests return 401
   - [ ] Test invalid session returns 401

2. **Organization Isolation**
   - [ ] Create data as User A in Org 1
   - [ ] Verify User B in Org 2 cannot see Org 1 data
   - [ ] Test all GET endpoints for org isolation
   - [ ] Test all POST/PATCH/DELETE endpoints for org isolation

3. **API Endpoints**
   - [ ] `/api/automation-rules` - All methods (GET, POST, PATCH, DELETE)
   - [ ] `/api/automation-logs` - All methods (GET, DELETE)
   - [ ] `/api/conversations` - All methods (GET, POST)
   - [ ] `/api/email-templates` - All methods (GET, POST, PATCH, DELETE)

4. **Bulk Operations**
   - [ ] Automation rules bulk-toggle (only affects user's org)
   - [ ] Automation rules bulk-delete (only affects user's org)
   - [ ] Automation logs bulk delete (only affects user's org)
   - [ ] Automation logs clear action (only affects user's org)

5. **Edge Cases**
   - [ ] Expired session handling
   - [ ] Missing organizationId in session
   - [ ] SQL injection attempts (parameterized queries should prevent)
   - [ ] Concurrent requests from different orgs

### 🔄 **Automated Testing (Recommended)**

Create integration tests in `__tests__/api/` directory:

```typescript
describe('/api/automation-rules', () => {
  it('returns 401 without authentication', async () => {
    const res = await fetch('/api/automation-rules');
    expect(res.status).toBe(401);
  });

  it('returns only rules from user\'s organization', async () => {
    // Create rules for Org A and Org B
    // Login as Org A user
    // Verify only Org A rules returned
  });

  it('prevents cross-org updates', async () => {
    // Create rule in Org A
    // Try to update as Org B user
    // Verify 404 or 403
  });
});
```

---

## Security Considerations

### ✅ **What's Secure**

1. **Session-based authentication** - Uses better-auth with session validation
2. **Parameterized queries** - All SQL uses `$1`, `$2`, etc. (prevents SQL injection)
3. **Organization scoping** - Every query filters by `organization_id`
4. **No hardcoded users** - All references to `"john.doe@example.com"` removed

### ⚠️ **What to Monitor**

1. **Session expiration** - Ensure sessions expire appropriately
2. **Rate limiting** - Consider adding rate limits to prevent abuse
3. **Audit logging** - Log sensitive operations (delete, bulk actions)
4. **Error messages** - Don't leak sensitive info in error responses

### 🔒 **Future Enhancements**

1. **Role-based access control (RBAC)** - Admin vs. Member permissions
2. **API key authentication** - For programmatic access
3. **Webhook signatures** - Verify webhook authenticity
4. **CSRF protection** - Already handled by better-auth, but verify

---

## Performance Optimizations

### ✅ **Indexes Added (via migration)**

The migration script adds these indexes:

```sql
-- Single-column indexes
CREATE INDEX idx_conversations_org_id ON sdr_conversations(organization_id);
CREATE INDEX idx_automation_rules_org_id ON automation_rules(organization_id);
CREATE INDEX idx_automation_logs_org_id ON automation_logs(organization_id);
-- ... etc for all tables

-- Composite indexes for common queries
CREATE INDEX idx_conversations_org_status ON sdr_conversations(organization_id, status);
CREATE INDEX idx_exports_org_status_created ON crm_exports(organization_id, status, created_at DESC);
CREATE INDEX idx_rules_org_enabled ON automation_rules(organization_id, enabled);
CREATE INDEX idx_logs_org_status_created ON automation_logs(organization_id, status, created_at DESC);
```

### 📊 **Query Performance**

Before deploying, run `EXPLAIN ANALYZE` on slow queries:

```sql
EXPLAIN ANALYZE
SELECT * FROM automation_logs
WHERE organization_id = 'org-123'
  AND status = 'success'
ORDER BY created_at DESC
LIMIT 50;
```

Look for:
- **Seq Scan** → Bad (add index)
- **Index Scan** → Good
- **Bitmap Index Scan** → Good for multiple conditions

---

## Rollback Plan

If authentication causes issues in production:

### Quick Rollback (Temporary)

1. **Revert API route changes:**
   ```bash
   git revert <commit-hash>
   git push
   ```

2. **Remove organization filters temporarily:**
   ```typescript
   // Emergency: Remove org filter (NOT RECOMMENDED)
   const rows = await queryInternalDatabase(
     `SELECT * FROM table_name`, // No WHERE clause
     []
   );
   ```

### Proper Rollback

1. Drop `organization_id` columns (will lose org isolation):
   ```sql
   ALTER TABLE sdr_conversations DROP COLUMN organization_id;
   -- ... etc for all tables
   ```

2. Restore hardcoded user:
   ```typescript
   const EMERGENCY_USER = "john.doe@example.com";
   // Use in queries
   ```

---

## Next Steps

### Immediate (Day 1-2 Complete)

- [x] Create authentication helpers
- [x] Update API routes with authentication
- [x] Remove all hardcoded `"john.doe@example.com"` references
- [x] Create database migration script
- [ ] **Run database migration on Neon**
- [ ] **Test authentication flow end-to-end**

### Week 1 Remaining (Day 3-7)

- [ ] Add loading skeletons (Day 3)
- [ ] Add empty states (Day 4)
- [ ] Improve error messages (Day 5)
- [ ] Add input validation with Zod (Day 6-7)

### Week 2+

Continue with PRIORITY-MATRIX.md plan:
- Button polish + toast system (Day 8)
- Keyboard shortcuts (Day 9)
- Complete stubbed components (Week 3-4)
- API documentation (Week 5-6)
- Etc.

---

## Resources

- **Priority Matrix:** `PRIORITY-MATRIX.md`
- **Roadmap:** `STRIPE-POLISH-ROADMAP.md`
- **Migration Script:** `migrations/001_add_organization_id.sql`
- **Auth Helpers:** `src/server-lib/auth-helpers.ts`

---

**Last Updated:** Day 1-2 Complete (Week 1)
**Next Task:** Run database migration + test authentication
