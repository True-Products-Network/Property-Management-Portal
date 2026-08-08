import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";

// PUT /api/admin/users/[id]/status - Update user status (active, suspended, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const context = extractAuditContext(request);
  
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      await auditLoggers.error(context, "USER_STATUS_UPDATE", "user", new Error("Unauthorized"), { path: request.nextUrl.pathname });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    context.userId = authUser.id;

    // Check if user is admin
    const { data: currentUser } = await supabase
      .from("portal_users")
      .select("is_admin")
      .eq("id", authUser.id)
      .maybeSingle();

    const { data: platformRole } = await supabase
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .is("revoked_at", null)
      .maybeSingle();

    const isAdmin = currentUser?.is_admin || platformRole?.role === "PLATFORM_ADMIN";

    if (!isAdmin) {
      await auditLoggers.securityEvent(context, "ADMIN_ACCESS_DENIED", "warning", { reason: "Admin access required", userId: authUser.id });
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { status } = body;

    if (!status) {
      await auditLoggers.error(context, "USER_STATUS_UPDATE", "user", new Error("Status is required"), { body });
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Map frontend status to database values
    // Common values: NOT_INVITED, PENDING, INVITED, ACTIVE, SUSPENDED, REVOKED
    const validStatuses = ['NOT_INVITED', 'PENDING', 'INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED', 'INACTIVE'];
    const upperStatus = status.toUpperCase();
    
    if (!validStatuses.includes(upperStatus)) {
      await auditLoggers.error(context, "USER_STATUS_UPDATE", "user", new Error(`Invalid status: ${status}`), { status, validStatuses });
      return NextResponse.json({ error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    // Try to update by portal_user_id first, then by contact id
    let contact = null;
    let contactError = null;

    // Get existing contact for before values
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id, portal_user_id, portal_invitation_status, email, first_name, last_name")
      .eq("portal_user_id", id)
      .maybeSingle();
    
    const beforeStatus = existingContact?.portal_invitation_status || "unknown";

    // Try portal_user_id
    const { data: contactByPortalId, error: errorByPortalId } = await supabase
      .from("contacts")
      .update({
        portal_invitation_status: upperStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("portal_user_id", id)
      .select()
      .maybeSingle();

    if (contactByPortalId) {
      contact = contactByPortalId;
    } else {
      // Try by contact id
      const { data: contactById, error: errorById } = await supabase
        .from("contacts")
        .update({
          portal_invitation_status: upperStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .maybeSingle();
      
      contact = contactById;
      contactError = errorById;
    }

    if (!contact) {
      console.error("Error updating contact status:", contactError);
      await auditLoggers.error(context, "USER_STATUS_UPDATE", "user", new Error("Contact not found"), { userId: id });
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Also update portal_users status if exists (only if we have a portal_user_id)
    if (contact.portal_user_id) {
      const { error: portalError } = await supabase
        .from("portal_users")
        .update({
          status: upperStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contact.portal_user_id);

      if (portalError) {
        console.error("Error updating portal user status:", portalError);
        // Don't fail if portal_users update fails, contact is the main record
      }
    }

    const duration = Date.now() - startTime;
    const contactName = contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : "unknown";
    
    // Create audit log entry
    await supabase.from("platform_audit_events").insert({
      event_type: "USER_STATUS_UPDATED",
      entity_type: "user",
      entity_id: id,
      details: {
        new_status: status,
        updated_by: authUser.id,
      },
      created_by: authUser.id,
    });

    await auditLoggers.update(context, "user", id, contactName || contact?.email || "unknown", { status: beforeStatus }, { status: upperStatus }, { durationMs: duration });

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("Error in PUT /api/admin/users/[id]/status:", error);
    await auditLoggers.error(context, "USER_STATUS_UPDATE", "user", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
