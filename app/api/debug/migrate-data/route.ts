// API to migrate all data to a specific user's tenant
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return NextResponse.json({ 
        error: "Not authenticated",
        authError: authError?.message 
      }, { 
        status: 401,
        headers: corsHeaders 
      });
    }

    // Get the user's contact record to find their tenant
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("tenant_id")
      .eq("portal_user_id", authUser.id)
      .not("tenant_id", "is", null)
      .maybeSingle();

    if (contactError || !contact?.tenant_id) {
      return NextResponse.json({
        error: "No contact record with tenant found",
        contactError: contactError?.message,
      }, { status: 400, headers: corsHeaders });
    }

    const targetTenantId = contact.tenant_id;
    const userId = authUser.id;

    // Get current counts before migration
    const { data: beforeCounts } = await supabase
      .from("associations")
      .select("id", { count: "exact" });

    // Update associations - set business_id and tenant_id
    const { data: updatedAssociations, error: assocError } = await supabase
      .from("associations")
      .update({ 
        business_id: targetTenantId,
        tenant_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .is("business_id", null)
      .select("id, name");

    if (assocError) {
      console.error("Error updating associations:", assocError);
    }

    // Update properties - set business_id
    const { data: updatedProperties, error: propError } = await supabase
      .from("properties")
      .update({ 
        business_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .is("business_id", null)
      .select("id, name");

    if (propError) {
      console.error("Error updating properties:", propError);
    }

    // Update vendors - set business_id
    const { data: updatedVendors, error: vendorError } = await supabase
      .from("vendors")
      .update({ 
        business_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .is("business_id", null)
      .select("id, company_name");

    if (vendorError) {
      console.error("Error updating vendors:", vendorError);
    }

    // Update units - set business_id
    const { data: updatedUnits, error: unitError } = await supabase
      .from("units")
      .update({ 
        business_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .is("business_id", null)
      .select("id, unit_number");

    if (unitError) {
      console.error("Error updating units:", unitError);
    }

    // Update maintenance_requests - set business_id
    const { data: updatedMaintenance, error: maintError } = await supabase
      .from("maintenance_requests")
      .update({ 
        business_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .is("business_id", null)
      .select("id, title");

    if (maintError) {
      console.error("Error updating maintenance requests:", maintError);
    }

    // Update inspections - set business_id
    const { data: updatedInspections, error: inspectError } = await supabase
      .from("inspections")
      .update({ 
        business_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .is("business_id", null)
      .select("id, title");

    if (inspectError) {
      console.error("Error updating inspections:", inspectError);
    }

    // Update documents - set business_id
    const { data: updatedDocuments, error: docError } = await supabase
      .from("documents")
      .update({ 
        business_id: targetTenantId,
        updated_at: new Date().toISOString(),
      })
      .is("business_id", null)
      .select("id, name");

    if (docError) {
      console.error("Error updating documents:", docError);
    }

    return NextResponse.json({
      success: true,
      message: "Data migration complete",
      targetTenantId: targetTenantId,
      userId: userId,
      results: {
        associations: {
          updated: updatedAssociations?.length || 0,
          error: assocError?.message,
          data: updatedAssociations?.slice(0, 5),
        },
        properties: {
          updated: updatedProperties?.length || 0,
          error: propError?.message,
          data: updatedProperties?.slice(0, 5),
        },
        vendors: {
          updated: updatedVendors?.length || 0,
          error: vendorError?.message,
          data: updatedVendors?.slice(0, 5),
        },
        units: {
          updated: updatedUnits?.length || 0,
          error: unitError?.message,
          data: updatedUnits?.slice(0, 5),
        },
        maintenance: {
          updated: updatedMaintenance?.length || 0,
          error: maintError?.message,
          data: updatedMaintenance?.slice(0, 5),
        },
        inspections: {
          updated: updatedInspections?.length || 0,
          error: inspectError?.message,
          data: updatedInspections?.slice(0, 5),
        },
        documents: {
          updated: updatedDocuments?.length || 0,
          error: docError?.message,
          data: updatedDocuments?.slice(0, 5),
        },
      },
    }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}
