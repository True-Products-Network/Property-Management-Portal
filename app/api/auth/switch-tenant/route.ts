// Switch Tenant API
// POST /api/auth/switch-tenant - Switch active tenant for multi-tenant users

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { tenantId } = body;
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required" },
        { status: 400 }
      );
    }
    
    // Verify user belongs to this tenant
    const { data: tenantUser, error: verifyError } = await supabase
      .from("tenant_users")
      .select("tenant_id, role, tenants(name)")
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    
    if (verifyError || !tenantUser) {
      return NextResponse.json(
        { success: false, error: "You do not have access to this tenant" },
        { status: 403 }
      );
    }
    
    // Set active tenant cookie
    const cookieStore = await cookies();
    cookieStore.set("active_tenant_id", tenantId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    
    return NextResponse.json({
      success: true,
      data: {
        tenantId,
        tenantName: tenantUser.tenants?.name || "Unknown",
        role: tenantUser.role,
      },
    });
  } catch (error) {
    console.error("[Switch Tenant API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
