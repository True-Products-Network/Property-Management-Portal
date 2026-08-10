// Server-side API to migrate orphaned data using service role (bypasses RLS)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's tenant ID from their contact record
    const supabase = await createClient();
    const { data: contact } = await supabase
      .from("contacts")
      .select("tenant_id")
      .eq("portal_user_id", user.id)
      .maybeSingle();

    if (!contact?.tenant_id) {
      return NextResponse.json({ error: "No tenant found for user" }, { status: 400 });
    }

    const targetTenantId = contact.tenant_id;
    const results: any = {
      associations: { updated: 0, error: null },
      properties: { updated: 0, error: null },
      vendors: { updated: 0, error: null },
      units: { updated: 0, error: null },
      maintenance: { updated: 0, error: null },
      inspections: { updated: 0, error: null },
    };

    // Use service client to bypass RLS
    const serviceClient = createServiceClient();

    // Update associations
    try {
      const { data, error } = await serviceClient
        .from("associations")
        .update({ 
          business_id: targetTenantId, 
          tenant_id: targetTenantId,
          updated_at: new Date().toISOString(),
        })
        .is("business_id", null)
        .select("id, name");
      results.associations.updated = data?.length || 0;
      results.associations.error = error?.message;
      if (error) console.error("Associations update error:", error);
    } catch (e: any) {
      results.associations.error = e.message;
    }

    // Update properties
    try {
      const { data, error } = await serviceClient
        .from("properties")
        .update({ 
          business_id: targetTenantId,
          updated_at: new Date().toISOString(),
        })
        .is("business_id", null)
        .select("id, name");
      results.properties.updated = data?.length || 0;
      results.properties.error = error?.message;
      if (error) console.error("Properties update error:", error);
    } catch (e: any) {
      results.properties.error = e.message;
    }

    // Update vendors
    try {
      const { data, error } = await serviceClient
        .from("vendors")
        .update({ 
          business_id: targetTenantId,
          updated_at: new Date().toISOString(),
        })
        .is("business_id", null)
        .select("id, company_name");
      results.vendors.updated = data?.length || 0;
      results.vendors.error = error?.message;
      if (error) console.error("Vendors update error:", error);
    } catch (e: any) {
      results.vendors.error = e.message;
    }

    // Update units
    try {
      const { data, error } = await serviceClient
        .from("units")
        .update({ 
          business_id: targetTenantId,
          updated_at: new Date().toISOString(),
        })
        .is("business_id", null)
        .select("id, unit_number");
      results.units.updated = data?.length || 0;
      results.units.error = error?.message;
      if (error) console.error("Units update error:", error);
    } catch (e: any) {
      results.units.error = e.message;
    }

    // Update maintenance requests
    try {
      const { data, error } = await serviceClient
        .from("maintenance_requests")
        .update({ 
          business_id: targetTenantId,
          updated_at: new Date().toISOString(),
        })
        .is("business_id", null)
        .select("id, title");
      results.maintenance.updated = data?.length || 0;
      results.maintenance.error = error?.message;
      if (error) console.error("Maintenance update error:", error);
    } catch (e: any) {
      results.maintenance.error = e.message;
    }

    // Update inspections
    try {
      const { data, error } = await serviceClient
        .from("inspections")
        .update({ 
          business_id: targetTenantId,
          updated_at: new Date().toISOString(),
        })
        .is("business_id", null)
        .select("id, title");
      results.inspections.updated = data?.length || 0;
      results.inspections.error = error?.message;
      if (error) console.error("Inspections update error:", error);
    } catch (e: any) {
      results.inspections.error = e.message;
    }

    return NextResponse.json({
      success: true,
      targetTenantId,
      results,
    });

  } catch (error: any) {
    console.error("Migration API error:", error);
    return NextResponse.json({
      error: error.message || "Internal server error",
    }, { status: 500 });
  }
}
