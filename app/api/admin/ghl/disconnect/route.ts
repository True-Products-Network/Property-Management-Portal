import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/ghl/disconnect - Disconnect association from GHL
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();

    if (!user || !isAdmin(user.roles)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { associationId } = body;

    if (!associationId) {
      return NextResponse.json(
        { error: "Association ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Delete credentials
    const { error: deleteError } = await supabase
      .from("association_ghl_credentials")
      .delete()
      .eq("association_id", associationId);

    if (deleteError) {
      console.error("Error deleting credentials:", deleteError);
      return NextResponse.json(
        { error: "Failed to disconnect" },
        { status: 500 }
      );
    }

    // Clear GHL IDs from association
    const { error: updateError } = await supabase
      .from("associations")
      .update({
        ghl_location_id: null,
        ghl_location_name: null,
        ghl_company_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", associationId);

    if (updateError) {
      console.error("Error updating association:", updateError);
    }

    return NextResponse.json({
      success: true,
      message: "Disconnected from GHL successfully",
    });
  } catch (error) {
    console.error("Error disconnecting from GHL:", error);
    return NextResponse.json(
      { error: "Failed to disconnect: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}
