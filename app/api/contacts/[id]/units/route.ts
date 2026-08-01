// Contact Units API Route
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const supabase = await createClient();
    
    // Fetch contact_unit_relationships with joined data
    const { data, error } = await supabase
      .from("contact_unit_relationships")
      .select(`
        id,
        role,
        is_primary_contact,
        unit:unit_id (
          id,
          unit_number,
          property:property_id (
            id,
            name,
            association:association_id (
              id,
              name
            )
          )
        )
      `)
      .eq("contact_id", id);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // Transform the data to a flatter structure
    const units = (data || []).map((item: any) => ({
      id: item.unit?.id,
      unitNumber: item.unit?.unit_number,
      propertyId: item.unit?.property?.id,
      propertyName: item.unit?.property?.name,
      associationId: item.unit?.property?.association?.id,
      associationName: item.unit?.property?.association?.name,
      role: item.role,
      isPrimaryContact: item.is_primary_contact,
    })).filter((u: any) => u.id); // Filter out any null units
    
    return NextResponse.json({ success: true, data: units });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
