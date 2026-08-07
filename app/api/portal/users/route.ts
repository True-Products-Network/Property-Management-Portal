// Portal Users API
// Returns portal users with their roles for a given association/tenant

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const associationId = searchParams.get("associationId");

    // Get user's tenant ID
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", authUser.id)
      .maybeSingle();

    const tenantId = tenantUser?.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "No tenant assigned" },
        { status: 403 }
      );
    }

    // Get all portal users for this tenant
    // Join with tenant_users to get users in this tenant
    const { data: tenantUsers, error: tuError } = await supabase
      .from("tenant_users")
      .select("user_id, role")
      .eq("tenant_id", tenantId);

    if (tuError) {
      console.error("[Portal Users API] Error fetching tenant users:", tuError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const userIds = tenantUsers?.map((tu: any) => tu.user_id) || [];

    if (userIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Get portal user details
    const { data: portalUsers, error: puError } = await supabase
      .from("portal_users")
      .select("id, email, first_name, last_name, status")
      .in("id", userIds);

    if (puError) {
      console.error("[Portal Users API] Error fetching portal users:", puError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Get user roles
    const { data: userRoles, error: urError } = await supabase
      .from("user_roles")
      .select("user_id, roles(name)")
      .in("user_id", userIds);

    if (urError) {
      console.error("[Portal Users API] Error fetching user roles:", urError);
    }

    // Build role map
    const roleMap = new Map<string, string[]>();
    (userRoles || []).forEach((ur: any) => {
      const roleName = ur.roles?.name;
      if (roleName) {
        const existing = roleMap.get(ur.user_id) || [];
        existing.push(roleName);
        roleMap.set(ur.user_id, existing);
      }
    });

    // Map to response format
    const mappedUsers = (portalUsers || []).map((pu: any) => ({
      id: pu.id,
      email: pu.email,
      firstName: pu.first_name,
      lastName: pu.last_name,
      status: pu.status,
      roles: roleMap.get(pu.id) || [],
    }));

    return NextResponse.json({
      success: true,
      data: mappedUsers,
    });
  } catch (error) {
    console.error("[Portal Users API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
