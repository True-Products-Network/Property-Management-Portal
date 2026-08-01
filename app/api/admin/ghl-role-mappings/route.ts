import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/ghl-role-mappings - List all GHL role mappings
export async function GET(request: NextRequest) {
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

    // Fetch mappings from database
    const { data: mappings, error } = await supabase
      .from("ghl_role_mappings")
      .select("*")
      .order("ghl_contact_role");

    if (error) {
      console.error("Error fetching mappings:", error);
      return NextResponse.json({ error: "Failed to fetch mappings" }, { status: 500 });
    }

    // Get user counts for each mapping
    const { data: userCounts, error: countError } = await supabase
      .from("contacts")
      .select("contact_role")
      .not("contact_role", "is", null);

    if (!countError && userCounts) {
      const counts: Record<string, number> = {};
      userCounts.forEach((u: { contact_role: string }) => {
        const role = u.contact_role;
        counts[role] = (counts[role] || 0) + 1;
      });

      mappings?.forEach((m) => {
        m.user_count = counts[m.ghl_contact_role] || 0;
      });
    }

    return NextResponse.json({ success: true, data: mappings || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/ghl-role-mappings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/ghl-role-mappings - Create new mapping
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
    const { ghlContactRole, portalRole, portalVersion, defaultPermissions, requiresMFA, status, description } = body;

    if (!ghlContactRole?.trim() || !portalRole?.trim()) {
      return NextResponse.json(
        { error: "GHL Contact Role and Portal Role are required" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from("ghl_role_mappings")
      .select("id")
      .eq("ghl_contact_role", ghlContactRole.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A mapping for this GHL Contact Role already exists" },
        { status: 400 }
      );
    }

    // Insert mapping
    const { data: mapping, error: mappingError } = await supabase
      .from("ghl_role_mappings")
      .insert({
        ghl_contact_role: ghlContactRole.trim(),
        portal_role: portalRole.trim(),
        portal_version: portalVersion?.trim() || "",
        default_permissions: defaultPermissions?.trim() || "",
        requires_mfa: requiresMFA || false,
        status: status || "active",
        description: description?.trim() || "",
        created_by: user.id,
      })
      .select()
      .single();

    if (mappingError) {
      console.error("Error creating mapping:", mappingError);
      return NextResponse.json({ error: "Failed to create mapping" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "GHL_MAPPING_CREATED",
      entity_type: "ghl_role_mapping",
      entity_id: mapping.id,
      details: {
        ghl_contact_role: ghlContactRole,
        portal_role: portalRole,
      },
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error("Error in POST /api/admin/ghl-role-mappings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
