import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/admin/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Prevent deleting yourself
    if (id === authUser.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    // Get user info for audit log before deletion
    const { data: contact } = await supabase
      .from("contacts")
      .select("email, first_name, last_name")
      .eq("user_id", id)
      .single();

    // Delete from user_roles first (cleanup)
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", id);

    // Delete from portal_users
    await supabase
      .from("portal_users")
      .delete()
      .eq("id", id);

    // Delete from contacts
    const { error: contactError } = await supabase
      .from("contacts")
      .delete()
      .eq("user_id", id);

    if (contactError) {
      console.error("Error deleting contact:", contactError);
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }

    // Optionally delete from auth.users (requires admin privileges)
    // This is commented out as it requires service role key
    // const { error: authError } = await supabase.auth.admin.deleteUser(id);

    // Create audit log entry
    await supabase.from("platform_audit_events").insert({
      event_type: "USER_DELETED",
      entity_type: "user",
      entity_id: id,
      details: {
        email: contact?.email,
        name: contact ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() : null,
        deleted_by: authUser.id,
      },
      created_by: authUser.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/users/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/admin/users/[id] - Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get contact with user details
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select(`
        *,
        user_roles!inner(role_id, roles(name))
      `)
      .eq("user_id", id)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/users/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
