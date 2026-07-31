# OpenClaw Portal Build Prompt

## How to use this prompt

Give OpenClaw the entire `portal_spec` folder, including:

- `Emma_Property_Management_Portal_Complete_Build_Specification.md`
- `assets/management-dashboard.png`
- `assets/maintenance-request-detail.png`
- this prompt

Place the specification at `docs/build-specification.md` inside the application repository, and place the two approved images at `assets/reference-screens/`.

Paste everything between **START OF PROMPT** and **END OF PROMPT** into OpenClaw.

---

## START OF PROMPT

You are the lead solution architect, product designer, full-stack engineer, integration engineer, security reviewer, and test engineer for the Exemplary Property Management Portal.

Your job is to build the working portal described in:

`docs/build-specification.md`

The approved visual references are:

- `assets/reference-screens/management-dashboard.png`
- `assets/reference-screens/maintenance-request-detail.png`

Treat the specification and reference screens as the product requirements. Do not replace them with a generic property-management template.

### 1. Required outcome

Build one responsive property-management portal with five controlled access levels:

1. Admin User
2. Management Staff
3. Owner or Resident
4. Board Member
5. Vendor

The portal must cover all 114 screens in the specification through reusable layouts, components, forms, tables, detail views, workflow timelines, and role-based variants.

The finished system must support:

- associations;
- properties;
- units;
- contacts and their roles;
- vendors;
- maintenance;
- inspections;
- documents;
- compliance matters;
- board approvals;
- communications;
- payments and statements;
- reports;
- workflow activity;
- integration errors;
- Admin-only users, roles, mappings, settings, integrations, and audit records.

Do not build 114 unrelated pages. Create a reusable design system and shared screen patterns, then configure each named screen from the specification.

### 2. Fixed product decisions

These decisions are not open to reinterpretation:

- All authenticated operational forms are portal-native.
- Do not use, iframe, or embed GHL forms, surveys, funnels, or calendars as the portal interface.
- GHL is the operational record, association, communication, task, and workflow system.
- All browser requests to GHL must pass through the protected server-side portal API.
- Never expose a GHL token, raw internal response, webhook secret, payment secret, or unrestricted object ID in browser code.
- Portal roles are derived from the GHL `Contact Role(s)` field plus verified record relationships and portal access status.
- GHL native staff roles are separate from portal roles.
- Only the `Admin User` role may enter the Admin section.
- Inspection, Document Record, and Compliance Matter already exist in GHL. Inventory and reuse them. Do not recreate, rename, or replace them without written approval.
- A Maintenance Request relates directly to Property, optional Unit, reporting Contact, optional assigned Vendor, and optional assigned Staff Member.
- A Maintenance Request does not have a direct Association relationship.
- Derive its Association only through `Maintenance Request → Property → Association`.
- Payment card and bank information must go directly to the selected processor. Do not store raw payment credentials in the portal, its logs, its database, or GHL.
- The payment processor is not yet selected. Build a processor interface and a safe test adapter, but do not choose or connect a production processor without approval.
- Do not write to production GHL data until the schema inventory, field mapping, test environment, and written approval are complete.

### 3. Authority order

Use this order when instructions conflict:

1. The latest written instruction from Nigel for this project
2. `docs/build-specification.md`
3. Approved reference screens
4. The GHL schema inventory and confirmed field IDs
5. This build-control prompt
6. Reasonable engineering judgment recorded in the decision log

Do not silently resolve a material conflict. Record it in `docs/build-decisions.md`, state the recommended resolution, and pause only the affected feature.

### 4. Default technical direction

Use this stack unless the existing repository already has a suitable supported stack:

- Next.js App Router with strict TypeScript
- React
- Tailwind CSS
- accessible reusable UI components
- Zod schemas for input, output, environment, and webhook validation
- PostgreSQL for portal-only operational data
- Supabase may provide PostgreSQL, authentication, row-level security, and protected file storage
- a server-side GHL adapter behind a typed service interface
- a payment-provider interface with a fake or test adapter until a processor is approved
- Vitest or the repository’s equivalent for unit and component tests
- Playwright for end-to-end and role-access tests

Use stable versions supported by the repository and deployment environment. Do not perform a framework rewrite if a suitable application already exists.

The portal database may hold:

- portal account and authentication references;
- verified role and Association membership projections;
- sessions;
- idempotency records;
- correlation IDs;
- integration attempts and safe error summaries;
- audit events;
- short-lived caches;
- file metadata and signed-access references;
- portal preferences;
- processor references and safe payment status when approved.

Do not create a competing copy of the GHL business record model merely because local queries are easier. GHL remains the source of truth for the operational records named in the specification.

### 5. Start with repository and requirements discovery

Before changing code:

1. Inspect the repository, existing application, instructions, package files, tests, environment templates, deployment configuration, and uncommitted changes.
2. Read `docs/build-specification.md` completely.
3. Inspect both approved reference images.
4. Create or update:
   - `docs/implementation-plan.md`
   - `docs/build-decisions.md`
   - `docs/ghl-schema-inventory.md`
   - `docs/ghl-field-map.md`
   - `docs/workflow-map.md`
   - `docs/permissions.md`
   - `docs/test-plan.md`
   - `docs/project-status.md`
5. List every unresolved external dependency, but separate:
   - blockers for the current stage;
   - decisions that can wait for a later stage;
   - production-only requirements.
6. Map all 114 screen IDs to planned routes and shared screen patterns.
7. Do not delete or overwrite unrelated existing work.

If there is no existing application, create the project structure described in Section 34 of the specification.

### 6. GHL discovery and adapter requirements

Build the GHL integration behind typed interfaces so UI work can proceed with fixtures before production credentials are available.

Create:

- `GhlClient`
- `GhlRecordRepository`
- `GhlAssociationRepository`
- `GhlWorkflowService`
- `GhlWebhookVerifier`
- `MockGhlAdapter`

The adapter must support:

- Contacts;
- Association Companies;
- Vendor Companies;
- Property objects;
- Unit objects;
- Maintenance Request objects;
- existing Inspection objects and record types;
- existing Document Record objects and record types;
- existing Compliance Matter objects and record types;
- object relationships;
- pagination;
- filtering;
- safe retry with backoff;
- rate-limit handling;
- timeouts;
- idempotent writes;
- normalized errors;
- correlation IDs;
- webhook signature verification;
- test fixtures.

Never hard-code live GHL field IDs, object IDs, location IDs, pipeline IDs, workflow IDs, or relationship IDs in components. Put confirmed IDs in validated server configuration or mapping files.

Before implementing live object writes:

1. Inventory the current GHL objects, fields, types, dropdown values, record types, relationships, workflows, and relevant internal IDs.
2. Compare the inventory with Sections 5, 17, 19, 21–24, 28, and 29 of the specification.
3. Classify every required field as:
   - existing and usable;
   - existing but requiring an approved mapping;
   - missing and requiring approval;
   - intentionally portal-only.
4. Present the difference report before changing the GHL schema.

### 7. Authentication and authorization

Authentication is not the same as authorization.

For every request:

1. Authenticate the portal user.
2. Resolve the linked GHL Contact.
3. Read or refresh the approved `Contact Role(s)` mapping.
4. Resolve active Association, Property, Unit, Board, or Vendor relationships.
5. apply record scope and field-level permissions on the server;
6. return only permitted data.

Client-side menu hiding is not a security control. Every API route and server action must enforce permissions independently.

Test at least:

- Admin User can access Admin pages.
- Management Staff cannot access Admin pages.
- An owner cannot view another owner’s Unit or request.
- A board member cannot view a different Association.
- A vendor can view only assigned jobs and permitted location/access details.
- A revoked user cannot continue through an old session.
- Changing a URL or ID cannot bypass record scope.

### 8. Design and interface rules

Reproduce the approved visual direction:

- dark navy sidebar;
- teal active state and primary actions;
- light gray workspace;
- white cards;
- compact summary cards;
- clear text status pills;
- restrained color;
- clean data tables;
- readable activity timelines;
- desktop, tablet, and mobile layouts.

Use the exact color, spacing, radius, status, and layout guidance in Section 3.

Create a shared component library for:

- portal shell and role menus;
- Association selector;
- breadcrumbs;
- global search;
- notification center;
- summary cards;
- filterable tables;
- detail summary panels;
- status and urgency pills;
- process tracker;
- activity timeline;
- workflow status;
- role-aware action menus;
- approval panels;
- portal-native forms;
- conditional form sections;
- file upload;
- document viewer;
- messages;
- empty, loading, success, integration-delay, and error states;
- confirmation and destructive-action dialogs;
- responsive navigation.

Each screen must have its own route and required behavior even when it uses a shared template.

Do not claim a screen is complete if it is only a static card or navigation placeholder.

### 9. Portal form rules

All operational forms must:

- render natively in the portal;
- retrieve permitted record choices from the protected portal API;
- prefill the signed-in person when appropriate;
- show only records the person may use;
- validate in the browser for usability and again on the server for security;
- use conditional fields from the specification;
- submit with an idempotency key;
- create or update the correct GHL record and relationships;
- trigger the named GHL workflow through the approved record change or webhook;
- return a human-readable reference number, current status, and next step;
- retain user input safely when a recoverable validation error occurs;
- never require temporary Contact fields simply to pass custom-object form answers.

### 10. API and webhook contract

Implement the routes in Section 17. Add a route only when the specification requires behavior that cannot be represented by an existing route. Record additions in the decision log.

Every write must:

1. validate the session;
2. validate role and record scope;
3. validate the payload;
4. enforce business rules;
5. use an idempotency key;
6. write the record and relationships;
7. produce an audit event;
8. trigger or prepare the correct GHL workflow;
9. return a normalized result with a correlation ID.

Every inbound webhook must:

- verify its signature;
- enforce timestamp or replay protection;
- validate its schema;
- reject duplicates safely;
- record a safe integration event;
- avoid logging secrets or unnecessary personal data;
- return quickly and process slow follow-up asynchronously.

### 11. Workflow boundary

GHL runs the workflows listed in Section 19. The portal starts actions and displays results; it does not silently replace approved GHL automation with hidden portal-only business logic.

For each workflow code:

- document the trigger;
- document the portal action that starts it;
- document the GHL record and field changes;
- document expected messages, tasks, reminders, and escalations;
- document the callback or polling behavior;
- show the current workflow state on the related screen;
- handle timeout, duplicate, failure, and delayed-completion states.

Use a fake workflow result adapter until live GHL workflows are confirmed.

### 12. File handling

Use a protected file-storage design:

- no public unrestricted bucket for private property records;
- short-lived signed URLs;
- access check before every download;
- allowed file type and size validation;
- malware-scanning hook or quarantine state;
- metadata recorded against the correct GHL record;
- upload tokens rather than raw browser-to-GHL credentials;
- audit events for sensitive downloads, replacements, and deletions.

### 13. Payment boundary

Payments are a later stage because discovery is incomplete.

Now:

- create a typed `PaymentProvider` interface;
- create a fake/test provider;
- build the approved portal screens with clearly marked test data;
- support processor session, payment status, receipt reference, refunds, voids, autopay intent, and webhook events at the interface level;
- write tests for signature verification, duplicate events, amount mismatch, and unauthorized refunds.

Do not:

- select a live processor;
- store card or bank data;
- mark a payment paid based on a browser response;
- implement vendor payouts;
- assume how Association funds, merchant accounts, fees, settlements, accounting, refunds, or disputes work.

Track the unanswered questions from Section 37. Pause only live payment activation until they are answered.

### 14. Build stages

Work in the following stages. Finish and verify one stage before moving to the next.

#### Stage 0 — Discovery and plan

- repository audit;
- full requirements read;
- screen-to-route matrix;
- technical plan;
- GHL inventory plan;
- decisions and blockers;
- local development instructions.

#### Stage 1 — Foundation

- application shell and approved design system;
- authentication;
- server-side authorization;
- GHL Contact Role mapping;
- Association context selector;
- protected API structure;
- mock GHL adapter;
- audit and integration logs;
- shared interface states;
- native form framework;
- Admin Home and User Maintenance foundation.

#### Stage 2 — Core records

- Associations;
- Properties;
- Units;
- People;
- Vendors;
- relationship manager;
- management lists and detail screens;
- scoped owner, board, and vendor views where applicable.

#### Stage 3 — Complete maintenance journey

Build and test maintenance across all four portal versions:

- management queue;
- new request;
- request detail;
- triage;
- emergency handling;
- board approval;
- vendor assignment;
- vendor response and quote;
- scheduling;
- progress;
- completion;
- invoice handoff;
- owner confirmation;
- reopening;
- workflow activity;
- overdue and error states.

This is the first complete vertical release and must work end to end with test records before Stage 4.

#### Stage 4 — Inspections

- inventory existing GHL Inspection schema and record types;
- queue and calendar;
- scheduling;
- checklist and findings;
- photos and documents;
- follow-up;
- maintenance and compliance handoffs;
- role variants.

#### Stage 5 — Documents and compliance

- inventory existing schemas and record types;
- document library and detail;
- issue, signature, acknowledgment, confidentiality, and expiration;
- compliance queue and detail;
- notices, responses, hearings, decisions, resolution, and closure;
- role variants.

#### Stage 6 — Payment framework

- complete discovery report;
- provider abstraction and test provider;
- owner payment journey;
- receipts and statements;
- Admin monitoring and exception views;
- GHL PAY workflow contract;
- production activation remains blocked until approved.

#### Stage 7 — Communications, reports, and Admin

- messages and record threads;
- announcements;
- report views and safe exports;
- workflow activity;
- integration error queue;
- roles and permissions;
- templates and workflow settings;
- dropdown and category settings;
- integrations;
- GHL Contact Role mapping;
- audit.

#### Stage 8 — Pilot

- use test records only;
- run every acceptance test in Section 33;
- test all roles;
- test Association separation;
- test each workflow;
- test duplicate actions;
- test file permissions;
- test responsive layouts and accessibility;
- produce a pilot-readiness report;
- wait for written approval before adding the first live Association.

### 15. Completion contract for every screen

A screen is complete only when it has:

- its named route;
- correct role and record-scope check;
- the fields, cards, tabs, table columns, filters, and actions from the specification;
- real adapter wiring or a clearly labeled mock adapter;
- loading state;
- empty state;
- validation state;
- success state;
- integration-delay state where applicable;
- safe error state;
- responsive desktop, tablet, and mobile layout;
- keyboard support;
- visible focus states;
- accessible names and labels;
- automated tests for its main permitted action;
- no leakage of another Association’s restricted records.

Maintain a screen completion matrix in `docs/project-status.md` with:

- screen ID;
- route;
- role;
- design status;
- data status;
- workflow status;
- test status;
- remaining issue.

### 16. Testing requirements

Create:

- schema and validation unit tests;
- permission tests;
- GHL adapter contract tests;
- webhook verification tests;
- idempotency and duplicate-submission tests;
- form conditional-logic tests;
- component tests;
- end-to-end tests for the main journeys;
- accessibility checks;
- responsive viewport checks;
- integration failure and delayed-workflow tests.

The minimum end-to-end journeys are:

1. Owner signs in, sees an associated Unit, submits maintenance, and receives a request number.
2. Management triages the request.
3. Board approves work when required.
4. Vendor accepts, submits a quote, schedules, and completes work.
5. Owner confirms resolution or reopens the same request.
6. An inspection creates a maintenance request or compliance matter.
7. A Document Record is issued and acknowledged.
8. A Compliance Matter moves through notice to closure.
9. An Admin User invites a user and maps a GHL Contact Role.
10. Every cross-Association access attempt is denied and audited.

### 17. Working behavior

- Work autonomously within the approved stage.
- Do not stop for a nonblocking question. Record the assumption and continue with a reversible implementation.
- Stop only the affected feature when a decision could cause data loss, unauthorized access, production changes, financial movement, or an incompatible schema change.
- Do not use destructive Git or filesystem commands.
- Preserve unrelated work and current repository conventions.
- Keep secrets in environment variables and provide `.env.example` with names and descriptions only.
- Do not place example secrets in source control.
- Use fixtures whose names begin with `TEST`.
- Never claim a live integration works unless it has been tested successfully against the approved environment.
- Do not hide incomplete work behind polished screenshots.

### 18. Progress report after each stage

After each stage, report:

1. outcome completed;
2. routes and screen IDs completed;
3. files changed;
4. tests run and results;
5. screenshots or preview links;
6. GHL objects, fields, relationships, and workflows used;
7. mock behavior still in use;
8. security checks completed;
9. open decisions;
10. the exact next stage.

Update `docs/project-status.md`, `docs/build-decisions.md`, and the test plan before starting the next stage.

### 19. Your first assignment

Complete Stage 0 only.

Return:

- repository assessment;
- proposed application architecture;
- screen-to-route and shared-template strategy for all 114 screens;
- GHL inventory and mapping plan;
- proposed database tables limited to portal responsibilities;
- authentication and authorization approach;
- file-storage approach;
- staged implementation plan;
- testing plan;
- blockers separated by stage;
- files created or changed.

Do not begin production GHL changes, payment activation, or live data migration.

At the end of Stage 0, state:

> Stage 0 is complete. Ready to begin Stage 1 — Foundation.

Then wait for approval before Stage 1.

## END OF PROMPT

---

## Recommended follow-up prompt after Stage 0

After reviewing OpenClaw’s Stage 0 output, use:

> Stage 0 is approved with the decisions recorded in `docs/build-decisions.md`. Begin Stage 1 — Foundation. Implement the application shell, approved design system, authentication boundary, server-side role and Association permissions, mock GHL adapter, portal-native form framework, audit and integration logging, Admin Home, and User Maintenance foundation. Use only TEST fixtures. Run the Stage 1 tests, update the project documents, provide responsive screen previews, and stop for review when Stage 1 meets its completion criteria.

## Recommended instruction for later stages

Use the same pattern:

> Stage [number] is approved. Begin Stage [number + 1] exactly as defined in the build-control prompt and `docs/build-specification.md`. Resolve approved decisions from `docs/build-decisions.md`, use TEST data unless live access has been explicitly approved, run the required tests, update the screen completion matrix, and stop for review when the stage meets its completion criteria.
