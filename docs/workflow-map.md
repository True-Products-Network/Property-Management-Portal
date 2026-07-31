# Workflow Map
## Exemplary Property Management Portal

**Purpose:** Document all GHL workflows, triggers, and portal interactions.

**Status:** Template — To be populated during GHL inventory

---

## Workflow Documentation Format

For each workflow, document:

```
### [CODE] — [Name]
**Trigger:** [What starts the workflow]
**Portal Action:** [What user action in portal triggers it]
**GHL Record Changes:** [What fields change in GHL]
**Portal Display:** [What the portal shows during/after]
**Messages/Tasks:** [What GHL sends/creates]
**Reminders/Escalations:** [Timing and conditions]
**Callback/Polling:** [How portal gets updates]
**Error Handling:** [Timeout, failure states]
**Mock Behavior:** [How mock adapter simulates]
```

---

## Maintenance Workflows

### MNT-01 — New Maintenance Request
**Trigger:** Maintenance Request record created  
**Portal Action:** Owner submits new request form  
**GHL Record Changes:**
- Create Maintenance Request
- Set status = "New"
- Set reported date = now
- Link to Property, Unit (if applicable), Contact

**Portal Display:**
- Show confirmation with request number
- Display in "My Requests" list
- Show status = "New"

**Messages/Tasks:**
- Email/SMS to management (if urgent)
- Task created for maintenance coordinator

**Reminders/Escalations:**
- If not triaged within 24h → escalate

**Callback/Polling:**
- Poll for status changes every 30s (active view)
- Webhook updates status

**Error Handling:**
- If GHL unavailable → queue for retry
- Show "Submission pending" state

**Mock Behavior:**
- Simulate 500ms delay
- Return success with generated request number
- Trigger mock status update after 2s

---

### MNT-02 — Emergency Maintenance
**Trigger:** Urgency = "Emergency"  
**Portal Action:** Owner checks "Emergency" on request form  
**GHL Record Changes:**
- Set urgency = "Emergency"
- Set status = "Emergency"

**Portal Display:**
- Emergency banner
- Immediate confirmation
- Direct phone option shown

**Messages/Tasks:**
- Immediate SMS to on-call manager
- Emergency task (high priority)
- Optional: auto-call webhook

**Reminders/Escalations:**
- If not acknowledged in 15 min → escalate to next contact

**Callback/Polling:**
- Real-time webhook updates
- Push notification to management app

**Error Handling:**
- If SMS fails → try call
- If all fail → log for manual follow-up

**Mock Behavior:**
- Simulate immediate notification
- Show emergency escalation path

---

### MNT-03 — Board Approval Required
**Trigger:** Board approval required flag set  
**Portal Action:** Management checks "Requires board approval"  
**GHL Record Changes:**
- Set boardApprovalRequired = true
- Set boardApprovalStatus = "Pending"
- Create approval task

**Portal Display:**
- Status = "Awaiting Board Approval"
- Show in Board approval queue

**Messages/Tasks:**
- Email to board members
- Task in board approval pipeline

**Reminders/Escalations:**
- Reminder at 3 days
- Escalate at 7 days

**Callback/Polling:**
- Webhook on approval/rejection
- Board portal updates status

**Error Handling:**
- If no board response → manual reminder

**Mock Behavior:**
- Simulate board notification
- Allow mock approval/rejection

---

### MNT-04 — Vendor Assignment
**Trigger:** Vendor assigned to request  
**Portal Action:** Management selects vendor  
**GHL Record Changes:**
- Set assignedVendor
- Set status = "Vendor Assigned"
- Create vendor notification

**Portal Display:**
- Show assigned vendor
- Status = "Vendor Assigned"

**Messages/Tasks:**
- Email to vendor
- Task for vendor response

**Reminders/Escalations:**
- If vendor doesn't respond in 24h → reminder
- If 48h → management alert

**Callback/Polling:**
- Webhook on vendor accept/decline

**Error Handling:**
- If vendor declines → return to assignment queue

**Mock Behavior:**
- Simulate vendor notification
- Allow mock accept/decline

---

### MNT-05 — Quote Review
**Trigger:** Vendor submits quote  
**Portal Action:** Vendor submits quote form  
**GHL Record Changes:**
- Set quoteAmount
- Set quoteSubmittedDate
- Set status = "Quote Pending"

**Portal Display:**
- Show quote amount
- Approval buttons for management

**Messages/Tasks:**
- Email to management
- Task for quote review

**Reminders/Escalations:**
- Reminder at 2 days

**Callback/Polling:**
- Webhook on approval/rejection

**Error Handling:**
- If quote rejected → notify vendor with reason

**Mock Behavior:**
- Simulate quote submission
- Allow mock approval

---

### MNT-06 — Work Scheduled
**Trigger:** Scheduled date set  
**Portal Action:** Vendor or management sets date  
**GHL Record Changes:**
- Set scheduledDate
- Set status = "Scheduled"

**Portal Display:**
- Show scheduled date
- Calendar view updated

**Messages/Tasks:**
- Confirmation to owner
- Reminder task (day before)

**Reminders/Escalations:**
- Day-before reminder
- Day-of reminder

**Callback/Polling:**
- Webhook on date changes

**Error Handling:**
- If vendor cancels → reschedule workflow

**Mock Behavior:**
- Simulate calendar update

---

### MNT-07 — Work In Progress
**Trigger:** Status changed to "In Progress"  
**Portal Action:** Vendor marks as started  
**GHL Record Changes:**
- Set status = "In Progress"
- Set start time

**Portal Display:**
- Status = "In Progress"
- Progress updates enabled

**Messages/Tasks:**
- Optional: notify owner work started

**Reminders/Escalations:**
- If not completed by EOD → follow-up

**Callback/Polling:**
- Real-time progress updates

**Error Handling:**
- If vendor stops responding → alert management

**Mock Behavior:**
- Simulate progress updates

---

### MNT-08 — Work Completed
**Trigger:** Vendor marks complete  
**Portal Action:** Vendor submits completion form  
**GHL Record Changes:**
- Set status = "Completed"
- Set completionDate
- Set completionNotes
- Attach completion photos/docs

**Portal Display:**
- Status = "Pending Owner Confirmation"
- Show completion details

**Messages/Tasks:**
- Email to owner for confirmation
- Task for owner review

**Reminders/Escalations:**
- Reminder at 3 days
- Auto-close at 7 days if no response

**Callback/Polling:**
- Webhook on owner confirmation

**Error Handling:**
- If owner doesn't respond → auto-close with note

**Mock Behavior:**
- Simulate completion
- Allow mock owner confirmation

---

### MNT-09 — Owner Confirmation
**Trigger:** Owner confirms resolution  
**Portal Action:** Owner clicks "Issue Resolved"  
**GHL Record Changes:**
- Set ownerConfirmed = true
- Set status = "Closed"
- Set closedDate

**Portal Display:**
- Status = "Closed"
- Confirmation message

**Messages/Tasks:**
- Thank you message to owner
- Close all related tasks

**Reminders/Escalations:**
- None

**Callback/Polling:**
- Immediate update

**Error Handling:**
- If owner reopens → trigger MNT-10

**Mock Behavior:**
- Simulate confirmation

---

### MNT-10 — Request Reopened
**Trigger:** Owner clicks "Issue Not Resolved"  
**Portal Action:** Owner reopens request  
**GHL Record Changes:**
- Set status = "Reopened"
- Append to notes
- Create new management task

**Portal Display:**
- Status = "Reopened"
- Return to management queue

**Messages/Tasks:**
- Urgent alert to management
- High priority task

**Reminders/Escalations:**
- Immediate management notification

**Callback/Polling:**
- Immediate update

**Error Handling:**
- Ensure same request number retained

**Mock Behavior:**
- Simulate reopen
- Show in queue

---

## Inspection Workflows (INS-01 to INS-09)

*(To be documented during GHL inventory)*

| Code | Name | Trigger | Status |
|------|------|---------|--------|
| INS-01 | Inspection Requested | | 🟡 PENDING |
| INS-02 | Inspection Scheduled | | 🟡 PENDING |
| INS-03 | Inspection Reminder | | 🟡 PENDING |
| INS-04 | Inspection Completed | | 🟡 PENDING |
| INS-05 | Findings Review | | 🟡 PENDING |
| INS-06 | Corrective Action Created | | 🟡 PENDING |
| INS-07 | Maintenance Request from Inspection | | 🟡 PENDING |
| INS-08 | Compliance Matter from Inspection | | 🟡 PENDING |
| INS-09 | Follow-Up Inspection | | 🟡 PENDING |

---

## Document Workflows (DOC-01 to DOC-08)

*(To be documented during GHL inventory)*

| Code | Name | Trigger | Status |
|------|------|---------|--------|
| DOC-01 | Document Added | | 🟡 PENDING |
| DOC-02 | Document Classified | | 🟡 PENDING |
| DOC-03 | Document Issued | | 🟡 PENDING |
| DOC-04 | Signature Requested | | 🟡 PENDING |
| DOC-05 | Document Signed | | 🟡 PENDING |
| DOC-06 | Acknowledgment Required | | 🟡 PENDING |
| DOC-07 | Document Acknowledged | | 🟡 PENDING |
| DOC-08 | Document Version Updated | | 🟡 PENDING |

---

## Compliance Workflows (CMP-01 to CMP-10)

*(To be documented during GHL inventory)*

| Code | Name | Trigger | Status |
|------|------|---------|--------|
| CMP-01 | Matter Reported | | 🟡 PENDING |
| CMP-02 | Internal Review | | 🟡 PENDING |
| CMP-03 | Notice Prepared | | 🟡 PENDING |
| CMP-04 | Notice Sent | | 🟡 PENDING |
| CMP-05 | Response Received | | 🟡 PENDING |
| CMP-06 | Hearing Scheduled | | 🟡 PENDING |
| CMP-07 | Hearing Completed | | 🟡 PENDING |
| CMP-08 | Board Decision | | 🟡 PENDING |
| CMP-09 | Corrective Action | | 🟡 PENDING |
| CMP-10 | Matter Closed | | 🟡 PENDING |

---

## Payment Workflows (PAY-01 to PAY-10)

*(To be documented during payment discovery)*

| Code | Name | Trigger | Status |
|------|------|---------|--------|
| PAY-01 | Payment Initiated | | 🟡 PENDING |
| PAY-02 | Payment Authorized | | 🟡 PENDING |
| PAY-03 | Payment Failed | | 🟡 PENDING |
| PAY-04 | Payment Settled | | 🟡 PENDING |
| PAY-05 | Refund Requested | | 🟡 PENDING |
| PAY-06 | Refund Processed | | 🟡 PENDING |
| PAY-07 | Dispute Received | | 🟡 PENDING |
| PAY-08 | Dispute Resolved | | 🟡 PENDING |
| PAY-09 | Autopay Processed | | 🟡 PENDING |
| PAY-10 | Reconciliation Exception | | 🟡 PENDING |

---

## User Workflows (USR-01 to USR-06)

*(To be documented during implementation)*

| Code | Name | Trigger | Status |
|------|------|---------|--------|
| USR-01 | User Invited | | 🟡 PENDING |
| USR-02 | Invitation Accepted | | 🟡 PENDING |
| USR-03 | Role Assigned | | 🟡 PENDING |
| USR-04 | User Suspended | | 🟡 PENDING |
| USR-05 | User Reactivated | | 🟡 PENDING |
| USR-06 | MFA Required | | 🟡 PENDING |

---

## Workflow Status Display

### Portal Status Indicators

| Status | Color | Icon | Display Text |
|--------|-------|------|--------------|
| New | Blue | ● | New |
| Emergency | Red | ⚠ | Emergency |
| Pending Approval | Purple | ⏸ | Awaiting Approval |
| Vendor Assigned | Teal | 👤 | Vendor Assigned |
| Scheduled | Teal | 📅 | Scheduled |
| In Progress | Teal | 🔧 | In Progress |
| Completed | Green | ✓ | Pending Confirmation |
| Closed | Gray | ✓ | Closed |
| Reopened | Red | ↻ | Reopened |

---

## Mock Workflow Adapter

Until live GHL workflows are confirmed, implement:

```typescript
class MockWorkflowService implements GhlWorkflowService {
  async trigger(workflowCode: string, context: WorkflowContext): Promise<WorkflowResult> {
    // Log the trigger
    console.log(`[MOCK] Workflow ${workflowCode} triggered`, context);
    
    // Simulate delay
    await delay(500);
    
    // Return mock success
    return {
      success: true,
      correlationId: `MOCK-${Date.now()}`,
      mock: true,
      simulatedActions: this.getSimulatedActions(workflowCode)
    };
  }
  
  private getSimulatedActions(code: string): string[] {
    const actions: Record<string, string[]> = {
      'MNT-01': ['Email sent to management', 'Task created'],
      'MNT-02': ['SMS sent to on-call', 'Emergency task created'],
      // ... etc
    };
    return actions[code] || ['Action simulated'];
  }
}
```

---

## Next Steps

1. Inventory existing GHL workflows
2. Document trigger conditions
3. Map workflow codes to GHL workflow IDs
4. Test webhook payloads
5. Verify workflow outcomes
6. Update this document with confirmed details
