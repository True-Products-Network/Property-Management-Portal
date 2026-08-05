import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/platform/settings?category=xxx - Get settings by category
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is platform admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase.from("app_settings").select("key, value");
    
    if (category) {
      // Filter by category prefix (e.g., "ghl_" for GHL settings)
      query = query.like("key", `${category}_%`);
    }

    const { data: settings, error } = await query;

    if (error) {
      console.error("Error fetching settings:", error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    // Convert to object format
    const settingsObj = (settings || []).reduce((acc: Record<string, string>, item: { key: string; value: string }) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      settings: settingsObj,
    });
  } catch (error) {
    console.error("Error in GET /api/platform/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/platform/settings - Save settings
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is platform admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    if (!isPlatformAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { category, settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Settings object is required" }, { status: 400 });
    }

    // Upsert each setting
    const upsertPromises = Object.entries(settings).map(async ([key, value]) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({
          key: key,
          value: value as string,
          category: category || "general",
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "key",
        });

      if (error) {
        console.error(`Error saving setting ${key}:`, error);
      }
    });

    await Promise.all(upsertPromises);

    // Create audit log
    await supabase.from("platform_audit_events").insert({
      event_type: "SETTINGS_UPDATED",
      entity_type: "settings",
      entity_id: category || "general",
      details: {
        category: category,
        keys: Object.keys(settings),
      },
      created_by: user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/platform/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
