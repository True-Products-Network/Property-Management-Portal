import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/stats - Get admin dashboard stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: platformRole } = await supabase
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .is("revoked_at", null)
      .maybeSingle();
    
    const isPlatformAdmin = platformRole?.role === "PLATFORM_ADMIN" || 
                            authUser.user_metadata?.is_platform_admin === true;
    
    const userRoles = authUser.user_metadata?.roles || [];
    const isAdmin = userRoles.includes("ADMIN_USER") || isPlatformAdmin;
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user's tenant ID for business isolation
    let tenantId: string | null = null;
    if (isPlatformAdmin) {
      // Platform admins can see all, but we still need a tenant context for GHL status
      // Get the first tenant they have access to, or from query param
      const { searchParams } = new URL(request.url);
      const tenantIdParam = searchParams.get("tenantId");
      
      if (tenantIdParam) {
        tenantId = tenantIdParam;
      } else {
        // Get first tenant
        const { data: firstTenant } = await supabase
          .from("tenants")
          .select("id")
          .limit(1)
          .single();
        tenantId = firstTenant?.id || null;
      }
    } else {
      // Get user's tenant
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", authUser.id)
        .maybeSingle();
      tenantId = tenantUser?.tenant_id || null;
    }

    // Get counts from various tables - FILTERED BY TENANT
    const [
      usersResult,
      rolesResult,
      dropdownsResult,
      listsResult,
      workflowsResult,
      auditResult,
      ghlStatusResult,
      portalRolesResult,
      ghlMappingsResult,
    ] = await Promise.all([
      // Users - filtered by tenant_id in contacts table
      tenantId 
        ? supabase.from("contacts").select("id", { count: "exact" }).eq("tenant_id", tenantId)
        : supabase.from("contacts").select("id", { count: "exact" }),
      // Contact roles - these are global/shared, not tenant-specific
      supabase.from("contact_roles").select("id", { count: "exact" }),
      // Dropdowns - filtered by tenant_id
      tenantId
        ? supabase.from("dropdown_settings").select("id", { count: "exact" }).eq("tenant_id", tenantId)
        : supabase.from("dropdown_settings").select("id", { count: "exact" }),
      // Lists - filtered by tenant_id
      tenantId
        ? supabase.from("dropdown_settings").select("record_type", { count: "exact" }).eq("tenant_id", tenantId).limit(1000)
        : supabase.from("dropdown_settings").select("record_type", { count: "exact" }).limit(1000),
      // Workflows - filtered by tenant_id
      tenantId
        ? supabase.from("workflows").select("id", { count: "exact" }).eq("tenant_id", tenantId)
        : supabase.from("workflows").select("id", { count: "exact" }),
      // Audit logs - filtered by tenant_id
      tenantId
        ? supabase.from("audit_logs").select("id", { count: "exact" }).eq("tenant_id", tenantId)
        : supabase.from("audit_logs").select("id", { count: "exact" }),
      // GHL Status - check if any association in this tenant has GHL credentials
      tenantId
        ? supabase.from("associations").select("id").eq("tenant_id", tenantId).not("ghl_location_id", "is", null).limit(1)
        : { data: null, count: 0 },
      // Portal roles - filtered by tenant_id
      tenantId
        ? supabase.from("roles").select("id", { count: "exact" }).or(`tenant_id.eq.${tenantId},is_system_role.eq.true`)
        : supabase.from("roles").select("id", { count: "exact" }),
      // GHL role mappings - filtered by tenant_id
      tenantId
        ? supabase.from("ghl_role_mappings").select("id", { count: "exact" }).eq("tenant_id", tenantId)
        : supabase.from("ghl_role_mappings").select("id", { count: "exact" }),
    ]);

    // Count unique list types
    const uniqueLists = new Set(listsResult.data?.map((d: { record_type: string }) => d.record_type) || []);

    // Get active workflow count - filtered by tenant
    const activeWorkflowQuery = tenantId
      ? supabase.from("workflows").select("id", { count: "exact" }).eq("tenant_id", tenantId).eq("active", true)
      : supabase.from("workflows").select("id", { count: "exact" }).eq("active", true);
    const { count: activeWorkflowCount } = await activeWorkflowQuery;

    // Check GHL connection - look for associations with ghl_location_id OR check association_ghl_credentials table
    let ghlConnected = false;
    if (tenantId) {
      // Check if any association in this tenant has GHL credentials
      const { data: associationsWithGhl } = await supabase
        .from("associations")
        .select("id")
        .eq("tenant_id", tenantId)
        .not("ghl_location_id", "is", null)
        .limit(1);
      
      if (associationsWithGhl && associationsWithGhl.length > 0) {
        ghlConnected = true;
      } else {
        // Also check the association_ghl_credentials table
        const { data: ghlCreds } = await supabase
          .from("association_ghl_credentials")
          .select("id")
          .limit(1);
        
        // Only count as connected if we have credentials AND an association in this tenant has them
        if (ghlCreds && ghlCreds.length > 0) {
          // Check if any association in this tenant has credentials
          const { data: assocWithCreds } = await supabase
            .from("associations")
            .select("id, ghl_location_id")
            .eq("tenant_id", tenantId)
            .not("ghl_location_id", "is", null)
            .limit(1);
          ghlConnected = !!(assocWithCreds && assocWithCreds.length > 0);
        }
      }
    }

    return NextResponse.json({
      userCount: usersResult.count || 0,
      roleCount: rolesResult.count || 0,
      dropdownCount: dropdownsResult.count || 0,
      listCount: uniqueLists.size,
      workflowCount: workflowsResult.count || 0,
      activeWorkflowCount: activeWorkflowCount || 0,
      auditCount: auditResult.count || 0,
      ghlConnected: ghlConnected,
      portalRoleCount: portalRolesResult.count || 0,
      ghlMappingCount: ghlMappingsResult.count || 0,
      tenantId: tenantId,
    });

  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
