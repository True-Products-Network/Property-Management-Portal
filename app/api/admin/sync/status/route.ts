// Admin API: Get sync queue status
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { getQueueStats } from "@/lib/ghl/queue";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || !isAdmin(user.roles)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Get queue stats
    const stats = await getQueueStats();

    // Get recent sync log entries
    const { data: recentLogs, error: logsError } = await supabase
      .from("sync_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (logsError) {
      console.error("[Admin Sync] Error fetching logs:", logsError);
    }

    // Get failed jobs
    const { data: failedJobs, error: failedError } = await supabase
      .from("sync_jobs")
      .select("*")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(10);

    if (failedError) {
      console.error("[Admin Sync] Error fetching failed jobs:", failedError);
    }

    return NextResponse.json({
      queue: stats,
      recentActivity: recentLogs || [],
      failedJobs: failedJobs || [],
    });
  } catch (error) {
    console.error("[Admin Sync] Error getting status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
