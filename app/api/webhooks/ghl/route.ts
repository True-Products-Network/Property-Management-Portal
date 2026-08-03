// GHL Webhook Handler
// Receives and processes webhooks from GoHighLevel

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { queueSync } from "@/lib/ghl/sync-engine";
import { EntityType } from "@/lib/ghl/field-mapper";

// Webhook verification using HMAC
import { createHmac } from "crypto";

const WEBHOOK_SECRET = process.env.GHL_WEBHOOK_SECRET;

interface GhlWebhookPayload {
  event: string;
  id: string;
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn("[GHL Webhook] No webhook secret configured, skipping verification");
    return true;
  }

  const expectedSignature = createHmac("sha256", WEBHOOK_SECRET)
    .update(payload)
    .digest("hex");

  return signature === expectedSignature;
}

/**
 * Check if webhook event is a duplicate
 */
async function isDuplicateEvent(eventId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ghl_webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("[GHL Webhook] Error checking duplicate:", error);
  }

  return !!data;
}

/**
 * Store webhook event for idempotency
 */
async function storeWebhookEvent(
  eventId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("ghl_webhook_events").insert({
    event_id: eventId,
    event_type: eventType,
    payload,
    processed: false,
  });

  if (error) {
    console.error("[GHL Webhook] Error storing event:", error);
  }
}

/**
 * Parse event type and determine entity
 */
function parseEventType(event: string): {
  entityType: EntityType | null;
  operation: "create" | "update" | "delete" | null;
} {
  const parts = event.split(".");
  if (parts.length < 2) {
    return { entityType: null, operation: null };
  }

  const [entity, action] = parts;

  let entityType: EntityType | null = null;
  switch (entity) {
    case "contact":
      entityType = "contact";
      break;
    case "company":
      entityType = "association";
      break;
    case "customObject":
      // Custom objects need additional parsing
      entityType = null;
      break;
    default:
      entityType = null;
  }

  let operation: "create" | "update" | "delete" | null = null;
  switch (action) {
    case "create":
    case "add":
      operation = "create";
      break;
    case "update":
    case "change":
      operation = "update";
      break;
    case "delete":
    case "remove":
      operation = "delete";
      break;
    default:
      operation = null;
  }

  return { entityType, operation };
}

/**
 * Process webhook event
 */
async function processWebhookEvent(
  eventType: string,
  data: Record<string, unknown>
): Promise<void> {
  const { entityType, operation } = parseEventType(eventType);

  if (!entityType || !operation) {
    console.log(`[GHL Webhook] Unhandled event type: ${eventType}`);
    return;
  }

  const ghlId = data.id as string;
  if (!ghlId) {
    console.error("[GHL Webhook] No ID in webhook data");
    return;
  }

  console.log(
    `[GHL Webhook] Processing ${eventType} for ${entityType}:${ghlId}`
  );

  // Queue a pull operation to sync from GHL
  // The sync engine will handle create vs update
  await queueSync(entityType, ghlId, "pull", ghlId, undefined, 7); // High priority
}

/**
 * POST handler for GHL webhooks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("X-GHL-Signature") || "";

    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error("[GHL Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse payload
    let payload: GhlWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error("[GHL Webhook] Invalid JSON payload");
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { event, id: eventId, data, timestamp } = payload;

    // Check for duplicate events
    if (await isDuplicateEvent(eventId)) {
      console.log(`[GHL Webhook] Duplicate event ${eventId}, skipping`);
      return NextResponse.json({ status: "duplicate" });
    }

    // Store event for idempotency
    await storeWebhookEvent(eventId, event, payload as unknown as Record<string, unknown>);

    // Process event asynchronously (don't block response)
    processWebhookEvent(event, data).catch((error) => {
      console.error("[GHL Webhook] Error processing event:", error);
    });

    // Return success immediately
    return NextResponse.json({
      status: "received",
      event,
      eventId,
    });
  } catch (error) {
    console.error("[GHL Webhook] Error handling webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET handler for webhook verification
 * GHL may send GET requests to verify the endpoint
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const challenge = request.nextUrl.searchParams.get("challenge");

  if (challenge) {
    // Echo back the challenge for verification
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json({
    status: "ok",
    message: "GHL Webhook endpoint active",
  });
}
