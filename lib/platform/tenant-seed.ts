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

// Default dropdown values for each record type
const DEFAULT_DROPDOWNS: Record<string, Array<{ value: string; label: string; sortOrder: number }>> = {
  "Vendor Company": [
    { value: "hvac", label: "HVAC", sortOrder: 1 },
    { value: "plumbing", label: "Plumbing", sortOrder: 2 },
    { value: "electrical", label: "Electrical", sortOrder: 3 },
    { value: "landscaping", label: "Landscaping", sortOrder: 4 },
    { value: "cleaning", label: "Cleaning", sortOrder: 5 },
    { value: "security", label: "Security", sortOrder: 6 },
    { value: "pest_control", label: "Pest Control", sortOrder: 7 },
    { value: "roofing", label: "Roofing", sortOrder: 8 },
    { value: "painting", label: "Painting", sortOrder: 9 },
    { value: "general_contracting", label: "General Contracting", sortOrder: 10 },
    { value: "elevator", label: "Elevator", sortOrder: 11 },
    { value: "fire_safety", label: "Fire Safety", sortOrder: 12 },
    { value: "pool_service", label: "Pool Service", sortOrder: 13 },
    { value: "snow_removal", label: "Snow Removal", sortOrder: 14 },
    { value: "other", label: "Other", sortOrder: 15 },
  ],
  "Unit": [
    { value: "studio", label: "Studio", sortOrder: 1 },
    { value: "1_bedroom", label: "1 Bedroom", sortOrder: 2 },
    { value: "2_bedroom", label: "2 Bedroom", sortOrder: 3 },
    { value: "3_bedroom", label: "3 Bedroom", sortOrder: 4 },
    { value: "4_bedroom", label: "4+ Bedroom", sortOrder: 5 },
    { value: "penthouse", label: "Penthouse", sortOrder: 6 },
    { value: "loft", label: "Loft", sortOrder: 7 },
    { value: "townhouse", label: "Townhouse", sortOrder: 8 },
  ],
  "Property": [
    { value: "condominium", label: "Condominium", sortOrder: 1 },
    { value: "apartment", label: "Apartment", sortOrder: 2 },
    { value: "townhouse", label: "Townhouse", sortOrder: 3 },
    { value: "single_family", label: "Single Family", sortOrder: 4 },
    { value: "commercial", label: "Commercial", sortOrder: 5 },
    { value: "mixed_use", label: "Mixed Use", sortOrder: 6 },
  ],
  "Association Company": [
    { value: "hoa", label: "HOA", sortOrder: 1 },
    { value: "condominium", label: "Condominium", sortOrder: 2 },
    { value: "cooperative", label: "Cooperative", sortOrder: 3 },
    { value: "commercial", label: "Commercial", sortOrder: 4 },
    { value: "other", label: "Other", sortOrder: 5 },
  ],
  "People": [
    { value: "admin_user", label: "Admin User", sortOrder: 1 },
    { value: "association_manager", label: "Association Manager", sortOrder: 2 },
    { value: "board_member", label: "Board Member", sortOrder: 3 },
    { value: "finance_user", label: "Finance User", sortOrder: 4 },
    { value: "owner", label: "Owner", sortOrder: 5 },
    { value: "portfolio_manager", label: "Portfolio Manager", sortOrder: 6 },
    { value: "property_manager", label: "Property Manager", sortOrder: 7 },
    { value: "resident", label: "Resident", sortOrder: 8 },
    { value: "staff", label: "Staff", sortOrder: 9 },
    { value: "vendor_contractor", label: "Vendor/Contractor", sortOrder: 10 },
  ],
  "Maintenance Request": [
    { value: "hvac", label: "HVAC", sortOrder: 1 },
    { value: "plumbing", label: "Plumbing", sortOrder: 2 },
    { value: "electrical", label: "Electrical", sortOrder: 3 },
    { value: "appliance", label: "Appliance", sortOrder: 4 },
    { value: "general", label: "General", sortOrder: 5 },
    { value: "emergency", label: "Emergency", sortOrder: 6 },
  ],
  "Inspection": [
    { value: "routine", label: "Routine", sortOrder: 1 },
    { value: "move_in", label: "Move In", sortOrder: 2 },
    { value: "move_out", label: "Move Out", sortOrder: 3 },
    { value: "annual", label: "Annual", sortOrder: 4 },
    { value: "emergency", label: "Emergency", sortOrder: 5 },
  ],
  "Approval": [
    { value: "maintenance", label: "Maintenance Approval", sortOrder: 1 },
    { value: "capital_improvement", label: "Capital Improvement", sortOrder: 2 },
    { value: "vendor_contract", label: "Vendor Contract", sortOrder: 3 },
    { value: "budget_item", label: "Budget Item", sortOrder: 4 },
    { value: "policy_change", label: "Policy Change", sortOrder: 5 },
    { value: "special_assessment", label: "Special Assessment", sortOrder: 6 },
    { value: "vendor_selection", label: "Vendor Selection", sortOrder: 7 },
    { value: "contract_approval", label: "Contract Approval", sortOrder: 8 },
    { value: "capital_expense", label: "Capital Expense", sortOrder: 9 },
    { value: "other", label: "Other", sortOrder: 10 },
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
            .eq("field_name", recordType === "Vendor Company" ? "Vendor Type" : "type")
            .eq("value", item.value)
            .maybeSingle();

          if (existing) {
            results.dropdowns.skipped++;
            continue;
          }

          const { error } = await supabase.from("dropdown_settings").insert({
            tenant_id: tenantId,
            record_type: recordType,
            field_name: recordType === "Vendor Company" ? "Vendor Type" : "type",
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

    // Seed Roles
    if (categories.includes("roles")) {
      for (const role of DEFAULT_ROLES) {
        const { data: existing } = await supabase
          .from("roles")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("name", role.name)
          .maybeSingle();

        if (existing) {
          results.roles.skipped++;
          continue;
        }

        const { error } = await supabase.from("roles").insert({
          tenant_id: tenantId,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          created_by: userId,
          updated_by: userId,
        });

        if (error) {
          results.roles.errors.push(`${role.name}: ${error.message}`);
        } else {
          results.roles.created++;
        }
      }
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
          ghl_role: mapping.ghl_role,
          portal_role: mapping.portal_role,
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
          is_active: true,
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

    // Seed Integrations
    if (categories.includes("integrations")) {
      for (const integration of DEFAULT_INTEGRATIONS) {
        const { data: existing } = await supabase
          .from("integrations")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("name", integration.name)
          .maybeSingle();

        if (existing) {
          results.integrations.skipped++;
          continue;
        }

        const { error } = await supabase.from("integrations").insert({
          tenant_id: tenantId,
          name: integration.name,
          description: integration.description,
          config: integration.config,
          is_active: false,
          created_by: userId,
          updated_by: userId,
        });

        if (error) {
          results.integrations.errors.push(`${integration.name}: ${error.message}`);
        } else {
          results.integrations.created++;
        }
      }
    }

    // Seed Branding
    if (categories.includes("branding")) {
      const { data: existing } = await supabase
        .from("brand_settings")
        .select("id")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (existing) {
        results.branding.skipped++;
      } else {
        const { error } = await supabase.from("brand_settings").insert({
          tenant_id: tenantId,
          ...DEFAULT_BRANDING,
          created_by: userId,
          updated_by: userId,
        });

        if (error) {
          results.branding.errors.push(`brand_settings: ${error.message}`);
        } else {
          results.branding.created++;
        }
      }
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
