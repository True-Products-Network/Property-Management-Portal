import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Public Settings API
 * Returns non-sensitive settings needed by the frontend
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build query - only return non-sensitive settings
    let query = supabase
      .from("app_settings")
      .select("key, value, description, category")
      .eq("is_encrypted", false);
    
    if (category) {
      query = query.eq("category", category);
    }
    
    // Only allow specific keys for public access
    const allowedKeys = [
      "calendar_provider",
      "enable_calendar_integration",
      "ghl_inspection_calendar_url",
    ];
    
    query = query.in("key", allowedKeys);
    
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching public settings:", error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    // Convert to key-value object for easier consumption
    const settings: Record<string, string> = {};
    data?.forEach((setting: { key: string; value: string }) => {
      settings[setting.key] = setting.value;
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error in GET /api/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
