import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Association {
  id: string;
  name: string;
}

interface PortalUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  ghl_contact_id: string | null;
  is_admin: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/users - Get all portal users
// Supports filtering by associationId (future enhancement)
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const associationId = searchParams.get("associationId");

    // Check if current user is admin
    const { data: currentUser } = await supabase
      .from("portal_users")
      .select("is_admin, status")
      .eq("id", authUser.id)
      .maybeSingle();

    if (!currentUser?.is_admin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get user's roles for role information
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", (await supabase.from("portal_users").select("id")).data?.map(u => u.id) || []);

    // Build role map
    const roleMap = new Map(userRoles?.map(ur => [ur.user_id, ur.role]) || []);

    // Get all portal users
    const { data: users, error } = await supabase
      .from("portal_users")
      .select(`
        id,
        email,
        first_name,
        last_name,
        ghl_contact_id,
        is_admin,
        status,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin Users API] Error fetching users:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users: " + error.message },
        { status: 500 }
      );
    }

    // Get associations for context (if needed for filtering)
    const { data: associations } = await supabase
      .from("associations")
      .select("id, name")
      .limit(100);

    const associationMap = new Map((associations as Association[] || []).map((a: Association) => [a.id, a.name]));

    // Map users with role information
    const mappedUsers = (users as PortalUser[] || []).map((u: PortalUser) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      name: u.first_name && u.last_name 
        ? `${u.first_name} ${u.last_name}` 
        : u.email,
      role: roleMap.get(u.id) || (u.is_admin ? "admin" : "user"),
      status: u.status?.toLowerCase() || "active",
      ghlContactId: u.ghl_contact_id,
      createdAt: u.created_at,
      lastSignInAt: u.updated_at, // Using updated_at as proxy for last activity
    }));

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
