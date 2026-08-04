// Platform User Detail API
// GET /api/platform/users/[id] - Get a single platform user
// PUT /api/platform/users/[id] - Update a platform user

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check if current user is platform admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 }
      );
    }

    const { data: platformRole } = await supabase
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .is("revoked_at", null)
      .single();

    if (!platformRole || platformRole.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Platform admin access required" },
        { status: 403 }
      );
    }

    // Get platform user
    const { data: platformUser, error: platformError } = await supabase
      .from("platform_user_roles")
      .select("*")
      .eq("id", id)
      .single();

    if (platformError || !platformUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user details from auth
    const serviceClient = createServiceClient();
    const { data: userData, error: userError } = await serviceClient.auth.admin.getUserById(platformUser.user_id);

    if (userError) {
      console.error("Error fetching user:", userError);
    }

    return NextResponse.json({
      platformUser,
      user: {
        email: userData?.user?.email || "",
        full_name: userData?.user?.user_metadata?.full_name,
      },
    });

  } catch (error) {
    console.error("Error in GET /api/platform/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check if current user is platform admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 }
      );
    }

    const { data: platformRole } = await supabase
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .is("revoked_at", null)
      .single();

    if (!platformRole || platformRole.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Platform admin access required" },
        { status: 403 }
      );
    }

    // Get platform user
    const { data: platformUser, error: platformError } = await supabase
      .from("platform_user_roles")
      .select("*")
      .eq("id", id)
      .single();

    if (platformError || !platformUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, fullName, role, status } = body;

    const serviceClient = createServiceClient();

    // Update auth user email and metadata
    const { error: updateUserError } = await serviceClient.auth.admin.updateUserById(
      platformUser.user_id,
      {
        email,
        user_metadata: {
          full_name: fullName,
        },
      }
    );

    if (updateUserError) {
      return NextResponse.json(
        { error: `Failed to update user: ${updateUserError.message}` },
        { status: 400 }
      );
    }

    // Update platform role
    const { error: updateRoleError } = await serviceClient
      .from("platform_user_roles")
      .update({
        role,
        revoked_at: status === "revoked" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateRoleError) {
      return NextResponse.json(
        { error: `Failed to update role: ${updateRoleError.message}` },
        { status: 400 }
      );
    }

    // Log the action
    await serviceClient.from("platform_audit_events").insert({
      actor_id: currentUser.id,
      actor_type: "platform_admin",
      action: "platform_user_updated",
      action_category: "security",
      target_type: "user",
      target_id: platformUser.user_id,
      new_value: { role, email, full_name: fullName, status },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
    });

  } catch (error) {
    console.error("Error in PUT /api/platform/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
