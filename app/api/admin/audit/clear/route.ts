// Clear Audit Logs API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
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

    // Delete all audit logs
    const { error } = await supabase
      .from("audit_logs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all (workaround for no filter)

    if (error) {
      console.error("Error clearing audit logs:", error);
      return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 });
    }

    // Log the clear action
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "AUDIT_LOGS_CLEARED",
      entity_type: "system",
      entity_id: "all",
      success: true,
      severity: "warning",
      details: { cleared_by: user.id },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "All audit logs cleared" });
  } catch (error) {
    console.error("Error in POST /api/admin/audit/clear:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
