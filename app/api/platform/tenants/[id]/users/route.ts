// Tenant Users API
// GET /api/platform/tenants/[id]/users - List users for a tenant
// POST /api/platform/tenants/[id]/users - Invite/create a new user for the tenant

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
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
      .select(`
        *,
        user:auth.users!tenant_users_user_id_fkey(id, email, user_metadata)
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

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
        users: tenantUsers || [],
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

    // Create contact record
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        tenant_id: tenantId,
        first_name: validation.data.firstName,
        last_name: validation.data.lastName,
        email: validation.data.email,
        primary_phone: validation.data.phone,
        user_id: userId,
        contact_type: "staff",
        is_primary_contact: validation.data.role === "admin_user",
        created_by: currentUser?.id,
        updated_by: currentUser?.id,
      })
      .select()
      .single();

    if (contactError) {
      console.error("Error creating contact:", contactError);
      // Continue even if contact creation fails
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
      console.error("Error creating tenant user:", tenantUserError);
      return NextResponse.json(
        { success: false, error: `Failed to assign user to tenant: ${tenantUserError.message}` },
        { status: 400 }
      );
    }

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
