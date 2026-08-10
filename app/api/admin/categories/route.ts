import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/categories - List all categories with their values
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

    // Fetch dropdown settings grouped by category - FILTERED BY TENANT
    let settingsQuery = supabase
      .from("dropdown_settings")
      .select("*")
      .order("record_type")
      .order("sort_order");
    
    // Filter by tenant_id if not platform admin
    if (!isPlatformAdmin && tenantId) {
      settingsQuery = settingsQuery.eq("tenant_id", tenantId);
    }

    const { data: settings, error } = await settingsQuery;

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
    }

    // Group by record_type
    const categoriesMap = new Map();
    
    for (const setting of settings || []) {
      if (!categoriesMap.has(setting.record_type)) {
        categoriesMap.set(setting.record_type, {
          id: setting.record_type,
          values: [],
        });
      }
      
      categoriesMap.get(setting.record_type).values.push({
        id: setting.id,
        value: setting.value,
        label: setting.label,
        description: setting.description,
        sortOrder: setting.sort_order || 0,
        isActive: setting.is_active !== false,
        recordCount: 0,
        field_name: setting.field_name,
      });
    }

    return NextResponse.json({
      success: true,
      data: Array.from(categoriesMap.values()),
    });
  } catch (error) {
    console.error("Error in GET /api/admin/categories:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
