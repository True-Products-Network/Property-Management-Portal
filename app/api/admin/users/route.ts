import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Association {
  id: string;
  name: string;
}

// GET /api/admin/users - Get all users for the current tenant
// Supports filtering by associationId
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

    // First, get the current user's tenant_id from tenant_users
    const { data: currentUser, error: userError } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("id", authUser.id)
      .single();

    if (userError || !currentUser) {
      console.error("[Admin Users API] Error getting current user:", userError);
      return NextResponse.json(
        { success: false, error: "Failed to get user context" },
        { status: 500 }
      );
    }

    const tenantId = currentUser.tenant_id;

    // Build the query for tenant users
    let query = supabase
      .from("tenant_users")
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        status,
        tenant_id,
        association_id,
        created_at,
        last_sign_in_at
      `)
      .eq("tenant_id", tenantId);

    // If associationId provided, filter by it
    if (associationId) {
      query = query.eq("association_id", associationId);
    }

    const { data: users, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[Admin Users API] Error fetching users:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch users: " + error.message },
        { status: 500 }
      );
    }

    // Get associations for context
    const { data: associations } = await supabase
      .from("associations")
      .select("id, name")
      .eq("tenant_id", tenantId);

    const associationMap = new Map((associations as Association[] || []).map((a: Association) => [a.id, a.name]));

    // Map users with association names
    const mappedUsers = (users || []).map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      name: u.first_name && u.last_name 
        ? `${u.first_name} ${u.last_name}` 
        : u.email,
      role: u.role || "user",
      status: u.status || "active",
      tenantId: u.tenant_id,
      associationId: u.association_id,
      associationName: u.association_id ? associationMap.get(u.association_id) || "Unknown" : null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at,
    }));

    return NextResponse.json({
      success: true,
      data: mappedUsers,
      meta: {
        tenantId,
        associationId: associationId || null,
        total: mappedUsers.length,
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
