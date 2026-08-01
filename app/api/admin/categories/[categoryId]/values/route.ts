import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/categories/[categoryId]/values - Create new value
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
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
    const { value, label, description, sortOrder, isActive } = body;

    if (!value?.trim() || !label?.trim()) {
      return NextResponse.json(
        { error: "Value and Label are required" },
        { status: 400 }
      );
    }

    // Check for duplicate value in this category
    const { data: existing } = await supabase
      .from("dropdown_settings")
      .select("id")
      .eq("record_type", categoryId)
      .eq("value", value.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A value with this code already exists in this category" },
        { status: 400 }
      );
    }

    // Insert new value
    const { data: newValue, error } = await supabase
      .from("dropdown_settings")
      .insert({
        record_type: categoryId,
        value: value.trim(),
        label: label.trim(),
        description: description?.trim(),
        sort_order: sortOrder || 0,
        is_active: isActive !== false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating value:", error);
      return NextResponse.json({ error: "Failed to create value" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "CATEGORY_VALUE_CREATED",
      entity_type: "dropdown_setting",
      entity_id: newValue.id,
      details: {
        category: categoryId,
        value: value,
        label: label,
      },
    });

    return NextResponse.json({ success: true, data: newValue });
  } catch (error) {
    console.error("Error in POST /api/admin/categories/[categoryId]/values:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
