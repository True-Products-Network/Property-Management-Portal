# GHL Sync Layer Architecture

## Overview

The GHL Sync Layer is a bidirectional synchronization system that keeps the Property Management Portal and GoHighLevel (GHL) in sync. It handles real-time updates, webhooks, conflict resolution, and data integrity between the two systems.

## Core Principles

1. **GHL is the Source of Truth** for business records (Contacts, Companies, Custom Objects)
2. **Portal is the Interface** - all user interactions happen in the portal
3. **Bidirectional Sync** - changes in either system propagate to the other
4. **Event-Driven** - webhooks trigger immediate sync actions
5. **Idempotent** - duplicate events don't cause data corruption
6. **Resilient** - failed syncs retry with exponential backoff

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROPERTY MANAGEMENT PORTAL                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Web App    │  │   List Pages │  │ Detail Pages│  │  Input Forms │   │
│  │   (Next.js)  │  │              │  │             │  │              │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                 │                 │            │
│  ┌──────▼─────────────────▼─────────────────▼─────────────────▼───────┐   │
│  │                      Portal API Layer                              │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐  │   │
│  │  │/api/assoc..│ │/api/prop...│ │/api/cont...│ │ /api/mainten.. │  │   │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └───────┬────────┘  │   │
│  └────────┼──────────────┼──────────────┼────────────────┼───────────┘   │
│           │              │              │                │               │
│  ┌────────▼──────────────▼──────────────▼────────────────▼───────┐       │
│  │                    GHL Sync Layer                              │       │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │       │
│  │  │  Sync    │ │  Webhook │ │  Queue   │ │  Conflict        │  │       │
│  │  │  Engine  │ │  Handler │ │  Manager │ │  Resolver        │  │       │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │       │
│  └───────┼────────────┼────────────┼────────────────┼────────────┘       │
└──────────┼────────────┼────────────┼────────────────┼────────────────────┘
           │            │            │                │
           │     ┌──────┴──────┐     │                │
           │     │  Supabase   │     │                │
           │     │  (Queue &   │     │                │
           │     │   Cache)    │     │                │
           │     └─────────────┘     │                │
           │                         │                │
           ▼                         ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GOHIGHLEVEL (GHL)                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Contacts   │  │  Companies   │  │ Custom Obj   │  │  Workflows   │   │
│  │              │  │(Associations │  │(Properties,  │  │              │   │
│  │              │  │   Vendors)   │  │  Units, etc) │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Sync Engine (`/lib/ghl/sync-engine.ts`)

The core orchestrator that manages all synchronization operations.

```typescript
interface SyncEngine {
  // Push changes from Portal to GHL
  pushToGHL(entity: EntityType, id: string, data: unknown): Promise<SyncResult>;
  
  // Pull changes from GHL to Portal
  pullFromGHL(entity: EntityType, ghlId: string): Promise<SyncResult>;
  
  // Bidirectional sync - compare and resolve
  sync(entity: EntityType, id: string): Promise<SyncResult>;
  
  // Batch sync for initial load or recovery
  batchSync(entity: EntityType, filters?: SyncFilters): Promise<BatchSyncResult>;
}
```

**Responsibilities:**
- Validate data before sync
- Map portal fields to GHL fields
- Handle GHL API rate limits
- Log all sync operations
- Trigger retry on failure

### 2. Webhook Handler (`/app/api/webhooks/ghl/route.ts`)

Receives and processes GHL webhooks for real-time updates.

```typescript
// GHL Webhook Events We Handle:
interface GhlWebhookEvents {
  // Contact events
  'contact.create': ContactPayload;
  'contact.update': ContactPayload;
  'contact.delete': { id: string };
  
  // Company events  
  'company.create': CompanyPayload;
  'company.update': CompanyPayload;
  'company.delete': { id: string };
  
  // Custom object events
  'customObject.create': CustomObjectPayload;
  'customObject.update': CustomObjectPayload;
  'customObject.delete': { id: string };
  
  // Workflow events
  'workflow.completed': WorkflowPayload;
  'workflow.contactAdded': WorkflowContactPayload;
}
```

**Webhook Processing Flow:**
1. Receive webhook from GHL
2. Verify webhook signature (HMAC)
3. Check idempotency (deduplicate)
4. Parse payload
5. Queue for processing
6. Return 200 OK immediately
7. Process async (don't block GHL)

### 3. Queue Manager (`/lib/ghl/queue.ts`)

Manages sync jobs using Supabase as the queue backend.

```typescript
interface SyncJob {
  id: string;
  entityType: EntityType;
  entityId: string;
  operation: 'push' | 'pull' | 'resolve';
  priority: number; // 1-10, higher = more urgent
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  scheduledFor: string;
  completedAt?: string;
  error?: string;
  correlationId: string; // For tracing
}
```

**Queue Features:**
- Priority-based processing
- Exponential backoff for retries
- Dead letter queue for failed jobs
- Job deduplication
- Batch processing for efficiency

### 4. Conflict Resolver (`/lib/ghl/conflict-resolver.ts`)

Handles data conflicts when both systems have changes.

```typescript
interface ConflictResolution {
  entityType: EntityType;
  entityId: string;
  portalVersion: unknown;
  ghlVersion: unknown;
  portalModifiedAt: string;
  ghlModifiedAt: string;
  resolution: 'portal_wins' | 'ghl_wins' | 'merge' | 'manual';
  resolvedFields: Record<string, {
    portalValue: unknown;
    ghlValue: unknown;
    chosenValue: unknown;
    reason: string;
  }>;
}
```

**Conflict Resolution Rules:**
1. **Last Write Wins** - Compare timestamps, newer wins
2. **GHL Wins for External Data** - GHL contact data from forms
3. **Portal Wins for Operational Data** - Maintenance status, inspections
4. **Merge for Arrays** - Combine unique items (documents, notes)
5. **Manual Review for Critical** - Financial data, legal documents

### 5. Field Mapper (`/lib/ghl/field-mapper.ts`)

Maps fields between Portal and GHL schemas.

```typescript
// Example: Property Field Mapping
const propertyFieldMap: FieldMap = {
  // Portal field -> GHL field
  'id': 'id', // UUID stays same
  'propertyId': 'property_id', // Custom field
  'associationId': 'company_id', // GHL Company relationship
  'name': 'name',
  'addressStreet': 'address',
  'addressCity': 'city',
  'addressState': 'state',
  'addressZip': 'postal_code',
  'type': 'custom_fields.property_type',
  'status': 'custom_fields.property_status',
  'yearBuilt': 'custom_fields.year_built',
  'totalUnits': 'custom_fields.total_units',
  'managementStartDate': 'custom_fields.management_start_date',
  'accessInstructions': 'custom_fields.access_instructions',
  'emergencyNotes': 'custom_fields.emergency_notes',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
};
```

## Sync Flows

### Flow 1: Portal Creates Record → GHL

```
User submits form
    ↓
Portal API validates
    ↓
Create in Portal DB
    ↓
Queue "pushToGHL" job
    ↓
Sync Engine processes job
    ↓
Map fields to GHL format
    ↓
POST to GHL API
    ↓
Store GHL ID in Portal
    ↓
Trigger GHL workflow
    ↓
Log success
```

### Flow 2: GHL Updates → Portal

```
GHL user updates record
    ↓
GHL triggers webhook
    ↓
Portal receives webhook
    ↓
Verify signature
    ↓
Queue "pullFromGHL" job
    ↓
Sync Engine processes
    ↓
GET from GHL API
    ↓
Map fields to Portal format
    ↓
Update Portal DB
    ↓
Log success
```

### Flow 3: Bidirectional Conflict

```
Portal user edits record A
    ↓
GHL user edits same record A
    ↓
Portal saves to DB
    ↓
GHL sends webhook
    ↓
Portal detects conflict
    ↓
Conflict Resolver compares
    ↓
Apply resolution rules
    ↓
Update both systems
    ↓
Log resolution
```

## Entity Sync Strategies

| Entity | Sync Direction | Trigger | Strategy |
|--------|---------------|---------|----------|
| **Associations** | Portal → GHL | Form submit | Push on create, webhook on GHL update |
| **Properties** | Bidirectional | Form/webhook | Full sync with conflict resolution |
| **Units** | Bidirectional | Form/webhook | Full sync with conflict resolution |
| **Contacts** | GHL → Portal | Webhook | GHL is source, portal caches |
| **Vendors** | Bidirectional | Form/webhook | Full sync |
| **Maintenance** | Portal → GHL | Form submit | Portal drives, GHL workflows respond |
| **Inspections** | Bidirectional | Form/webhook | Full sync |
| **Documents** | Portal → GHL | Upload | Portal stores file, GHL stores metadata |
| **Compliance** | Bidirectional | Form/webhook | Full sync |
| **Payments** | Portal → Processor → GHL | Payment complete | Portal initiates, GHL records status |

## Database Schema

### Sync Jobs Table
```sql
CREATE TABLE sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  ghl_id VARCHAR(255),
  operation VARCHAR(20) NOT NULL, -- push, pull, resolve
  priority INTEGER DEFAULT 5,
  status VARCHAR(20) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  correlation_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  INDEX idx_status_scheduled (status, scheduled_for),
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_correlation (correlation_id)
);
```

### Sync Log Table
```sql
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES sync_jobs(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  direction VARCHAR(10) NOT NULL, -- to_ghl, from_ghl
  action VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  error_details JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Sync State Table (for conflict detection)
```sql
CREATE TABLE sync_state (
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  ghl_id VARCHAR(255) NOT NULL,
  portal_hash VARCHAR(64) NOT NULL, -- SHA256 of portal data
  ghl_hash VARCHAR(64) NOT NULL, -- SHA256 of GHL data
  portal_modified_at TIMESTAMPTZ,
  ghl_modified_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  sync_version INTEGER DEFAULT 1,
  
  PRIMARY KEY (entity_type, entity_id)
);
```

## API Endpoints

### Webhook Endpoint
```
POST /api/webhooks/ghl
- Receives GHL webhooks
- Verifies signature
- Queues jobs
- Returns 200 immediately
```

### Sync Control Endpoints (Admin only)
```
POST /api/admin/sync/trigger
- Manually trigger sync for entity

GET /api/admin/sync/status
- Get sync queue status

POST /api/admin/sync/retry
- Retry failed jobs

POST /api/admin/sync/reconcile
- Full reconciliation between systems
```

### Health Check
```
GET /api/health/sync
- Returns sync system health
- Queue depth
- Recent error rate
- Last successful sync times
```

## Error Handling

### Retry Strategy
```typescript
const retryDelays = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m

function getRetryDelay(attempt: number): number {
  return retryDelays[Math.min(attempt, retryDelays.length - 1)];
}
```

### Error Categories
1. **Transient** (retry): Network errors, rate limits, GHL downtime
2. **Validation** (don't retry): Invalid data, missing required fields
3. **Auth** (alert): Token expired, permissions changed
4. **Conflict** (resolve): Data conflicts need resolution

### Alerting
- Slack notification on repeated failures
- Email on auth issues
- Dashboard shows sync health

## Security

1. **Webhook Verification**: HMAC-SHA256 signature check
2. **API Tokens**: Stored encrypted in Supabase
3. **Rate Limiting**: Respect GHL limits (100 req/min)
4. **Data Redaction**: No PII in logs
5. **Audit Trail**: All sync operations logged

## Monitoring

### Metrics to Track
- Sync success rate
- Average sync latency
- Queue depth
- Conflict count
- Retry rate
- Error rate by entity type

### Dashboard Views
1. **Real-time**: Current queue, processing rate
2. **Health**: Success rates, error trends
3. **Entity View**: Sync status by record
4. **Conflict View**: Pending conflicts needing resolution

## Implementation Phases

### Phase 1: Basic Push (Week 1)
- Portal → GHL for new records
- Webhook handler skeleton
- Basic logging

### Phase 2: Pull & Webhooks (Week 2)
- GHL → Portal via webhooks
- Contact sync from GHL
- Queue system

### Phase 3: Bidirectional (Week 3)
- Conflict detection
- Resolution rules
- Sync state tracking

### Phase 4: Advanced (Week 4)
- Batch operations
- Reconciliation
- Performance optimization
- Monitoring dashboard

## Code Structure

```
/lib/ghl/
  ├── sync-engine.ts       # Core sync orchestrator
  ├── webhook-handler.ts   # Webhook processing
  ├── queue.ts            # Job queue management
  ├── conflict-resolver.ts # Conflict resolution
  ├── field-mapper.ts     # Field mapping
  ├── api-client.ts       # GHL API client
  ├── crypto.ts           # Signature verification
  ├── credentials.ts      # Token management
  └── types.ts            # TypeScript interfaces

/app/api/webhooks/ghl/
  └── route.ts            # Webhook endpoint

/app/api/admin/sync/
  ├── trigger/route.ts    # Manual sync trigger
  ├── status/route.ts     # Sync status
  ├── retry/route.ts      # Retry failed jobs
  └── reconcile/route.ts  # Full reconciliation

/supabase/migrations/
  └── 20260801_sync_system.sql # Sync tables
```

## Testing Strategy

1. **Unit Tests**: Field mapping, conflict resolution
2. **Integration Tests**: GHL API mocking
3. **E2E Tests**: Full sync flows
4. **Load Tests**: Queue performance
5. **Chaos Tests**: Failure scenarios

---

This architecture ensures reliable, scalable synchronization between the Property Management Portal and GHL while maintaining data integrity and providing visibility into sync operations.