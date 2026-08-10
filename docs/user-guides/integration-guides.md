# Integration Guides

Connect the Property Management Portal with your existing tools and services.

## GoHighLevel (GHL) Integration

The GHL integration syncs contacts, calendar events, and communications between the portal and your GHL account.

### What Syncs
- **Contacts**: Owners, tenants, vendors
- **Calendar Events**: Inspections, appointments
- **Communications**: Emails and messages
- **Tasks**: Follow-ups and reminders

### Setting Up GHL Integration

#### Step 1: Get GHL API Key
1. Log in to your GHL account
2. Go to Settings → API
3. Generate a new API key
4. Copy the key (you'll need it in the portal)

#### Step 2: Configure in Portal
1. Go to **Admin** → **Integrations** → **GHL**
2. Enter your GHL API key
3. Click **Test Connection** to verify
4. Configure sync settings:
   - Which contacts to sync
   - Calendar sync preferences
   - Field mappings
5. Enable sync

#### Step 3: Field Mapping
Map portal fields to GHL fields:
- Contact name ↔ GHL contact name
- Email ↔ GHL email
- Phone ↔ GHL phone
- Property address ↔ GHL custom field
- Role ↔ GHL tags

#### Step 4: Association-Level GHL
Each association can have its own GHL location:
1. Go to Association → **Settings** → **Integrations**
2. Enter GHL location ID
3. Configure association-specific sync rules

### Managing Sync
- **Manual Sync**: Force a sync anytime from the integration page
- **Conflict Resolution**: Choose which system wins when data differs
- **Sync Logs**: View history of sync operations

### Troubleshooting
- **Connection Failed**: Check API key and GHL account status
- **Contacts Not Syncing**: Verify field mappings
- **Duplicate Contacts**: Check for existing contacts in both systems

---

## Calendar Integration

Sync inspections and appointments with external calendars.

### Supported Calendars
- Google Calendar
- Microsoft Outlook
- Apple Calendar
- Any calendar supporting iCal feeds

### Setup
1. Go to **Admin** → **Integrations** → **Calendar**
2. Select your calendar provider
3. Authorize access
4. Choose sync direction:
   - Portal → Calendar (one way)
   - Calendar → Portal (one way)
   - Bidirectional (both ways)

### Calendar Events
The following create calendar events:
- Scheduled inspections
- Maintenance appointments
- Board meetings
- Tenant move-in/move-out dates

### Event Details
Calendar events include:
- Title and description
- Location (property address)
- Attendees (inspector, tenant, etc.)
- Reminders

---

## Live Chat Integration

Add live chat support to your portal.

### Supported Providers
- GoHighLevel Web Chat
- Intercom
- Zendesk Chat
- Custom widget (HTML/JavaScript)

### Setup
1. Go to **Admin** → **Integrations** → **Live Chat**
2. Enable live chat
3. Enter your chat widget code
4. Configure display settings:
   - Show on all pages or specific pages
   - Auto-open or user-initiated
   - Business hours

### Chat Widget Code
Get the code from your chat provider:
- GHL: Settings → Chat Widget → Install
- Intercom: Settings → Installation → Web
- Zendesk: Admin → Channels → Widget

Paste the entire script tag into the portal.

---

## Email Integration

Configure email sending for notifications and communications.

### Email Providers
- SendGrid
- Mailgun
- Amazon SES
- SMTP (custom server)

### Setup
1. Go to **Admin** → **Integrations** → **Email**
2. Select provider
3. Enter API key or SMTP credentials
4. Configure sender information:
   - From name
   - From email
   - Reply-to address
5. Test email delivery

### Email Templates
Customize emails for:
- Welcome emails
- Maintenance updates
- Inspection reminders
- Payment receipts
- Board notifications

---

## Payment Processing

Accept payments through the portal.

### Supported Processors
- Stripe
- Square
- PayPal
- Authorize.Net

### Setup
1. Go to **Admin** → **Integrations** → **Payments**
2. Select processor
3. Enter API credentials
4. Configure payment types:
   - Rent payments
   - Maintenance fees
   - Special assessments
   - Application fees
5. Set up payment methods:
   - Credit/debit cards
   - ACH/bank transfer
   - Digital wallets

### Security
- PCI compliance handled by processor
- No card data stored in portal
- Encrypted transactions
- Fraud protection

---

## API Access

Developers can access portal data via API.

### API Documentation
Full API reference available at `/api/docs` (admin access required).

### Authentication
- API keys for server-to-server access
- OAuth 2.0 for third-party apps
- JWT tokens for user authentication

### Rate Limits
- Standard: 100 requests/minute
- Enterprise: 1000 requests/minute

### Common Endpoints
- `GET /api/properties` - List properties
- `GET /api/contacts` - List contacts
- `POST /api/maintenance` - Create maintenance request
- `GET /api/inspections` - List inspections

### Webhooks
Receive real-time notifications:
- New maintenance request
- Inspection scheduled
- Contact updated
- Payment received

Configure webhooks in **Admin** → **Integrations** → **Webhooks**.

---

## Support

Need help with integrations?

**Email**: support@trueproductsnetwork.com  
**Phone**: (314) 915-3356

For complex integrations, consider working with a developer or our professional services team.
