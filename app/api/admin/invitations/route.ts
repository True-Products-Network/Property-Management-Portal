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

    // Send invitation email via GHL (if configured)
    // This is async - don't wait for it
    sendGHLInvitation(supabase, {
      email,
      firstName,
      lastName,
      token,
      tenantId,
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

// Helper function to send invitation via GHL
async function sendGHLInvitation(
  supabase: any,
  params: {
    email: string;
    firstName: string;
    lastName: string;
    token: string;
    tenantId: string;
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
    console.log("GHL not configured, skipping invitation webhook");
    return;
  }

  // Get tenant info
  const { data: tenant } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", params.tenantId)
    .single();

  // Call GHL webhook/API to send invitation
  // This would trigger a GHL workflow that sends the email
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/ghl/invite`;
  
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      invitationToken: params.token,
      tenantName: tenant?.name || "Associos Property Management",
      invitationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${params.token}`,
    }),
  });
}
