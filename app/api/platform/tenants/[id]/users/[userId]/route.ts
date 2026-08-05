// Tenant User Management API
// PATCH /api/platform/tenants/[id]/users/[userId] - Update user role
// DELETE /api/platform/tenants/[id]/users/[userId] - Remove user from tenant

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Check if user has platform support access
async function isPlatformSupport(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_support");
  return !!data && !error;
}

// PATCH - Update user role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: tenantId, userId } = await params;
    const supabase = await createClient();

    // Check platform support access
    if (!await isPlatformSupport(supabase)) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Platform access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !["admin", "member"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be 'admin' or 'member'" },
        { status: 400 }
      );
    }

    // Update the tenant user
    const { error } = await supabase
      .from("tenant_users")
      .update({
        role,
        is_primary_admin: role === "admin" ? false : undefined, // Don't change primary admin status
      })
      .eq("tenant_id", tenantId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating tenant user:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log audit event
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await supabase.from("platform_audit_events").insert({
      actor_id: currentUser?.id,
      action: "tenant_user_role_updated",
      action_category: "tenant",
      target_type: "user",
      target_id: userId,
      new_value: { role, tenantId },
    });

    return NextResponse.json({
      success: true,
      message: "User role updated successfully",
    });
  } catch (error) {
    console.error("Error in PATCH:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove user from tenant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: tenantId, userId } = await params;
    const supabase = await createClient();

    // Check platform support access
    if (!await isPlatformSupport(supabase)) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Platform access required" },
        { status: 403 }
      );
    }

    // Get user info before deleting for audit log
    const { data: userInfo } = await supabase
      .from("tenant_users")
      .select("role")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .single();

    // Delete the tenant user
    const { error } = await supabase
      .from("tenant_users")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting tenant user:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Log audit event
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    await supabase.from("platform_audit_events").insert({
      actor_id: currentUser?.id,
      action: "tenant_user_removed",
      action_category: "tenant",
      target_type: "user",
      target_id: userId,
      previous_value: { role: userInfo?.role, tenantId },
    });

    return NextResponse.json({
      success: true,
      message: "User removed from tenant successfully",
    });
  } catch (error) {
    console.error("Error in DELETE:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
