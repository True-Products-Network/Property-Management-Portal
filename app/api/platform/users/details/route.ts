// Platform Users Details API
// GET /api/platform/users/details - Get details for all platform users

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if current user is platform admin
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized - Not logged in" },
        { status: 401 }
      );
    }

    const { data: platformRole } = await supabase
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .is("revoked_at", null)
      .single();

    if (!platformRole || platformRole.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Platform admin access required" },
        { status: 403 }
      );
    }

    // Get all platform users to find which user IDs we need
    const { data: platformUsers } = await supabase
      .from("platform_user_roles")
      .select("user_id");

    if (!platformUsers || platformUsers.length === 0) {
      return NextResponse.json({ users: {} });
    }

    const userIds = platformUsers.map((u: { user_id: string }) => u.user_id);

    // Use service role to fetch user details from auth
    const serviceClient = createServiceClient();
    const { data: usersData, error: usersError } = await serviceClient.auth.admin.listUsers();

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch user details" },
        { status: 500 }
      );
    }

    // Filter to only platform users and format response
    const userDetails: Record<string, { email: string; full_name?: string }> = {};
    
    usersData.users.forEach((u: { id: string; email?: string; user_metadata?: { full_name?: string } }) => {
      if (userIds.includes(u.id)) {
        userDetails[u.id] = {
          email: u.email || "",
          full_name: u.user_metadata?.full_name,
        };
      }
    });

    return NextResponse.json({ users: userDetails });

  } catch (error) {
    console.error("Error in GET /api/platform/users/details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
