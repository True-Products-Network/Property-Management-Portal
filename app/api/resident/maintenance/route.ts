import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/resident/maintenance - Get maintenance requests for user's units
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contactId = user.user_metadata?.contact_id;
    if (!contactId) {
      return NextResponse.json({ error: "Contact not found" }, { status: 400 });
    }

    // Get contact's units
    const { data: contactUnits, error: unitsError } = await supabase
      .from("contact_units")
      .select("unit_id")
      .eq("contact_id", contactId);

    if (unitsError) {
      console.error("Error fetching contact units:", unitsError);
      return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
    }

    const unitIds = contactUnits?.map((cu: { unit_id: string }) => cu.unit_id) || [];

    if (unitIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Get maintenance requests for these units
    const { data: requests, error: requestsError } = await supabase
      .from("maintenance_requests")
      .select(`
        id,
        title,
        description,
        status,
        urgency,
        category,
        created_at,
        updated_at,
        scheduled_date,
        units!inner(unit_number, properties!inner(name))
      `)
      .in("unit_id", unitIds)
      .order("updated_at", { ascending: false });

    if (requestsError) {
      console.error("Error fetching maintenance requests:", requestsError);
      return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
    }

    // Format the response
    const formattedRequests = requests?.map((request: { id: string; title: string; description: string; status: string; urgency: string; category: string; units?: { unit_number: string }; created_at: string; updated_at: string; scheduled_date: string }) => ({
      id: request.id,
      title: request.title,
      description: request.description,
      status: request.status,
      urgency: request.urgency,
      category: request.category,
      unitNumber: request.units?.unit_number,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      scheduledDate: request.scheduled_date,
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedRequests,
    });
  } catch (error) {
    console.error("Error in GET /api/resident/maintenance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/resident/maintenance - Create new maintenance request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contactId = user.user_metadata?.contact_id;
    if (!contactId) {
      return NextResponse.json({ error: "Contact not found" }, { status: 400 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.unitId || !body.title || !body.description || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user has access to this unit
    const { data: contactUnit, error: unitError } = await supabase
      .from("contact_units")
      .select("unit_id")
      .eq("contact_id", contactId)
      .eq("unit_id", body.unitId)
      .single();

    if (unitError && body.unitId !== "common") {
      return NextResponse.json(
        { error: "You do not have access to this unit" },
        { status: 403 }
      );
    }

    // Get the actual unit ID (handle "common" selection)
    const actualUnitId = body.unitId === "common" 
      ? (await supabase.from("contact_units").select("unit_id").eq("contact_id", contactId).limit(1).single()).data?.unit_id
      : body.unitId;

    if (!actualUnitId) {
      return NextResponse.json({ error: "No unit found" }, { status: 400 });
    }

    // Create the maintenance request
    const { data: newRequest, error: createError } = await supabase
      .from("maintenance_requests")
      .insert({
        unit_id: actualUnitId,
        reporter_id: contactId,
        title: body.title,
        description: body.description,
        category: body.category,
        urgency: body.urgency || "medium",
        status: "submitted",
        access_instructions: body.accessInstructions,
        preferred_date: body.preferredDate || null,
        preferred_time: body.preferredTime || null,
        safety_concern: body.safetyConcern || false,
        safety_description: body.safetyDescription || null,
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating maintenance request:", createError);
      return NextResponse.json(
        { error: "Failed to create request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: newRequest.id },
    });
  } catch (error) {
    console.error("Error in POST /api/resident/maintenance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
