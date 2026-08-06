import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/invitations/activate - Activate user for tenant after password set
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email, tenantSlug } = body;

    if (!email || !tenantSlug) {
      return NextResponse.json(
        { error: "Email and tenant slug are required" },
        { status: 400 }
      );
    }

    // Get the user by email
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Find tenant by slug or ID
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, association_id")
      .or(`subdomain.eq.${tenantSlug},id.eq.${tenantSlug}`)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Update tenant_users to mark as active
    const { error: updateError } = await supabase
      .from("tenant_users")
      .update({
        status: "active",
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("tenant_id", tenant.id);

    if (updateError) {
      console.error("Error activating tenant user:", updateError);
      // Don't fail - user can still log in
    }

    // Update contact status if exists
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
      event_type: "USER_ACTIVATED",
      entity_type: "user",
      entity_id: user.id,
      details: {
        email,
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        activated_via: "set_password",
      },
      created_by: user.id,
    });

    // Sync to GHL
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(user.id);
      if (userData?.user) {
        // Trigger GHL sync
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/ghl/sync-user`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            email: userData.user.email,
            tenantId: tenant.id,
            status: "active",
          }),
        });
      }
    } catch (ghlError) {
      console.error("Error syncing to GHL:", ghlError);
      // Don't fail activation if GHL sync fails
    }

    return NextResponse.json({
      success: true,
      message: "User activated successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/invitations/activate:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
