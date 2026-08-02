// Feature Flag Batch Check API
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isFeatureEnabled, FeatureFlagUserRole, FeatureFlag } from "@/lib/features/feature-flags";

interface Override {
  feature_flag_id: string;
  enabled: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { keys } = body;

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { success: false, error: "Feature keys array is required" },
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

    // Fetch all feature flags
    const { data: flags, error } = await supabase
      .from("feature_flags")
      .select("*")
      .in("key", keys);

    if (error) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch feature flags" },
        { status: 500 }
      );
    }

    // Fetch user-specific overrides
    const flagIds = flags?.map((f: FeatureFlag) => f.id) || [];
    const { data: overrides } = flagIds.length > 0
      ? await supabase
          .from("feature_flag_overrides")
          .select("feature_flag_id, enabled")
          .eq("user_id", userId)
          .in("feature_flag_id", flagIds)
      : { data: [] };

    const overrideMap = new Map<string, boolean>(
      overrides?.map((o: Override) => [o.feature_flag_id, o.enabled]) || []
    );

    // Check each feature
    const environment = process.env.NODE_ENV === "production" ? "production" : "development";
    const features: Record<string, boolean> = {};

    for (const key of keys) {
      const flag = flags?.find((f: FeatureFlag) => f.key === key);

      if (!flag) {
        features[key] = false;
        continue;
      }

      // Check for override
      if (overrideMap.has(flag.id)) {
        features[key] = overrideMap.get(flag.id)!;
        continue;
      }

      // Check if feature is enabled
      features[key] = isFeatureEnabled(
        flag,
        userId,
        userRole,
        environment,
        contactRoles?.association_id,
        contactRoles?.property_id
      );
    }

    return NextResponse.json({ success: true, features });
  } catch (error) {
    console.error("Error checking feature flags:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check feature flags" },
      { status: 500 }
    );
  }
}
