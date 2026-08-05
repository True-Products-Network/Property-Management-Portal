import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

// POST /api/admin/invitations - Create invitation for a user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    // Check if user is admin
    const isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    const isTenantAdmin = tenantUser?.role === 'admin';
    
    if (!isPlatformAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const tenantId = tenantUser?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant context" }, { status: 400 });
    }

    const body = await request.json();
    const { email, firstName, lastName, role, portalRole } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate invitation token
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from("user_invitations")
      .insert({
        email: email.trim().toLowerCase(),
        first_name: firstName?.trim(),
        last_name: lastName?.trim(),
        tenant_id: tenantId,
        role: role || 'member',
        portal_role: portalRole || 'Staff',
        invited_by: user.id,
        token: token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
      return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
    }

    // Create audit log
    await supabase.from("platform_audit_events").insert({
      tenant_id: tenantId,
      event_type: "USER_INVITED",
      entity_type: "invitation",
      entity_id: invitation.id,
      details: {
        email: email,
        role: role,
        portal_role: portalRole,
      },
      created_by: user.id,
    });

    // Push contact to GHL and send invitation (if configured)
    // This is async - don't wait for it
    sendGHLInvitation(supabase, {
      email,
      firstName,
      lastName,
      token,
      tenantId,
      role,
      portalRole,
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expires_at: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/admin/invitations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/admin/invitations - List pending invitations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    const isTenantAdmin = tenantUser?.role === 'admin';
    
    if (!isPlatformAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenantId = tenantUser?.tenant_id;

    // Build query
    let query = supabase
      .from("user_invitations")
      .select("*")
      .order("created_at", { ascending: false });

    // If tenant admin, only show invitations for their tenant
    if (!isPlatformAdmin && tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data: invitations, error } = await query;

    if (error) {
      console.error("Error fetching invitations:", error);
      return NextResponse.json({ error: "Failed to fetch invitations" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: invitations || [],
    });
  } catch (error) {
    console.error("Error in GET /api/admin/invitations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to push contact to GHL and send invitation
async function sendGHLInvitation(
  supabase: any,
  params: {
    email: string;
    firstName: string;
    lastName: string;
    token: string;
    tenantId: string;
    role?: string;
    portalRole?: string;
  }
) {
  // Get GHL credentials
  const { data: locationSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "ghl_location_id")
    .single();

  const { data: tokenSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "ghl_access_token")
    .single();

  if (!locationSetting?.value || !tokenSetting?.value) {
    console.log("GHL not configured, skipping invitation sync");
    return;
  }

  // Get tenant info
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", params.tenantId)
    .single();

  const tenantName = tenant?.name || "Associos Property Management";
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${params.token}`;

  // First, create/update contact in GHL with "invited" tag
  console.log(`[GHL Invitation] Creating/updating contact for ${params.email}`);

  try {
    // Try GHL v2 API first
    const v2Response = await fetch("https://services.leadconnectorhq.com/contacts/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenSetting.value}`,
        "Version": "2021-07-28",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        locationId: locationSetting.value,
        email: params.email,
        firstName: params.firstName || "",
        lastName: params.lastName || "",
        tags: [
          "portal_user",
          "status_invited",
          `role_${params.portalRole || params.role || 'member'}`,
          `tenant_${tenantName}`,
          "source_associos_portal"
        ],
        customFields: [
          { key: "portal_role", field_value: params.portalRole || params.role || "member" },
          { key: "tenant_name", field_value: tenantName },
          { key: "source", field_value: "Associos Portal" },
          { key: "portal_user_type", field_value: "invited" },
          { key: "invitation_token", field_value: params.token },
          { key: "invitation_url", field_value: invitationUrl },
        ],
      }),
    });

    if (v2Response.ok) {
      const result = await v2Response.json();
      console.log("[GHL Invitation] Contact created/updated in GHL v2:", result.contact?.id);
      
      // Store GHL contact ID for future updates
      if (result.contact?.id) {
        await supabase.from("ghl_contact_mappings").upsert({
          email: params.email,
          ghl_contact_id: result.contact.id,
          ghl_location_id: locationSetting.value,
          tenant_id: params.tenantId,
          status: "invited",
          invitation_token: params.token,
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" });
      }
      
      return;
    }

    // If v2 fails, try v1 API
    console.log("[GHL Invitation] V2 failed, trying V1...");
    const errorText = await v2Response.text();
    console.log("[GHL Invitation] V2 error:", errorText);

    // Try v1 API
    const v1Response = await fetch("https://rest.gohighlevel.com/v1/contacts/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenSetting.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        firstName: params.firstName || "",
        lastName: params.lastName || "",
        tags: [
          "portal_user",
          "status_invited",
          `role_${params.portalRole || params.role || 'member'}`,
          `tenant_${tenantName}`,
          "source_associos_portal"
        ],
        customFields: [
          { id: "portal_role", value: params.portalRole || params.role || "member" },
          { id: "tenant_name", value: tenantName },
          { id: "source", value: "Associos Portal" },
          { id: "portal_user_type", value: "invited" },
        ],
      }),
    });

    if (v1Response.ok) {
      const result = await v1Response.json();
      console.log("[GHL Invitation] Contact created in GHL v1:", result.contact?.id);
      
      if (result.contact?.id) {
        await supabase.from("ghl_contact_mappings").upsert({
          email: params.email,
          ghl_contact_id: result.contact.id,
          ghl_location_id: locationSetting.value,
          tenant_id: params.tenantId,
          status: "invited",
          invitation_token: params.token,
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" });
      }
    } else {
      console.error("[GHL Invitation] V1 API error:", await v1Response.text());
    }
  } catch (error) {
    console.error("[GHL Invitation] Error pushing to GHL:", error);
  }
}
