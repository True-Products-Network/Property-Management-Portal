// Tenant Users API
// GET /api/platform/tenants/[id]/users - List users for a tenant
// POST /api/platform/tenants/[id]/users - Invite/create a new user for the tenant

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getGhlCredentials } from "@/lib/ghl/credentials";
import { z } from "zod";

// Validation schema for inviting a user
// Uses the 10 standard portal roles
const inviteUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum([
    "admin_user",
    "portfolio_manager", 
    "association_manager",
    "property_manager",
    "board_member",
    "vendor_contractor",
    "resident",
    "owner",
    "staff",
    "finance_user"
  ]).default("staff"),
  phone: z.string().optional(),
  sendInviteEmail: z.boolean().default(true),
});

// Check if user has platform support access
async function isPlatformSupport(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_support");
  return !!data && !error;
}

// Log audit event
async function logAuditEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    action: string;
    actionCategory: string;
    targetType?: string;
    targetId?: string;
    previousValue?: any;
    newValue?: any;
    reason?: string;
  }
) {
  const { data: { user } } = await supabase.auth.getUser();
  
  await supabase.from("platform_audit_events").insert({
    actor_id: user?.id,
    actor_type: user ? "platform_support" : "system",
    action: params.action,
    action_category: params.actionCategory,
    target_type: params.targetType,
    target_id: params.targetId,
    previous_value: params.previousValue,
    new_value: params.newValue,
    reason: params.reason,
  });
}

// GET /api/platform/tenants/[id]/users
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    const supabase = await createClient();
    
    // Check platform support access
    if (!await isPlatformSupport(supabase)) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Platform access required" },
        { status: 403 }
      );
    }

    // Get users associated with this tenant
    const { data: tenantUsers, error } = await supabase
      .from("tenant_users")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    // Get auth user details using service client (same approach as View page)
    const userIds = tenantUsers?.map((tu: { user_id: string }) => tu.user_id) || [];
    let userDetails: Record<string, { email?: string; full_name?: string; first_name?: string; last_name?: string }> = {};
    
    if (userIds.length > 0) {
      try {
        const serviceClient = createServiceClient();
        const { data: usersData } = await serviceClient.auth.admin.listUsers();
        if (usersData?.users) {
          usersData.users.forEach((u: { id: string; email?: string; user_metadata?: { full_name?: string; first_name?: string; last_name?: string } }) => {
            if (userIds.includes(u.id)) {
              userDetails[u.id] = {
                email: u.email,
                full_name: u.user_metadata?.full_name,
                first_name: u.user_metadata?.first_name,
                last_name: u.user_metadata?.last_name,
              };
            }
          });
        }
      } catch (authFetchError) {
        console.error("[Tenant Users API] Failed to fetch auth users:", authFetchError);
      }
    }

    // Merge auth user data with tenant users
    const mergedUsers = tenantUsers?.map((tu: { user_id: string; [key: string]: any }) => {
      const details = userDetails[tu.user_id];
      return {
        ...tu,
        email: details?.email || tu.email,
        first_name: tu.first_name || details?.first_name || details?.full_name?.split(' ')[0],
        last_name: tu.last_name || details?.last_name || details?.full_name?.split(' ').slice(1).join(' '),
      };
    });

    if (error) {
      console.error("Error fetching tenant users:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get contacts associated with this tenant
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (contactsError) {
      console.error("Error fetching contacts:", contactsError);
    }

    return NextResponse.json({
      success: true,
      data: {
        users: mergedUsers || [],
        contacts: contacts || [],
      },
    });
  } catch (error) {
    console.error("Error in GET /api/platform/tenants/[id]/users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/platform/tenants/[id]/users - Invite a new user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantId } = await params;
    const supabase = await createClient();
    
    // Check platform support access
    if (!await isPlatformSupport(supabase)) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Platform access required" },
        { status: 403 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = inviteUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const serviceClient = createServiceClient();

    // Check if user already exists
    const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find((u: { email?: string }) => u.email === validation.data.email);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // User exists, use their ID
      userId = existingUser.id;
    } else {
      // Create new user with service role
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase();
      
      const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
        email: validation.data.email,
        password: tempPassword,
        email_confirm: false, // Require email confirmation
        user_metadata: {
          first_name: validation.data.firstName,
          last_name: validation.data.lastName,
          full_name: `${validation.data.firstName} ${validation.data.lastName}`,
          phone: validation.data.phone,
          portal_role: validation.data.role,
        },
      });

      if (createError || !newUser.user) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { success: false, error: `Failed to create user: ${createError?.message}` },
          { status: 400 }
        );
      }

      userId = newUser.user.id;
      isNewUser = true;

      // Send password reset email (acts as invite)
      if (validation.data.sendInviteEmail) {
        const { error: inviteError } = await serviceClient.auth.admin.generateLink({
          type: "recovery",
          email: validation.data.email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
          },
        });

        if (inviteError) {
          console.error("Error sending invite email:", inviteError);
          // Don't fail the operation, just log the error
        }
      }
    }

    // Create contact record (only use columns that exist in the table)
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        contact_id: `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        first_name: validation.data.firstName,
        last_name: validation.data.lastName,
        email: validation.data.email,
        phone: validation.data.phone,
        email_permission: true,
      })
      .select()
      .single();

    if (contactError) {
      console.error("Error creating contact:", contactError);
      // Continue even if contact creation fails - user is still created
    }

    // Create tenant user relationship
    // Map detailed roles to database roles (admin/member)
    const adminRoles = ["admin_user", "portfolio_manager", "association_manager"];
    const dbRole = adminRoles.includes(validation.data.role) ? "admin" : "member";
    
    const { error: tenantUserError } = await supabase
      .from("tenant_users")
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role: dbRole,
        is_primary_admin: validation.data.role === "admin_user",
        invited_at: new Date().toISOString(),
      });

    if (tenantUserError) {
      // If duplicate, user is already in tenant - that's ok for re-invites
      if (tenantUserError.message.includes('duplicate')) {
        console.log("[Tenant Users] User already exists in tenant:", userId);
        // Update role if needed
        await supabase
          .from("tenant_users")
          .update({ 
            role: dbRole,
            is_primary_admin: validation.data.role === "admin_user" 
          })
          .eq("tenant_id", tenantId)
          .eq("user_id", userId);
      } else {
        console.error("Error creating tenant user:", tenantUserError);
        return NextResponse.json(
          { success: false, error: `Failed to assign user to tenant: ${tenantUserError.message}` },
          { status: 400 }
        );
      }
    }

    // Push to GHL (async - don't wait but handle errors)
    console.log("[Tenant Users] Triggering GHL push...");
    pushToGHL(supabase, {
      email: validation.data.email,
      firstName: validation.data.firstName,
      lastName: validation.data.lastName,
      role: validation.data.role,
      tenantId,
      isNewUser,
    }).catch((err) => {
      console.error("[Tenant Users] GHL push error:", err);
    });

    // Log audit event
    await logAuditEvent(supabase, {
      action: "tenant_user_invited",
      actionCategory: "tenant",
      targetType: "user",
      targetId: userId,
      newValue: {
        email: validation.data.email,
        role: validation.data.role,
        tenantId,
        isNewUser,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        userId,
        email: validation.data.email,
        role: validation.data.role,
        isNewUser,
        message: isNewUser 
          ? "User created and invitation sent" 
          : "Existing user added to tenant",
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/platform/tenants/[id]/users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper to push user to GHL
async function pushToGHL(
  supabase: any,
  params: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
    isNewUser: boolean;
  }
) {
  try {
    console.log("[GHL Push] Starting GHL push for:", params.email);
    
    // Get GHL credentials from app_settings (Platform GHL integration)
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

    console.log("[GHL Push] Location ID found:", locationSetting?.value ? "yes" : "no");
    console.log("[GHL Push] Access token found:", tokenSetting?.value ? "yes" : "no");

    const accessToken = tokenSetting?.value;
    const locationId = locationSetting?.value;

    if (!accessToken || !locationId) {
      console.log("[GHL Push] GHL not configured - missing access_token or location_id in app_settings");
      return;
    }

  // Get tenant name
  const { data: tenantData } = await supabase
    .from("tenants")
    .select("name")
    .eq("id", params.tenantId)
    .single();

  const tenantName = tenantData?.name || "Associos";

  console.log(`[GHL Push] Pushing user ${params.email} to GHL location ${locationId}`);

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
        tags: [
          "portal_user",
          params.isNewUser ? "status_invited" : "status_active",
          `role_${params.role}`,
          `tenant_${tenantName}`,
          "source_associos_portal"
        ],
        customFields: [
          { key: "portal_role", field_value: params.role },
          { key: "tenant_name", field_value: tenantName },
          { key: "source", field_value: "Associos Portal" },
          { key: "portal_user_type", field_value: params.isNewUser ? "invited" : "active" },
        ],
      }),
    });

    if (v2Response.ok) {
      const result = await v2Response.json();
      console.log("[GHL Push] Contact created in GHL v2:", result.contact?.id);
      return;
    }

    console.log("[GHL Push] V2 failed:", v2Response.status, await v2Response.text());

    // Fall back to v1
    console.log("[GHL Push] Trying V1...");
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
        tags: [
          "portal_user",
          params.isNewUser ? "status_invited" : "status_active",
          `role_${params.role}`,
          `tenant_${tenantName}`,
          "source_associos_portal"
        ],
        customFields: [
          { id: "portal_role", value: params.role },
          { id: "tenant_name", value: tenantName },
          { id: "source", value: "Associos Portal" },
          { id: "portal_user_type", value: params.isNewUser ? "invited" : "active" },
        ],
      }),
    });

    if (v1Response.ok) {
      console.log("[GHL Push] Contact created in GHL v1");
    } else {
      console.error("[GHL Push] V1 failed:", v1Response.status, await v1Response.text());
    }
  } catch (error) {
    console.error("[GHL Push] Error:", error);
  }
  } catch (outerError) {
    console.error("[GHL Push] Outer error:", outerError);
  }
}
