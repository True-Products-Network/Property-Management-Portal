import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/settings - Get all app settings or filter by category
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build query
    let query = supabase.from("app_settings").select("*");
    
    if (category) {
      query = query.eq("category", category);
    }
    
    const { data, error } = await query.order("key");

    if (error) {
      console.error("Error fetching app settings:", error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in GET /api/admin/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/settings - Update a setting
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "Setting key is required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update setting
    const { data, error } = await supabase
      .from("app_settings")
      .update({ 
        value,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq("key", key)
      .select()
      .single();

    if (error) {
      console.error("Error updating app setting:", error);
      return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in PUT /api/admin/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/settings - Create a new setting (admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, value, description, category, is_encrypted } = body;

    if (!key) {
      return NextResponse.json({ error: "Setting key is required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Insert setting
    const { data, error } = await supabase
      .from("app_settings")
      .insert({
        key,
        value,
        description,
        category: category || "general",
        is_encrypted: is_encrypted || false,
        updated_by: user.id
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Setting with this key already exists" }, { status: 409 });
      }
      console.error("Error creating app setting:", error);
      return NextResponse.json({ error: "Failed to create setting" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in POST /api/admin/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
