# Build Decisions Log
## Exemplary Property Management Portal

**Purpose:** Record all architectural decisions, assumptions, and conflict resolutions.

---

## Decision Template

```
### D-XXX — [Title]
**Date:** YYYY-MM-DD  
**Status:** [PROPOSED | APPROVED | REJECTED | SUPERSEDED]  
**Context:** [What led to this decision]  
**Options Considered:**
- Option A
- Option B
**Decision:** [What was decided]  
**Rationale:** [Why this decision]  
**Consequences:** [Impact of this decision]  
**Authority:** [Who approved]
```

---

## Proposed Decisions

### D-001 — Portal Authentication Provider
**Date:** 2026-07-31  
**Status:** APPROVED  
**Context:** Need to select authentication solution for portal users  
**Options Considered:**
- Supabase Auth (built-in, works with our PostgreSQL choice)
- NextAuth.js (flexible, requires additional setup)
- Custom JWT implementation (more control, more maintenance)
- Clerk (modern, but adds vendor dependency)
**Decision:** Supabase Auth  
**Rationale:** 
- Already using Supabase for PostgreSQL
- Built-in RLS support
- Handles MFA, password reset, session management
- No additional vendor needed
- Approved by Nigel
**Consequences:** Tightly coupled to Supabase, but that's acceptable given our stack choice  
**Authority:** Nigel Lear

---

### D-002 — File Storage Provider
**Date:** 2026-07-31  
**Status:** PROPOSED  
**Context:** Need secure file storage for documents, photos, etc.  
**Options Considered:**
- Supabase Storage (integrated, RLS support)
- AWS S3 (industry standard, more complex)
- Cloudflare R2 (S3-compatible, good pricing)
- GHL native file storage (limited control)
**Decision:** Supabase Storage  
**Rationale:**
- Integrated with Supabase Auth for access control
- Signed URL support
- Row-level security policies
- Same platform as database
**Consequences:** Files stored alongside auth/database in Supabase ecosystem  
**Authority:** Pending Nigel approval

---

### D-003 — GHL Integration Architecture
**Date:** 2026-07-31  
**Status:** PROPOSED  
**Context:** How to structure the GHL adapter pattern  
**Options Considered:**
- Single monolithic GhlService class
- Repository pattern (separate repos per object type)
- Full CQRS with event sourcing (overkill)
**Decision:** Repository pattern with service layer  
**Rationale:**
- Clear separation of concerns
- Easier to mock for testing
- Aligns with spec's typed interface requirement
- Allows per-object optimization
**Consequences:** More files/classes, but better testability and maintainability  
**Authority:** Pending Nigel approval

---

## Approved Decisions

*(None yet — awaiting Stage 0 approval)*

---

## Rejected Decisions

*(None)*

---

## Superseded Decisions

*(None)*

---

## Conflict Resolutions

| Date | Conflict | Resolution | Authority |
|------|----------|------------|-----------|
| — | — | — | — |

---

## Assumptions Log

| ID | Assumption | Validated | Impact if Wrong |
|----|------------|-----------|-----------------|
| A-001 | Supabase will meet all auth/file needs | No | Would need to migrate to alternative |
| A-002 | GHL API rate limits won't block normal operations | No | May need caching/retry strategies |
| A-003 | 114 screens can share ~6 template patterns | No | May need more templates |
| A-004 | Next.js App Router will handle all routing needs | No | May need custom routing logic |

---

## Questions for Nigel

1. **GHL Location Structure:** What is the GHL location/sub-account structure? Single location or multiple?
2. **Admin User:** Who is the initial Admin User? Need name and email for TEST fixtures.
3. **Design Approval:** Are the two reference screens (management-dashboard.png and maintenance-request-detail.png) the final approved visual direction?
4. **Domain:** What domain will host the portal? (for CORS, auth callbacks)
5. **Existing Code:** Is there any existing code/assets that should be preserved or migrated?
