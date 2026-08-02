import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/resident/dashboard - Get dashboard data for logged-in resident
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contactId = user.user_metadata?.contact_id;
    if (!contactId) {
      return NextResponse.json({ error: "Contact not found" }, { status: 400 });
    }

    // Get contact's units
    const { data: contactUnits, error: unitsError } = await supabase
      .from("contact_units")
      .select("unit_id")
      .eq("contact_id", contactId);

    if (unitsError) {
      console.error("Error fetching contact units:", unitsError);
      return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
    }

    const unitIds = contactUnits?.map((cu: { unit_id: string }) => cu.unit_id) || [];

    if (unitIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          unit: null,
          openMaintenanceRequests: 0,
          nextInspection: null,
          unreadNotices: 0,
          documentsRequiringAction: 0,
          recentRequests: [],
          recentMessages: [],
          announcements: [],
          upcomingAppointments: [],
        },
      });
    }

    // Get primary unit details
    const { data: unitData, error: unitError } = await supabase
      .from("units")
      .select(`
        id,
        unit_number,
        properties!inner(id, name, association_id),
        associations!inner(id, name)
      `)
      .in("id", unitIds)
      .limit(1)
      .single();

    if (unitError && unitError.code !== "PGRST116") {
      console.error("Error fetching unit:", unitError);
    }

    // Get open maintenance requests for user's units
    const { data: maintenanceRequests, error: maintError } = await supabase
      .from("maintenance_requests")
      .select("id, title, status, urgency, updated_at")
      .in("unit_id", unitIds)
      .not("status", "in", "(completed,closed,cancelled)")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (maintError) {
      console.error("Error fetching maintenance requests:", maintError);
    }

    // Get next upcoming inspection
    const { data: nextInspection, error: inspectError } = await supabase
      .from("inspections")
      .select("id, inspection_type, scheduled_date")
      .in("unit_id", unitIds)
      .gte("scheduled_date", new Date().toISOString())
      .order("scheduled_date", { ascending: true })
      .limit(1)
      .single();

    // Get unread notices/compliance matters
    const { count: unreadNotices, error: noticesError } = await supabase
      .from("compliance_matters")
      .select("id", { count: "exact" })
      .in("unit_id", unitIds)
      .eq("status", "open");

    if (noticesError) {
      console.error("Error fetching notices:", noticesError);
    }

    // Get documents requiring action
    const { count: documentsAction, error: docsError } = await supabase
      .from("documents")
      .select("id", { count: "exact" })
      .in("unit_id", unitIds)
      .eq("requires_acknowledgment", true)
      .eq("acknowledged", false);

    if (docsError) {
      console.error("Error fetching documents:", docsError);
    }

    // Get recent messages
    const { data: messages, error: msgError } = await supabase
      .from("communications")
      .select("id, subject, content, created_at, read_by")
      .in("unit_id", unitIds)
      .order("created_at", { ascending: false })
      .limit(3);

    if (msgError) {
      console.error("Error fetching messages:", msgError);
    }

    // Get association announcements
    const associationId = unitData?.properties?.association_id;
    const { data: announcements, error: annError } = await supabase
      .from("communications")
      .select("id, subject, content, created_at")
      .eq("association_id", associationId)
      .eq("communication_type", "announcement")
      .order("created_at", { ascending: false })
      .limit(3);

    if (annError) {
      console.error("Error fetching announcements:", annError);
    }

    // Get upcoming appointments
    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("id, title, start_time, appointment_type")
      .in("unit_id", unitIds)
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(3);

    if (apptError) {
      console.error("Error fetching appointments:", apptError);
    }

    const dashboardData = {
      unit: unitData
        ? {
            id: unitData.id,
            unitNumber: unitData.unit_number,
            propertyName: unitData.properties?.name || "",
            associationName: unitData.associations?.name || "",
          }
        : null,
      openMaintenanceRequests: maintenanceRequests?.length || 0,
      nextInspection: nextInspection
        ? {
            id: nextInspection.id,
            type: nextInspection.inspection_type,
            scheduledDate: nextInspection.scheduled_date,
          }
        : null,
      unreadNotices: unreadNotices || 0,
      documentsRequiringAction: documentsAction || 0,
      recentRequests:
        maintenanceRequests?.map((r) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          urgency: r.urgency,
          updatedAt: r.updated_at,
        })) || [],
      recentMessages:
        messages?.map((m) => ({
          id: m.id,
          subject: m.subject,
          preview: m.content?.substring(0, 100) + "..." || "",
          unread: !m.read_by?.includes(user.id),
          createdAt: m.created_at,
        })) || [],
      announcements:
        announcements?.map((a) => ({
          id: a.id,
          title: a.subject,
          content: a.content,
          date: a.created_at,
        })) || [],
      upcomingAppointments:
        appointments?.map((a) => ({
          id: a.id,
          title: a.title,
          startTime: a.start_time,
          type: a.appointment_type,
        })) || [],
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error in GET /api/resident/dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
