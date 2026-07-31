# GHL Field Mapping
## Exemplary Property Management Portal

**Purpose:** Document the mapping between portal fields and GHL fields.

**Status:** Template — To be populated during GHL inventory

---

## Mapping Legend

| Status | Meaning |
|--------|---------|
| 🟢 CONFIRMED | Field verified in GHL, ready to use |
| 🟡 PENDING | Field expected but not yet verified |
| 🔴 MISSING | Field not found, needs creation |
| ⚪ PORTAL_ONLY | Stored in portal database only |

---

## Contact Mapping

| Portal Field | GHL Field | GHL Field ID | Status | Notes |
|--------------|-----------|--------------|--------|-------|
| contactId | Contact ID | | 🟡 PENDING | |
| firstName | First Name | | 🟡 PENDING | |
| lastName | Last Name | | 🟡 PENDING | |
| email | Email | | 🟡 PENDING | |
| phone | Phone | | 🟡 PENDING | |
| portalRoles | Contact Role(s) | | 🟡 PENDING | Multi-select |
| portalAccessStatus | Portal Access Status | | 🟡 PENDING | Custom field |
| boardPosition | Board Position | | 🟡 PENDING | Custom field |
| termStartDate | Term Start Date | | 🟡 PENDING | Custom field |
| termEndDate | Term End Date | | 🟡 PENDING | Custom field |
| preferredContactMethod | Preferred Contact Method | | 🟡 PENDING | Custom field |
| emailPermission | Email Permission | | 🟡 PENDING | Custom field |
| smsPermission | SMS Permission | | 🟡 PENDING | Custom field |
| emergencyContactName | Emergency Contact Name | | 🟡 PENDING | Custom field |
| emergencyContactPhone | Emergency Contact Phone | | 🟡 PENDING | Custom field |

---

## Association (Company) Mapping

| Portal Field | GHL Field | GHL Field ID | Status | Notes |
|--------------|-----------|--------------|--------|-------|
| associationId | Association ID | | 🟡 PENDING | Custom field |
| legalName | Company Name | | 🟡 PENDING | |
| commonName | Common Name | | 🟡 PENDING | Custom field |
| associationType | Association Type | | 🟡 PENDING | Custom field |
| status | Status | | 🟡 PENDING | |
| address | Address | | 🟡 PENDING | |
| city | City | | 🟡 PENDING | |
| state | State | | 🟡 PENDING | |
| zip | ZIP | | 🟡 PENDING | |
| phone | Phone | | 🟡 PENDING | |
| email | Email | | 🟡 PENDING | |
| website | Website | | 🟡 PENDING | |
| managementStartDate | Management Start Date | | 🟡 PENDING | Custom field |
| fiscalYearEnd | Fiscal Year End | | 🟡 PENDING | Custom field |
| annualMeetingMonth | Annual Meeting Month | | 🟡 PENDING | Custom field |
| propertyCount | Property Count | | 🟡 PENDING | Computed |
| unitCount | Unit Count | | 🟡 PENDING | Computed |
| financialPlatformLink | Financial Platform Link | | 🟡 PENDING | Custom field |
| documentStorageLink | Document Storage Link | | 🟡 PENDING | Custom field |
| emergencyInstructions | Emergency Instructions | | 🟡 PENDING | Custom field |

---

## Vendor (Company) Mapping

| Portal Field | GHL Field | GHL Field ID | Status | Notes |
|--------------|-----------|--------------|--------|-------|
| vendorId | Vendor ID | | 🟡 PENDING | Custom field |
| companyName | Company Name | | 🟡 PENDING | |
| companyType | Company Type | | 🟡 PENDING | Custom field |
| status | Status | | 🟡 PENDING | |
| vendorType | Vendor Type | | 🟡 PENDING | Custom field |
| services | Services | | 🟡 PENDING | Custom field |
| serviceArea | Service Area | | 🟡 PENDING | Custom field |
| emergencyAvailable | Emergency Available | | 🟡 PENDING | Custom field |
| approved | Approved | | 🟡 PENDING | Custom field |
| preferred | Preferred | | 🟡 PENDING | Custom field |
| performanceNotes | Performance Notes | | 🟡 PENDING | Custom field |
| insuranceExpiration | Insurance Expiration | | 🟡 PENDING | Custom field |
| licenseExpiration | License Expiration | | 🟡 PENDING | Custom field |
| w9OnFile | W-9 On File | | 🟡 PENDING | Custom field |
| contractOnFile | Contract On File | | 🟡 PENDING | Custom field |

---

## Property Mapping

| Portal Field | GHL Field | GHL Field ID | Status | Notes |
|--------------|-----------|--------------|--------|-------|
| propertyId | Property ID | | 🟡 PENDING | Custom field |
| propertyName | Property Name | | 🟡 PENDING | Custom field |
| status | Status | | 🟡 PENDING | |
| propertyType | Property Type | | 🟡 PENDING | Custom field |
| address | Address | | 🟡 PENDING | |
| addressLine2 | Address Line 2 | | 🟡 PENDING | |
| city | City | | 🟡 PENDING | |
| state | State | | 🟡 PENDING | |
| zip | ZIP | | 🟡 PENDING | |
| county | County | | 🟡 PENDING | Custom field |
| unitCount | Unit Count | | 🟡 PENDING | Custom field |
| yearBuilt | Year Built | | 🟡 PENDING | Custom field |
| accessNotes | Access Notes | | 🟡 PENDING | Custom field |
| emergencyNotes | Emergency Notes | | 🟡 PENDING | Custom field |
| assignedStaff | Assigned Staff | | 🟡 PENDING | Relationship |
| managementStartDate | Management Start Date | | 🟡 PENDING | Custom field |
| managementEndDate | Management End Date | | 🟡 PENDING | Custom field |
| relatedAssociation | Related Association | | 🟡 PENDING | Relationship |
| financialLink | Financial Platform Link | | 🟡 PENDING | Custom field |
| documentLink | Document Storage Link | | 🟡 PENDING | Custom field |

---

## Unit Mapping

| Portal Field | GHL Field | GHL Field ID | Status | Notes |
|--------------|-----------|--------------|--------|-------|
| unitId | Unit ID | | 🟡 PENDING | Custom field |
| unitNumber | Unit Number | | 🟡 PENDING | Custom field |
| displayName | Display Name | | 🟡 PENDING | Custom field |
| status | Status | | 🟡 PENDING | |
| unitType | Unit Type | | 🟡 PENDING | Custom field |
| floor | Floor | | 🟡 PENDING | Custom field |
| bedrooms | Bedrooms | | 🟡 PENDING | Custom field |
| bathrooms | Bathrooms | | 🟡 PENDING | Custom field |
| occupancyStatus | Occupancy Status | | 🟡 PENDING | Custom field |
| ownerOccupied | Owner Occupied | | 🟡 PENDING | Custom field |
| rentalStatus | Rental Status | | 🟡 PENDING | Custom field |
| moveInDate | Move In Date | | 🟡 PENDING | Custom field |
| moveOutDate | Move Out Date | | 🟡 PENDING | Custom field |
| parkingSpaces | Parking Spaces | | 🟡 PENDING | Custom field |
| storageSpaces | Storage Spaces | | 🟡 PENDING | Custom field |
| mailingNotes | Mailing Notes | | 🟡 PENDING | Custom field |
| accessNotes | Access Notes | | 🟡 PENDING | Custom field |
| relatedProperty | Related Property | | 🟡 PENDING | Relationship |
| relatedContacts | Related Contacts | | 🟡 PENDING | Relationship |

---

## Maintenance Request Mapping

| Portal Field | GHL Field | GHL Field ID | Status | Notes |
|--------------|-----------|--------------|--------|-------|
| requestNumber | Request Number | | 🟡 PENDING | Custom field |
| reportedDate | Reported Date | | 🟡 PENDING | |
| status | Status | | 🟡 PENDING | |
| urgency | Urgency | | 🟡 PENDING | Custom field |
| category | Category | | 🟡 PENDING | Custom field |
| title | Title | | 🟡 PENDING | |
| description | Description | | 🟡 PENDING | |
| location | Location | | 🟡 PENDING | Custom field |
| entryPermission | Entry Permission | | 🟡 PENDING | Custom field |
| preferredContact | Preferred Contact Method | | 🟡 PENDING | Custom field |
| relatedProperty | Related Property | | 🟡 PENDING | Relationship |
| relatedUnit | Related Unit | | 🟡 PENDING | Relationship |
| reportedBy | Reported By | | 🟡 PENDING | Relationship (Contact) |
| assignedVendor | Assigned Vendor | | 🟡 PENDING | Relationship (Company) |
| assignedStaff | Assigned Staff | | 🟡 PENDING | Relationship (Contact) |
| boardApprovalRequired | Board Approval Required | | 🟡 PENDING | Custom field |
| boardApprovalStatus | Board Approval Status | | 🟡 PENDING | Custom field |
| quoteAmount | Quote Amount | | 🟡 PENDING | Custom field |
| scheduledDate | Scheduled Date | | 🟡 PENDING | Custom field |
| completionDate | Completion Date | | 🟡 PENDING | Custom field |
| completionNotes | Completion Notes | | 🟡 PENDING | Custom field |
| ownerConfirmed | Owner Confirmed | | 🟡 PENDING | Custom field |
| closedDate | Closed Date | | 🟡 PENDING | Custom field |
| internalNotes | Internal Notes | | 🟡 PENDING | Custom field |

---

## Inspection Mapping

| Portal Field | GHL Field | GHL Field ID | Status | Notes |
|--------------|-----------|--------------|--------|-------|
| inspectionNumber | Inspection Number | | 🟡 PENDING | Custom field |
| inspectionType | Inspection Type | | 🟡 PENDING | Record type? |
| status | Status | | 🟡 PENDING | |
| requestedDate | Requested Date | | 🟡 PENDING | |
| scheduledDate | Scheduled Date | | 🟡 PENDING | |
| completedDate | Completed Date | | 🟡 PENDING | |
| result | Result | | 🟡 PENDING | Custom field |
| findings | Findings | | 🟡 PENDING | Custom field |
| correctiveAction | Corrective Action | | 🟡 PENDING | Custom field |
| followUpDate | Follow Up Date | | 🟡 PENDING | Custom field |
| relatedProperty | Related Property | | 🟡 PENDING | Relationship |
| relatedUnit | Related Unit | | 🟡 PENDING | Relationship |
| inspector | Inspector | | 🟡 PENDING | Relationship |

---

## Document Record Mapping

| Portal Field | GHL Field | GHL Field ID | Status | Notes |
|--------------|-----------|--------------|--------|-------|
| documentId | Document ID | | 🟡 PENDING | Custom field |
| documentName | Document Name | | 🟡 PENDING | |
| documentType | Document Type | | 🟡 PENDING | Record type? |
| status | Status | | 🟡 PENDING | |
| fileReference | File Reference | | 🟡 PENDING | Custom field |
| effectiveDate | Effective Date | | 🟡 PENDING | Custom field |
| expirationDate | Expiration Date | | 🟡 PENDING | Custom field |
| signatureRequired | Signature Required | | 🟡 PENDING | Custom field |
| signatureStatus | Signature Status | | 🟡 PENDING | Custom field |
| deliveryMethod | Delivery Method | | 🟡 PENDING | Custom field |
| version | Version | | 🟡 PENDING | Custom field |
| confidentiality | Confidentiality Level | | 🟡 PENDING | Custom field |
| relatedCompany | Related Company | | 🟡 PENDING | Relationship |
| relatedProperty | Related Property | | 🟡 PENDING | Relationship |
| relatedUnit | Related Unit | | 🟡 PENDING | Relationship |
| relatedContact | Related Contact | | 🟡 PENDING | Relationship |
| relatedMaintenance | Related Maintenance Request | | 🟡 PENDING | Relationship |
| relatedInspection | Related Inspection | | 🟡 PENDING | Relationship |
| relatedCompliance | Related Compliance Matter | | 🟡 PENDING | Relationship |

---

## Compliance Matter Mapping

| Portal Field | GHL Field | GHL Field ID | Status | Notes |
|--------------|-----------|--------------|--------|-------|
| matterNumber | Matter Number | | 🟡 PENDING | Custom field |
| matterType | Matter Type | | 🟡 PENDING | Record type? |
| status | Status | | 🟡 PENDING | |
| reportedDate | Reported Date | | 🟡 PENDING | |
| title | Title | | 🟡 PENDING | |
| description | Description | | 🟡 PENDING | |
| policyReference | Policy Reference | | 🟡 PENDING | Custom field |
| evidence | Evidence | | 🟡 PENDING | Custom field |
| noticeDate | Notice Date | | 🟡 PENDING | Custom field |
| responseDueDate | Response Due Date | | 🟡 PENDING | Custom field |
| responseReceivedDate | Response Received Date | | 🟡 PENDING | Custom field |
| hearingDate | Hearing Date | | 🟡 PENDING | Custom field |
| hearingResult | Hearing Result | | 🟡 PENDING | Custom field |
| boardDecision | Board Decision | | 🟡 PENDING | Custom field |
| correctiveActionDue | Corrective Action Due Date | | 🟡 PENDING | Custom field |
| correctiveActionCompleted | Corrective Action Completed | | 🟡 PENDING | Custom field |
| resolutionDate | Resolution Date | | 🟡 PENDING | Custom field |
| closedDate | Closed Date | | 🟡 PENDING | Custom field |
| notes | Notes | | 🟡 PENDING | |

---

## Relationship Model

```
Association ||--o{ Property : "has properties"
Property ||--o{ Unit : "contains units"
Contact }o--o{ Unit : "owns or occupies"
Property ||--o{ MaintenanceRequest : "has requests"
Unit o|--o{ MaintenanceRequest : "may have requests"
Contact ||--o{ MaintenanceRequest : "reported"
Vendor o|--o{ MaintenanceRequest : "assigned"
Property ||--o{ Inspection : "has inspections"
Unit o|--o{ Inspection : "may have inspections"
```

**CRITICAL RULE:** Maintenance Request does NOT have a direct Association relationship. Derive Association through Property only.

---

## Workflow Trigger Mapping

| Workflow Code | Trigger Event | GHL Workflow ID | Status |
|---------------|---------------|-----------------|--------|
| MNT-01 | Maintenance Request created | | 🟡 PENDING |
| MNT-02 | Urgency = Emergency | | 🟡 PENDING |
| MNT-03 | Board approval required | | 🟡 PENDING |
| MNT-04 | Vendor assigned | | 🟡 PENDING |
| MNT-05 | Quote submitted | | 🟡 PENDING |
| MNT-06 | Scheduled date set | | 🟡 PENDING |
| MNT-07 | Status = In Progress | | 🟡 PENDING |
| MNT-08 | Completion recorded | | 🟡 PENDING |
| MNT-09 | Owner confirmation received | | 🟡 PENDING |
| MNT-10 | Reopened | | 🟡 PENDING |

*(Additional workflows to be mapped during inventory)*

---

## Next Steps

1. Access GHL instance
2. Export all custom object schemas
3. Document all field IDs
4. Verify all relationships
5. Map workflow triggers
6. Present gap analysis
7. Obtain approval for any needed changes
