import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GHL Calendar Webhook Handler
 * 
 * This endpoint receives webhook events from GHL when appointments are:
 * - Created (booking confirmed)
 * - Updated (rescheduled)
 * - Cancelled
 * 
 * The webhook should be configured in GHL:
 * Location Settings → Calendars → [Your Calendar] → Webhooks
 */

interface GhlCalendarWebhookPayload {
  event: "appointment.created" | "appointment.updated" | "appointment.cancelled";
  data: {
    id: string;
    calendarId: string;
    contactId?: string;
    startTime: string;
    endTime: string;
    title?: string;
    notes?: string;
    status: "confirmed" | "cancelled" | "pending";
    customFields?: Array<{
      id: string;
      key?: string;
      fieldKey?: string;
      value: string;
    }>;
    // Additional fields that may be present
    address?: string;
    locationId?: string;
  };
}

export async function POST(request: Request) {
  try {
    const payload: GhlCalendarWebhookPayload = await request.json();
    
    console.log("GHL Calendar Webhook received:", {
      event: payload.event,
      appointmentId: payload.data?.id,
      calendarId: payload.data?.calendarId,
    });

    const supabase = await createClient();

    // Verify this is for our configured calendar
    const { data: calendarSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "ghl_inspection_calendar_id")
      .single();

    if (calendarSetting?.value && calendarSetting.value !== payload.data.calendarId) {
      // This booking is for a different calendar, ignore it
      return NextResponse.json({ 
        success: true, 
        message: "Ignored - different calendar" 
      });
    }

    // Extract custom fields that may contain our inspection reference
    const customFields = payload.data.customFields || [];
    const inspectionRefField = customFields.find(
      (f) => f.key === "inspection_id" || f.fieldKey === "inspection_id"
    );
    const inspectionId = inspectionRefField?.value;

    if (!inspectionId && payload.event === "appointment.created") {
      // No inspection ID - this might be a direct booking
      // Could create a new inspection record or log for manual review
      console.log("Calendar booking without inspection reference:", payload.data.id);
      
      // Optionally create an inspection from the booking
      // await createInspectionFromBooking(supabase, payload.data);
      
      return NextResponse.json({ 
        success: true, 
        message: "Booking recorded without inspection reference" 
      });
    }

    // Handle different event types
    switch (payload.event) {
      case "appointment.created":
        await handleAppointmentCreated(supabase, inspectionId, payload.data);
        break;
        
      case "appointment.updated":
        await handleAppointmentUpdated(supabase, inspectionId, payload.data);
        break;
        
      case "appointment.cancelled":
        await handleAppointmentCancelled(supabase, inspectionId, payload.data);
        break;
        
      default:
        console.log("Unknown webhook event:", payload.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing GHL calendar webhook:", error);
    // Return 200 to prevent GHL from retrying (we'll handle errors internally)
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 200 }
    );
  }
}

async function handleAppointmentCreated(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inspectionId: string | undefined,
  data: GhlCalendarWebhookPayload["data"]
) {
  if (!inspectionId) return;

  // Update the inspection with scheduled date/time
  const { error } = await supabase
    .from("inspections")
    .update({
      scheduled_date: data.startTime.split("T")[0],
      scheduled_time: data.startTime.split("T")[1]?.substring(0, 5) || null,
      status: "scheduled",
      ghl_calendar_event_id: data.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inspectionId);

  if (error) {
    console.error("Error updating inspection from calendar booking:", error);
  } else {
    console.log(`Inspection ${inspectionId} scheduled for ${data.startTime}`);
  }
}

async function handleAppointmentUpdated(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inspectionId: string | undefined,
  data: GhlCalendarWebhookPayload["data"]
) {
  if (!inspectionId) return;

  // Update the inspection with new date/time
  const { error } = await supabase
    .from("inspections")
    .update({
      scheduled_date: data.startTime.split("T")[0],
      scheduled_time: data.startTime.split("T")[1]?.substring(0, 5) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inspectionId);

  if (error) {
    console.error("Error updating inspection from calendar reschedule:", error);
  } else {
    console.log(`Inspection ${inspectionId} rescheduled to ${data.startTime}`);
  }
}

async function handleAppointmentCancelled(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inspectionId: string | undefined,
  data: GhlCalendarWebhookPayload["data"]
) {
  if (!inspectionId) return;

  // Clear the scheduled date and update status
  const { error } = await supabase
    .from("inspections")
    .update({
      scheduled_date: null,
      scheduled_time: null,
      status: "pending",
      ghl_calendar_event_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inspectionId);

  if (error) {
    console.error("Error updating inspection from calendar cancellation:", error);
  } else {
    console.log(`Inspection ${inspectionId} unscheduled due to cancellation`);
  }
}

// Optional: Handle GET for webhook verification (some services require this)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");
  
  if (challenge) {
    // Return challenge for webhook verification
    return new Response(challenge, { status: 200 });
  }
  
  return NextResponse.json({ 
    message: "GHL Calendar Webhook Endpoint",
    status: "active"
  });
}
