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

    // Get counts from various tables
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
      supabase.from("contacts").select("id", { count: "exact" }),
      supabase.from("contact_roles").select("id", { count: "exact" }),
      supabase.from("dropdown_settings").select("id", { count: "exact" }),
      supabase.from("dropdown_settings").select("record_type", { count: "exact" }).limit(1000),
      supabase.from("workflows").select("id", { count: "exact" }),
      supabase.from("audit_logs").select("id", { count: "exact" }),
      supabase.from("app_settings").select("value").eq("key", "ghl_location_id").single(),
      supabase.from("roles").select("id", { count: "exact" }),
      supabase.from("ghl_role_mappings").select("id", { count: "exact" }),
    ]);

    // Count unique list types
    const uniqueLists = new Set(listsResult.data?.map((d: { record_type: string }) => d.record_type) || []);

    // Get active workflow count
    const { count: activeWorkflowCount } = await supabase
      .from("workflows")
      .select("id", { count: "exact" })
      .eq("active", true);

    return NextResponse.json({
      userCount: usersResult.count || 0,
      roleCount: rolesResult.count || 0,
      dropdownCount: dropdownsResult.count || 0,
      listCount: uniqueLists.size,
      workflowCount: workflowsResult.count || 0,
      activeWorkflowCount: activeWorkflowCount || 0,
      auditCount: auditResult.count || 0,
      ghlConnected: !!ghlStatusResult.data?.value,
      portalRoleCount: portalRolesResult.count || 0,
      ghlMappingCount: ghlMappingsResult.count || 0,
    });

  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
