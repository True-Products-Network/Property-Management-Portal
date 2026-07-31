# Build Decisions Log

## Date: July 31, 2026

### Decisions Made

#### 1. GHL Schema Inventory
**Status:** ✅ DONE
- All dropdowns, fields, objects, relationships complete in GHL
- Portal database will be the master (Supabase)
- GHL receives sync updates only
- Contact and Company (Associations, Vendors) data in GHL will be updated from Portal

#### 2. Payment Processor Selection
**Decision:** Stripe and PayPal (Initially)
- Build processor interface to support both
- Start with Stripe as primary
- Add PayPal as secondary option

#### 3. File Storage Solution
**Options:**
- GHL (limited, workflow-focused)
- Google Drive (good integration, permissions)
- AWS S3 (most flexible, scalable)

**Recommendation:** AWS S3 with CloudFront
- Most scalable and cost-effective
- Full control over permissions
- Easy integration with Supabase
- Can use signed URLs for security

**Decision:** AWS S3 (pending final approval)

#### 4. GHL Workflow Mapping
**Status:** Unknown - needs discovery
- Will map workflows as we build features
- Portal triggers workflows via API/webhooks
- Document workflows in `/docs/ghl-workflow-map.md`

#### 5. Association Onboarding Process
**Status:** Unknown - needs definition
- Will create standard onboarding checklist
- Document in `/docs/onboarding-process.md`

#### 6. Board Approval Thresholds
**Status:** Unknown - needs definition
- Will implement configurable thresholds
- Document in `/docs/approval-workflows.md`

#### 7. Email/SMS Provider
**Decision:**
- **Auth/Login:** Supabase email
- **Communications:** GHL (email and SMS)
- Portal sends communication requests to GHL via API

#### 8. Calendar Views
**Decision:** Use GHL embedded calendar views
- Embed GHL calendars for specific types
- GHL workflows fire automatically
- Confirmed appointments sync back to Portal via webhooks
- Store appointment data in Portal database

---

## Architecture Confirmation

**Portal Database (Supabase) = Master for:**
- All property management data
- Relationships between records
- Forms and user interactions
- Payment interactions (bank details at Association level)
- Audit log entries

**GHL = Sync Target for:**
- Workflow triggers
- Email/SMS messaging
- Task creation
- Contact management (sync from Portal)
- Calendar appointments (sync back to Portal)

---

## Next Actions

1. ✅ Decisions documented
2. 🔄 Create complete database schema
3. 🔄 Apply migrations to Supabase
4. 🔄 Build API layer
5. 🔄 Update detail pages to use real data

---

*Last Updated: July 31, 2026*
