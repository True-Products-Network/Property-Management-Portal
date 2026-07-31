# Permissions Documentation
## Exemplary Property Management Portal

**Purpose:** Document all role-based permissions and access controls.

---

## Portal Roles

| Role | ID | Description |
|------|-----|-------------|
| Admin User | `ADMIN_USER` | Full platform administration |
| Management Staff | `MANAGEMENT_STAFF` | Property management operations |
| Owner | `OWNER` | Property/unit owner |
| Resident | `RESIDENT` | Tenant/occupant |
| Board Member | `BOARD_MEMBER` | Association board member |
| Vendor | `VENDOR` | Approved contractor/service provider |

---

## Permission Matrix

### Module Access

| Module | Admin | Management | Owner/Resident | Board | Vendor |
|--------|:-----:|:----------:|:--------------:|:-----:|:------:|
| Dashboard | F | F (assigned) | O | R | O |
| Associations | F | F (assigned) | R (summary) | R (assigned) | — |
| Properties | F | F (assigned) | O | R (assigned) | R (job location) |
| Units | F | F (assigned) | O | R (restricted) | R (job location) |
| People | F | F (assigned) | O (profile) | R (directory) | O (profile) |
| Maintenance | F | F (assigned) | O | R/A (assigned) | O (assigned jobs) |
| Vendors | F | F (assigned) | — | R (summary) | O (company) |
| Inspections | F | F (assigned) | O (public) | R | O (assigned) |
| Documents | F | F (assigned) | O (permitted) | R (permitted) | O (permitted) |
| Compliance | F | F (assigned) | O (related) | R/A (permitted) | — |
| Approvals | F | F (assigned) | — | A/R | — |
| Payments | Restricted F | Restricted (assigned) | O (permitted) | R (reports) | O (invoices) |
| Communications | F | F (assigned) | O | R/A (permitted) | O |
| Reports | F | R/F (assigned) | — (statements only) | R (approved) | O (history) |
| Workflow Activity | F | (assigned records) | (public events) | (selected) | (selected) |
| **Admin Section** | **F** | **—** | **—** | **—** | **—** |
| User Maintenance | F | — | — | — | — |
| Integration Settings | F | — | — | — | — |
| Payment Processor Settings | F (restricted) | — | — | — | — |
| Audit Log | F | — | — | — | — |

**Legend:**
- **F** = Full access within assigned scope
- **R** = Read only
- **O** = Own/assigned records only
- **A** = Approval action only
- **—** = No access

---

## Record Scope Rules

### Association Scope
- Users can only access Associations they are explicitly linked to
- No cross-association visibility in any list, search, or API response
- URL parameter tampering must not bypass scope checks

### Property Scope
- **Admin:** All properties
- **Management:** Properties in assigned Associations
- **Owner/Resident:** Only their owned/occupied properties
- **Board:** Properties in their Association
- **Vendor:** Properties where they have assigned jobs

### Unit Scope
- **Admin:** All units
- **Management:** Units in assigned Properties
- **Owner/Resident:** Only their units
- **Board:** Summary only (no individual unit details)
- **Vendor:** Units where they have assigned jobs

### Maintenance Request Scope
- **Admin:** All requests
- **Management:** Requests in assigned Associations
- **Owner/Resident:** Only their reported requests
- **Board:** Requests requiring approval + Association summary
- **Vendor:** Only assigned jobs

### Document Scope
- **Confidentiality levels:** Public, Management, Board, Management+Board, Management+Owner, All Parties
- Users see only documents at their confidentiality level or below
- Related record permissions also apply

---

## Field-Level Restrictions

| Field | Admin | Management | Owner | Board | Vendor |
|-------|:-----:|:----------:|:-----:|:-----:|:------:|
| Internal maintenance notes | ✓ | ✓ | ✗ | ✗ | ✗ |
| Owner access notes | ✓ | ✓ | ✗ | ✗ | ✓ (when required) |
| Board discussion | ✓ | ✓ | ✗ | ✓ | ✗ |
| Vendor credentials | ✓ | ✓ | ✗ | ✓ (selected roles) | ✓ |
| Communication permissions | ✓ | ✓ | ✓ | ✗ | ✗ |
| Payment destination | ✓ (restricted) | ✗ | ✗ | ✗ | ✗ |
| Tax ID/EIN | ✓ (restricted) | ✓ (restricted) | ✗ | ✗ | ✗ |
| Audit log | ✓ | ✗ | ✗ | ✗ | ✗ |
| GHL Contact Role mapping | ✓ | ✗ | ✗ | ✗ | ✗ |

---

## API Permission Enforcement

### Every API Request Must:

1. **Authenticate**
   ```typescript
   const session = await validateSession(req);
   if (!session) return 401;
   ```

2. **Resolve User**
   ```typescript
   const user = await getPortalUser(session.userId);
   const roles = await getActiveRoles(user.id);
   ```

3. **Check Role Access**
   ```typescript
   if (!roles.some(r => allowedRoles.includes(r.role))) {
     return 403;
   }
   ```

4. **Apply Record Scope**
   ```typescript
   const scope = await resolveRecordScope(user.id, roles);
   const records = await queryRecords({ ...filter, ...scope });
   ```

5. **Validate Field Access**
   ```typescript
   const visibleFields = filterFieldsByPermission(fields, roles);
   ```

6. **Log Audit Event**
   ```typescript
   await logAuditEvent({
     actorId: user.id,
     action: 'record_read',
     recordType,
     recordId,
     correlationId
   });
   ```

---

## Permission Cache Strategy

### Cache Structure
```typescript
interface PermissionCache {
  userId: string;
  roles: PortalRole[];
  associations: string[];
  properties: string[];
  units: string[];
  vendors: string[];
  expiresAt: Date;
}
```

### Cache Invalidation
- On role change
- On association membership change
- On session revocation
- On permission rule update
- TTL: 15 minutes

---

## Admin-Only Section Protection

### Routes Protected
- `/admin` and all sub-routes
- `/api/admin/*` endpoints

### Protection Mechanism
```typescript
// middleware.ts
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const session = await getSession(req);
    if (!session?.roles?.includes('ADMIN_USER')) {
      return NextResponse.redirect('/access-denied');
    }
  }
}
```

### No Information Leakage
- Admin routes return 404 (not 403) to non-admins
- Admin menu items hidden from API responses
- No admin data in page preload for non-admins

---

## Cross-Association Protection Tests

### Required Tests

1. **List View Test**
   ```typescript
   test('User A cannot see Association B records', async () => {
     const userA = await createTestUser({ association: 'A' });
     const records = await fetchRecords(userA.token);
     expect(records).none.toHaveProperty('associationId', 'B');
   });
   ```

2. **URL Tampering Test**
   ```typescript
   test('Changing ID in URL does not bypass permissions', async () => {
     const userA = await createTestUser({ association: 'A' });
     const response = await fetch(`/api/records/${recordB.id}`, {
       headers: { Authorization: userA.token }
     });
     expect(response.status).toBe(404);
   });
   ```

3. **Search Test**
   ```typescript
   test('Search does not reveal other associations', async () => {
     const userA = await createTestUser({ association: 'A' });
     const results = await search(userA.token, 'common term');
     expect(results).none.toHaveProperty('associationId', 'B');
   });
   ```

4. **Autocomplete Test**
   ```typescript
   test('Autocomplete limited to permitted associations', async () => {
     const userA = await createTestUser({ association: 'A' });
     const suggestions = await autocomplete(userA.token, 'prop');
     expect(suggestions).none.toMatch(/Association B/);
   });
   ```

---

## Role Transition Handling

### When Role Changes
1. Invalidate all active sessions (configurable)
2. Clear permission cache
3. Force re-authentication if required
4. Update GHL Contact Role mapping

### When Access Revoked
1. Immediately invalidate all sessions
2. Clear all caches
3. Log security event
4. Notify user on next attempt

---

## Emergency Access

### Break-Glass Procedure
1. Admin User can grant temporary elevated access
2. Requires reason and approval from second Admin
3. Time-limited (default 4 hours)
4. Full audit trail
5. Automatic notification to security contact

---

## Permission Configuration

### GHL Contact Role Mapping

| GHL Contact Role(s) Value | Portal Role(s) Granted |
|---------------------------|------------------------|
| `Admin User` | ADMIN_USER |
| `Property Manager` | MANAGEMENT_STAFF |
| `Maintenance Coordinator` | MANAGEMENT_STAFF |
| `Staff` | MANAGEMENT_STAFF |
| `Owner` | OWNER |
| `Resident` | RESIDENT |
| `Tenant` | RESIDENT |
| `Board President` | BOARD_MEMBER |
| `Board Treasurer` | BOARD_MEMBER |
| `Board Secretary` | BOARD_MEMBER |
| `Board Member` | BOARD_MEMBER |
| `Vendor Contact` | VENDOR |

**Note:** Exact values to be confirmed with Admin User.

---

## Next Steps

1. Confirm GHL Contact Role values
2. Implement permission middleware
3. Create permission test suite
4. Document edge cases
5. Review with security auditor
