// Admin Dropdown Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  updateDropdownSetting,
  deleteDropdownSetting,
} from "@/lib/api/dropdowns";
import { z } from "zod";

const updateSchema = z.object({
  value: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  sortOrder: z.number().optional(),
  isDefault: z.boolean().optional(),
});

// Helper function to check admin status
async function checkAdmin(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { isAdmin: false, userId: null, error: "Unauthorized" };
  }

  const { data: portalUser, error: userError } = await supabase
    .from("portal_users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (userError || !portalUser?.is_admin) {
    return { isAdmin: false, userId: null, error: "Forbidden" };
  }

  return { isAdmin: true, userId: user.id, error: null };
}

// PUT /api/admin/dropdowns/[id] - Update dropdown value
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { isAdmin: adminCheck, userId, error } = await checkAdmin(supabase);

    if (!adminCheck) {
      return NextResponse.json({ success: false, error }, { status: error === "Unauthorized" ? 401 : 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await updateDropdownSetting(id, validation.data, userId!);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PUT /api/admin/dropdowns/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/dropdowns/[id] - Delete dropdown value
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { isAdmin: adminCheck, error } = await checkAdmin(supabase);

    if (!adminCheck) {
      return NextResponse.json({ success: false, error }, { status: error === "Unauthorized" ? 401 : 403 });
    }

    const { id } = await params;
    const result = await deleteDropdownSetting(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in DELETE /api/admin/dropdowns/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
