// Audit Stats API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    // Get total count
    const { count: totalLogs, error: countError } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting audit logs:", countError);
    }

    // Estimate storage size (rough approximation: ~2KB per log entry)
    const estimatedSizeBytes = (totalLogs || 0) * 2048;
    const storageSize = formatBytes(estimatedSizeBytes);

    return NextResponse.json({
      success: true,
      data: {
        totalLogs: totalLogs || 0,
        storageSize,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/audit/stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
