// Admin Dropdown Settings API Routes
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDropdownSettingsGrouped,
  createDropdownSetting,
} from "@/lib/api/dropdowns";
import { z } from "zod";

const createSchema = z.object({
  recordType: z.string().min(1),
  fieldName: z.string().min(1),
  value: z.string().min(1),
  label: z.string().min(1),
  sortOrder: z.number().optional(),
  isDefault: z.boolean().optional(),
});

// GET /api/admin/dropdowns - Get all dropdowns grouped
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin from JWT metadata (avoids RLS recursion)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Debug: Log user metadata
    console.log("User metadata:", JSON.stringify(user.user_metadata));

    // Check admin status from user metadata (set during login/token creation)
    const roles = user.user_metadata?.roles;
    const hasAdminRole = Array.isArray(roles) && roles.includes("ADMIN_USER");
    const isAdmin = user.user_metadata?.is_admin === true || hasAdminRole;

    console.log("Is admin check:", isAdmin, "is_admin:", user.user_metadata?.is_admin, "roles:", roles, "hasAdminRole:", hasAdminRole);

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const result = await getDropdownSettingsGrouped();

    console.log("Dropdown settings result:", result.success, "data keys:", result.data ? Object.keys(result.data) : 'no data');

    if (!result.success) {
      console.error("Dropdown settings error:", result.error);
      return NextResponse.json(
        { success: false, error: result.error || "Database query failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/admin/dropdowns:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/dropdowns - Create new dropdown value
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin from JWT metadata (avoids RLS recursion)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status from user metadata
    const roles = user.user_metadata?.roles;
    const hasAdminRole = Array.isArray(roles) && roles.includes("ADMIN_USER");
    const isAdmin = user.user_metadata?.is_admin === true || hasAdminRole;

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = createSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await createDropdownSetting(validation.data, user.id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/admin/dropdowns:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
