import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";

// GET /api/businesses - Get all businesses for the current tenant
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all tenant IDs for the user
    const tenantIds = user.tenants?.map(t => t.id) || [];
    
    if (tenantIds.length === 0) {
      return NextResponse.json({ error: "No tenants found" }, { status: 400 });
    }

    const serviceClient = createServiceClient();

    // Get businesses for ALL of the user's tenants (slug field stores the tenant_id)
    const { data: businesses, error } = await serviceClient
      .from("businesses")
      .select("*")
      .in("slug", tenantIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching businesses:", error);
      return NextResponse.json(
        { error: "Failed to fetch businesses" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: businesses || [],
    });
  } catch (error) {
    console.error("Error in GET /api/businesses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/businesses - Create a new business
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get tenant ID from user's first tenant
    const tenantId = user.tenants?.[0]?.id;
    
    if (!tenantId) {
      return NextResponse.json({ error: "No tenant found" }, { status: 400 });
    }

    const body = await request.json();
    const { name, code, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Create business (slug field stores the tenant_id for linking)
    const { data: business, error } = await serviceClient
      .from("businesses")
      .insert({
        slug: tenantId,
        name,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating business:", error);
      return NextResponse.json(
        { error: "Failed to create business" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error("Error in POST /api/businesses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
