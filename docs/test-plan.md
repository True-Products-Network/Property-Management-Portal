# Test Plan
## Exemplary Property Management Portal

**Purpose:** Define testing strategy, test cases, and acceptance criteria.

---

## Testing Levels

### 1. Unit Tests (Vitest)
**Scope:** Individual functions, utilities, validators

| Component | Test Cases |
|-----------|------------|
| Schema validators | Valid data passes, invalid data fails with correct errors |
| Permission logic | Each role resolves correctly, edge cases handled |
| GHL adapter | Contract tests with mock responses |
| Form conditional logic | Field visibility based on values |
| Date/currency utilities | Formatting, parsing, timezone handling |
| ID generators | Uniqueness, format compliance |

**Coverage Target:** 80%+ for business logic

---

### 2. Integration Tests
**Scope:** API routes, database operations, service interactions

| Component | Test Cases |
|-----------|------------|
| Authentication | Sign-in, MFA, password reset, session management |
| API routes | Each endpoint validates auth, permissions, input |
| Database | CRUD operations, RLS policies, transactions |
| GHL adapter | Mock client responses, error handling, retries |
| Webhooks | Signature verification, event parsing, duplicate handling |
| File handling | Upload, download, access control, expiration |
| Idempotency | Duplicate requests return same result |

---

### 3. End-to-End Tests (Playwright)
**Scope:** Complete user journeys across all portal versions

#### Critical Journey Tests

**Journey 1: Owner Maintenance Request**
```gherkin
Given an owner is signed in
And they have an associated unit
When they submit a maintenance request
Then they receive a request number
And the request appears in their list
And management receives notification
```

**Journey 2: Management Triage**
```gherkin
Given a management user is signed in
And there is a new maintenance request
When they review and triage the request
Then the status updates to "Triaged"
And the appropriate workflow triggers
```

**Journey 3: Board Approval**
```gherkin
Given a board member is signed in
And there is a request awaiting approval
When they review and approve
Then the status updates to "Approved"
And the vendor is notified
```

**Journey 4: Vendor Workflow**
```gherkin
Given a vendor is signed in
And they have an assigned job
When they accept, quote, schedule, and complete
Then each status updates correctly
And the owner receives notifications
```

**Journey 5: Owner Confirmation**
```gherkin
Given an owner is signed in
And their maintenance request is completed
When they confirm resolution
Then the request closes
And they see a confirmation
```

**Journey 6: Inspection to Maintenance**
```gherkin
Given an inspection with findings
When findings are reviewed
Then a maintenance request can be created
And it links to the inspection
```

**Journey 7: Document Acknowledgment**
```gherkin
Given a document requiring acknowledgment
When the owner views and acknowledges it
Then the acknowledgment is recorded
And the workflow completes
```

**Journey 8: Compliance Matter**
```gherkin
Given a compliance matter
When it moves through notice, response, hearing, decision
Then each status is recorded
And the matter closes with full history
```

**Journey 9: Admin User Management**
```gherkin
Given an admin user is signed in
When they invite a user and assign roles
Then the invitation is sent
And the role mapping is saved
```

**Journey 10: Cross-Association Security**
```gherkin
Given User A belongs to Association A
When they attempt to access Association B records
Then all requests return 404
And no data is leaked
```

---

## Test Data

### TEST Records (per specification)

| Record | ID | Details |
|--------|-----|---------|
| Association | TEST – Ridgeland Condominium Association | |
| Property | TEST – 6722 S Ridgeland | |
| Unit | TEST – 6722 Ridgeland – Unit 3S | |
| Owner | Test Owner – Mary Jones | |
| Admin | Test Admin – Alex Morgan | |
| Multi-role | Test Owner/Board – Jordan Lee | |
| Vendor | TEST – ABC Plumbing | |
| Maintenance | Water leak under kitchen sink | |
| Payment | TEST – Assessment – $125.00 | |

### Test Fixtures
- All fixtures prefixed with `TEST`
- Isolated test database
- Reset between test runs
- Mock GHL adapter responses

---

## Accessibility Tests

### Automated Checks
- axe-core integration
- Lighthouse accessibility audit
- Color contrast validation

### Manual Checks
| Check | Tool/Method |
|-------|-------------|
| Keyboard navigation | Tab through all interactive elements |
| Focus visibility | Visual focus indicator on all elements |
| Screen reader labels | NVDA/VoiceOver testing |
| Color independence | Information not color-only |
| Zoom support | 200% zoom, responsive layouts |
| Motion preferences | Respect `prefers-reduced-motion` |

---

## Responsive Tests

### Viewport Matrix

| Device | Width | Height | Tests |
|--------|-------|--------|-------|
| Mobile | 375px | 667px | Touch targets, stacked layout |
| Mobile Large | 414px | 896px | Larger phones |
| Tablet | 768px | 1024px | Sidebar collapse, 2-column |
| Desktop | 1440px | 900px | Full layout, 3-column |
| Large Desktop | 1920px | 1080px | Max content width |

### Responsive Behaviors
- Sidebar collapses to hamburger menu < 1024px
- Tables become cards or horizontal scroll on mobile
- Filters move to drawer on mobile
- Touch targets minimum 44x44px

---

## Security Tests

### Authentication
- [ ] Brute force protection
- [ ] Session expiration
- [ ] Concurrent session handling
- [ ] Password strength requirements
- [ ] MFA enforcement for sensitive roles

### Authorization
- [ ] Role-based access control
- [ ] Record scope enforcement
- [ ] Field-level permissions
- [ ] URL parameter tampering resistance
- [ ] API endpoint protection

### Data Protection
- [ ] No GHL tokens in browser
- [ ] No raw payment data in logs
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection

### File Security
- [ ] Signed URL expiration
- [ ] Access control on download
- [ ] File type validation
- [ ] Size limits enforced

---

## Performance Tests

### Metrics
| Metric | Target | Maximum |
|--------|--------|---------|
| First Contentful Paint | < 1.5s | 2.5s |
| Largest Contentful Paint | < 2.5s | 4s |
| Time to Interactive | < 3s | 5s |
| Cumulative Layout Shift | < 0.1 | 0.25 |

### Load Tests
- 100 concurrent users
- 1000 requests/minute
- API response time < 500ms (p95)

---

## Workflow Tests

### Idempotency
```typescript
test('Duplicate submission returns same result', async () => {
  const idempotencyKey = 'test-key-123';
  const result1 = await submitRequest(data, idempotencyKey);
  const result2 = await submitRequest(data, idempotencyKey);
  expect(result1.requestNumber).toBe(result2.requestNumber);
  expect(result1.correlationId).toBe(result2.correlationId);
});
```

### Duplicate Webhook Handling
```typescript
test('Duplicate webhook is ignored', async () => {
  const webhook = createTestWebhook();
  await processWebhook(webhook);
  const result = await processWebhook(webhook); // Same ID
  expect(result.status).toBe('ignored');
});
```

### Rate Limit Handling
```typescript
test('Rate limit triggers retry with backoff', async () => {
  mockGhl.setRateLimit(true);
  const result = await ghlClient.request(config);
  expect(result.retryCount).toBeGreaterThan(0);
  expect(result.success).toBe(true);
});
```

---

## Acceptance Criteria (from Specification Section 33)

### Access Tests
- [ ] Association A user cannot see Association B in any list
- [ ] URL ID changes do not bypass permissions
- [ ] Multi-role users see correct version
- [ ] Vendor sees only assigned jobs
- [ ] Non-Admin cannot access Admin routes
- [ ] Admin can invite, suspend, reactivate users
- [ ] Invalid Contact Role grants no access
- [ ] Role change invalidates caches/sessions

### Maintenance Tests
- [ ] Owner sees only permitted units
- [ ] Common-area request works without Unit
- [ ] Unit/Property mismatch rejected
- [ ] Request creates one record
- [ ] Relationships appear correctly
- [ ] Association derived through Property only
- [ ] Emergency triggers MNT-02
- [ ] Owner confirmation closes/reopens same request

### Integration Tests
- [ ] Duplicate create returns first result
- [ ] Rate limit retries safely
- [ ] Validation error enters manual review
- [ ] Bad webhook signature rejected
- [ ] Duplicate webhook ignored
- [ ] Workflow status appears in portal
- [ ] No GHL forms embedded
- [ ] Portal forms write correct GHL objects

### Payment Tests (Test Mode Only)
- [ ] Portal cannot mark paid from browser
- [ ] No raw card data in logs/storage
- [ ] Valid webhook updates correct records
- [ ] Duplicate processor event ignored
- [ ] Mismatched amount enters exception queue
- [ ] Failed payment shows safe retry
- [ ] Refund/void hidden unless permitted

---

## Test Environments

### Local Development
- SQLite or local PostgreSQL
- Mock GHL adapter
- Test fixtures only

### Staging
- Staging PostgreSQL
- GHL sandbox/test location
- TEST records only
- No live payments

### Production
- Production PostgreSQL
- Production GHL
- Live data (after pilot approval)
- Live payments (after approval)

---

## CI/CD Integration

### Pre-commit
- Linting
- Type checking
- Unit tests

### Pull Request
- All unit tests
- Integration tests
- Build verification

### Deployment
- Full test suite
- E2E critical journeys
- Security scan
- Performance baseline

---

## Test Documentation

### For Each Test
```typescript
describe('Feature Name', () => {
  it('should do X when Y', () => {
    // Arrange
    const setup = createTestSetup();
    
    // Act
    const result = performAction(setup);
    
    // Assert
    expect(result).toMatchExpected();
  });
});
```

### Test Output
- Clear failure messages
- Screenshots for E2E failures
- Logs for debugging
- Coverage reports

---

## Next Steps

1. Set up Vitest configuration
2. Set up Playwright configuration
3. Create test utilities and fixtures
4. Write first unit tests
5. Write first E2E journey test
6. Integrate with CI/CD
