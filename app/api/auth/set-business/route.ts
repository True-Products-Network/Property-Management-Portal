import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();
    console.log(`[set-business] Looking up business: ${businessId}`);
    console.log(`[set-business] User tenants:`, user.tenants);
    
    const { data: business, error } = await supabase
      .from("businesses")
      .select("id, slug")
      .eq("id", businessId)
      .single();

    console.log(`[set-business] Business lookup result:`, { business, error });

    if (error || !business) {
      console.log(`[set-business] Business not found, returning 404`);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Check if user belongs to this business's tenant
    const userTenantIds = user.tenants?.map(t => t.id) || [];
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
