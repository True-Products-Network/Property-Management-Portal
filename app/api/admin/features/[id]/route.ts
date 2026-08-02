// Admin Individual Feature Flag API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Helper function to check if user is admin from JWT metadata
async function checkAdmin(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { isAdmin: false, user: null };
  }

  // Check admin status from user metadata (set during login/token creation)
  const roles = user.user_metadata?.roles;
  const hasAdminRole = Array.isArray(roles) && roles.includes("ADMIN_USER");
  const isAdmin = user.user_metadata?.is_admin === true || hasAdminRole;

  return { isAdmin, user };
}

// GET - Get a single feature flag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: flagId } = await params;
    const supabase = await createClient();

    const { isAdmin } = await checkAdmin(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
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

    // Get overrides for this flag
    const { data: overrides } = await supabase
      .from("feature_flag_overrides")
      .select(`
        id,
        user_id,
        association_id,
        property_id,
        enabled,
        reason,
        created_by,
        created_at,
        expires_at
      `)
      .eq("feature_flag_id", flagId);

    return NextResponse.json({
      success: true,
      data: {
        ...flag,
        overrides: overrides || [],
      },
    });
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

    const { isAdmin } = await checkAdmin(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
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

    const { isAdmin } = await checkAdmin(supabase);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Delete related overrides first
    await supabase
      .from("feature_flag_overrides")
      .delete()
      .eq("feature_flag_id", flagId);

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
