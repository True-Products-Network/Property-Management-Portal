import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Association {
  id: string;
  name: string;
}

// GET /api/admin/users - Get all users from contacts table
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user session
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if current user is admin
    console.log("[Admin Users API] Checking admin status for user ID:", authUser.id);
    
    // Check portal_users first
    const { data: currentUser } = await supabase
      .from("portal_users")
      .select("id, email, is_admin, status")
      .eq("id", authUser.id)
      .maybeSingle();

    // Also check if user is platform admin
    const { data: platformRole } = await supabase
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .is("revoked_at", null)
      .maybeSingle();
    
    const isPlatformAdmin = platformRole?.role === "PLATFORM_ADMIN" || authUser.user_metadata?.is_platform_admin === true;

    console.log("[Admin Users API] Current user lookup result:", { currentUser, isPlatformAdmin });

    // Allow access if user is in portal_users as admin OR is platform admin
    if (!currentUser?.is_admin && !isPlatformAdmin) {
      console.error("[Admin Users API] User is not admin:", authUser.id);
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const associationId = searchParams.get("associationId");

    // Get all contacts (these are the users)
    let contactsQuery = supabase
      .from("contacts")
      .select(`
        id,
        user_id,
        contact_id,
        first_name,
        last_name,
        email,
        phone,
        portal_invitation_status,
        portal_user_id,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    const { data: contacts, error: contactsError } = await contactsQuery;

    if (contactsError) {
      console.error("[Admin Users API] Error fetching contacts:", contactsError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users: " + contactsError.message },
        { status: 500 }
      );
    }

    // Get user IDs from contacts
    const userIds = (contacts || [])
      .map((c: any) => c.user_id)
      .filter((id: string | null): id is string => !!id);

    // Get user's roles for role information
    let roleMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, role_id, roles(name)")
        .in("user_id", userIds);

      (userRoles || []).forEach((ur: any) => {
        const roleName = ur.roles?.name || "Unknown";
        roleMap.set(ur.user_id, roleName);
      });
    }

    // Get associations for context
    const { data: associations } = await supabase
      .from("associations")
      .select("id, name")
      .limit(100);

    const associationMap = new Map((associations as Association[] || []).map((a: Association) => [a.id, a.name]));

    // Map contacts to users
    const mappedUsers = (contacts || []).map((contact: any) => {
      const firstName = contact.first_name;
      const lastName = contact.last_name;
      const fullName = firstName && lastName 
        ? `${firstName} ${lastName}` 
        : firstName || lastName || contact.email;
      
      return {
        id: contact.user_id || contact.id,
        contactId: contact.id,
        email: contact.email,
        firstName: firstName || null,
        lastName: lastName || null,
        name: fullName,
        role: contact.user_id ? roleMap.get(contact.user_id) || "User" : "Contact",
        status: contact.portal_invitation_status?.toLowerCase() || "none",
        ghlContactId: contact.contact_id,
        createdAt: contact.created_at,
        lastSignInAt: contact.updated_at,
      };
    });

    return NextResponse.json({
      success: true,
      data: mappedUsers,
      meta: {
        total: mappedUsers.length,
        associationId: associationId || null,
      }
    });
  } catch (error) {
    console.error("[Admin Users API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
