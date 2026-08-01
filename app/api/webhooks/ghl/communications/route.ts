import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GHL Communications Webhook Handler
 * 
 * This endpoint receives webhook events from GHL for:
 * - Email sent
 * - SMS sent
 * - Communication created/updated
 * 
 * Configure this webhook in GHL:
 * Location Settings → Webhooks → Add Endpoint
 */

interface GhlCommunicationWebhookPayload {
  event: "email.sent" | "sms.sent" | "communication.created" | "communication.updated";
  data: {
    id: string;
    contactId?: string;
    type: "email" | "sms" | "call" | "voicemail";
    status: "sent" | "delivered" | "failed" | "pending";
    subject?: string;
    body?: string;
    to?: string;
    from?: string;
    sentAt?: string;
    locationId?: string;
    attachments?: Array<{
      url: string;
      name: string;
    }>;
  };
}

export async function POST(request: Request) {
  try {
    const payload: GhlCommunicationWebhookPayload = await request.json();
    
    console.log("GHL Communications Webhook received:", {
      event: payload.event,
      communicationId: payload.data?.id,
      type: payload.data?.type,
      status: payload.data?.status,
    });

    const supabase = await createClient();

    // Handle different event types
    switch (payload.event) {
      case "email.sent":
      case "sms.sent":
        await handleCommunicationSent(supabase, payload.data);
        break;
        
      case "communication.created":
        await handleCommunicationCreated(supabase, payload.data);
        break;
        
      case "communication.updated":
        await handleCommunicationUpdated(supabase, payload.data);
        break;
        
      default:
        console.log("Unknown webhook event:", payload.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing GHL communications webhook:", error);
    // Return 200 to prevent GHL from retrying
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 200 }
    );
  }
}

async function handleCommunicationSent(
  supabase: ReturnType<typeof createClient>,
  data: GhlCommunicationWebhookPayload["data"]
) {
  // Log the communication in our database
  // This can be used for tracking sent emails/SMS
  console.log(`Communication ${data.type} sent to ${data.to}`);
  
  // If we have a contactId, we could update the contact's communication history
  if (data.contactId) {
    // Optional: Update contact's last communication date
    const { error } = await supabase
      .from("contacts")
      .update({
        last_communication_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("ghl_contact_id", data.contactId);

    if (error) {
      console.error("Error updating contact communication date:", error);
    }
  }
}

async function handleCommunicationCreated(
  supabase: ReturnType<typeof createClient>,
  data: GhlCommunicationWebhookPayload["data"]
) {
  console.log(`Communication created: ${data.id}`);
  
  // Could create a record in a communications_log table
  // for tracking all communications
}

async function handleCommunicationUpdated(
  supabase: ReturnType<typeof createClient>,
  data: GhlCommunicationWebhookPayload["data"]
) {
  console.log(`Communication updated: ${data.id}, status: ${data.status}`);
  
  // Update delivery status, etc.
}

// Optional: Handle GET for webhook verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");
  
  if (challenge) {
    return new Response(challenge, { status: 200 });
  }
  
  return NextResponse.json({ 
    message: "GHL Communications Webhook Endpoint",
    status: "active",
    supportedEvents: [
      "email.sent",
      "sms.sent", 
      "communication.created",
      "communication.updated"
    ]
  });
}
