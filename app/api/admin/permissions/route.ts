import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/permissions - List all available permissions
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
      .single();

    if (!tenantUser) {
      return NextResponse.json({ error: "No tenant found" }, { status: 403 });
    }

    // Check if user is admin
    if (tenantUser.role !== 'admin') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Fetch all permissions grouped by module
    const { data: permissions, error } = await supabase
      .from("permissions")
      .select("*")
      .order("module")
      .order("name");

    if (error) {
      console.error("Error fetching permissions:", error);
      return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
    }

    // Group permissions by module
    const groupedPermissions = (permissions || []).reduce((acc: Record<string, Array<{ code: string; name: string; description: string }>>, perm: { module: string; code: string; name: string; description: string }) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push({
        code: perm.code,
        name: perm.name,
        description: perm.description,
      });
      return acc;
    }, {});

    return NextResponse.json({ 
      success: true, 
      data: groupedPermissions 
    });
  } catch (error) {
    console.error("Error in GET /api/admin/permissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
