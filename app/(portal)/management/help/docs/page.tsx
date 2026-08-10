"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { 
  Book, 
  FileText, 
  ArrowLeft, 
  ExternalLink,
  ChevronRight
} from "lucide-react";

const docCategories = [
  {
    icon: Book,
    title: "Getting Started",
    description: "Learn the basics of using the Property Management Portal",
    docs: [
      { 
        label: "Quick Start Guide", 
        content: `
# Quick Start Guide

Welcome to the Property Management Portal! This guide will get you up and running in minutes.

## First Time Setup

### 1. Log In
- Navigate to your portal URL
- Enter your email and password
- If you don't have credentials, contact your administrator

### 2. Complete Your Profile
- Click your name in the top right corner
- Select "Profile" from the dropdown
- Update your contact information and preferences

### 3. Explore the Dashboard
The main dashboard shows:
- **Properties Overview**: Total properties, occupancy rate, maintenance alerts
- **Recent Activity**: Latest maintenance requests, inspections, and updates
- **Quick Actions**: Shortcuts to common tasks

## Key Features Overview

### Portfolio View (Admin Users)
If you have admin access, you'll see the **Portfolio** menu item. This gives you:
- Platform-level settings
- Business account management
- Tenant provisioning
- System-wide reports

### Association Management
- View all associations you manage
- Access association details, properties, and contacts
- Track maintenance requests by association

### Properties
- Add and manage properties
- View property details, units, and occupancy
- Track property-specific maintenance and inspections

### People
- Manage contacts (owners, tenants, board members)
- Assign roles and permissions
- Track communication history

### Maintenance Requests
- Submit and track maintenance issues
- Assign vendors and track costs
- Escalate urgent issues

### Inspections
- Schedule routine, move-in, move-out inspections
- Record findings with ratings
- Generate inspection reports

## Next Steps

1. **Add Your First Association**: Go to Associations → Add Association
2. **Add Properties**: Navigate to Properties → Add Property
3. **Set Up Contacts**: Use the People section to add owners and tenants
4. **Configure Integrations**: Admin users can set up GHL integration in Admin → Integrations

## Need Help?

- Visit the Help page for FAQs
- Contact support at support@trueproductsnetwork.com
- Call (314) 915-3356 for phone support
        `
      },
      { 
        label: "Dashboard Overview", 
        content: `
# Dashboard Overview

The Dashboard is your command center for managing properties and associations.

## Dashboard Sections

### Header Stats Cards
At the top of the dashboard, you'll see key metrics:
- **Total Properties**: Number of properties you manage
- **Occupancy Rate**: Percentage of occupied units
- **Open Maintenance**: Number of pending maintenance requests
- **Upcoming Inspections**: Inspections scheduled in the next 30 days

### Properties Overview
A visual summary of your property portfolio:
- Property count by association
- Occupancy trends
- Recent property additions

### Recent Activity
Stay up to date with:
- New maintenance requests
- Completed inspections
- Recent contact additions
- Association updates

### Quick Actions
One-click access to common tasks:
- Add Property
- Schedule Inspection
- Submit Maintenance Request
- Generate Report

## Navigation Sidebar

The left sidebar provides access to all portal features:

### Portfolio (Admin Only)
Platform-level management for administrators.

### Dashboard
Your main overview page (current page).

### Associations
Manage HOA, Condo, and other association types.

### Properties
View and manage all properties in your portfolio.

### People
Contacts management (owners, tenants, board members).

### Maintenance
Track and manage maintenance requests.

### Inspections
Schedule and record property inspections.

### Reports
Generate and download various reports.

### Approvals
Manage approval workflows for expenses and contracts.

### Documents
Store and access important documents.

### Admin (Admin Only)
System settings, integrations, and user management.

### Help
Access this documentation and contact support.

## Customizing Your View

### Role-Based Menu
Your menu items are determined by your role:
- **Admin Users**: See Portfolio, Dashboard, and Admin sections
- **Property Managers**: See Dashboard and management features
- **Board Members**: See limited view based on permissions

### Mobile View
On mobile devices, the sidebar collapses into a hamburger menu. All features remain accessible.

## Dashboard Tips

1. **Refresh Data**: The dashboard updates automatically, but you can refresh manually by clicking the refresh icon
2. **Drill Down**: Click on any stat card to see detailed information
3. **Quick Search**: Use the search bar to find properties, contacts, or maintenance requests quickly
4. **Notifications**: Check the bell icon for important alerts and updates

## Getting Help

If you need assistance with the dashboard:
- Click the Help icon in the sidebar
- Email support@trueproductsnetwork.com
- Call (314) 915-3356
        `
      },
      { 
        label: "Setting Up Your First Property", 
        content: `
# Setting Up Your First Property

This guide walks you through adding your first property to the portal.

## Prerequisites

Before adding a property, you should have:
- An association created (HOA, Condo, etc.) OR be adding a standalone property
- Property details ready (address, type, units)

## Step 1: Navigate to Properties

1. Click **Properties** in the left sidebar
2. Click the **Add Property** button in the top right

## Step 2: Enter Property Details

### Basic Information
- **Property Name**: A descriptive name (e.g., "Sunset Heights Building A")
- **Address**: Full street address
- **City, State, ZIP**: Complete location information
- **Property Type**: Select from dropdown (Residential, Commercial, Mixed-Use, etc.)

### Association Assignment
- **Association**: Select the association this property belongs to (optional for standalone properties)
- If the association doesn't exist yet, you'll need to create it first

### Property Specifications
- **Year Built**: Construction year
- **Total Units**: Number of units in the property
- **Square Footage**: Total property size

## Step 3: Add Units (Optional)

If your property has multiple units:
1. After saving the property, click **Add Unit**
2. Enter unit details:
   - Unit number/name
   - Type (Studio, 1BR, 2BR, etc.)
   - Square footage
   - Rent amount (if applicable)
3. Repeat for each unit

## Step 4: Assign Contacts

Link contacts to the property:
1. Go to the **People** tab on the property detail page
2. Click **Add Contact**
3. Select from existing contacts or create new ones
4. Assign roles:
   - **Owner**: Property owner
   - **Property Manager**: Day-to-day manager
   - **Tenant**: Current tenant (for rental units)

## Step 5: Set Up Maintenance

Configure maintenance settings:
1. Go to the **Maintenance** tab
2. Set default vendor preferences (optional)
3. Configure maintenance categories

## Step 6: Schedule Initial Inspection

It's recommended to schedule a baseline inspection:
1. Go to **Inspections** → **Schedule Inspection**
2. Select your new property
3. Choose inspection type (Routine, Move-in, etc.)
4. Set date and time
5. Assign inspector

## Tips for Success

### Property Photos
- Upload clear photos of the property exterior
- Add unit photos for rental listings
- Include any amenity photos (pool, gym, etc.)

### Documentation
- Store important documents in the Documents section
- Upload leases, insurance certificates, warranties
- Keep inspection reports organized

### Regular Updates
- Update occupancy status as tenants move in/out
- Keep contact information current
- Log all maintenance activities

## Next Steps

After setting up your first property:
1. **Add More Properties**: Repeat this process for your entire portfolio
2. **Set Up Maintenance Requests**: Configure request categories and vendors
3. **Schedule Inspections**: Create inspection schedules for compliance
4. **Generate Reports**: Run occupancy and financial reports

## Troubleshooting

### Can't Find Association
If your association isn't in the dropdown:
- Go to Associations → Add Association first
- Then return to add the property

### Property Not Saving
Check that all required fields are filled:
- Property name
- Address
- City, State, ZIP

### Need Help?
Contact support:
- Email: support@trueproductsnetwork.com
- Phone: (314) 915-3356
        `
      },
    ],
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "Detailed guides for all features and functions",
    docs: [
      { 
        label: "User Manual", 
        content: `
# Property Management Portal - User Manual

Complete guide to using the Property Management Portal.

## Table of Contents

1. Getting Started
2. Associations
3. Properties
4. People & Contacts
5. Maintenance Requests
6. Inspections
7. Reports
8. Approvals
9. Documents
10. Admin Settings

## Getting Started

### Logging In
Navigate to your portal URL and enter your credentials. If you've forgotten your password, use the "Forgot Password" link or contact your administrator.

### Your Role
Your permissions are based on your assigned role:
- **Admin**: Full access to all features
- **Property Manager**: Manage properties, maintenance, and inspections
- **Board Member**: View reports and approve items
- **Owner/Tenant**: Limited access to relevant properties

### Navigation
Use the left sidebar to navigate between sections. The menu adapts based on your role.

## Associations

Associations represent HOA, Condo, or other community organizations.

### Creating an Association
1. Go to **Associations** → **Add Association**
2. Enter association details:
   - Name
   - Type (HOA, Condo, Co-op, etc.)
   - Address
   - Fiscal year dates
   - Tax ID (optional)
3. Add board members in the **People** section
4. Configure association settings

### Association Details
Each association has:
- **Overview**: Basic information and stats
- **Properties**: All properties in the association
- **People**: Contacts associated with the association
- **Maintenance**: Association-level maintenance requests
- **Documents**: Association documents (bylaws, CC&Rs, etc.)

## Properties

Properties are individual buildings or units you manage.

### Property Details
Each property includes:
- **Overview**: Address, specs, occupancy
- **Units**: Individual units within the property
- **People**: Owners, tenants, vendors
- **Maintenance**: Request history
- **Inspections**: Past and upcoming inspections
- **Documents**: Leases, warranties, photos

## People & Contacts

The People section manages all contacts in the system.

### Contact Types
- **Owner**: Property owners
- **Tenant**: Renters
- **Board Member**: Association board members
- **Vendor**: Service providers
- **Property Manager**: Management staff

### Adding Contacts
1. Go to **People** → **Add Contact**
2. Enter contact information
3. Assign role(s)
4. Link to properties or associations

## Maintenance Requests

Track and manage maintenance issues from submission to completion.

### Submitting a Request
1. Go to **Maintenance** → **New Request**
2. Select property/unit
3. Describe the issue
4. Set priority
5. Submit

### Managing Requests
- View all requests in the Maintenance section
- Update status: Open, In Progress, Waiting for Parts, Completed, Cancelled
- Assign vendors and track costs
- Escalate urgent issues

## Inspections

Schedule and record property inspections.

### Inspection Types
- Routine, Move-in, Move-out, Annual
- Fire Safety, Elevator, HVAC, Roof
- Pool, Emergency Systems, Insurance

### Scheduling
1. Go to **Inspections** → **Schedule Inspection**
2. Select property/unit and type
3. Set date and assign inspector

## Reports

Generate insights from your data.

### Available Reports
- Occupancy Report
- Maintenance Summary
- Financial Report
- Inspection Report
- Contact Directory

## Support

**Email**: support@trueproductsnetwork.com
**Phone**: (314) 915-3356
        `
      },
      { 
        label: "Integration Guides", 
        content: `
# Integration Guides

Connect the Property Management Portal with your existing tools.

## GoHighLevel (GHL) Integration

Sync contacts, calendar events, and communications with GHL.

### Setup
1. Get your GHL API key from Settings → API
2. Go to Admin → Integrations → GHL
3. Enter API key and test connection
4. Configure sync settings

### What Syncs
- Contacts (owners, tenants, vendors)
- Calendar events (inspections, appointments)
- Communications and tasks

## Calendar Integration

Sync with Google Calendar, Outlook, Apple Calendar.

### Setup
1. Go to Admin → Integrations → Calendar
2. Select provider and authorize
3. Choose sync direction

## Live Chat

Add chat support using GHL Web Chat, Intercom, or Zendesk.

### Setup
1. Go to Admin → Integrations → Live Chat
2. Enable and paste widget code
3. Configure display settings

## Support

**Email**: support@trueproductsnetwork.com
**Phone**: (314) 915-3356
        `
      },
    ],
  },
];

export default function DocsPage() {
  const [selectedDoc, setSelectedDoc] = useState<{label: string; content: string} | null>(null);

  if (selectedDoc) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedDoc(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Docs
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{selectedDoc.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              {selectedDoc.content.split('\n').map((line, idx) => {
                if (line.startsWith('# ')) {
                  return <h1 key={idx} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
                }
                if (line.startsWith('## ')) {
                  return <h2 key={idx} className="text-xl font-semibold mt-4 mb-2">{line.slice(3)}</h2>;
                }
                if (line.startsWith('### ')) {
                  return <h3 key={idx} className="text-lg font-medium mt-3 mb-1">{line.slice(4)}</h3>;
                }
                if (line.startsWith('- ')) {
                  return <li key={idx} className="ml-4">{line.slice(2)}</li>;
                }
                if (line.match(/^\d+\./)) {
                  return <li key={idx} className="ml-4">{line.replace(/^\d+\.\s*/, '')}</li>;
                }
                if (line.trim() === '') {
                  return <div key={idx} className="h-2" />;
                }
                if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={idx} className="font-semibold">{line.slice(2, -2)}</p>;
                }
                return <p key={idx} className="mb-1">{line}</p>;
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">Documentation</h1>
        <p className="text-[var(--secondary-text)] mt-1">
          Browse user guides and documentation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docCategories.map((category) => (
          <Card key={category.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <category.icon className="h-5 w-5 text-[var(--teal)]" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--secondary-text)] mb-4">
                {category.description}
              </p>
              <ul className="space-y-2">
                {category.docs.map((doc) => (
                  <li key={doc.label}>
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="text-sm text-[var(--teal)] hover:text-[var(--teal-hover)] flex items-center gap-1 w-full text-left"
                    >
                      {doc.label}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
