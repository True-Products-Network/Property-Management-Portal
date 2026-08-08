import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { auditLoggers, extractAuditContext } from "@/lib/audit/enhanced-logger";

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(
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
      await auditLoggers.error(context, "ADMIN_USER_DELETE", "user", new Error("Unauthorized"), { path: request.nextUrl.pathname });
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

    // Prevent deleting yourself
    if (id === authUser.id) {
      await auditLoggers.error(context, "ADMIN_USER_DELETE", "user", new Error("Cannot delete your own account"), { userId: id });
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Find the contact first (by portal_user_id or contact id)
    let contact = null;
    
    // Try by portal_user_id
    const { data: contactByPortalId } = await supabase
      .from("contacts")
      .select("id, portal_user_id, email, first_name, last_name")
      .eq("portal_user_id", id)
      .maybeSingle();
    
    if (contactByPortalId) {
      contact = contactByPortalId;
    } else {
      // Try by contact id
      const { data: contactById } = await supabase
        .from("contacts")
        .select("id, portal_user_id, email, first_name, last_name")
        .eq("id", id)
        .maybeSingle();
      
      contact = contactById;
    }

    if (!contact) {
      await auditLoggers.error(context, "ADMIN_USER_DELETE", "user", new Error("Contact not found"), { userId: id });
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const contactId = contact.id;
    const portalUserId = contact.portal_user_id;

    // Delete from user_roles first (cleanup)
    if (portalUserId) {
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", portalUserId);
    }

    // Delete from portal_users
    if (portalUserId) {
      await supabase
        .from("portal_users")
        .delete()
        .eq("id", portalUserId);
    }

    // Delete from contacts
    const { error: contactError } = await supabase
      .from("contacts")
      .delete()
      .eq("id", contactId);

    if (contactError) {
      console.error("Error deleting contact:", contactError);
      await auditLoggers.error(context, "ADMIN_USER_DELETE", "user", new Error("Failed to delete user"), { userId: id, error: contactError.message });
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }

    const duration = Date.now() - startTime;
    const contactName = contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : "unknown";
    
    // Create audit log entry
    await supabase.from("platform_audit_events").insert({
      event_type: "USER_DELETED",
      entity_type: "user",
      entity_id: id,
      details: {
        email: contact?.email,
        name: contactName,
        deleted_by: authUser.id,
      },
      created_by: authUser.id,
    });

    await auditLoggers.delete(context, "user", id, contactName || contact?.email || "unknown", { email: contact?.email, contactId: contact?.id }, { durationMs: duration });

    return NextResponse.json({ success: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("Error in DELETE /api/admin/users/[id]:", error);
    await auditLoggers.error(context, "ADMIN_USER_DELETE", "user", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/admin/users/[id] - Get single user details
export async function GET(
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
      await auditLoggers.error(context, "ADMIN_USER_VIEW", "user", new Error("Unauthorized"), { path: request.nextUrl.pathname });
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

    // Find contact by portal_user_id or contact id
    let contact = null;
    
    // Try by portal_user_id
    const { data: contactByPortalId } = await supabase
      .from("contacts")
      .select(`
        *,
        user_roles!inner(role_id, roles(name))
      `)
      .eq("portal_user_id", id)
      .maybeSingle();
    
    if (contactByPortalId) {
      contact = contactByPortalId;
    } else {
      // Try by contact id
      const { data: contactById } = await supabase
        .from("contacts")
        .select(`
          *,
          user_roles!inner(role_id, roles(name))
        `)
        .eq("id", id)
        .maybeSingle();
      
      contact = contactById;
    }

    if (!contact) {
      await auditLoggers.error(context, "ADMIN_USER_VIEW", "user", new Error("User not found"), { userId: id });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const duration = Date.now() - startTime;
    const contactName = contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : "unknown";
    await auditLoggers.view(context, "user", id, contactName || contact.email || "unknown", { durationMs: duration });

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("Error in GET /api/admin/users/[id]:", error);
    await auditLoggers.error(context, "ADMIN_USER_VIEW", "user", error instanceof Error ? error : new Error("Internal server error"), { durationMs: duration });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
