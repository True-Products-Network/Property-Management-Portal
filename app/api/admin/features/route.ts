// Admin Feature Flags Management API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_FEATURE_FLAGS } from "@/lib/features/feature-flags";

// Helper function to check if user is admin
async function checkAdmin(supabase: any, userId: string) {
  const { data: contactData } = await supabase
    .from("contacts")
    .select("id")
    .eq("portal_user_id", userId)
    .single();

  const { data: adminRole } = await supabase
    .from("contact_roles")
    .select("id")
    .eq("contact_id", contactData?.id)
    .eq("role", "ADMIN_USER")
    .eq("is_active", true)
    .maybeSingle();

  return { isAdmin: !!adminRole, contactId: contactData?.id };
}

// GET - List all feature flags
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { isAdmin } = await checkAdmin(supabase, user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { data: flags, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: flags || [] });
  } catch (error) {
    console.error("Error fetching feature flags:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feature flags" },
      { status: 500 }
    );
  }
}

// POST - Create a new feature flag
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { isAdmin, contactId } = await checkAdmin(supabase, user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.key || !body.name) {
      return NextResponse.json(
        { success: false, error: "Key and name are required" },
        { status: 400 }
      );
    }

    // Check if key already exists
    const { data: existing } = await supabase
      .from("feature_flags")
      .select("id")
      .eq("key", body.key)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Feature flag with this key already exists" },
        { status: 400 }
      );
    }

    const { data: flag, error } = await supabase
      .from("feature_flags")
      .insert({
        key: body.key,
        name: body.name,
        description: body.description || "",
        enabled: body.enabled ?? false,
        environment: body.environment || "all",
        allowed_roles: body.allowedRoles || ["all"],
        user_percentage: body.userPercentage ?? 100,
        associations: body.associations || null,
        properties: body.properties || null,
        users: body.users || null,
        metadata: body.metadata || null,
        created_by: contactId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: flag });
  } catch (error) {
    console.error("Error creating feature flag:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create feature flag" },
      { status: 500 }
    );
  }
}

// PUT - Initialize default feature flags
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();
    const { isAdmin, contactId } = await checkAdmin(supabase, user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Check which default flags already exist
    const { data: existingFlags } = await supabase
      .from("feature_flags")
      .select("key")
      .in("key", DEFAULT_FEATURE_FLAGS.map(f => f.key));

    const existingKeys = new Set(existingFlags?.map(f => f.key) || []);

    // Insert only missing flags
    const flagsToInsert = DEFAULT_FEATURE_FLAGS
      .filter(f => !existingKeys.has(f.key))
      .map(f => ({
        ...f,
        allowed_roles: f.allowedRoles,
        user_percentage: f.userPercentage,
        created_by: contactId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    if (flagsToInsert.length > 0) {
      const { error } = await supabase
        .from("feature_flags")
        .insert(flagsToInsert);

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Initialized ${flagsToInsert.length} default feature flags`,
    });
  } catch (error) {
    console.error("Error initializing feature flags:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize feature flags" },
      { status: 500 }
    );
  }
}
