import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/invitations/accept - Accept invitation and create user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const body = await request.json();
    const { token, password, firstName, lastName } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("user_invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("auth.users")
      .select("id")
      .eq("email", invitation.email)
      .single();

    let userId: string;

    if (existingUser) {
      // User already exists - just link them to tenant
      userId = existingUser.id;
    } else {
      // Create new auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: invitation.email,
        password: password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName || invitation.first_name,
          last_name: lastName || invitation.last_name,
          portal_role: invitation.portal_role,
        },
      });

      if (authError || !authData.user) {
        console.error("Error creating user:", authError);
        return NextResponse.json(
          { error: "Failed to create user account" },
          { status: 500 }
        );
      }

      userId = authData.user.id;

      // Send user to GHL (async - don't wait)
      sendUserToGHL(supabase, {
        email: invitation.email,
        firstName: firstName || invitation.first_name,
        lastName: lastName || invitation.last_name,
        tenantId: invitation.tenant_id,
        portalRole: invitation.portal_role,
      }).catch(console.error);
    }

    // Create tenant_users entry - THIS IS THE KEY STEP
    const { error: tenantUserError } = await supabase
      .from("tenant_users")
      .insert({
        user_id: userId,
        tenant_id: invitation.tenant_id,
        role: invitation.role,
        status: 'active',
      });

    if (tenantUserError) {
      // If error is duplicate, user is already in tenant - that's ok
      if (!tenantUserError.message.includes('duplicate')) {
        console.error("Error creating tenant_user:", tenantUserError);
        return NextResponse.json(
          { error: "Failed to associate user with tenant" },
          { status: 500 }
        );
      }
    }

    // Assign role if specified
    if (invitation.portal_role) {
      // Get the role ID from roles table
      const { data: roleData } = await supabase
        .from("roles")
        .select("id")
        .eq("name", invitation.portal_role)
        .or(`tenant_id.is.null,tenant_id.eq.${invitation.tenant_id}`)
        .limit(1)
        .single();

      if (roleData) {
        await supabase.from("user_roles").insert({
          user_id: userId,
          tenant_id: invitation.tenant_id,
          role_id: roleData.id,
        }).catch(console.error); // Ignore duplicates
      }
    }

    // Mark invitation as accepted
    await supabase
      .from("user_invitations")
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
      })
      .eq("id", invitation.id);

    // Create audit log
    await supabase.from("platform_audit_events").insert({
      tenant_id: invitation.tenant_id,
      event_type: "INVITATION_ACCEPTED",
      entity_type: "invitation",
      entity_id: invitation.id,
      details: {
        email: invitation.email,
        user_id: userId,
        role: invitation.role,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully",
      data: {
        email: invitation.email,
        tenant_id: invitation.tenant_id,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/invitations/accept:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper to send new user to GHL
async function sendUserToGHL(
  supabase: any,
  params: {
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    portalRole: string;
  }
) {
  // Get tenant's association_id first
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("association_id, name")
    .eq("id", params.tenantId)
    .single();

  if (tenantError || !tenant?.association_id) {
    console.log("[GHL Accept] No association found for tenant:", params.tenantId);
    return;
  }

  console.log("[GHL Accept] Using association_id:", tenant.association_id);

  // Get GHL credentials from association_ghl_credentials (per-association)
  const { data: credentials, error: credsError } = await supabase
    .from("association_ghl_credentials")
    .select("*")
    .eq("association_id", tenant.association_id)
    .maybeSingle();

  if (credsError) {
    console.log("[GHL Accept] Error fetching credentials:", credsError.message);
    return;
  }

  if (!credentials) {
    console.log("[GHL Accept] No GHL credentials found for association:", tenant.association_id);
    return;
  }

  // Get access token and location ID
  const accessToken = credentials.access_token;
  const locationId = credentials.location_id;

  if (!accessToken || !locationId) {
    console.log("[GHL Accept] GHL credentials incomplete");
    return;
  }

  console.log("[GHL Accept] GHL configured - locationId:", locationId);

  // Call GHL API to create/update contact
  // Try v2 first, fall back to v1
  try {
    // Try GHL v2 API
    const v2Response = await fetch("https://services.leadconnectorhq.com/contacts/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        locationId: locationId,
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        tags: ["portal_user", `role_${params.portalRole}`, `tenant_${tenant?.name}`, "source_associos_portal"],
        customFields: [
          { key: "portal_role", field_value: params.portalRole },
          { key: "tenant_name", field_value: tenant?.name || "" },
          { key: "source", field_value: "Associos Portal" },
          { key: "portal_user_type", field_value: "registered" },
        ],
      }),
    });

    if (v2Response.ok) {
      console.log("[GHL Accept] User synced to GHL v2 successfully");
      return;
    }

    // Fall back to v1
    console.log("[GHL Accept] GHL v2 failed, trying v1...");
    const v1Response = await fetch("https://rest.gohighlevel.com/v1/contacts/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        tags: ["portal_user", `role_${params.portalRole}`, `tenant_${tenant?.name}`, "source_associos_portal"],
        customFields: [
          { id: "portal_role", value: params.portalRole },
          { id: "tenant_name", value: tenant?.name || "" },
          { id: "source", value: "Associos Portal" },
          { id: "portal_user_type", value: "registered" },
        ],
      }),
    });

    if (!v1Response.ok) {
      console.error("GHL API error (v1):", await v1Response.text());
    } else {
      console.log("User synced to GHL v1 successfully");
    }
  } catch (error) {
    console.error("Error sending user to GHL:", error);
  }
}
