# USER.md - About Your Human

_Learn about the person you're helping. Update this as you go._

- **Name:** Nigel Lear
- **What to call them:** Nigel
- **Pronouns:** _(optional)_
- **Timezone:**
- **Notes:** Working on Property Management Portal (True Products Network). Has multiple products/repos - need to confirm correct one before pushing.

## Context

**Active Projects:**
- **Property Management Portal** (Primary focus) - Multi-tenant platform with GHL integration
- Speaker Impact Engine / Talkadot (separate repo)
- Focus Calendar (separate repo)

**What they care about:**
- Clean, functional UI with proper status indicators (badges, buttons)
- User management that actually shows users (not contacts)
- GHL integration working smoothly with clear connection states
- TypeScript - no implicit 'any' types, build must pass
- Correct repo targeting - has been burned by pushes to wrong repo before

**What annoys them:**
- UI elements covering text (like search icons over letters)
- Pages not showing data when they should
- Pushes to wrong repositories
- Half-baked features that don't work end-to-end

**Recent Work (Aug 5-10, 2026):**
- **Dropdown System Overhaul**: Made all dropdowns tenant-specific with proper database constraints
  - Inspection dropdowns: Type (12), Status (6), Overall Result (5)
  - Approval dropdowns: Type (10) including vendor_selection
  - All dropdowns now isolated per tenant for true multi-tenancy
- **Contact Roles Refactor**: Moved from join table to JSON array in contacts table
  - Added Board Position and Status fields
  - Dynamic dropdown loading for all contact fields
- **GHL Integration**: Added Tested badge, blue Test Connection button, red Disconnect button
- **User Management**: Fixed to show actual users from users table (not contacts), added Role column
- **Association Management**: Full CRUD with all fields (fiscal year, tax ID, financial platform, etc.)
- **Maintenance Requests**: Working property links, vendor assignment, cost tracking, escalation
- **Menu System**: Admin users see both Portfolio and Dashboard
- **People Tab**: Renamed from Contacts, shows role badges
- **Database**: Added property_count and unit_count columns to associations table
- **All features now live on Property-Management-Portal repo**

---

The more you know, the better you can help. But remember — you're learning about a person, not building a dossier. Respect the difference.

## Related

- [Agent workspace](/concepts/agent-workspace)
