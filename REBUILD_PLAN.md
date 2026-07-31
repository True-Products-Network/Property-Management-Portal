# Property Management Portal - Rebuild Plan

## Current Issues
- Built isolated list pages instead of interconnected detail screens
- Missing tab-based navigation for related records
- No relationship manager
- Not following visual direction exactly (dark navy sidebar, teal accents)
- Missing global search with related-record cards

## Rebuild Approach

### Phase 1: Core Architecture & Visual Foundation
1. Update layout.tsx with correct visual direction (dark navy sidebar, teal accents)
2. Create reusable Tab component for detail pages
3. Create RelatedRecordCard component
4. Create RelationshipManager component
5. Implement global search

### Phase 2: Detail Pages with Tabs (Per Specification)

#### MG-03: Association Detail
Tabs: Overview, Properties, People & Board, Maintenance, Inspections, Documents, Compliance, Communications, Financial Links, Activity

#### MG-07: Property Detail  
Tabs: Overview, Units, People, Maintenance, Vendors, Inspections, Documents, Compliance, Activity
- Overview shows: address, type, unit count, year built, management dates, access instructions, emergency notes, assigned staff, **Association card (clickable)**, open-item summary

#### MG-10: Unit Detail
Tabs: Overview, Owners & Occupants, Maintenance, Inspections, Documents, Compliance, Activity
- Overview shows: unit number, type, floor, bedrooms, bathrooms, occupancy status, rental status, parking, storage, move-in/out dates, **Property card (clickable)**, **Association through Property**

#### MG-13: Contact Detail
Tabs: Overview, Associations, Units, Requests, Documents, Communications, Activity
- Shows all roles, relationships to Associations, Properties, Units

#### MG-17: Maintenance Request Detail (Already have base)
Tabs: Overview, Activity/Messages, Files
- Shows: **Property card**, **Unit card (if applicable)**, **Reporter Contact card**, **Assigned Vendor card**
- NO direct Association field (per rule: Maintenance Request → Property → Association)

#### MG-20: Vendor Detail
Tabs: Overview, Assigned Work, Credentials, Documents, Activity

#### MG-23: Inspection Detail
Tabs: Overview, Findings, Documents, Related Maintenance, Compliance, Activity
- Shows: **Property card**, **Unit card (if applicable)**

#### MG-26: Document Detail
Tabs: Overview, Content, Related Records, Activity
- Shows all related records: Company, Property, Unit, Contact, Maintenance Request, Inspection, Compliance Matter

#### MG-29: Compliance Matter Detail
Tabs: Overview, Notices, Evidence, Documents, Hearings, Decisions, Activity
- Shows: **Property/Unit cards**, **Involved Contacts**

### Phase 3: List Pages (Simplified)
- Association List (MG-02)
- Property List (MG-06)
- Unit List (MG-09)
- People Directory (MG-12)
- Maintenance Queue (MG-16)
- Vendor List (MG-19)
- Inspection List (MG-22)
- Document List (MG-25)
- Compliance List (MG-28)

### Phase 4: Supporting Screens
- MG-15: Relationship Manager
- Global Search (Section 8)
- MG-01: Portfolio Overview (Dashboard)

### Phase 5: Payment Integration (Stripe)
- Payment processor connection
- Payment forms
- Transaction reporting to GHL

## Visual Direction (From Spec)
- Primary navy: #062F52
- Secondary navy: #0B3F69
- Teal: #07838B
- Teal hover: #066B72
- Gold accent: #D6A52A
- Page background: #F5F7FA
- Card background: #FFFFFF
- Sidebar: 248-260px dark navy
- Card radius: 10-12px
- Button radius: 7-9px

## Key Rules
1. Every detail screen shows related records in tabs
2. Relationships visible and clickable from both sides
3. Maintenance Request → Property → Association (no direct Association link)
4. Document Record can relate to multiple record types
5. Global search opens detail screens with related records visible
6. Color is secondary cue - every status must also have text

## Implementation Order
1. Fix layout/sidebar colors
2. Create tab components
3. Build Association Detail (MG-03) as template
4. Build Property Detail (MG-07) with all tabs
5. Build Unit Detail (MG-10)
6. Build Contact Detail (MG-13)
7. Fix Maintenance Detail (MG-17) - remove Association field
8. Build remaining detail pages
9. Build list pages
10. Add global search
11. Add relationship manager
12. Payment integration
