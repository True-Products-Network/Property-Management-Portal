// User Roles API
// Get and update roles for a specific user

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";

// GET /api/admin/users/[id]/roles - Get user's roles
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get current user session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      await auditLoggers.error(context, "USER_ROLES_VIEW", "user_role", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    context.userId = authUser.id;

    // Check admin access
    const { data: currentUser } = await supabase
      .from("portal_users")
      .select("id, is_admin")
      .eq("id", authUser.id)
      .maybeSingle();

    const isPlatformAdmin = authUser.user_metadata?.is_platform_admin === true;
    
    if (!currentUser?.is_admin && !isPlatformAdmin) {
      await auditLoggers.securityEvent(context, "ADMIN_ACCESS_DENIED", "warning", { reason: "Admin access required", userId: authUser.id });
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get user's current roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role_id, roles(id, name, description)")
      .eq("user_id", id);

    if (rolesError) {
      console.error("[User Roles API] Error fetching roles:", rolesError);
      await auditLoggers.error(context, "USER_ROLES_VIEW", "user_role", new Error("Failed to fetch roles"), { userId: id, error: rolesError.message });
      return NextResponse.json(
        { success: false, error: "Failed to fetch roles" },
        { status: 500 }
      );
    }

    // Get all available roles
    const { data: allRoles, error: allRolesError } = await supabase
      .from("roles")
      .select("id, name, description, is_system_role")
      .eq("is_active", true)
      .order("name");

    if (allRolesError) {
      console.error("[User Roles API] Error fetching all roles:", allRolesError);
    }

    const duration = Date.now() - startTime;
    await auditLoggers.view(context, "user_role", id, "User Roles", { userRolesCount: userRoles?.length || 0, durationMs: duration });
    
    return NextResponse.json({
      success: true,
      data: {
        userRoles: userRoles || [],
        allRoles: allRoles || [],
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[User Roles API] Unexpected error:", error);
    await auditLoggers.error(context, "USER_ROLES_VIEW", "user_role", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id]/roles - Update user's roles
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get current user session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      await auditLoggers.error(context, "USER_ROLES_UPDATE", "user_role", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    context.userId = authUser.id;

    // Check admin access
    const { data: currentUser } = await supabase
      .from("portal_users")
      .select("id, is_admin")
      .eq("id", authUser.id)
      .maybeSingle();

    const isPlatformAdmin = authUser.user_metadata?.is_platform_admin === true;
    
    if (!currentUser?.is_admin && !isPlatformAdmin) {
      await auditLoggers.securityEvent(context, "ADMIN_ACCESS_DENIED", "warning", { reason: "Admin access required", userId: authUser.id });
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { roleIds } = body;

    if (!Array.isArray(roleIds)) {
      await auditLoggers.error(context, "USER_ROLES_UPDATE", "user_role", new Error("roleIds must be an array"), { body });
      return NextResponse.json(
        { success: false, error: "roleIds must be an array" },
        { status: 400 }
      );
    }

    // Get existing roles for before values
    const { data: existingRoles } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", id);
    
    const beforeRoleIds = existingRoles?.map((r: any) => r.role_id) || [];

    // Delete existing roles for this user
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", id);

    if (deleteError) {
      console.error("[User Roles API] Error deleting existing roles:", deleteError);
      await auditLoggers.error(context, "USER_ROLES_UPDATE", "user_role", new Error("Failed to update roles"), { userId: id, error: deleteError.message });
      return NextResponse.json(
        { success: false, error: "Failed to update roles" },
        { status: 500 }
      );
    }

    // Insert new roles
    if (roleIds.length > 0) {
      const roleInserts = roleIds.map((roleId: string) => ({
        user_id: id,
        role_id: roleId,
        created_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from("user_roles")
        .insert(roleInserts);

      if (insertError) {
        console.error("[User Roles API] Error inserting roles:", insertError);
        await auditLoggers.error(context, "USER_ROLES_UPDATE", "user_role", new Error("Failed to assign roles"), { userId: id, error: insertError.message });
        return NextResponse.json(
          { success: false, error: "Failed to assign roles" },
          { status: 500 }
        );
      }
    }

    const duration = Date.now() - startTime;
    await auditLoggers.update(context, "user_role", id, "User Roles", { roleIds: beforeRoleIds }, { roleIds }, { durationMs: duration });

    return NextResponse.json({
      success: true,
      message: "Roles updated successfully",
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[User Roles API] Unexpected error:", error);
    await auditLoggers.error(context, "USER_ROLES_UPDATE", "user_role", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
