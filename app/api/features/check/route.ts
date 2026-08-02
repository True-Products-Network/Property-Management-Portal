// Feature Flag Check API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled, FeatureFlagUserRole } from "@/lib/features/feature-flags";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const featureKey = searchParams.get("key");

    if (!featureKey) {
      return NextResponse.json(
        { success: false, error: "Feature key is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user's role and association info
    const { data: contactData } = await supabase
      .from("contacts")
      .select("id, portal_user_id, roles")
      .eq("portal_user_id", user.id)
      .single();

    const userRole = (contactData?.roles?.[0] || "owner") as FeatureFlagUserRole;
    const userId = contactData?.id || user.id;

    // Get user's association/property info
    const { data: contactRoles } = await supabase
      .from("contact_roles")
      .select("association_id, property_id")
      .eq("contact_id", userId)
      .eq("is_active", true)
      .limit(1)
      .single();

    // Fetch the feature flag
    const { data: flag, error } = await supabase
      .from("feature_flags")
      .select("*")
      .eq("key", featureKey)
      .single();

    if (error || !flag) {
      // Feature flag not found - default to disabled
      return NextResponse.json({ success: true, enabled: false });
    }

    // Check for user-specific override
    const { data: override } = await supabase
      .from("feature_flag_overrides")
      .select("enabled")
      .eq("feature_flag_id", flag.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (override) {
      return NextResponse.json({ success: true, enabled: override.enabled });
    }

    // Check if feature is enabled for this user
    const environment = process.env.NODE_ENV === "production" ? "production" : "development";
    const enabled = isFeatureEnabled(
      flag,
      userId,
      userRole,
      environment,
      contactRoles?.association_id,
      contactRoles?.property_id
    );

    return NextResponse.json({ success: true, enabled });
  } catch (error) {
    console.error("Error checking feature flag:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check feature flag" },
      { status: 500 }
    );
  }
}
