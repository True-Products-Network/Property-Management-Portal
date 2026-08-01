// Contact Roles API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");
    const associationId = searchParams.get("associationId");

    const supabase = await createClient();

    let query = supabase
      .from("contact_roles")
      .select("*")
      .eq("is_active", true);

    if (contactId) {
      query = query.eq("contact_id", contactId);
    }

    if (associationId) {
      query = query.eq("association_id", associationId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // Map to camelCase
    const mappedData = (data || []).map((role: any) => ({
      id: role.id,
      contactId: role.contact_id,
      roleType: role.role_type,
      associationId: role.association_id,
      propertyId: role.property_id,
      unitId: role.unit_id,
      isPrimary: role.is_primary,
      isActive: role.is_active,
      createdAt: role.created_at,
      updatedAt: role.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        data: mappedData,
        total: mappedData.length,
      },
    });
  } catch (error) {
    console.error("Error fetching contact roles:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
