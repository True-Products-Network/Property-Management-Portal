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
    // Now synchronous to catch errors
    try {
      await sendGHLInvitation(supabase, {
        email,
        firstName,
        lastName,
        token,
        tenantId,
        role,
        portalRole,
      });
    } catch (ghlError) {
      console.error("[Invitations] GHL push failed:", ghlError);
      // Don't fail the invitation if GHL push fails, just log it
    }

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
  // Get tenant's association_id first
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("association_id, name")
    .eq("id", params.tenantId)
    .single();

  if (tenantError || !tenant?.association_id) {
    console.log("[GHL Invitation] No association found for tenant:", params.tenantId);
    return;
  }

  console.log("[GHL Invitation] Using association_id:", tenant.association_id);

  // Get GHL credentials from association_ghl_credentials (per-association)
  const { data: credentials, error: credsError } = await supabase
    .from("association_ghl_credentials")
    .select("*")
    .eq("association_id", tenant.association_id)
    .maybeSingle();

  if (credsError) {
    console.log("[GHL Invitation] Error fetching credentials:", credsError.message);
    return;
  }

  if (!credentials) {
    console.log("[GHL Invitation] No GHL credentials found for association:", tenant.association_id);
    return;
  }

  // Get access token and location ID
  const accessToken = credentials.access_token;
  const locationId = credentials.location_id;

  if (!accessToken || !locationId) {
    console.log("[GHL Invitation] GHL credentials incomplete - access_token:", accessToken ? "exists" : "missing", "location_id:", locationId ? "exists" : "missing");
    return;
  }

  console.log("[GHL Invitation] GHL configured - locationId:", locationId);

  const tenantName = tenant?.name || "Associos Property Management";
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${params.token}`;
  const tenantName = tenant?.name || "Associos Property Management";

  // First, create/update contact in GHL with "invited" tag
  console.log(`[GHL Invitation] Creating/updating contact for ${params.email}`);

  try {
    // Try GHL v2 API first
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
          ghl_location_id: locationId,
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
        "Authorization": `Bearer ${accessToken}`,
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
          ghl_location_id: locationId,
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
