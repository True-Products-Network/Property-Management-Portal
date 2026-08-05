import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/invitations/validate?token=xxx - Validate invitation token
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Get invitation with tenant info
    const { data: invitation, error } = await supabase
      .from("user_invitations")
      .select(`
        *,
        tenants:tenant_id (name)
      `)
      .eq("token", token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation" },
        { status: 404 }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check if already accepted
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Invitation has already been ${invitation.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        tenant_name: invitation.tenants?.name || "Associos Property Management",
        role: invitation.role,
        portal_role: invitation.portal_role,
        expires_at: invitation.expires_at,
      },
    });
  } catch (error) {
    console.error("Error validating invitation:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
