// Platform Users API
// POST /api/platform/users - Create a new platform user

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();
    const { email, password, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, role" },
        { status: 400 }
      );
    }

    if (!["PLATFORM_ADMIN", "PLATFORM_SUPPORT"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be PLATFORM_ADMIN or PLATFORM_SUPPORT" },
        { status: 400 }
      );
    }

    // Use service role client to create user (bypasses RLS and auth restrictions)
    const serviceClient = createServiceClient();

    // Step 1: Try to create the user
    const { data: userData, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    let userId: string;
    let isNewUser = false;

    if (createError) {
      // Check if user already exists
      if (createError.message.includes("already been registered")) {
        // Find existing user by email
        const { data: existingUsers, error: listError } = await serviceClient.auth.admin.listUsers();
        
        if (listError) {
          return NextResponse.json(
            { error: "Failed to check existing users" },
            { status: 500 }
          );
        }

        const existingUser = existingUsers.users.find(u => u.email === email);
        
        if (!existingUser) {
          return NextResponse.json(
            { error: "User exists but could not be found" },
            { status: 500 }
          );
        }

        userId = existingUser.id;
      } else {
        return NextResponse.json(
          { error: `Failed to create user: ${createError.message}` },
          { status: 400 }
        );
      }
    } else if (userData.user) {
      userId = userData.user.id;
      isNewUser = true;
    } else {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Step 2: Check if user already has a platform role
    const { data: existingRole } = await serviceClient
      .from("platform_user_roles")
      .select("id, role, revoked_at")
      .eq("user_id", userId)
      .single();

    if (existingRole && !existingRole.revoked_at) {
      return NextResponse.json(
        { error: `User already has an active ${existingRole.role} role.` },
        { status: 409 }
      );
    }

    // Step 3: Grant or reactivate platform role
    if (existingRole?.revoked_at) {
      const { error: updateError } = await serviceClient
        .from("platform_user_roles")
        .update({
          role,
          revoked_at: null,
          granted_at: new Date().toISOString(),
          granted_by: currentUser.id,
        })
        .eq("id", existingRole.id);

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to reactivate role: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await serviceClient
        .from("platform_user_roles")
        .insert({
          user_id: userId,
          role,
          granted_at: new Date().toISOString(),
          granted_by: currentUser.id,
        });

      if (insertError) {
        return NextResponse.json(
          { error: `Failed to grant role: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    // Step 4: Log the action
    await serviceClient.from("platform_audit_events").insert({
      actor_id: currentUser.id,
      actor_type: "platform_admin",
      action: isNewUser ? "platform_user_created" : "platform_role_granted",
      action_category: "security",
      target_type: "user",
      target_id: userId,
      new_value: { role, email, is_new_user: isNewUser },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${isNewUser ? 'created' : 'added'} ${email} as ${role}`,
      isNewUser,
      userId,
    });

  } catch (error) {
    console.error("Error in POST /api/platform/users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
