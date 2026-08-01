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

    const userRoles = user.user_metadata?.roles || [];
    if (!userRoles.includes("ADMIN_USER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all dropdown settings grouped by category
    const { data: settings, error } = await supabase
      .from("dropdown_settings")
      .select("*")
      .order("record_type")
      .order("sort_order");

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
