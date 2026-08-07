// User Roles API
// Get and update roles for a specific user

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/users/[id]/roles - Get user's roles
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get current user session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin access
    const { data: currentUser } = await supabase
      .from("portal_users")
      .select("id, is_admin")
      .eq("id", authUser.id)
      .maybeSingle();

    const isPlatformAdmin = authUser.user_metadata?.is_platform_admin === true;
    
    if (!currentUser?.is_admin && !isPlatformAdmin) {
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

    return NextResponse.json({
      success: true,
      data: {
        userRoles: userRoles || [],
        allRoles: allRoles || [],
      },
    });
  } catch (error) {
    console.error("[User Roles API] Unexpected error:", error);
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
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get current user session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin access
    const { data: currentUser } = await supabase
      .from("portal_users")
      .select("id, is_admin")
      .eq("id", authUser.id)
      .maybeSingle();

    const isPlatformAdmin = authUser.user_metadata?.is_platform_admin === true;
    
    if (!currentUser?.is_admin && !isPlatformAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { roleIds } = body;

    if (!Array.isArray(roleIds)) {
      return NextResponse.json(
        { success: false, error: "roleIds must be an array" },
        { status: 400 }
      );
    }

    // Delete existing roles for this user
    const { error: deleteError } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", id);

    if (deleteError) {
      console.error("[User Roles API] Error deleting existing roles:", deleteError);
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
        return NextResponse.json(
          { success: false, error: "Failed to assign roles" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Roles updated successfully",
    });
  } catch (error) {
    console.error("[User Roles API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
