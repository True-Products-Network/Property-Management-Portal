import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

interface UserRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

// GET /api/admin/users - Get all users for admin management
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();

    console.log("[Admin Users API] Session user:", JSON.stringify(user, null, 2));

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No session" },
        { status: 401 }
      );
    }

    if (!user.roles || !Array.isArray(user.roles)) {
      console.error("[Admin Users API] User roles missing or invalid:", user.roles);
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid roles" },
        { status: 401 }
      );
    }

    if (!isAdmin(user.roles)) {
      console.error("[Admin Users API] User is not admin:", user.roles);
      return NextResponse.json(
        { success: false, error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get all users from auth.users via the admin API
    // First, let's get users from our users table with their roles
    console.log("[Admin Users API] Fetching users from database...");

    const { data: users, error } = await supabase
      .from("users")
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        status,
        created_at,
        last_sign_in_at
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin Users API] Error fetching users:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users: " + error.message },
        { status: 500 }
      );
    }

    console.log("[Admin Users API] Fetched users count:", users?.length || 0);

    // Map to the expected format
    const mappedUsers = (users as UserRow[]).map((u: UserRow) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      name: u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email,
      role: u.role || "user",
      status: u.status || "active",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at,
    }));

    return NextResponse.json({
      success: true,
      data: mappedUsers,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/users:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
