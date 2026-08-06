import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/admin/categories/[categoryId]/values/[valueId] - Update value
export async function PUT(
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
    const { label, sortOrder, isActive } = body;

    // Get current value for audit
    const { data: currentValue } = await supabase
      .from("dropdown_settings")
      .select("*")
      .eq("id", valueId)
      .single();

    // Update value
    const { data: updatedValue, error } = await supabase
      .from("dropdown_settings")
      .update({
        label: label?.trim(),
        sort_order: sortOrder,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", valueId)
      .select()
      .single();

    if (error) {
      console.error("Error updating value:", error);
      return NextResponse.json({ error: "Failed to update value" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "CATEGORY_VALUE_UPDATED",
      entity_type: "dropdown_setting",
      entity_id: valueId,
      details: {
        category: categoryId,
        changes: {
          before: currentValue,
          after: updatedValue,
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedValue });
  } catch (error) {
    console.error("Error in PUT /api/admin/categories/[categoryId]/values/[valueId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/categories/[categoryId]/values/[valueId] - Delete value
export async function DELETE(
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

    // Get value details for audit
    const { data: value } = await supabase
      .from("dropdown_settings")
      .select("value, label")
      .eq("id", valueId)
      .single();

    // Delete value
    const { error } = await supabase
      .from("dropdown_settings")
      .delete()
      .eq("id", valueId);

    if (error) {
      console.error("Error deleting value:", error);
      return NextResponse.json({ error: "Failed to delete value" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "CATEGORY_VALUE_DELETED",
      entity_type: "dropdown_setting",
      entity_id: valueId,
      details: {
        category: categoryId,
        value: value?.value,
        label: value?.label,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/categories/[categoryId]/values/[valueId]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
