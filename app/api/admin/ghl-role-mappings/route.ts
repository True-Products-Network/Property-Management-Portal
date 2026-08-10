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

    // Check if user is platform admin
    let isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    if (!isPlatformAdmin) {
      const { data: platformRole } = await supabase
        .from("platform_user_roles")
        .select("role")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (platformRole?.role === "PLATFORM_ADMIN") {
        isPlatformAdmin = true;
      }
    }

    const userRoles = user.user_metadata?.roles || [];
    const isAdmin = userRoles.includes("ADMIN_USER") || isPlatformAdmin;
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user's tenant for business isolation
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .maybeSingle();
    
    const isTenantAdmin = tenantUser?.role === 'admin';
    const tenantId = tenantUser?.tenant_id;

    if (!isPlatformAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Fetch mappings from database - FILTERED BY TENANT
    let mappingsQuery = supabase
      .from("ghl_role_mappings")
      .select("*")
      .order("ghl_contact_role");
    
    // Filter by tenant_id if not platform admin
    if (!isPlatformAdmin && tenantId) {
      mappingsQuery = mappingsQuery.eq("tenant_id", tenantId);
    }

    const { data: mappings, error } = await mappingsQuery;

    if (error) {
      console.error("Error fetching mappings:", error);
      return NextResponse.json({ error: "Failed to fetch mappings" }, { status: 500 });
    }

    // Get user counts for each mapping - FILTERED BY TENANT
    let userCountsQuery = supabase
      .from("contacts")
      .select("contact_role, tenant_id")
      .not("contact_role", "is", null);
    
    if (tenantId) {
      userCountsQuery = userCountsQuery.eq("tenant_id", tenantId);
    }
    
    const { data: userCounts, error: countError } = await userCountsQuery;

    if (!countError && userCounts) {
      const counts: Record<string, number> = {};
      userCounts.forEach((u: { contact_role: string }) => {
        const role = u.contact_role;
        counts[role] = (counts[role] || 0) + 1;
      });

      mappings?.forEach((m: { ghl_contact_role: string; user_count: number }) => {
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

    // Check if user is platform admin
    let isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    if (!isPlatformAdmin) {
      const { data: platformRole } = await supabase
        .from("platform_user_roles")
        .select("role")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (platformRole?.role === "PLATFORM_ADMIN") {
        isPlatformAdmin = true;
      }
    }

    const userRoles = user.user_metadata?.roles || [];
    const isAdmin = userRoles.includes("ADMIN_USER") || isPlatformAdmin;
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user's tenant for business isolation
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .maybeSingle();
    
    const isTenantAdmin = tenantUser?.role === 'admin';
    const tenantId = tenantUser?.tenant_id;

    if (!isPlatformAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { ghlContactRole, portalRole, portalVersion, defaultPermissions, requiresMFA, status, description } = body;

    if (!ghlContactRole?.trim() || !portalRole?.trim()) {
      return NextResponse.json(
        { error: "GHL Contact Role and Portal Role are required" },
        { status: 400 }
      );
    }

    // Check for duplicate - scoped to tenant
    let existingQuery = supabase
      .from("ghl_role_mappings")
      .select("id")
      .eq("ghl_contact_role", ghlContactRole.trim());
    
    if (tenantId) {
      existingQuery = existingQuery.eq("tenant_id", tenantId);
    }
    
    const { data: existing } = await existingQuery.single();

    if (existing) {
      return NextResponse.json(
        { error: "A mapping for this GHL Contact Role already exists" },
        { status: 400 }
      );
    }

    // Insert mapping with tenant_id
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
        tenant_id: tenantId,
        created_by: user.id,
      })
      .select()
      .single();

    if (mappingError) {
      console.error("Error creating mapping:", mappingError);
      return NextResponse.json({ error: "Failed to create mapping" }, { status: 500 });
    }

    // Create audit log entry with tenant_id
    await supabase.from("audit_logs").insert({
      tenant_id: tenantId,
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
