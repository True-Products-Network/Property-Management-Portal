import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import { cookies } from "next/headers";

// POST /api/auth/set-business - Set the active business for the user
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 });
    }

    // Verify the user has access to this business
    // Use service client to bypass RLS since we've already authenticated the user
    const supabase = createServiceClient();
    
    const { data: business, error } = await supabase
      .from("businesses")
      .select("id, slug")
      .eq("id", businessId)
      .single();

    if (error || !business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Check if user belongs to this business's tenant
    // Get user's tenants from tenant_users table
    const { data: userTenants } = await supabase
      .from("tenant_users")
      .select("tenant_id")
      .eq("user_id", user.id);
    
    const userTenantIds = userTenants?.map(t => t.tenant_id) || [];
    
    // Also check contacts table
    const { data: contactTenants } = await supabase
      .from("contacts")
      .select("tenant_id")
      .eq("portal_user_id", user.id)
      .not("tenant_id", "is", null);
    
    contactTenants?.forEach(ct => {
      if (ct.tenant_id && !userTenantIds.includes(ct.tenant_id)) {
        userTenantIds.push(ct.tenant_id);
      }
    });
    
    console.log("[set-business] business.slug:", business.slug, "userTenantIds:", userTenantIds);
    
    if (!userTenantIds.includes(business.slug)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Set cookie for active business
    const cookieStore = await cookies();
    cookieStore.set("active_business_id", businessId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      businessId,
    });
  } catch (error) {
    console.error("Error setting active business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
