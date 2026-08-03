# Section 16 Impact Assessment
## Associos Property Management Portal - Multi-Tenant Platform Amendment

**Date:** August 3, 2026  
**Assessment By:** OpenClaw  
**Amendment Version:** 1.1  
**Effective Date:** August 2, 2026

---

## Executive Summary

The Associos Property Management Portal has **significant foundational work already completed** toward multi-tenancy, but requires architectural alignment with the Amendment's specific hierarchy (Tenant → Portfolio → Association). The current implementation uses `business_id` as the tenant key, which maps to the Amendment's `tenant_id` concept. However, the **Portfolio layer is missing**, and GHL connections are not yet Association-level.

**Risk Level:** MEDIUM-HIGH  
**Estimated Implementation Time:** 3-4 weeks  
**Data Destruction Risk:** LOW (with proper migration sequence)

---

## 1. Current Single-Tenant Assumptions Found in Code and Schema

### 1.1 Already Addressed (Partial Multi-Tenancy Exists)

| Component | Current State | Amendment Gap |
|-----------|--------------|---------------|
| `business_id` column | ✅ Exists on all major tables | Maps to `tenant_id` - acceptable |
| `businesses` table | ✅ Exists | Needs rename to `tenants` or alias |
| `business_users` junction | ✅ Exists | Needs expansion for Portfolio assignments |
| Business isolation RLS | ✅ Implemented | Working foundation |
| `get_current_business_id()` | ✅ JWT-based function | Compatible with amendment |

### 1.2 Missing Multi-Tenant Components

| Component | Status | Impact |
|-----------|--------|--------|
| **Portfolios table** | ❌ Does not exist | **CRITICAL** - Core amendment requirement |
| **Portfolio → Association relationship** | ❌ Associations link directly to business | Requires schema change |
| **Association-level GHL connections** | ❌ Uses `ghl_credentials` table (global) | Must migrate to per-Association |
| **Plans & entitlements tables** | ❌ Do not exist | **CRITICAL** - Subscription management |
| **Platform Console routes** | ❌ Do not exist | **CRITICAL** - True Products Network admin |
| **Platform Admin role** | ❌ Not distinguished from Business Admin | Security boundary issue |
| **Association financial connections** | ❌ Do not exist | Future feature gap |

### 1.3 Single-Tenant Code Patterns Found

```typescript
// File: lib/business/business-context.ts
// Issue: No Portfolio context in session
export async function getCurrentBusiness(): Promise<Business | null> {
  // Only returns business, no Portfolio awareness
}

// File: lib/api/associations.ts
// Issue: No Portfolio filtering
export async function getAssociations(
  params: QueryParams = {},
  businessId?: string  // Only business, no Portfolio
)
```

### 1.4 Role System Gaps

| Amendment Role | Current Implementation | Gap |
|----------------|----------------------|-----|
| Platform Admin | ❌ Not implemented | Entirely missing |
| Platform Support | ❌ Not implemented | Entirely missing |
| Business Admin | ✅ `ADMIN_USER` exists | Needs rename/mapping |
| Portfolio Manager | ❌ Not implemented | **CRITICAL** - New role |
| Property Manager | ✅ Partial via `user_roles` | Needs Portfolio scope |
| Association Manager | ✅ Partial via `user_roles` | Needs validation |

---

## 2. Code and Screens That Can Remain Unchanged

### 2.1 Fully Compatible (No Changes Required)

| Component | Reason |
|-----------|--------|
| All form components (`components/forms/*.tsx`) | Business-logic only, no tenant logic |
| UI primitives (`components/ui/*.tsx`) | Pure presentation |
| API mappers (`lib/api/mappers.ts`) | Data transformation only |
| Dropdown settings (`lib/api/dropdowns.ts`) | Already business-scoped |
| Authentication UI (`app/(auth)/*`) | Login flow unchanged |
| Detail page layouts | Data presentation only |
| File upload components | Will inherit tenant scope from parent |

### 2.2 Compatible with Minor Updates

| Component | Required Change |
|-----------|-----------------|
| `lib/api/*.ts` | Add Portfolio filtering where applicable |
| `app/(portal)/management/*` | Add Portfolio selector/context |
| `app/(portal)/board/*` | Verify Association-scoped access |
| `app/(portal)/owner/*` | No changes (already scoped to user) |
| `app/(portal)/vendor/*` | No changes (already scoped to user) |

### 2.3 Screen Inventory (Current: 120+ routes)

**Tenant-Facing Screens (Existing - Remain):**
- Management Portal: ~45 screens
- Board Portal: ~10 screens  
- Owner/Resident Portal: ~15 screens
- Vendor Portal: ~8 screens
- Admin (Business): ~10 screens

**Platform Console Screens (New Required - PL-01 to PL-12):**
- 12 new screens for True Products Network Platform Admin

---

## 3. Database Migrations and Backfill Approach

### 3.1 Migration Sequence (Non-Destructive)

```sql
-- PHASE 1: Create New Platform Tables (Safe - No existing data impact)
1. CREATE TABLE tenants (rename from businesses or create new)
2. CREATE TABLE tenant_subscriptions
3. CREATE TABLE plans
4. CREATE TABLE features
5. CREATE TABLE plan_features
6. CREATE TABLE tenant_entitlements
7. CREATE TABLE portfolios
8. CREATE TABLE portfolio_user_assignments
9. CREATE TABLE association_ghl_connections
10. CREATE TABLE association_financial_connections
11. CREATE TABLE platform_audit_events
12. CREATE TABLE support_access_sessions

-- PHASE 2: Modify Existing Tables (Requires backfill)
13. ALTER TABLE associations ADD COLUMN portfolio_id UUID
14. CREATE INDEX idx_associations_portfolio ON associations(portfolio_id)
15. UPDATE associations SET portfolio_id = (SELECT id FROM portfolios WHERE tenant_id = business_id LIMIT 1)
16. ALTER TABLE associations ALTER COLUMN portfolio_id SET NOT NULL

-- PHASE 3: Rename/Alias tenant key (Optional - can keep business_id)
-- Option A: Keep business_id as physical column (recommended)
-- Option B: Rename to tenant_id (requires code changes)

-- PHASE 4: RLS Policy Updates
17. Add portfolio-scoped policies where needed
18. Add tenant-scoped policies for new tables
```

### 3.2 Backfill Strategy for Exemplary Services LLC

```sql
-- Step 1: Create tenant record for Exemplary Services
INSERT INTO tenants (id, name, code, status, created_at)
VALUES (
  gen_random_uuid(),
  'Exemplary Services LLC',
  'exemplary-services',
  'active',
  NOW()
);

-- Step 2: Create default Portfolio
INSERT INTO portfolios (id, tenant_id, name, is_default, created_at)
SELECT 
  gen_random_uuid(),
  t.id,
  'Default Portfolio',
  true,
  NOW()
FROM tenants t WHERE t.code = 'exemplary-services';

-- Step 3: Link existing associations to Portfolio
UPDATE associations a
SET portfolio_id = p.id
FROM portfolios p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.code = 'exemplary-services';

-- Step 4: Migrate GHL credentials to Association-level
INSERT INTO association_ghl_connections (
  association_id,
  ghl_location_id,
  ghl_company_id,
  -- other fields
)
SELECT 
  a.id,
  g.location_id,
  g.company_id,
  -- map other fields
FROM associations a
JOIN ghl_credentials g ON g.business_id = a.business_id;
```

### 3.3 Migration Safety Measures

| Measure | Implementation |
|---------|---------------|
| Transaction wrapping | Each phase in single transaction |
| Rollback scripts | Generate reverse migrations before running |
| Data preservation | No DELETE or DROP until Phase 5 (cleanup) |
| Verification queries | Count records before/after each phase |
| Feature flags | Gate new behavior behind flags |

---

## 4. Tenant-Isolation Policy Design

### 4.1 Current RLS Foundation (Working)

```sql
-- Current working pattern
CREATE POLICY associations_business_isolation ON associations
    FOR ALL USING (
        business_id = get_current_business_id() 
        OR is_admin_from_jwt()
    );
```

### 4.2 Required RLS Additions

```sql
-- Portfolio-scoped access for Portfolio Managers
CREATE POLICY associations_portfolio_isolation ON associations
    FOR ALL USING (
        portfolio_id IN (
            SELECT portfolio_id FROM portfolio_user_assignments
            WHERE user_id = auth.uid()
            AND role = 'PORTFOLIO_MANAGER'
        )
        OR business_id = get_current_business_id() AND is_business_admin()
        OR is_platform_admin()
    );

-- Platform Admin support access (audited)
CREATE POLICY support_access_isolation ON associations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM support_access_sessions
            WHERE platform_user_id = auth.uid()
            AND tenant_id = associations.business_id
            AND started_at <= NOW()
            AND (ended_at IS NULL OR ended_at >= NOW())
        )
    );
```

### 4.3 Application-Level Isolation

```typescript
// Required pattern for all API calls
export async function getAssociations(
  params: QueryParams,
  context: TenantContext  // New required parameter
) {
  const { tenantId, portfolioId, userRole } = context;
  
  // Server-side tenant verification
  if (!await verifyTenantAccess(userId, tenantId)) {
    throw new AuthorizationError();
  }
  
  // Apply portfolio filter for Portfolio Managers
  if (userRole === 'PORTFOLIO_MANAGER' && portfolioId) {
    query = query.eq('portfolio_id', portfolioId);
  }
  
  // Always filter by tenant
  query = query.eq('business_id', tenantId);
}
```

---

## 5. Portfolio and Role Changes

### 5.1 New Database Schema Required

```sql
-- Portfolios table
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio user assignments
CREATE TABLE portfolio_user_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    role TEXT NOT NULL CHECK (role IN ('PORTFOLIO_MANAGER', 'PORTFOLIO_VIEWER')),
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(portfolio_id, user_id)
);

-- Modify associations to link to portfolio
ALTER TABLE associations ADD COLUMN portfolio_id UUID REFERENCES portfolios(id);
```

### 5.2 Role Hierarchy Implementation

```typescript
// lib/permissions/roles.ts - Updated
export const PLATFORM_ROLES = {
  PLATFORM_ADMIN: 'platform_admin',      // True Products Network
  PLATFORM_SUPPORT: 'platform_support',  // Audited support access
} as const;

export const TENANT_ROLES = {
  BUSINESS_ADMIN: 'business_admin',      // Was ADMIN_USER
  PORTFOLIO_MANAGER: 'portfolio_manager', // NEW
  PROPERTY_MANAGER: 'property_manager',
  ASSOCIATION_MANAGER: 'association_manager',
  BOOKKEEPER: 'bookkeeper',
  BOARD_MEMBER: 'board_member',
  OWNER: 'owner',
  RESIDENT: 'resident',
  VENDOR: 'vendor',
} as const;

// Role scope checking
export function canAccessPortfolio(
  userId: string,
  portfolioId: string,
  requiredRole: string
): Promise<boolean>;
```

### 5.3 UI Changes for Portfolio Support

```typescript
// New component: PortfolioSelector
// Location: components/PortfolioSelector.tsx
// Shows when user has multiple Portfolio assignments

// New component: PortfolioContextProvider
// Wraps tenant-facing pages to provide Portfolio context
```

---

## 6. Plan and Entitlement Design

### 6.1 Required Tables

```sql
-- Feature catalog (stable codes)
CREATE TABLE features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,  -- e.g., 'core.associations', 'maintenance.advanced'
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    default_limit INTEGER,  -- NULL = unlimited
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan definitions
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,  -- e.g., 'basic', 'growth', 'premium'
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan feature defaults
CREATE TABLE plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id),
    feature_id UUID NOT NULL REFERENCES features(id),
    is_enabled BOOLEAN DEFAULT false,
    limit_value INTEGER,  -- NULL = unlimited, overrides feature.default_limit
    UNIQUE(plan_id, feature_id)
);

-- Tenant subscriptions
CREATE TABLE tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    plan_id UUID NOT NULL REFERENCES plans(id),
    status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'cancelled', 'suspended')),
    billing_reference TEXT,  -- GHL customer/subscription ID
    effective_date DATE NOT NULL,
    cancellation_date DATE,
    grace_period_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant entitlements (add-ons, overrides)
CREATE TABLE tenant_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    feature_id UUID NOT NULL REFERENCES features(id),
    entitlement_type TEXT NOT NULL CHECK (entitlement_type IN ('addon', 'override', 'trial')),
    is_enabled BOOLEAN DEFAULT true,
    limit_value INTEGER,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    reason TEXT,
    granted_by UUID REFERENCES auth.users(id),  -- Platform Admin
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Entitlement Resolution Service

```typescript
// lib/entitlements/service.ts
export class EntitlementService {
  async resolveEntitlement(
    tenantId: string,
    featureCode: string
  ): Promise<EntitlementResult> {
    // 1. Get active subscription
    // 2. Get plan defaults for feature
    // 3. Apply tenant entitlements (overrides/add-ons)
    // 4. Check limits against usage
    // 5. Return resolved access
  }
  
  async checkLimit(
    tenantId: string,
    featureCode: string,
    currentUsage: number
  ): Promise<boolean>;
}
```

### 6.3 Seed Data (Example Plans)

```sql
-- Insert core features
INSERT INTO features (code, name, category) VALUES
('core.associations', 'Associations', 'core'),
('core.properties', 'Properties', 'core'),
('core.units', 'Units', 'core'),
('core.people', 'People', 'core'),
('maintenance.basic', 'Basic Maintenance', 'maintenance'),
('maintenance.advanced', 'Advanced Maintenance', 'maintenance'),
('inspections', 'Inspections', 'operations'),
('documents.library', 'Document Library', 'operations'),
('compliance', 'Compliance', 'operations'),
('vendor_portal', 'Vendor Portal', 'portals'),
('board_portal', 'Board Portal', 'portals'),
('payments', 'Payments', 'financial'),
('reports.standard', 'Standard Reports', 'reports'),
('reports.advanced', 'Advanced Reports', 'reports'),
('ghl.automation', 'GHL Automation', 'integrations'),
('portfolios.multiple', 'Multiple Portfolios', 'core');

-- Insert plans
INSERT INTO plans (code, name) VALUES
('basic', 'Basic'),
('growth', 'Growth'),
('premium', 'Premium'),
('enterprise', 'Enterprise');
```

---

## 7. Platform Console Route and Authorization Plan

### 7.1 Route Structure

```
app/
├── (portal)/                    # Tenant-facing (existing)
│   ├── management/
│   ├── board/
│   ├── owner/
│   ├── vendor/
│   └── admin/                   # Business Admin (tenant-scoped)
├── (platform)/                  # NEW: Platform Console
│   ├── layout.tsx               # Platform Admin layout
│   ├── page.tsx                 # PL-01: Platform Dashboard
│   ├── tenants/                 # PL-02, PL-03, PL-04
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   └── new/
│   ├── plans/                   # PL-05, PL-06
│   │   ├── page.tsx
│   │   └── features/
│   ├── entitlements/            # PL-07
│   ├── usage/                   # PL-08
│   ├── users/                   # PL-09
│   ├── integrations/            # PL-10
│   ├── audit/                   # PL-11
│   └── health/                  # PL-12
```

### 7.2 Middleware Authorization

```typescript
// middleware.ts - Add Platform Admin check
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Platform routes require PLATFORM_ADMIN role
  if (pathname.startsWith('/(platform)')) {
    const token = await getToken(request);
    if (!token?.roles?.includes('PLATFORM_ADMIN')) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  // Existing tenant route checks...
}
```

### 7.3 Platform Console Screens Detail

| ID | Screen | Key Features |
|----|--------|--------------|
| PL-01 | Platform Dashboard | Tenant count, active subscriptions, alerts, integration health |
| PL-02 | Business Accounts | Searchable tenant list, status filters, quick actions |
| PL-03 | Business Account Detail | Tenant profile, Portfolios, users, activity timeline |
| PL-04 | Provision/Edit Tenant | Create, suspend, reactivate, configure tenant |
| PL-05 | Plans | CRUD plan definitions, versioning |
| PL-06 | Feature Catalog | Manage features, dependencies, display info |
| PL-07 | Entitlements | Assign add-ons, trials, overrides with dates |
| PL-08 | Usage & Limits | View usage, limits, warnings, blocked actions |
| PL-09 | Platform Users | Manage True Products Network personnel |
| PL-10 | Association Integrations | Review GHL/financial mappings, status |
| PL-11 | Platform Audit Log | Tenant provisioning, plan changes, support access |
| PL-12 | Platform Health | Job queues, webhook errors, sync status |

---

## 8. Association-Level GHL Connection Changes

### 8.1 Current State

```sql
-- Current: Global GHL credentials per business
CREATE TABLE ghl_credentials (
    id UUID PRIMARY KEY,
    business_id UUID REFERENCES businesses(id),
    location_id TEXT,
    company_id TEXT,
    -- ...
);
```

### 8.2 Target State

```sql
-- Target: Association-level GHL connections
CREATE TABLE association_ghl_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id),
    
    -- GHL Location mapping (non-secret)
    ghl_location_id TEXT NOT NULL,
    ghl_company_id TEXT,
    ghl_location_name TEXT,
    
    -- Configuration
    is_active BOOLEAN DEFAULT true,
    sync_enabled BOOLEAN DEFAULT true,
    webhook_secret_reference TEXT,  -- Reference to secret manager, not the secret
    
    -- Status
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT,
    last_error TEXT,
    
    -- Metadata
    connected_by UUID REFERENCES auth.users(id),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ,
    disconnect_reason TEXT,
    
    UNIQUE(association_id)
);

-- Index for GHL lookups
CREATE INDEX idx_ghl_conn_location ON association_ghl_connections(ghl_location_id);
```

### 8.3 Migration Strategy

```sql
-- Step 1: Create new table
CREATE TABLE association_ghl_connections (...);

-- Step 2: Migrate existing data
INSERT INTO association_ghl_connections (
    association_id,
    ghl_location_id,
    ghl_company_id,
    connected_at
)
SELECT 
    a.id,
    g.location_id,
    g.company_id,
    NOW()
FROM associations a
JOIN ghl_credentials g ON g.business_id = a.business_id;

-- Step 3: Update integration workers to use new table
-- Step 4: Deprecate old table (keep for rollback)
```

### 8.4 Integration Worker Changes

```typescript
// lib/ghl/integration-worker.ts
export async function processIntegrationEvent(event: IntegrationEvent) {
  // OLD: Get GHL credentials from business level
  // const credentials = await getGhlCredentials(businessId);
  
  // NEW: Resolve Association from record, then get GHL connection
  const associationId = await resolveAssociationId(event.recordType, event.recordId);
  const ghlConnection = await getAssociationGhlConnection(associationId);
  
  if (!ghlConnection?.is_active) {
    throw new RetryableError('GHL connection inactive');
  }
  
  // Send to GHL with idempotency key
  await sendToGhl(ghlConnection.ghl_location_id, event, {
    idempotencyKey: event.idempotency_key,
    correlationId: event.correlation_id,
  });
}
```

---

## 9. Association Financial-System Mappings and Portfolio Reporting

### 9.1 Association Financial Connections

```sql
CREATE TABLE association_financial_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    association_id UUID NOT NULL REFERENCES associations(id),
    
    -- Financial system type
    provider TEXT NOT NULL CHECK (provider IN (
        'quickbooks_online',
        'quickbooks_desktop',
        'xero',
        'sage',
        'appfolio',
        'buildium',
        'custom'
    )),
    
    -- External reference (non-secret)
    external_account_id TEXT,
    external_account_name TEXT,
    
    -- Configuration
    import_enabled BOOLEAN DEFAULT false,
    import_schedule TEXT,  -- cron expression
    last_import_at TIMESTAMPTZ,
    last_import_status TEXT,
    
    -- Permissions
    allowed_sync_directions TEXT[] DEFAULT ARRAY['inbound'],  -- inbound, outbound
    allowed_data_types TEXT[] DEFAULT ARRAY['transactions', 'balances'],
    
    -- Secret reference (actual credentials in secret manager)
    credentials_reference TEXT,
    
    -- Metadata
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    connected_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(association_id, provider)
);
```

### 9.2 Portfolio Reporting (Read-Only Consolidation)

```sql
-- Portfolio reports are views, not stored ledger data
CREATE VIEW portfolio_financial_summary AS
SELECT 
    p.id as portfolio_id,
    p.tenant_id,
    p.name as portfolio_name,
    COUNT(DISTINCT a.id) as association_count,
    -- Aggregated from Association financial systems (read-only)
    SUM(afs.total_revenue) as consolidated_revenue,
    SUM(afs.total_expenses) as consolidated_expenses,
    SUM(afs.outstanding_payables) as consolidated_payables,
    -- etc.
FROM portfolios p
JOIN associations a ON a.portfolio_id = p.id
LEFT JOIN association_financial_summaries afs ON afs.association_id = a.id
GROUP BY p.id, p.tenant_id, p.name;

-- IMPORTANT: No bank_account_id, no ledger entries, no payment processing
-- Portfolio only CONSOLIDATES Association data for reporting
```

---

## 10. True Products Network Subscription Billing Callback Design

### 10.1 Billing System Architecture

```
True Products Network GHL Billing System (Separate)
  ↓
Webhook callback to Associos Platform
  ↓
Verify signature, process event
  ↓
Update tenant_subscriptions
  ↓
Trigger entitlement recalculation
```

### 10.2 Webhook Handler

```typescript
// app/api/webhooks/billing/route.ts
export async function POST(request: Request) {
  // Verify webhook signature from True Products Network GHL
  const signature = request.headers.get('x-tpn-signature');
  const payload = await request.json();
  
  if (!verifyBillingWebhook(signature, payload)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const { event_type, data } = payload;
  
  switch (event_type) {
    case 'subscription.created':
      await handleSubscriptionCreated(data);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(data);
      break;
    case 'subscription.cancelled':
      await handleSubscriptionCancelled(data);
      break;
    case 'payment.succeeded':
      await handlePaymentSucceeded(data);
      break;
    case 'payment.failed':
      await handlePaymentFailed(data);
      break;
  }
  
  return new Response('OK', { status: 200 });
}

async function handleSubscriptionUpdated(data: BillingEvent) {
  await supabase
    .from('tenant_subscriptions')
    .update({
      plan_id: data.plan_id,
      status: data.status,
      billing_reference: data.subscription_id,
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', data.tenant_id);
  
  // Recalculate entitlements
  await entitlementService.invalidateCache(data.tenant_id);
}
```

### 10.3 Billing Events Table

```sql
CREATE TABLE billing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    event_type TEXT NOT NULL,
    billing_reference TEXT,  -- GHL subscription/payment ID
    amount DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    status TEXT,
    metadata JSONB,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by UUID REFERENCES auth.users(id)  -- For manual entries
);
```

---

## 11. Test and Rollback Plan

### 11.1 Test Strategy

| Test Category | Tests Required |
|--------------|----------------|
| Tenant Isolation | Cross-tenant access attempts, URL parameter tampering, RLS bypass attempts |
| Portfolio Scope | Portfolio Manager access boundaries, Association visibility |
| Entitlements | Feature enable/disable, limit enforcement, add-on activation |
| GHL Integration | Association-level routing, credential isolation, retry behavior |
| Billing Webhooks | Signature verification, idempotency, edge cases |
| Platform Console | Role-based access, audit logging, support session boundaries |

### 11.2 Rollback Plan

| Phase | Rollback Action |
|-------|-----------------|
| Phase 1 (New tables) | DROP new tables, no data impact |
| Phase 2 (Alter tables) | Restore from backup, revert column additions |
| Phase 3 (RLS changes) | Disable new policies, re-enable old |
| Phase 4 (Data migration) | Restore associations.portfolio_id to NULL |
| Phase 5 (Code deploy) | Revert to previous deployment |

### 11.3 Verification Checklist

- [ ] All existing tests pass
- [ ] New tenant can be provisioned end-to-end
- [ ] Exemplary Services data intact and accessible
- [ ] Cross-tenant queries blocked at DB level
- [ ] GHL events route to correct Association
- [ ] Platform Console accessible only to Platform Admins
- [ ] Audit logs capture all privileged actions
- [ ] Billing webhooks process correctly

---

## 12. Risks and Unresolved Decisions

### 12.1 High-Risk Items

| Risk | Mitigation |
|------|------------|
| **Data migration failure** | Full backup before migration, transaction wrapping, verification queries |
| **GHL integration disruption** | Maintain backward compatibility during transition, test with mock adapter |
| **Performance degradation** | Add indexes before migration, load test with realistic data volumes |
| **Authorization bypass** | Comprehensive security testing, RLS policy review |

### 12.2 Unresolved Decisions (Require Nigel Input)

| Decision | Options | Recommendation |
|----------|---------|----------------|
| **Physical tenant key name** | Keep `business_id` vs rename to `tenant_id` | Keep `business_id` - less migration risk |
| **Plan names** | Basic/Growth/Premium/Enterprise vs custom | Use seed names, allow customization later |
| **Default Portfolio naming** | "Default" vs "Main" vs company name | "Default Portfolio" with ability to rename |
| **Portfolio Manager permissions** | Can they create Associations? | Yes, within their assigned Portfolios |
| **Support session duration** | Fixed (1 hour) vs configurable | Configurable with 1 hour default |
| **Billing grace period** | 3 days, 7 days, 14 days | 7 days default, tenant-specific override |

### 12.3 Technical Debt Items

1. **Role migration**: Existing `ADMIN_USER` roles need migration to `BUSINESS_ADMIN`
2. **GHL credentials**: Need secure migration from global to Association-level
3. **Feature flags**: Current system needs migration to new entitlement model
4. **Test data**: Mock adapter needs Portfolio and tenant context

---

## 13. Recommended Implementation Order

### Phase 1: Foundation (Week 1)
1. Create all new platform tables (tenants, plans, features, portfolios, etc.)
2. Add Portfolio support to schema
3. Create Platform Console shell routes
4. Implement entitlement service (read-only)

### Phase 2: Migration (Week 1-2)
5. Backfill Exemplary Services as first tenant
6. Create default Portfolio, link existing Associations
7. Migrate GHL credentials to Association-level
8. Add Portfolio context to existing APIs

### Phase 3: Authorization (Week 2)
9. Implement Platform Admin role and middleware
10. Build Platform Console screens (PL-01 to PL-12)
11. Add Portfolio Manager role and permissions
12. Update RLS policies for Portfolio scope

### Phase 4: Integration (Week 3)
13. Implement billing webhook handlers
14. Build entitlement enforcement in UI
15. Add Association-level GHL integration
16. Implement financial connection mappings

### Phase 5: Testing & Cleanup (Week 4)
17. Comprehensive isolation testing
18. Performance testing
19. Documentation updates
20. Deprecate old GHL credentials table

---

## 14. Conclusion

The Associos Property Management Portal has a **solid foundation** for multi-tenancy with the existing `business_id` isolation. The primary gaps are:

1. **Portfolio layer** - Missing entirely, requires schema and UI changes
2. **Platform Console** - 12 new screens for True Products Network administration
3. **Plans & Entitlements** - Subscription management system not yet built
4. **Association-level GHL** - Currently business-level, needs per-Association mapping

**No production migrations should be run until:**
- This assessment is approved
- Unresolved decisions are answered
- Full backup is verified
- Rollback procedures are tested

The existing 120+ screens and working business logic can be preserved with targeted modifications for Portfolio context and entitlement checks.

---

**Assessment Complete**  
**Awaiting Approval Before Implementation**
