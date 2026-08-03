// Platform Admin Individual Feature Flag API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper function to check if user is platform admin
async function checkPlatformAdmin(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { isAdmin: false, user: null };
  }

  // Check for PLATFORM_ADMIN in user metadata
  const roles = user.user_metadata?.roles;
  if (Array.isArray(roles) && roles.includes("PLATFORM_ADMIN")) {
    return { isAdmin: true, user };
  }

  // Also check platform_user_roles table
  const { data: platformRole } = await supabase
    .from("platform_user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .single();

  if (platformRole?.role === "PLATFORM_ADMIN" || platformRole?.role === "PLATFORM_SUPPORT") {
    return { isAdmin: true, user };
  }

  return { isAdmin: false, user };
}

// GET - Get a single feature flag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flagId } = await params;
    const supabase = await createClient();

    const { isAdmin } = await checkPlatformAdmin(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Platform admin access required" },
        { status: 403 }
      );
    }

    const { data: flag, error } = await supabase
      .from("feature_flags")
      .select("*")
      .eq("id", flagId)
      .single();

    if (error || !flag) {
      return NextResponse.json(
        { success: false, error: "Feature flag not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: flag });
  } catch (error) {
    console.error("Error fetching feature flag:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feature flag" },
      { status: 500 }
    );
  }
}

// PUT - Update a feature flag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flagId } = await params;
    const supabase = await createClient();

    const { isAdmin } = await checkPlatformAdmin(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Platform admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.environment !== undefined) updates.environment = body.environment;
    if (body.allowedRoles !== undefined) updates.allowed_roles = body.allowedRoles;
    if (body.userPercentage !== undefined) updates.user_percentage = body.userPercentage;
    if (body.associations !== undefined) updates.associations = body.associations;
    if (body.properties !== undefined) updates.properties = body.properties;
    if (body.users !== undefined) updates.users = body.users;
    if (body.metadata !== undefined) updates.metadata = body.metadata;
    if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt;

    const { data: flag, error } = await supabase
      .from("feature_flags")
      .update(updates)
      .eq("id", flagId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data: flag });
  } catch (error) {
    console.error("Error updating feature flag:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update feature flag" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a feature flag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flagId } = await params;
    const supabase = await createClient();

    const { isAdmin } = await checkPlatformAdmin(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Platform admin access required" },
        { status: 403 }
      );
    }

    // Delete the feature flag
    const { error } = await supabase
      .from("feature_flags")
      .delete()
      .eq("id", flagId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting feature flag:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete feature flag" },
      { status: 500 }
    );
  }
}
