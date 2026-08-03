// Admin API: Retry failed sync jobs
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { retryFailedJobs } from "@/lib/ghl/queue";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || !isAdmin(user.roles)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const retriedCount = await retryFailedJobs();

    return NextResponse.json({
      success: true,
      message: `Retried ${retriedCount} failed jobs`,
      retriedCount,
    });
  } catch (error) {
    console.error("[Admin Sync] Error retrying jobs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
