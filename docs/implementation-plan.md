# Implementation Plan
## Exemplary Property Management Portal

**Stage:** 0 — Discovery and Plan  
**Date:** July 31, 2026  
**Status:** Complete — Pending Approval

---

## 1. Repository Assessment

### 1.1 Current State
The repository has been cloned and contains:

| File | Purpose | Status |
|------|---------|--------|
| `README.md` | Repository overview | ✅ Present |
| `OpenClaw_Portal_Build_Prompt.md` | Build control instructions | ✅ Present |
| `Emma_Property_Management_Portal_Complete_Build_Specification_V1.md` | Full 114-screen spec | ✅ Present |
| `Management-dashboard.pdf` | PDF reference (management) | ✅ Present |
| `Maintenance-request-detail.pdf` | PDF reference (maintenance) | ✅ Present |
| `management-dashboard.png` | PNG reference (management) | ✅ Present |
| `maintenance-request-detail.png` | PNG reference (maintenance) | ✅ Present |

### 1.2 Canonical Paths Created
✅ `docs/build-specification.md` — Copy of full specification  
✅ `assets/reference-screens/management-dashboard.png` — PNG reference  
✅ `assets/reference-screens/maintenance-request-detail.png` — PNG reference  

Original files preserved in repository root.

### 1.3 Existing Application
**No existing application detected.** Starting from clean repository.

---

## 2. Proposed Application Architecture

### 2.1 Technology Stack
| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | Spec requirement, server components for GHL security |
| Language | TypeScript (strict) | Spec requirement, type safety |
| Styling | Tailwind CSS | Spec requirement, rapid UI development |
| UI Components | shadcn/ui + custom | Accessible, reusable, matches design system |
| Validation | Zod | Spec requirement for all schemas |
| Database | PostgreSQL via Supabase | Spec requirement, RLS, auth, file storage |
| ORM | Prisma | Type-safe database access |
| Testing | Vitest + Playwright | Spec requirement |
| GHL Integration | Server-side adapter pattern | Spec requirement, no browser token exposure |

### 2.2 Project Structure
```
property-management-portal/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group (no sidebar)
│   │   ├── sign-in/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   ├── mfa-verify/
│   │   └── invitation/
│   ├── (portal)/                 # Portal group (with sidebar)
│   │   ├── layout.tsx            # Shared shell with role menu
│   │   ├── management/           # 56 screens (MG-01 to MG-56)
│   │   ├── admin/                # Admin-only (MG-49 to MG-56)
│   │   ├── owner/                # 17 screens (OR-01 to OR-17)
│   │   ├── board/                # 18 screens (BD-01 to BD-18)
│   │   └── vendor/               # 13 screens (VN-01 to VN-13)
│   ├── api/                      # Protected API routes
│   │   ├── auth/
│   │   ├── ghl/
│   │   ├── maintenance/
│   │   ├── inspections/
│   │   ├── documents/
│   │   ├── compliance/
│   │   ├── payments/
│   │   └── webhooks/
│   └── layout.tsx                # Root layout
├── components/
│   ├── shell/                    # Portal shell, sidebar, header
│   ├── ui/                       # shadcn/ui components
│   ├── cards/                    # Summary cards
│   ├── tables/                   # Data tables
│   ├── forms/                    # Form components
│   ├── timelines/                # Activity timelines
│   ├── status/                   # Status/urgency pills
│   └── workflow/                 # Workflow status components
├── lib/
│   ├── auth/                     # Auth utilities
│   ├── permissions/              # Role/permission checks
│   ├── ghl/                      # GHL adapter
│   │   ├── client.ts             # GhlClient
│   │   ├── repositories/         # GhlRecordRepository, etc.
│   │   ├── services/             # GhlWorkflowService
│   │   ├── webhooks.ts           # GhlWebhookVerifier
│   │   └── mock/                 # MockGhlAdapter
│   ├── payments/                 # Payment provider interface
│   ├── audit/                    # Audit logging
│   ├── cache/                    # Short-lived caching
│   └── utils.ts                  # Utilities
├── schemas/
│   ├── portal/                   # Portal input/output schemas
│   └── ghl/                      # GHL object schemas
├── prisma/
│   └── schema.prisma             # Database schema
├── tests/
│   ├── unit/                     # Vitest tests
│   ├── integration/              # API contract tests
│   └── e2e/                      # Playwright tests
├── docs/                         # Project documentation
│   ├── build-specification.md    # Full spec (canonical)
│   ├── implementation-plan.md    # This file
│   ├── build-decisions.md        # Decision log
│   ├── ghl-schema-inventory.md   # GHL object inventory
│   ├── ghl-field-map.md          # Field mappings
│   ├── workflow-map.md           # Workflow documentation
│   ├── permissions.md            # Permission matrix
│   ├── test-plan.md              # Testing strategy
│   └── project-status.md         # Screen completion matrix
└── assets/
    └── reference-screens/        # Approved visual references
```

---

## 3. Screen-to-Route Matrix

### 3.1 Shared Access Screens (10)
| ID | Screen | Route | Notes |
|----|--------|-------|-------|
| SH-01 | Sign In | `/sign-in` | Public |
| SH-02 | Forgot/Reset Password | `/forgot-password`, `/reset-password` | Public |
| SH-03 | Multi-Factor Verification | `/mfa-verify` | Protected |
| SH-04 | Invitation Acceptance | `/invitation` | Token-based |
| SH-05 | Role/Association Selector | `/select-context` | Multi-role users |
| SH-06 | Notification Center | `/notifications` | All roles |
| SH-07 | User Profile | `/profile` | All roles |
| SH-08 | Help and Emergency | `/help` | All roles |
| SH-09 | Access Denied | `/access-denied` | Error state |
| SH-10 | System Status | `/admin/system-status` | Admin only |

### 3.2 Management Screens (56)
| ID | Screen | Route |
|----|--------|-------|
| MG-01 | Portfolio Overview | `/management/overview` |
| MG-02 | Association List | `/management/associations` |
| MG-03 | Association Detail | `/management/associations/[id]` |
| MG-04 | Association Create/Edit | `/management/associations/new`, `/management/associations/[id]/edit` |
| MG-05 | Association Onboarding | `/management/associations/[id]/onboarding` |
| MG-06 | Property List | `/management/properties` |
| MG-07 | Property Detail | `/management/properties/[id]` |
| MG-08 | Property Create/Edit | `/management/properties/new`, `/management/properties/[id]/edit` |
| MG-09 | Unit List | `/management/units` |
| MG-10 | Unit Detail | `/management/units/[id]` |
| MG-11 | Unit Create/Edit | `/management/units/new`, `/management/units/[id]/edit` |
| MG-12 | People Directory | `/management/people` |
| MG-13 | Contact Detail | `/management/people/[id]` |
| MG-14 | Contact Create/Edit | `/management/people/new`, `/management/people/[id]/edit` |
| MG-15 | Relationship Manager | `/management/relationships` |
| MG-16 | Maintenance Queue | `/management/maintenance` |
| MG-17 | Maintenance Request Detail | `/management/maintenance/[id]` |
| MG-18 | New Maintenance Request | `/management/maintenance/new` |
| MG-19 | Maintenance Triage | `/management/maintenance/[id]/triage` |
| MG-20 | Vendor Assignment | `/management/maintenance/[id]/assignment` |
| MG-21 | Completion Review | `/management/maintenance/[id]/completion` |
| MG-22 | Vendor List | `/management/vendors` |
| MG-23 | Vendor Detail | `/management/vendors/[id]` |
| MG-24 | Vendor Create/Edit | `/management/vendors/new`, `/management/vendors/[id]/edit` |
| MG-25 | Vendor Credential Review | `/management/vendors/[id]/credentials` |
| MG-26 | Inspection Queue | `/management/inspections` |
| MG-27 | Inspection Detail | `/management/inspections/[id]` |
| MG-28 | New/Schedule Inspection | `/management/inspections/new` |
| MG-29 | Inspection Checklist | `/management/inspections/[id]/checklist` |
| MG-30 | Inspection Follow-Up | `/management/inspections/[id]/followup` |
| MG-31 | Document Library | `/management/documents` |
| MG-32 | Document Detail | `/management/documents/[id]` |
| MG-33 | Add/Issue Document | `/management/documents/new` |
| MG-34 | Document Expiration Queue | `/management/documents/expiration` |
| MG-35 | Compliance Queue | `/management/compliance` |
| MG-36 | Compliance Matter Detail | `/management/compliance/[id]` |
| MG-37 | New Compliance Matter | `/management/compliance/new` |
| MG-38 | Notice/Hearing/Resolution | `/management/compliance/[id]/process` |
| MG-39 | Approval Inbox | `/management/approvals` |
| MG-40 | Approval Detail | `/management/approvals/[id]` |
| MG-41 | Payment Handoff Summary | `/management/payments` |
| MG-42 | Communications Inbox | `/management/communications` |
| MG-43 | Announcement Composer | `/management/communications/announce` |
| MG-44 | Communication Detail | `/management/communications/[id]` |
| MG-45 | Reports Home | `/management/reports` |
| MG-46 | Report Detail/Export | `/management/reports/[id]` |
| MG-47 | Workflow Activity | `/management/workflow-activity` |
| MG-48 | Integration Error Queue | `/management/integration-errors` |
| MG-49 | Admin Home | `/admin` |
| MG-50 | Roles and Permissions | `/admin/roles` |
| MG-51 | Workflow Settings | `/admin/workflows` |
| MG-52 | Integration Settings | `/admin/integrations` |
| MG-53 | Dropdown Settings | `/admin/lists` |
| MG-54 | Audit Log | `/admin/audit` |
| MG-55 | User Maintenance | `/admin/users` |
| MG-56 | GHL Contact Role Mapping | `/admin/ghl-mapping` |

### 3.3 Owner/Resident Screens (17)
| ID | Screen | Route |
|----|--------|-------|
| OR-01 | Owner Home | `/owner` |
| OR-02 | My Property and Unit | `/owner/property` |
| OR-03 | Household Information | `/owner/household` |
| OR-04 | My Maintenance Requests | `/owner/maintenance` |
| OR-05 | Submit Maintenance Request | `/owner/maintenance/new` |
| OR-06 | Maintenance Request Detail | `/owner/maintenance/[id]` |
| OR-07 | Completion Confirmation | `/owner/maintenance/[id]/confirm` |
| OR-08 | My Inspections | `/owner/inspections` |
| OR-09 | Inspection Result Detail | `/owner/inspections/[id]` |
| OR-10 | My Documents | `/owner/documents` |
| OR-11 | Document View/Acknowledge | `/owner/documents/[id]` |
| OR-12 | Notices and Compliance | `/owner/notices` |
| OR-13 | Notice Response | `/owner/notices/[id]/respond` |
| OR-14 | Payments and Statements | `/owner/payments` |
| OR-15 | Messages | `/owner/messages` |
| OR-16 | Message Detail | `/owner/messages/[id]` |
| OR-17 | Contact Preferences | `/owner/preferences` |

### 3.4 Board Screens (18)
| ID | Screen | Route |
|----|--------|-------|
| BD-01 | Board Home | `/board` |
| BD-02 | Association Summary | `/board/association` |
| BD-03 | Approval Queue | `/board/approvals` |
| BD-04 | Approval Detail | `/board/approvals/[id]` |
| BD-05 | Maintenance Overview | `/board/maintenance` |
| BD-06 | Maintenance Detail | `/board/maintenance/[id]` |
| BD-07 | Inspection Overview | `/board/inspections` |
| BD-08 | Inspection Detail | `/board/inspections/[id]` |
| BD-09 | Compliance Overview | `/board/compliance` |
| BD-10 | Compliance/Hearing Detail | `/board/compliance/[id]` |
| BD-11 | Board Documents | `/board/documents` |
| BD-12 | Document View/Vote | `/board/documents/[id]` |
| BD-13 | Meetings List | `/board/meetings` |
| BD-14 | Meeting Detail | `/board/meetings/[id]` |
| BD-15 | Reports Home | `/board/reports` |
| BD-16 | Report Detail | `/board/reports/[id]` |
| BD-17 | Announcement Review | `/board/announcements` |
| BD-18 | Board Directory | `/board/directory` |

### 3.5 Vendor Screens (13)
| ID | Screen | Route |
|----|--------|-------|
| VN-01 | Vendor Home | `/vendor` |
| VN-02 | Assigned Jobs | `/vendor/jobs` |
| VN-03 | Job Detail | `/vendor/jobs/[id]` |
| VN-04 | Accept/Decline | `/vendor/jobs/[id]/respond` |
| VN-05 | Quote Submission | `/vendor/jobs/[id]/quote` |
| VN-06 | Schedule Confirmation | `/vendor/jobs/[id]/schedule` |
| VN-07 | Work Progress Update | `/vendor/jobs/[id]/progress` |
| VN-08 | Work Completion | `/vendor/jobs/[id]/complete` |
| VN-09 | Completed Work History | `/vendor/history` |
| VN-10 | Invoice Submission | `/vendor/invoices` |
| VN-11 | Vendor Documents | `/vendor/documents` |
| VN-12 | Company Profile | `/vendor/profile` |
| VN-13 | Vendor Messages | `/vendor/messages` |

### 3.6 Shared Template Strategy

| Template Pattern | Screens Using It |
|-----------------|------------------|
| **List View** | MG-02, MG-06, MG-09, MG-12, MG-16, MG-22, MG-26, MG-31, MG-35, MG-39, MG-42, MG-45, MG-47, MG-48, OR-04, OR-08, OR-10, OR-15, BD-03, BD-05, BD-07, BD-09, BD-11, BD-13, BD-15, VN-02, VN-09, VN-11, VN-13 |
| **Detail View** | MG-03, MG-07, MG-10, MG-13, MG-17, MG-23, MG-27, MG-32, MG-36, MG-40, MG-44, MG-46, OR-02, OR-06, OR-09, OR-11, OR-16, BD-02, BD-04, BD-06, BD-08, BD-10, BD-12, BD-14, BD-16, BD-18, VN-03 |
| **Create/Edit Form** | MG-04, MG-08, MG-11, MG-14, MG-18, MG-24, MG-28, MG-33, MG-37, OR-05, OR-13 |
| **Process/Workflow** | MG-05, MG-19, MG-20, MG-21, MG-29, MG-30, MG-38, OR-07, VN-04, VN-05, VN-06, VN-07, VN-08 |
| **Admin Configuration** | MG-49-56 |

---

## 4. GHL Inventory and Mapping Plan

### 4.1 Objects to Inventory
| Object | Status | Priority |
|--------|--------|----------|
| Contact | Existing | High |
| Company (Association) | Existing | High |
| Company (Vendor) | Existing | High |
| Property (Custom Object) | Existing | High |
| Unit (Custom Object) | Existing | High |
| Maintenance Request (Custom Object) | Existing | High |
| Inspection (Custom Object) | Existing | Medium |
| Document Record (Custom Object) | Existing | Medium |
| Compliance Matter (Custom Object) | Existing | Medium |

### 4.2 Inventory Tasks
1. **Schema Discovery** — List all fields, types, dropdown values, record types
2. **Relationship Mapping** — Document all object relationships
3. **Internal ID Collection** — Capture field IDs, object IDs, pipeline IDs
4. **Comparison Analysis** — Map against specification requirements (Sections 5, 17, 19, 21-24, 28, 29)
5. **Gap Analysis** — Classify fields as: existing/usable, existing/remap-needed, missing/approval-needed, portal-only
6. **Approval Presentation** — Present difference report before schema changes

### 4.3 GHL Adapter Interface
```typescript
// Core interfaces to implement
interface GhlClient {
  authenticate(): Promise<AuthResult>;
  request<T>(config: RequestConfig): Promise<T>;
  handleRateLimit(): Promise<void>;
}

interface GhlRecordRepository {
  findContacts(filter: ContactFilter): Promise<Paginated<Contact>>;
  findAssociations(filter: AssociationFilter): Promise<Paginated<Association>>;
  findProperties(filter: PropertyFilter): Promise<Paginated<Property>>;
  findUnits(filter: UnitFilter): Promise<Paginated<Unit>>;
  findMaintenanceRequests(filter: MaintenanceFilter): Promise<Paginated<MaintenanceRequest>>;
  findInspections(filter: InspectionFilter): Promise<Paginated<Inspection>>;
  findDocuments(filter: DocumentFilter): Promise<Paginated<Document>>;
  findComplianceMatters(filter: ComplianceFilter): Promise<Paginated<ComplianceMatter>>;
  create<T>(type: RecordType, data: T): Promise<CreateResult<T>>;
  update<T>(type: RecordType, id: string, data: Partial<T>): Promise<UpdateResult<T>>;
}

interface GhlWorkflowService {
  trigger(workflowCode: string, context: WorkflowContext): Promise<WorkflowResult>;
  getStatus(correlationId: string): Promise<WorkflowStatus>;
}

interface GhlWebhookVerifier {
  verifySignature(payload: string, signature: string, secret: string): boolean;
  parseEvent(payload: string): WebhookEvent;
}
```

---

## 5. Database Schema (Portal-Only)

### 5.1 Tables
```prisma
// Portal authentication & sessions
model PortalUser {
  id              String   @id @default(cuid())
  ghlContactId    String   @unique
  email           String   @unique
  passwordHash    String?
  mfaSecret       String?
  mfaEnabled      Boolean  @default(false)
  status          UserStatus @default(ACTIVE)
  lastSignInAt    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  sessions        PortalSession[]
  roles           UserRole[]
  auditEvents     AuditEvent[]
}

model PortalSession {
  id           String   @id @default(cuid())
  userId       String
  user         PortalUser @relation(fields: [userId], references: [id])
  token        String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  revokedAt    DateTime?
}

model UserRole {
  id            String   @id @default(cuid())
  userId        String
  user          PortalUser @relation(fields: [userId], references: [id])
  role          PortalRole
  associationId String?
  propertyId    String?
  unitId        String?
  vendorId      String?
  grantedAt     DateTime @default(now())
  grantedBy     String?
  revokedAt     DateTime?
}

// Idempotency & correlation
model IdempotencyKey {
  key         String   @id
  action      String
  payloadHash String
  result      Json?
  createdAt   DateTime @default(now())
  expiresAt   DateTime
}

model CorrelationRecord {
  id          String   @id @default(cuid())
  correlationId String @unique
  action      String
  status      String
  request     Json
  response    Json?
  createdAt   DateTime @default(now())
  completedAt DateTime?
}

// Integration & audit
model IntegrationEvent {
  id          String   @id @default(cuid())
  provider    String   // 'ghl', 'payment', etc.
  eventType   String
  status      String   // 'success', 'error', 'retry'
  payload     Json?
  error       Json?
  correlationId String?
  createdAt   DateTime @default(now())
}

model AuditEvent {
  id            String   @id @default(cuid())
  eventId       String   @unique
  occurredAt    DateTime @default(now())
  actorId       String
  actor         PortalUser @relation(fields: [actorId], references: [id])
  role          String
  associationId String?
  recordType    String?
  recordId      String?
  action        String
  previousValue Json?
  newValue      Json?
  correlationId String?
  ipAddress     String?
  userAgent     String?
}

// File metadata
model FileReference {
  id            String   @id @default(cuid())
  fileName      String
  storageKey    String   @unique
  contentType   String
  size          Int
  associationId String
  relatedType   String?
  relatedId     String?
  uploadedBy    String
  uploadedAt    DateTime @default(now())
  expiresAt     DateTime?
  scanStatus    String   @default('pending')
}

// Portal preferences
model UserPreference {
  id        String   @id @default(cuid())
  userId    String   @unique
  settings  Json     // { theme, notifications, filters, etc. }
  updatedAt DateTime @updatedAt
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  REVOKED
  PENDING_INVITE
}

enum PortalRole {
  ADMIN_USER
  MANAGEMENT_STAFF
  OWNER
  RESIDENT
  BOARD_MEMBER
  VENDOR
}
```

---

## 6. Authentication & Authorization Approach

### 6.1 Authentication Flow
1. User submits credentials to `/api/auth/sign-in`
2. Server validates against portal database
3. If MFA enabled → redirect to `/mfa-verify`
4. On success → create session, set HTTP-only cookie
5. Resolve GHL Contact and portal roles
6. Redirect to appropriate home or context selector

### 6.2 Authorization Layers
| Layer | Enforcement |
|-------|-------------|
| Route Middleware | Check authentication, redirect if needed |
| Role Guard | Verify role access to route segment |
| API Route Handler | Validate session, resolve permissions |
| Service Layer | Enforce record-scope checks |
| Database | RLS policies for portal tables |

### 6.3 Permission Resolution
```typescript
// Pseudocode for permission check
async function resolvePermissions(userId: string, context: RequestContext) {
  const user = await getPortalUser(userId);
  const roles = await getActiveRoles(userId);
  
  return {
    isAdmin: roles.some(r => r.role === 'ADMIN_USER'),
    associations: roles.map(r => r.associationId).filter(Boolean),
    properties: roles.map(r => r.propertyId).filter(Boolean),
    units: roles.map(r => r.unitId).filter(Boolean),
    vendors: roles.map(r => r.vendorId).filter(Boolean),
    // ... context-specific permissions
  };
}
```

---

## 7. File Storage Approach

### 7.1 Architecture
- **Storage Provider:** Supabase Storage (or S3-compatible)
- **Access Model:** Signed URLs with short expiration (15 min default)
- **Upload Flow:**
  1. Client requests upload URL from `/api/files/upload-url`
  2. Server validates permissions, generates signed URL
  3. Client uploads directly to storage
  4. Client confirms upload, server creates FileReference record
  5. Server creates/updates GHL Document Record

### 7.2 Security
- No public buckets for sensitive files
- Access check before every download
- File type whitelist validation
- Size limits per file type
- Malware scanning hook (quarantine state)
- Audit logging for all downloads

---

## 8. Staged Implementation Plan

### Stage 1 — Foundation (Est. 2-3 weeks)
- [ ] Initialize Next.js project with TypeScript, Tailwind
- [ ] Set up shadcn/ui component library
- [ ] Configure Prisma + Supabase
- [ ] Build design system (colors, typography, components)
- [ ] Implement authentication (sign-in, MFA, password reset)
- [ ] Create portal shell (sidebar, header, navigation)
- [ ] Build role-based routing and permission guards
- [ ] Implement GHL mock adapter
- [ ] Create audit and integration logging
- [ ] Build Admin Home and User Maintenance foundation
- [ ] Add TEST fixtures
- [ ] Write Stage 1 tests

### Stage 2 — Core Records (Est. 2 weeks)
- [ ] Association CRUD screens
- [ ] Property CRUD screens
- [ ] Unit CRUD screens
- [ ] People (Contacts) screens
- [ ] Vendor screens
- [ ] Relationship manager

### Stage 3 — Maintenance Journey (Est. 3 weeks)
- [ ] Management maintenance queue
- [ ] New maintenance request form
- [ ] Request detail with activity timeline
- [ ] Triage workflow
- [ ] Board approval workflow
- [ ] Vendor assignment and quote
- [ ] Completion and owner confirmation
- [ ] Owner, Board, Vendor variants
- [ ] End-to-end workflow testing

### Stage 4 — Inspections (Est. 2 weeks)
- [ ] Inventory existing GHL Inspection schema
- [ ] Inspection queue and calendar
- [ ] Scheduling workflow
- [ ] Checklist and findings
- [ ] Photos and documents
- [ ] Follow-up and handoffs

### Stage 5 — Documents & Compliance (Est. 2 weeks)
- [ ] Inventory existing Document Record schema
- [ ] Document library and detail
- [ ] Issue, signature, acknowledgment
- [ ] Inventory existing Compliance Matter schema
- [ ] Compliance queue and detail
- [ ] Notice, hearing, resolution workflow

### Stage 6 — Payment Framework (Est. 2 weeks)
- [ ] Complete payment discovery
- [ ] Build PaymentProvider interface
- [ ] Implement test/fake provider
- [ ] Owner payment screens (test data)
- [ ] Receipts and statements
- [ ] Admin monitoring views
- [ ] **BLOCKED:** Production processor selection

### Stage 7 — Communications, Reports, Admin (Est. 2 weeks)
- [ ] Messages and threads
- [ ] Announcements
- [ ] Reports and exports
- [ ] Workflow activity
- [ ] Integration error queue
- [ ] Complete Admin screens

### Stage 8 — Pilot (Est. 1-2 weeks)
- [ ] Load TEST records only
- [ ] Run all acceptance tests
- [ ] Test all roles
- [ ] Test Association separation
- [ ] Test workflows
- [ ] Test file permissions
- [ ] Responsive and accessibility testing
- [ ] Pilot-readiness report
- [ ] **WAIT:** Written approval for live data

---

## 9. Testing Plan

### 9.1 Unit Tests (Vitest)
- Schema validation
- Permission logic
- GHL adapter contracts
- Form conditional logic
- Utility functions

### 9.2 Integration Tests
- API route handlers
- Webhook verification
- Database operations
- GHL adapter with mock

### 9.3 End-to-End Tests (Playwright)
**Critical Journeys:**
1. Owner submits maintenance request
2. Management triages request
3. Board approves work
4. Vendor accepts and completes work
5. Owner confirms resolution
6. Inspection creates maintenance request
7. Document issued and acknowledged
8. Compliance matter moves to closure
9. Admin invites user and maps role
10. Cross-Association access denied

### 9.4 Accessibility Tests
- Keyboard navigation
- Focus visibility
- Screen reader labels
- Color contrast
- Responsive layouts

---

## 10. Blockers by Stage

### Current Stage 0 Blockers
**NONE** — Ready to proceed to Stage 1

### Stage 1 Blockers
| Blocker | Impact | Resolution |
|---------|--------|------------|
| GHL Location/Integration structure | GHL adapter setup | Nigel to confirm |
| Portal auth provider selection | Auth implementation | Decision needed |
| File storage provider | File handling | Decision needed |

### Stage 2+ Blockers
| Blocker | Impact | Resolution |
|---------|--------|------------|
| GHL field ID inventory | All record screens | Complete during Stage 1 |
| GHL Contact Role values | Role mapping | Admin User + Nigel approval |

### Production-Only Blockers
| Blocker | Impact | Resolution |
|---------|--------|------------|
| Payment processor selection | Live payments | After payment discovery |
| Pilot Association confirmation | First live data | Admin User approval |
| Live GHL credentials | Production integration | Security review + approval |

---

## 11. Files Created in Stage 0

| File | Purpose |
|------|---------|
| `docs/build-specification.md` | Canonical build specification |
| `docs/implementation-plan.md` | This document |
| `docs/build-decisions.md` | Decision log (initialized) |
| `docs/ghl-schema-inventory.md` | GHL inventory plan (initialized) |
| `docs/ghl-field-map.md` | Field mapping (initialized) |
| `docs/workflow-map.md` | Workflow documentation (initialized) |
| `docs/permissions.md` | Permission matrix (initialized) |
| `docs/test-plan.md` | Testing strategy (initialized) |
| `docs/project-status.md` | Screen completion matrix (initialized) |
| `assets/reference-screens/management-dashboard.png` | Visual reference |
| `assets/reference-screens/maintenance-request-detail.png` | Visual reference |

---

## 12. Open Decisions Log

| ID | Decision | Current Status | Stage |
|----|----------|----------------|-------|
| D-001 | Portal authentication provider | Supabase Auth recommended | 1 |
| D-002 | File storage provider | Supabase Storage recommended | 1 |
| D-003 | GHL location/organization structure | Pending Nigel confirmation | 1 |
| D-004 | GHL Contact Role exact values | Pending Admin User approval | 1 |
| D-005 | Payment processor | Deferred to Stage 6 | 6 |
| D-006 | Pilot Association | Pending Admin User confirmation | 8 |

---

## 13. Next Steps

Upon approval of Stage 0:

1. Initialize Next.js project with approved stack
2. Set up development environment
3. Begin Stage 1 — Foundation
4. Create TEST fixtures
5. Build authentication and portal shell
6. Implement mock GHL adapter
7. Build Admin Home and User Maintenance

---

**Stage 0 is complete. Ready to begin Stage 1 — Foundation.**

Awaiting approval to proceed.
