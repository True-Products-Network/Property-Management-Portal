import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/audit - List audit events
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");
    const action = searchParams.get("action");
    const severity = searchParams.get("severity");
    const success = searchParams.get("success");
    const entityType = searchParams.get("entityType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build query
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (action) {
      query = query.eq("action", action);
    }

    if (severity) {
      query = query.eq("severity", severity);
    }

    if (success !== null && success !== undefined) {
      query = query.eq("success", success === "true");
    }

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error("Error fetching audit events:", error);
      return NextResponse.json({ error: "Failed to fetch audit events" }, { status: 500 });
    }

    // Enrich events with user names
    const userIds = [...new Set((events || []).map((e: { user_id: string }) => e.user_id).filter(Boolean))];
    
    let userMap: Record<string, { name: string; email: string }> = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("contacts")
        .select("id, first_name, last_name, email")
        .in("id", userIds);

      userMap = (users || []).reduce((acc: Record<string, { name: string; email: string }>, u: { id: string; first_name: string; last_name: string; email: string }) => {
        acc[u.id] = {
          name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Unknown",
          email: u.email || "-",
        };
        return acc;
      }, {});
    }

    const enrichedEvents = (events || []).map((event: any) => ({
      ...event,
      userName: userMap[event.user_id]?.name || (event.user_id === "system" ? "System" : "Unknown"),
      userEmail: userMap[event.user_id]?.email || "-",
      entityName: event.entity_name || event.details?.entity_name || `${event.entity_type} ${event.entity_id?.slice(0, 8)}`,
      timestamp: event.created_at,
      ipAddress: event.ip_address,
      userAgent: event.user_agent,
      severity: event.severity || "info",
      statusLabel: event.success === true ? "Success" : event.success === false ? "Failed" : "Unknown",
    }));

    return NextResponse.json({ success: true, data: enrichedEvents });
  } catch (error) {
    console.error("Error in GET /api/admin/audit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
