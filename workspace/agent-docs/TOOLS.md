# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## TypeScript Best Practices (Next.js Strict Mode)

When writing TypeScript code for this project:

1. **Always define interfaces** for database query results before using them
2. **Use explicit types** for all `.map()`, `.filter()`, `.forEach()` callback parameters  
3. **Type Supabase queries** with `.returns<Interface[]>()`
4. **Test build locally** with `npm run build` before pushing to catch type errors

### Example Pattern

```typescript
// Define interfaces at top of file
interface ContactAssociation {
  association_id: string;
}

// Type the query result
const { data } = await supabase
  .from("table")
  .select("field")
  .returns<ContactAssociation[]>();

// Explicit types for callbacks
const ids = data.map((item: ContactAssociation) => item.field);
```

## Project Repositories

**Property Management Portal** (Primary)
- Path: `/root/.openclaw/workspace/Property-Management-Portal`
- Repo: `https://github.com/True-Products-Network/Property-Management-Portal.git`
- Vercel: Live deployment target
- Stack: Next.js 16, Supabase, Tailwind, shadcn/ui

**Other Repos (DO NOT PUSH HERE unless explicitly asked):**
- `speaker-impact-engine` → Talkadot project
- `focus-calendar` → Focus Calendar project

**Always verify current directory before committing:**
```bash
pwd && git remote -v
```

## Recent Work Log (August 2026)

### Aug 10, 2026 (Today)
- **Dropdown Settings Tenant Isolation**: Made dropdown_settings tenant-specific
  - Updated unique constraint to include tenant_id
  - Made tenant_id NOT NULL
  - All dropdowns now filtered by tenant
- **Inspection & Approval Dropdowns**: Created and seeded all values
  - Inspection Types (12): routine, move_in, move_out, annual, fire_safety, elevator, hvac, roof, pool, emergency_systems, insurance, other
  - Inspection Status (6): scheduled, in_progress, completed, overdue, cancelled, rescheduled
  - Overall Result (5): excellent, good, fair, poor, critical
  - Approval Types (10): maintenance, capital_improvement, vendor_contract, budget_item, policy_change, special_assessment, vendor_selection, contract_approval, capital_expense, other
- **Dropdowns API**: Updated to require authentication and filter by tenant_id
- **Tenant Seeding**: Updated to include fieldName for multi-field record types
- **Button Color Fix**: "Provision New Tenant" back to green/white
- **Inspection Detail Fix**: Fixed RatingIcon undefined error
- **SQL Migrations**: Created comprehensive migration scripts for dropdown changes

### Aug 8, 2026
- **Database Schema Update**: Added `property_count` and `unit_count` columns to `associations` table
- **Contact Roles Fix**: Fixed contact_roles join syntax in API
- **Association Edit Form**: Added error handling for contact loading

### Aug 7, 2026
- **People Tab**: Renamed Contacts tab to People in association view
- **Role Badges**: Contact cards now show role badges (board_member, owner, etc.)
- **Property/Unit Counts**: Fixed association edit to save propertyCount and unitCount
- **Manager Display**: Shows manager name (not ID) in Operational Details
- **Number Inputs**: Added +/- buttons for property/unit counts
- **Maintenance Buttons**: Assign Vendor, Update Cost, Escalate buttons now work
- **Property Name Fix**: Maintenance requests show property name correctly
- **Maintenance Count Fix**: Association view shows correct maintenance count per association
- **Association Create Fix**: All fields now save properly (fiscal year, tax ID, etc.)

### Aug 6, 2026
- **Menu Labels**: Admin User sees both "Portfolio" and "Dashboard"
- **Operational Details**: Added to association edit form (property count, unit count, assigned manager)
- **Multi-role Support**: Users with multiple roles see appropriate menu items

### Aug 5, 2026
- **GHL Integration UI**: Added Tested badge, blue Test Connection button, red Disconnect button
- **User Management Fix**: Now shows actual users from `users` table (not contacts), added Role column, fixed search input styling covering "S"
- **Commits**: `7c79089`, `ef0059f`, `3518e77`

### Aug 4, 2026
- **Multi-Tenant Platform**: Core complete (Platform Console, Plans, Entitlements)
- **GHL Sync Layer**: Implemented with field mapper, queue system, conflict resolver
- **Association-Level GHL**: Each association can have its own GHL location

## Dropdown System Reference

### API Pattern
All dropdowns use the pattern: `/api/dropdowns?recordType=XXX&fieldName=YYY`

**Record Types and Fields:**
| Record Type | Field Names |
|-------------|-------------|
| Inspection | `Inspection Type`, `Inspection Status`, `Overall Result` |
| Approval | `Approval Type` |
| Vendor Company | `Vendor Type`, `Vendor Status` |
| Unit | `type` |
| Contact | `role`, `status`, `board_position` |
| Property | `type` |
| Association Company | `Association Type`, `Association Status` |

### Database Schema
- Table: `dropdown_settings`
- Unique constraint: `(tenant_id, record_type, field_name, value)`
- tenant_id is NOT NULL (tenant-specific)

### Tenant Seeding
Location: Platform Admin → Business Accounts → Tenant row actions → "Setup Tenant Data"
- Seeds all default dropdowns for new tenants
- Idempotent (safe to run multiple times)

### Adding New Dropdown Values
1. Use Admin → Dropdown Settings UI
2. Or insert directly to `dropdown_settings` table with proper tenant_id
3. Must include: tenant_id, record_type, field_name, value, label, sort_order

## Related

- [Agent workspace](/concepts/agent-workspace)
