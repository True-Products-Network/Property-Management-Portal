import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/categories/[categoryId]/values/[valueId]/retire - Retire value with replacement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string; valueId: string }> }
) {
  try {
    const { categoryId, valueId } = await params;
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = user.user_metadata?.roles || [];
    if (!userRoles.includes("ADMIN_USER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { replacementValue } = body;

    if (!replacementValue) {
      return NextResponse.json(
        { error: "Replacement value is required" },
        { status: 400 }
      );
    }

    // Get the value being retired
    const { data: retiringValue } = await supabase
      .from("dropdown_settings")
      .select("value, label")
      .eq("id", valueId)
      .single();

    // Get the replacement value details
    const { data: replacement } = await supabase
      .from("dropdown_settings")
      .select("value, label")
      .eq("id", replacementValue)
      .single();

    if (!replacement) {
      return NextResponse.json(
        { error: "Replacement value not found" },
        { status: 404 }
      );
    }

    // TODO: Update all records that use the retiring value to use the replacement
    // This would need to be done based on which entities use this category
    // For now, we'll just mark the value as inactive

    // Mark the old value as inactive
    const { error: updateError } = await supabase
      .from("dropdown_settings")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", valueId);

    if (updateError) {
      console.error("Error retiring value:", updateError);
      return NextResponse.json({ error: "Failed to retire value" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "CATEGORY_VALUE_RETIRED",
      entity_type: "dropdown_setting",
      entity_id: valueId,
      details: {
        category: categoryId,
        retired_value: retiringValue?.value,
        retired_label: retiringValue?.label,
        replacement_value: replacement.value,
        replacement_label: replacement.label,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Value retired successfully",
    });
  } catch (error) {
    console.error("Error in POST /api/admin/categories/[categoryId]/values/[valueId]/retire:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
