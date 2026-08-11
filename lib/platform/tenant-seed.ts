// Tenant Data Seeding Library
// Idempotent seeding of core default data for new tenants

import { createClient } from "@/lib/supabase/server";

export type SeedCategory =
  | "dropdowns"
  | "roles"
  | "ghl_mappings"
  | "workflows"
  | "integrations"
  | "branding"
  | "categories";

interface SeedResult {
  success: boolean;
  error?: string;
  results?: Record<SeedCategory, { created: number; skipped: number; errors: string[] }>;
}

// Default dropdown values exported from Test-True Products Network tenant (161 values)
const DEFAULT_DROPDOWNS: Record<string, Array<{ value: string; label: string; sortOrder: number; fieldName?: string }>> = {
  "Approval": [
    { value: "maintenance", label: "Maintenance Approval", sortOrder: 1, fieldName: "Approval Type" },
    { value: "capital_improvement", label: "Capital Improvement", sortOrder: 2, fieldName: "Approval Type" },
    { value: "vendor_contract", label: "Vendor Contract", sortOrder: 3, fieldName: "Approval Type" },
    { value: "budget_item", label: "Budget Item", sortOrder: 4, fieldName: "Approval Type" },
    { value: "policy_change", label: "Policy Change", sortOrder: 5, fieldName: "Approval Type" },
    { value: "special_assessment", label: "Special Assessment", sortOrder: 6, fieldName: "Approval Type" },
    { value: "vendor_selection", label: "Vendor Selection", sortOrder: 7, fieldName: "Approval Type" },
    { value: "contract_approval", label: "Contract Approval", sortOrder: 8, fieldName: "Approval Type" },
    { value: "capital_expense", label: "Capital Expense", sortOrder: 9, fieldName: "Approval Type" },
    { value: "other", label: "Other", sortOrder: 10, fieldName: "Approval Type" },
  ],
  "Association Company": [
    { value: "prospect", label: "Prospect", sortOrder: 1, fieldName: "Association Status" },
    { value: "onboarding", label: "Onboarding", sortOrder: 2, fieldName: "Association Status" },
    { value: "active", label: "Active", sortOrder: 3, fieldName: "Association Status" },
    { value: "on_hold", label: "On-Hold", sortOrder: 4, fieldName: "Association Status" },
    { value: "ending_management", label: "Ending Management", sortOrder: 5, fieldName: "Association Status" },
    { value: "inactive", label: "Inactive", sortOrder: 6, fieldName: "Association Status" },
    { value: "condominium", label: "Condominium", sortOrder: 1, fieldName: "Association Type" },
    { value: "hoa", label: "HOA (Homeowners Association)", sortOrder: 2, fieldName: "Association Type" },
    { value: "cooperative", label: "Cooperative", sortOrder: 3, fieldName: "Association Type" },
    { value: "commercial", label: "Commercial", sortOrder: 4, fieldName: "Association Type" },
    { value: "mixed_use", label: "Mixed Use", sortOrder: 5, fieldName: "Association Type" },
    { value: "other", label: "Other", sortOrder: 6, fieldName: "Association Type" },
  ],
  "Compliance Matter": [
    { value: "open", label: "Open", sortOrder: 1, fieldName: "Compliance Status" },
    { value: "notice_issued", label: "Notice Issued", sortOrder: 2, fieldName: "Compliance Status" },
    { value: "evidence_gathering", label: "Evidence Gathering", sortOrder: 3, fieldName: "Compliance Status" },
    { value: "hearing_scheduled", label: "Hearing Scheduled", sortOrder: 4, fieldName: "Compliance Status" },
    { value: "under_review", label: "Under Review", sortOrder: 5, fieldName: "Compliance Status" },
    { value: "decision_pending", label: "Decision Pending", sortOrder: 6, fieldName: "Compliance Status" },
    { value: "resolved", label: "Resolved", sortOrder: 7, fieldName: "Compliance Status" },
    { value: "closed", label: "Closed", sortOrder: 8, fieldName: "Compliance Status" },
    { value: "appealed", label: "Appealed", sortOrder: 9, fieldName: "Compliance Status" },
  ],
  "Contact": [
    { value: "admin_user", label: "Admin User", sortOrder: 1, fieldName: "role" },
    { value: "association_manager", label: "Association Manager", sortOrder: 2, fieldName: "role" },
    { value: "board_member", label: "Board Member", sortOrder: 3, fieldName: "role" },
    { value: "finance_user", label: "Finance User", sortOrder: 4, fieldName: "role" },
    { value: "owner", label: "Owner", sortOrder: 5, fieldName: "role" },
    { value: "portfolio_manager", label: "Portfolio Manager", sortOrder: 6, fieldName: "role" },
    { value: "resident", label: "Resident", sortOrder: 7, fieldName: "role" },
    { value: "staff", label: "Staff", sortOrder: 8, fieldName: "role" },
    { value: "vendor_contractor", label: "Vendor Contractor", sortOrder: 9, fieldName: "role" },
    { value: "property_manager", label: "Property Manager", sortOrder: 10, fieldName: "role" },
    { value: "emergency_contact", label: "Emergency Contact", sortOrder: 11, fieldName: "role" },
    { value: "inspector", label: "Inspector", sortOrder: 12, fieldName: "role" },
    { value: "co_owner", label: "Co-Owner", sortOrder: 13, fieldName: "role" },
    { value: "maintenance_contact", label: "Maintenance Contact", sortOrder: 14, fieldName: "role" },
    { value: "other", label: "Other", sortOrder: 15, fieldName: "role" },
  ],
  "Document Record": [
    { value: "insurance", label: "Insurance", sortOrder: 1, fieldName: "Document Type" },
    { value: "financial", label: "Financial", sortOrder: 2, fieldName: "Document Type" },
    { value: "legal", label: "Legal", sortOrder: 3, fieldName: "Document Type" },
    { value: "meeting_minutes", label: "Meeting Minutes", sortOrder: 4, fieldName: "Document Type" },
    { value: "contract", label: "Contract", sortOrder: 5, fieldName: "Document Type" },
    { value: "inspection_report", label: "Inspection Report", sortOrder: 6, fieldName: "Document Type" },
    { value: "certificate", label: "Certificate", sortOrder: 7, fieldName: "Document Type" },
    { value: "policy", label: "Policy", sortOrder: 8, fieldName: "Document Type" },
    { value: "notice", label: "Notice", sortOrder: 9, fieldName: "Document Type" },
    { value: "other", label: "Other", sortOrder: 10, fieldName: "Document Type" },
  ],
  "Inspection": [
    { value: "scheduled", label: "Scheduled", sortOrder: 1, fieldName: "Inspection Status" },
    { value: "in_progress", label: "In Progress", sortOrder: 2, fieldName: "Inspection Status" },
    { value: "completed", label: "Completed", sortOrder: 3, fieldName: "Inspection Status" },
    { value: "overdue", label: "Overdue", sortOrder: 4, fieldName: "Inspection Status" },
    { value: "cancelled", label: "Cancelled", sortOrder: 5, fieldName: "Inspection Status" },
    { value: "rescheduled", label: "Rescheduled", sortOrder: 6, fieldName: "Inspection Status" },
    { value: "routine", label: "Routine", sortOrder: 1, fieldName: "Inspection Type" },
    { value: "move_in", label: "Move In", sortOrder: 2, fieldName: "Inspection Type" },
    { value: "move_out", label: "Move Out", sortOrder: 3, fieldName: "Inspection Type" },
    { value: "annual", label: "Annual", sortOrder: 4, fieldName: "Inspection Type" },
    { value: "fire_safety", label: "Fire Safety", sortOrder: 5, fieldName: "Inspection Type" },
    { value: "elevator", label: "Elevator", sortOrder: 6, fieldName: "Inspection Type" },
    { value: "hvac", label: "HVAC", sortOrder: 7, fieldName: "Inspection Type" },
    { value: "roof", label: "Roof", sortOrder: 8, fieldName: "Inspection Type" },
    { value: "pool", label: "Pool", sortOrder: 9, fieldName: "Inspection Type" },
    { value: "emergency_systems", label: "Emergency Systems", sortOrder: 10, fieldName: "Inspection Type" },
    { value: "insurance", label: "Insurance", sortOrder: 11, fieldName: "Inspection Type" },
    { value: "other", label: "Other", sortOrder: 12, fieldName: "Inspection Type" },
    { value: "excellent", label: "Excellent", sortOrder: 1, fieldName: "Overall Result" },
    { value: "good", label: "Good", sortOrder: 2, fieldName: "Overall Result" },
    { value: "fair", label: "Fair", sortOrder: 3, fieldName: "Overall Result" },
    { value: "poor", label: "Poor", sortOrder: 4, fieldName: "Overall Result" },
    { value: "critical", label: "Critical", sortOrder: 5, fieldName: "Overall Result" },
  ],
  "Maintenance Request": [
    { value: "repair", label: "Repair", sortOrder: 1, fieldName: "Category" },
    { value: "hvac", label: "HVAC", sortOrder: 1, fieldName: "Category" },
    { value: "plumbing", label: "Plumbing", sortOrder: 2, fieldName: "Category" },
    { value: "electrical", label: "Electrical", sortOrder: 3, fieldName: "Category" },
    { value: "appliance", label: "Appliance", sortOrder: 4, fieldName: "Category" },
    { value: "structural", label: "Structural", sortOrder: 5, fieldName: "Category" },
    { value: "cosmetic", label: "Cosmetic", sortOrder: 6, fieldName: "Category" },
    { value: "safety", label: "Safety", sortOrder: 7, fieldName: "Category" },
    { value: "cleaning", label: "Cleaning", sortOrder: 8, fieldName: "Category" },
    { value: "landscaping", label: "Landscaping", sortOrder: 9, fieldName: "Category" },
    { value: "other", label: "Other", sortOrder: 10, fieldName: "Category" },
    { value: "new", label: "New", sortOrder: 1, fieldName: "Current Status" },
    { value: "triaged", label: "Triaged", sortOrder: 2, fieldName: "Current Status" },
    { value: "pending_approval", label: "Pending Approval", sortOrder: 3, fieldName: "Current Status" },
    { value: "approved", label: "Approved", sortOrder: 4, fieldName: "Current Status" },
    { value: "vendor_assigned", label: "Vendor Assigned", sortOrder: 5, fieldName: "Current Status" },
    { value: "scheduled", label: "Scheduled", sortOrder: 6, fieldName: "Current Status" },
    { value: "in_progress", label: "In Progress", sortOrder: 7, fieldName: "Current Status" },
    { value: "on_hold", label: "On Hold", sortOrder: 8, fieldName: "Current Status" },
    { value: "completed", label: "Completed", sortOrder: 9, fieldName: "Current Status" },
    { value: "closed", label: "Closed", sortOrder: 10, fieldName: "Current Status" },
    { value: "cancelled", label: "Cancelled", sortOrder: 11, fieldName: "Current Status" },
    { value: "emergency", label: "Emergency", sortOrder: 1, fieldName: "Urgency" },
    { value: "urgent", label: "Urgent", sortOrder: 2, fieldName: "Urgency" },
    { value: "normal", label: "Normal", sortOrder: 3, fieldName: "Urgency" },
    { value: "low", label: "Low", sortOrder: 4, fieldName: "Urgency" },
  ],
  "People": [
    { value: "not_a_board_member", label: "Not a Board Member", sortOrder: 0, fieldName: "Board Position" },
    { value: "president", label: "President", sortOrder: 1, fieldName: "Board Position" },
    { value: "vice_president", label: "Vice President", sortOrder: 2, fieldName: "Board Position" },
    { value: "treasurer", label: "Treasurer", sortOrder: 3, fieldName: "Board Position" },
    { value: "secretary", label: "Secretary", sortOrder: 4, fieldName: "Board Position" },
    { value: "member_at_large", label: "Member", sortOrder: 5, fieldName: "Board Position" },
    { value: "committee_chair", label: "Committee Chair", sortOrder: 6, fieldName: "Board Position" },
    { value: "email", label: "Email", sortOrder: 1, fieldName: "Preferred Contact Method" },
    { value: "phone", label: "Phone", sortOrder: 2, fieldName: "Preferred Contact Method" },
    { value: "sms", label: "SMS/Text", sortOrder: 3, fieldName: "Preferred Contact Method" },
    { value: "mail", label: "Mail", sortOrder: 4, fieldName: "Preferred Contact Method" },
  ],
  "Property": [
    { value: "active", label: "Active", sortOrder: 1, fieldName: "Property Status" },
    { value: "inactive", label: "Inactive", sortOrder: 2, fieldName: "Property Status" },
    { value: "under_construction", label: "Under Construction", sortOrder: 3, fieldName: "Property Status" },
    { value: "pending_sale", label: "Pending Sale", sortOrder: 4, fieldName: "Property Status" },
    { value: "condominium", label: "Condominium", sortOrder: 1, fieldName: "Property Type" },
    { value: "apartment", label: "Apartment", sortOrder: 2, fieldName: "Property Type" },
    { value: "Townhouse", label: "Townhouse", sortOrder: 3, fieldName: "Property Type" },
    { value: "single_family", label: "Single Family", sortOrder: 4, fieldName: "Property Type" },
    { value: "commercial", label: "Commercial", sortOrder: 5, fieldName: "Property Type" },
    { value: "mixed_use", label: "Mixed Use", sortOrder: 6, fieldName: "Property Type" },
  ],
  "Unit": [
    { value: "occupied", label: "Occupied", sortOrder: 1, fieldName: "Occupancy Status" },
    { value: "owner_occupied", label: "Owner Occupied", sortOrder: 1, fieldName: "Occupancy Status" },
    { value: "tenant_occupied", label: "Tenant Occupied", sortOrder: 2, fieldName: "Occupancy Status" },
    { value: "vacant", label: "Vacant", sortOrder: 3, fieldName: "Occupancy Status" },
    { value: "rented", label: "Rented", sortOrder: 1, fieldName: "Rental Status" },
    { value: "available", label: "Available", sortOrder: 2, fieldName: "Rental Status" },
    { value: "not_for_rent", label: "Not For Rent", sortOrder: 3, fieldName: "Rental Status" },
    { value: "studio", label: "Studio", sortOrder: 1, fieldName: "type" },
    { value: "1_bedroom", label: "1 Bedroom", sortOrder: 2, fieldName: "type" },
    { value: "2_bedroom", label: "2 Bedroom", sortOrder: 3, fieldName: "type" },
    { value: "3_bedroom", label: "3 Bedroom", sortOrder: 4, fieldName: "type" },
    { value: "4_bedroom", label: "4+ Bedroom", sortOrder: 5, fieldName: "type" },
    { value: "penthouse", label: "Penthouse", sortOrder: 6, fieldName: "type" },
    { value: "loft", label: "Loft", sortOrder: 7, fieldName: "type" },
    { value: "Townhouse", label: "Townhouse", sortOrder: 8, fieldName: "type" },
  ],
  "Vendor Company": [
    { value: "active", label: "Active", sortOrder: 1, fieldName: "Vendor Status" },
    { value: "inactive", label: "Inactive", sortOrder: 2, fieldName: "Vendor Status" },
    { value: "pending_approval", label: "Pending Approval", sortOrder: 3, fieldName: "Vendor Status" },
    { value: "suspended", label: "Suspended", sortOrder: 4, fieldName: "Vendor Status" },
    { value: "construction", label: "Construction", sortOrder: 0, fieldName: "Vendor Type" },
    { value: "hvac", label: "HVAC", sortOrder: 1, fieldName: "Vendor Type" },
    { value: "plumbing", label: "Plumbing", sortOrder: 2, fieldName: "Vendor Type" },
    { value: "electrical", label: "Electrical", sortOrder: 3, fieldName: "Vendor Type" },
    { value: "landscaping", label: "Landscaping", sortOrder: 4, fieldName: "Vendor Type" },
    { value: "cleaning", label: "Cleaning", sortOrder: 5, fieldName: "Vendor Type" },
    { value: "security", label: "Security", sortOrder: 6, fieldName: "Vendor Type" },
    { value: "pest_control", label: "Pest Control", sortOrder: 7, fieldName: "Vendor Type" },
    { value: "roofing", label: "Roofing", sortOrder: 8, fieldName: "Vendor Type" },
    { value: "painting", label: "Painting", sortOrder: 9, fieldName: "Vendor Type" },
    { value: "general_contracting", label: "General Contracting", sortOrder: 10, fieldName: "Vendor Type" },
    { value: "elevator", label: "Elevator", sortOrder: 11, fieldName: "Vendor Type" },
    { value: "fire_safety", label: "Fire Safety", sortOrder: 12, fieldName: "Vendor Type" },
    { value: "pool_service", label: "Pool Service", sortOrder: 13, fieldName: "Vendor Type" },
    { value: "snow_removal", label: "Snow Removal", sortOrder: 14, fieldName: "Vendor Type" },
    { value: "other", label: "Other", sortOrder: 15, fieldName: "Vendor Type" },
  ],
};

// Default roles and permissions
const DEFAULT_ROLES = [
  {
    name: "Platform Admin",
    description: "Full platform access",
    permissions: ["*"],
  },
  {
    name: "Tenant Admin",
    description: "Full tenant administration",
    permissions: ["tenant:*", "users:*", "settings:*"],
  },
  {
    name: "Property Manager",
    description: "Manage properties and maintenance",
    permissions: ["properties:*", "maintenance:*", "vendors:read", "contacts:*"],
  },
  {
    name: "Board Member",
    description: "View reports and approve items",
    permissions: ["reports:*", "approvals:*", "contacts:read"],
  },
  {
    name: "Resident",
    description: "Resident portal access",
    permissions: ["maintenance:create", "documents:read", "payments:*"],
  },
];

// Default GHL role mappings
const DEFAULT_GHL_MAPPINGS = [
  { ghl_role: "admin", portal_role: "Platform Admin" },
  { ghl_role: "manager", portal_role: "Property Manager" },
  { ghl_role: "board", portal_role: "Board Member" },
  { ghl_role: "resident", portal_role: "Resident" },
];

// Default workflow templates
const DEFAULT_WORKFLOWS = [
  {
    name: "Maintenance Request Approval",
    description: "Standard maintenance request workflow",
    steps: ["submitted", "reviewed", "approved", "scheduled", "completed"],
  },
  {
    name: "Vendor Onboarding",
    description: "New vendor approval process",
    steps: ["application", "review", "background_check", "approved"],
  },
];

// Default integration settings
const DEFAULT_INTEGRATIONS = [
  {
    name: "GoHighLevel",
    description: "GHL CRM Integration",
    config: { enabled: false, sync_contacts: true, sync_companies: true },
  },
  {
    name: "Stripe",
    description: "Payment Processing",
    config: { enabled: false, test_mode: true },
  },
];

// Default brand settings
const DEFAULT_BRANDING = {
  primary_color: "#0d9488",
  secondary_color: "#64748b",
  logo_url: null,
  favicon_url: null,
  company_name: "Property Management Portal",
};

export async function seedTenantData(
  tenantId: string,
  categories: SeedCategory[]
): Promise<SeedResult> {
  const supabase = await createClient();
  const results: Record<SeedCategory, { created: number; skipped: number; errors: string[] }> = {
    dropdowns: { created: 0, skipped: 0, errors: [] },
    roles: { created: 0, skipped: 0, errors: [] },
    ghl_mappings: { created: 0, skipped: 0, errors: [] },
    workflows: { created: 0, skipped: 0, errors: [] },
    integrations: { created: 0, skipped: 0, errors: [] },
    branding: { created: 0, skipped: 0, errors: [] },
    categories: { created: 0, skipped: 0, errors: [] },
  };

  try {
    // Get current user for created_by
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Seed Dropdown Settings
    if (categories.includes("dropdowns")) {
      for (const [recordType, values] of Object.entries(DEFAULT_DROPDOWNS)) {
        for (const item of values) {
          // Check if already exists
          const { data: existing } = await supabase
            .from("dropdown_settings")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("record_type", recordType)
            .eq("field_name", item.fieldName || "type")
            .eq("value", item.value)
            .maybeSingle();

          if (existing) {
            results.dropdowns.skipped++;
            continue;
          }

          const { error } = await supabase.from("dropdown_settings").insert({
            tenant_id: tenantId,
            record_type: recordType,
            field_name: item.fieldName || "type",
            value: item.value,
            label: item.label,
            sort_order: item.sortOrder,
            is_active: true,
            created_by: userId,
            updated_by: userId,
          });

          if (error) {
            results.dropdowns.errors.push(`${recordType}.${item.value}: ${error.message}`);
          } else {
            results.dropdowns.created++;
          }
        }
      }
    }

    // Seed Roles - System roles already exist from migration, skip tenant-specific roles
    if (categories.includes("roles")) {
      results.roles.skipped = DEFAULT_ROLES.length;
    }

    // Seed GHL Mappings
    if (categories.includes("ghl_mappings")) {
      for (const mapping of DEFAULT_GHL_MAPPINGS) {
        const { data: existing } = await supabase
          .from("ghl_role_mappings")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("ghl_role", mapping.ghl_role)
          .maybeSingle();

        if (existing) {
          results.ghl_mappings.skipped++;
          continue;
        }

        const { error } = await supabase.from("ghl_role_mappings").insert({
          tenant_id: tenantId,
          ghl_role_name: mapping.ghl_role,
          portal_role_name: mapping.portal_role,
          created_by: userId,
          updated_by: userId,
        });

        if (error) {
          results.ghl_mappings.errors.push(`${mapping.ghl_role}: ${error.message}`);
        } else {
          results.ghl_mappings.created++;
        }
      }
    }

    // Seed Workflows
    if (categories.includes("workflows")) {
      for (const workflow of DEFAULT_WORKFLOWS) {
        const { data: existing } = await supabase
          .from("workflows")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("name", workflow.name)
          .maybeSingle();

        if (existing) {
          results.workflows.skipped++;
          continue;
        }

        const { error } = await supabase.from("workflows").insert({
          tenant_id: tenantId,
          name: workflow.name,
          description: workflow.description,
          steps: workflow.steps,
          status: "active",
          created_by: userId,
          updated_by: userId,
        });

        if (error) {
          results.workflows.errors.push(`${workflow.name}: ${error.message}`);
        } else {
          results.workflows.created++;
        }
      }
    }

    // Seed Integrations - Table doesn't exist, skip
    if (categories.includes("integrations")) {
      results.integrations.skipped = DEFAULT_INTEGRATIONS.length;
    }

    // Seed Branding - Table doesn't exist, skip
    if (categories.includes("branding")) {
      results.branding.skipped = 1;
    }

    // Seed Categories (placeholder - depends on your category management structure)
    if (categories.includes("categories")) {
      // Categories are typically seeded with dropdowns
      // Add specific category management defaults here if needed
      results.categories.skipped++;
    }

    return { success: true, results };
  } catch (error) {
    console.error("Error seeding tenant data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
