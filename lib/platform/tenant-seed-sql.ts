// Tenant Seed SQL Runner
// Runs SQL seed files for new tenants

import { createServiceClient } from "@/lib/supabase/service";

export interface SeedResult {
  success: boolean;
  error?: string;
  details?: {
    dropdowns?: { success: boolean; error?: string };
    ghlMappings?: { success: boolean; error?: string };
    workflows?: { success: boolean; error?: string };
  };
}

/**
 * Run SQL seed files for a new tenant
 * This is called automatically when a tenant is created
 */
export async function runTenantSeedSql(
  tenantId: string,
  businessId?: string
): Promise<SeedResult> {
  const serviceClient = createServiceClient();
  const result: SeedResult = {
    success: true,
    details: {},
  };

  try {
    // 1. Seed dropdown settings
    try {
      const { error: dropdownError } = await serviceClient.rpc(
        "exec_sql_with_tenant",
        {
          sql_file: "tenant_seed_dropdowns",
          tenant_id: tenantId,
        }
      );

      if (dropdownError) {
        console.error("Error seeding dropdowns:", dropdownError);
        result.details!.dropdowns = {
          success: false,
          error: dropdownError.message,
        };
      } else {
        result.details!.dropdowns = { success: true };
      }
    } catch (e) {
      console.error("Exception seeding dropdowns:", e);
      result.details!.dropdowns = {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }

    // 2. Seed GHL role mappings (global, no tenant_id needed)
    try {
      const { error: ghlError } = await serviceClient.rpc(
        "exec_sql_with_tenant",
        {
          sql_file: "tenant_seed_ghl_mappings",
          tenant_id: null,
        }
      );

      if (ghlError) {
        console.error("Error seeding GHL mappings:", ghlError);
        result.details!.ghlMappings = {
          success: false,
          error: ghlError.message,
        };
      } else {
        result.details!.ghlMappings = { success: true };
      }
    } catch (e) {
      console.error("Exception seeding GHL mappings:", e);
      result.details!.ghlMappings = {
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      };
    }

    // 3. Seed workflows (requires business_id)
    if (businessId) {
      try {
        const { error: workflowError } = await serviceClient.rpc(
          "exec_sql_with_business",
          {
            sql_file: "tenant_seed_workflows",
            business_id: businessId,
          }
        );

        if (workflowError) {
          console.error("Error seeding workflows:", workflowError);
          result.details!.workflows = {
            success: false,
            error: workflowError.message,
          };
        } else {
          result.details!.workflows = { success: true };
        }
      } catch (e) {
        console.error("Exception seeding workflows:", e);
        result.details!.workflows = {
          success: false,
          error: e instanceof Error ? e.message : "Unknown error",
        };
      }
    } else {
      result.details!.workflows = {
        success: false,
        error: "No business_id provided for workflows",
      };
    }

    // Check if any seeding failed
    const allSuccess = Object.values(result.details!).every(
      (d) => d.success
    );
    result.success = allSuccess;

    return result;
  } catch (error) {
    console.error("Error running tenant seed SQL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
