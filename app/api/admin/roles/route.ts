import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/roles - List all roles
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user roles from metadata
    const userRoles = user.user_metadata?.roles || [];
    if (!userRoles.includes("ADMIN_USER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch roles from database
    const { data: roles, error } = await supabase
      .from("portal_roles")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching roles:", error);
      return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: roles || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = user.user_metadata?.roles || [];
    if (!userRoles.includes("ADMIN_USER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, permissions, requiresMFA, status, auditReason } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    // Insert role
    const { data: role, error: roleError } = await supabase
      .from("portal_roles")
      .insert({
        name: name.trim(),
        description: description?.trim() || "",
        permissions: permissions || [],
        requires_mfa: requiresMFA || false,
        status: status || "active",
        is_default: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (roleError) {
      console.error("Error creating role:", roleError);
      return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "ROLE_CREATED",
      entity_type: "portal_role",
      entity_id: role.id,
      details: {
        role_name: name,
        reason: auditReason || "Created new role",
      },
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    console.error("Error in POST /api/admin/roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
