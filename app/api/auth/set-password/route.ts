import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// POST /api/auth/set-password - Set password for new user and activate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, tenantSlug, password } = body;

    if (!email || !tenantSlug || !password) {
      return NextResponse.json(
        { error: "Email, tenant slug, and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();
    const supabase = await createClient();

    // Find the user by email
    const { data: usersData, error: listError } = await serviceClient.auth.admin.listUsers();
    
    if (listError) {
      console.error("[SetPassword] Error listing users:", listError);
      return NextResponse.json(
        { error: "Failed to find user" },
        { status: 500 }
      );
    }

    const user = usersData?.users.find((u: { email?: string }) => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("[SetPassword] Found user:", user.id);

    // Find tenant by ID using service client (bypasses RLS)
    const { data: tenant, error: tenantError } = await serviceClient
      .from("tenants")
      .select("id, name")
      .eq("id", tenantSlug)
      .maybeSingle();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Update the user's password
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (updateError) {
      console.error("[SetPassword] Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to set password" },
        { status: 500 }
      );
    }

    console.log("[SetPassword] Password updated for user:", user.id);

    // Confirm the user's email
    await serviceClient.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    // Activate tenant user relationship
    const { error: tenantUserError } = await supabase
      .from("tenant_users")
      .update({
        status: "active",
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("tenant_id", tenant.id);

    if (tenantUserError) {
      console.error("[SetPassword] Error activating tenant user:", tenantUserError);
    }

    // Update contact record
    await supabase
      .from("contacts")
      .update({
        portal_invitation_status: "ACTIVE",
        portal_user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("email", email)
      .eq("tenant_id", tenant.id);

    // Update portal_users status
    await supabase
      .from("portal_users")
      .update({
        status: "ACTIVE",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Create audit log
    await supabase.from("platform_audit_events").insert({
      event_type: "USER_PASSWORD_SET",
      entity_type: "user",
      entity_id: user.id,
      details: {
        email,
        tenant_id: tenant.id,
        tenant_name: tenant.name,
      },
    });

    console.log("[SetPassword] User activated successfully:", user.id);

    return NextResponse.json({
      success: true,
      message: "Password set and user activated",
    });
  } catch (error) {
    console.error("[SetPassword] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
