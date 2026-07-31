# GHL Schema Inventory Plan
## Exemplary Property Management Portal

**Purpose:** Document the plan for inventorying all GHL objects, fields, and relationships.

---

## Inventory Checklist

### 1. Contacts
- [ ] Standard Contact fields
- [ ] Custom fields for portal
- [ ] `Contact Role(s)` field values
- [ ] `Portal Access Status` field
- [ ] Contact tags used

### 2. Companies (Associations)
- [ ] Standard Company fields
- [ ] Custom fields for Association data
- [ ] Association-specific tags

### 3. Companies (Vendors)
- [ ] Standard Company fields
- [ ] Custom fields for Vendor data
- [ ] Vendor type classifications
- [ ] Vendor status values

### 4. Custom Object: Property
- [ ] All custom fields
- [ ] Field types and validation
- [ ] Dropdown values
- [ ] Required fields
- [ ] Relationships configured

### 5. Custom Object: Unit
- [ ] All custom fields
- [ ] Field types and validation
- [ ] Dropdown values
- [ ] Required fields
- [ ] Relationships configured

### 6. Custom Object: Maintenance Request
- [ ] All custom fields
- [ ] Field types and validation
- [ ] Status values and workflow
- [ ] Urgency/priority values
- [ ] Category values
- [ ] Required fields
- [ ] Relationships configured

### 7. Custom Object: Inspection
- [ ] **CRITICAL:** Inventory existing object first
- [ ] Record types
- [ ] All custom fields
- [ ] Checklist template structure
- [ ] Result values
- [ ] Status workflow
- [ ] Relationships configured

### 8. Custom Object: Document Record
- [ ] **CRITICAL:** Inventory existing object first
- [ ] Record types
- [ ] All custom fields
- [ ] Document type values
- [ ] Status values
- [ ] Confidentiality levels
- [ ] Relationships configured

### 9. Custom Object: Compliance Matter
- [ ] **CRITICAL:** Inventory existing object first
- [ ] Record types
- [ ] All custom fields
- [ ] Matter type values
- [ ] Status workflow
- [ ] Relationships configured

### 10. Workflows
- [ ] MNT-01: New Maintenance Request
- [ ] MNT-02: Emergency Maintenance
- [ ] MNT-03: Board Approval Required
- [ ] MNT-04: Vendor Assignment
- [ ] MNT-05: Quote Review
- [ ] MNT-06: Work Scheduled
- [ ] MNT-07: Work In Progress
- [ ] MNT-08: Work Completed
- [ ] MNT-09: Owner Confirmation
- [ ] MNT-10: Request Reopened
- [ ] INS-01 through INS-09
- [ ] DOC-01 through DOC-08
- [ ] CMP-01 through CMP-10
- [ ] PAY-01 through PAY-10
- [ ] USR-01 through USR-06

### 11. Pipelines
- [ ] Maintenance Request pipeline
- [ ] Inspection pipeline
- [ ] Compliance pipeline
- [ ] Any other relevant pipelines

### 12. Integration Settings
- [ ] API key configuration
- [ ] Webhook endpoints
- [ ] Webhook event subscriptions

---

## Inventory Method

1. **GHL UI Inspection:** Manually review each object in GHL
2. **API Discovery:** Use GHL API to list all fields and configurations
3. **Export:** Document findings in structured format
4. **Comparison:** Map against specification requirements
5. **Gap Analysis:** Identify missing or misaligned fields

---

## Field Classification

For each field, classify as:

| Classification | Meaning | Action |
|----------------|---------|--------|
| **EXISTING_USABLE** | Field exists and matches spec | Use as-is |
| **EXISTING_REMAP** | Field exists but needs mapping | Document mapping |
| **MISSING_APPROVAL** | Field doesn't exist, spec requires it | Request approval to add |
| **PORTAL_ONLY** | Data should stay in portal DB | Don't add to GHL |

---

## Output Format

```json
{
  "object": "MaintenanceRequest",
  "ghlObjectId": "...",
  "fields": [
    {
      "name": "Request Number",
      "ghlFieldId": "...",
      "type": "text",
      "required": true,
      "classification": "EXISTING_USABLE",
      "specReference": "Section 29.6"
    }
  ],
  "relationships": [
    {
      "name": "Related Property",
      "targetObject": "Property",
      "relationshipId": "...",
      "classification": "EXISTING_USABLE"
    }
  ],
  "workflows": [
    {
      "code": "MNT-01",
      "name": "New Maintenance Request",
      "ghlWorkflowId": "...",
      "trigger": "Record created"
    }
  ]
}
```

---

## Timeline

- **Stage 1:** Begin inventory of Contacts, Companies, basic custom objects
- **Stage 2:** Complete Property, Unit, Maintenance Request inventory
- **Stage 3:** Verify Maintenance workflow triggers
- **Stage 4:** Complete Inspection inventory
- **Stage 5:** Complete Document and Compliance inventory
- **Stage 6-8:** Ongoing verification and updates

---

## Notes

- **DO NOT** modify existing GHL schema without written approval
- **DO NOT** assume field IDs from documentation — verify in actual GHL instance
- **DO** inventory existing Inspection, Document Record, and Compliance Matter before building UI
- **DO** document every internal ID found — these are required for API calls
