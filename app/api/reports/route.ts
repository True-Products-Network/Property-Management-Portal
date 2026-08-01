import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch counts for all entities
    const [
      associationsResult,
      propertiesResult,
      unitsResult,
      contactsResult,
      vendorsResult,
      maintenanceResult,
      inspectionsResult,
      documentsResult,
      complianceResult,
      approvalsResult,
      paymentsResult,
      appointmentsResult,
      communicationsResult,
    ] = await Promise.all([
      supabase.from("associations").select("id, status, type, created_at", { count: "exact" }),
      supabase.from("properties").select("id, status, type, total_units, created_at", { count: "exact" }),
      supabase.from("units").select("id, status, occupancy_status, created_at", { count: "exact" }),
      supabase.from("contacts").select("id, portal_invitation_status, created_at", { count: "exact" }),
      supabase.from("vendors").select("id, status, category, rating, created_at", { count: "exact" }),
      supabase.from("maintenance_requests").select("id, status, urgency, category, actual_cost, created_at", { count: "exact" }),
      supabase.from("inspections").select("id, status, inspection_type, rating, created_at", { count: "exact" }),
      supabase.from("documents").select("id, status, document_type, file_size, expiry_date, created_at", { count: "exact" }),
      supabase.from("compliance_matters").select("id, status, priority, category, fine_amount, created_at", { count: "exact" }),
      supabase.from("approval_requests").select("id, status, approval_type, requested_amount, approved_amount, created_at", { count: "exact" }),
      supabase.from("payment_records").select("id, status, payment_type, amount, created_at", { count: "exact" }),
      supabase.from("appointments").select("id, status, appointment_type, created_at", { count: "exact" }),
      supabase.from("communications").select("id, status, type, created_at", { count: "exact" }),
    ]);

    // Calculate statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const associations = associationsResult.data || [];
    const properties = propertiesResult.data || [];
    const units = unitsResult.data || [];
    const contacts = contactsResult.data || [];
    const vendors = vendorsResult.data || [];
    const maintenance = maintenanceResult.data || [];
    const inspections = inspectionsResult.data || [];
    const documents = documentsResult.data || [];
    const compliance = complianceResult.data || [];
    const approvals = approvalsResult.data || [];
    const payments = paymentsResult.data || [];
    const appointments = appointmentsResult.data || [];
    const communications = communicationsResult.data || [];

    // Generate report data
    const reportData = {
      summary: {
        totalAssociations: associations.length,
        totalProperties: properties.length,
        totalUnits: units.length,
        totalContacts: contacts.length,
        totalVendors: vendors.length,
        totalCommunications: communications.length,
        activeAssociations: associations.filter((a: { status: string }) => a.status === "active").length,
        activeProperties: properties.filter((p: { status: string }) => p.status === "active").length,
        occupiedUnits: units.filter((u: { occupancy_status?: string; status?: string }) => u.occupancy_status === "occupied" || u.status === "occupied").length,
        vacantUnits: units.filter((u: { occupancy_status?: string; status?: string }) => u.occupancy_status === "vacant" || u.status === "vacant").length,
      },
      communications: {
        total: communications.length,
        sent: communications.filter((c: { status: string }) => c.status === "sent").length,
        scheduled: communications.filter((c: { status: string }) => c.status === "scheduled").length,
        draft: communications.filter((c: { status: string }) => c.status === "draft").length,
      },
      maintenance: {
        total: maintenance.length,
        open: maintenance.filter((m: { status: string }) => m.status === "new" || m.status === "in_progress").length,
        completed: maintenance.filter((m: { status: string }) => m.status === "completed" || m.status === "closed").length,
        emergency: maintenance.filter((m: { urgency?: string; status: string }) => m.urgency === "emergency" && m.status !== "completed" && m.status !== "closed").length,
        byCategory: maintenance.reduce((acc: Record<string, number>, m: { category?: string }) => {
          acc[m.category || "uncategorized"] = (acc[m.category || "uncategorized"] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalCost: maintenance.reduce((sum: number, m: { actual_cost?: number }) => sum + (m.actual_cost || 0), 0),
      },
      inspections: {
        total: inspections.length,
        scheduled: inspections.filter((i: { status: string }) => i.status === "scheduled").length,
        completed: inspections.filter((i: { status: string }) => i.status === "completed").length,
        overdue: inspections.filter((i: { status: string }) => i.status === "overdue").length,
        averageRating: inspections.filter((i: { rating?: number }) => i.rating).length > 0
          ? inspections.reduce((sum: number, i: { rating?: number }) => sum + (i.rating || 0), 0) / inspections.filter((i: { rating?: number }) => i.rating).length
          : 0,
      },
      compliance: {
        total: compliance.length,
        open: compliance.filter((c: { status: string }) => c.status === "open" || c.status === "in_progress").length,
        critical: compliance.filter((c: { priority?: string; status: string }) => c.priority === "critical" && c.status !== "resolved").length,
        overdue: compliance.filter((c: { status: string }) => c.status !== "resolved" && c.status !== "closed").length,
        totalFines: compliance.reduce((sum: number, c: { fine_amount?: number }) => sum + (c.fine_amount || 0), 0),
      },
      approvals: {
        total: approvals.length,
        pending: approvals.filter((a: { status: string }) => a.status === "pending").length,
        approved: approvals.filter((a: { status: string }) => a.status === "approved").length,
        rejected: approvals.filter((a: { status: string }) => a.status === "rejected").length,
        totalRequested: approvals.reduce((sum: number, a: { requested_amount?: number }) => sum + (a.requested_amount || 0), 0),
        totalApproved: approvals.reduce((sum: number, a: { approved_amount?: number }) => sum + (a.approved_amount || 0), 0),
      },
      payments: {
        total: payments.length,
        completed: payments.filter((p: { status: string }) => p.status === "completed").length,
        pending: payments.filter((p: { status: string }) => p.status === "pending").length,
        failed: payments.filter((p: { status: string }) => p.status === "failed").length,
        totalCollected: payments.filter((p: { status: string }) => p.status === "completed").reduce((sum: number, p: { amount?: number }) => sum + (p.amount || 0), 0),
        pendingAmount: payments.filter((p: { status: string }) => p.status === "pending").reduce((sum: number, p: { amount?: number }) => sum + (p.amount || 0), 0),
      },
      documents: {
        total: documents.length,
        active: documents.filter((d: { status: string }) => d.status === "active").length,
        expired: documents.filter((d: { status: string }) => d.status === "expired").length,
        expiringSoon: documents.filter((d: { expiry_date?: string }) => {
          if (!d.expiry_date) return false;
          const expiry = new Date(d.expiry_date);
          return expiry > now && expiry <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }).length,
        totalStorage: documents.reduce((sum: number, d: { file_size?: number }) => sum + (d.file_size || 0), 0),
      },
      activity: {
        newThisWeek: {
          associations: associations.filter((a: { created_at: string }) => new Date(a.created_at) >= sevenDaysAgo).length,
          properties: properties.filter((p: { created_at: string }) => new Date(p.created_at) >= sevenDaysAgo).length,
          units: units.filter((u: { created_at: string }) => new Date(u.created_at) >= sevenDaysAgo).length,
          contacts: contacts.filter((c: { created_at: string }) => new Date(c.created_at) >= sevenDaysAgo).length,
          maintenance: maintenance.filter((m: { created_at: string }) => new Date(m.created_at) >= sevenDaysAgo).length,
        },
        newThisMonth: {
          associations: associations.filter((a: { created_at: string }) => new Date(a.created_at) >= thirtyDaysAgo).length,
          properties: properties.filter((p: { created_at: string }) => new Date(p.created_at) >= thirtyDaysAgo).length,
          units: units.filter((u: { created_at: string }) => new Date(u.created_at) >= thirtyDaysAgo).length,
          contacts: contacts.filter((c: { created_at: string }) => new Date(c.created_at) >= thirtyDaysAgo).length,
          maintenance: maintenance.filter((m: { created_at: string }) => new Date(m.created_at) >= thirtyDaysAgo).length,
        },
      },
      generatedAt: now.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
