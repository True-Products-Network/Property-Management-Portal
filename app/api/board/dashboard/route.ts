// Board Dashboard API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get user's contact ID and association
    const { data: contactData } = await supabase
      .from("contacts")
      .select("id, association_id")
      .eq("portal_user_id", user.id)
      .single();

    if (!contactData) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    const contactId = contactData.id;
    const associationId = contactData.association_id;

    // Fetch counts in parallel
    const [
      pendingApprovalsResult,
      urgentMaintenanceResult,
      overdueMaintenanceResult,
      upcomingInspectionsResult,
      openComplianceResult,
      documentsRequiringActionResult,
      upcomingMeetingsResult,
      recentActivityResult,
      announcementsResult,
    ] = await Promise.all([
      // Pending approvals
      supabase
        .from("approval_requests")
        .select("id", { count: "exact" })
        .eq("status", "pending")
        .eq("association_id", associationId),

      // Urgent maintenance
      supabase
        .from("maintenance_requests")
        .select("id", { count: "exact" })
        .in("urgency", ["high", "emergency"])
        .eq("association_id", associationId)
        .not("status", "in", "(completed,cancelled)"),

      // Overdue maintenance
      supabase
        .from("maintenance_requests")
        .select("id", { count: "exact" })
        .lt("scheduled_date", new Date().toISOString())
        .eq("association_id", associationId)
        .not("status", "in", "(completed,cancelled)"),

      // Upcoming inspections
      supabase
        .from("inspections")
        .select("id", { count: "exact" })
        .gte("scheduled_date", new Date().toISOString())
        .lte("scheduled_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
        .eq("association_id", associationId),

      // Open compliance matters
      supabase
        .from("compliance_matters")
        .select("id", { count: "exact" })
        .not("status", "in", "(resolved,closed)")
        .eq("association_id", associationId),

      // Documents requiring action
      supabase
        .from("documents")
        .select("id", { count: "exact" })
        .eq("requires_acknowledgment", true)
        .eq("association_id", associationId),

      // Upcoming meetings
      supabase
        .from("meetings")
        .select("id", { count: "exact" })
        .gte("scheduled_date", new Date().toISOString())
        .eq("association_id", associationId),

      // Recent activity (last 10)
      supabase
        .from("audit_logs")
        .select("id, action, description, created_at, created_by")
        .eq("association_id", associationId)
        .order("created_at", { ascending: false })
        .limit(10),

      // Recent announcements
      supabase
        .from("communications")
        .select("id, subject, created_at")
        .eq("communication_type", "announcement")
        .eq("association_id", associationId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const dashboardData = {
      pendingApprovals: pendingApprovalsResult.count || 0,
      urgentMaintenance: urgentMaintenanceResult.count || 0,
      overdueMaintenance: overdueMaintenanceResult.count || 0,
      upcomingInspections: upcomingInspectionsResult.count || 0,
      openCompliance: openComplianceResult.count || 0,
      documentsRequiringAction: documentsRequiringActionResult.count || 0,
      upcomingMeetings: upcomingMeetingsResult.count || 0,
      recentActivity: recentActivityResult.data?.map((item: any) => ({
        id: item.id,
        type: item.action,
        description: item.description,
        timestamp: item.created_at,
        user: item.created_by,
      })) || [],
      announcements: announcementsResult.data?.map((item: any) => ({
        id: item.id,
        title: item.subject,
        date: item.created_at,
        isNew: new Date(item.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })) || [],
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error("Error fetching board dashboard:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
