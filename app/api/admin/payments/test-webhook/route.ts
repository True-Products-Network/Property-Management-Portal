import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/payments/test-webhook - Test payment webhook
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = user.user_metadata?.roles || [];
    if (!userRoles.includes("ADMIN_USER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get webhook URL from settings
    const { data: webhookSetting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "payment_webhook_url")
      .single();

    const webhookUrl = webhookSetting?.value;

    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL not configured" }, { status: 400 });
    }

    // Send test webhook event
    const testEvent = {
      id: `test_${Date.now()}`,
      object: "event",
      type: "payment_intent.test",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `pi_test_${Date.now()}`,
          amount: 1000,
          currency: "usd",
          status: "succeeded",
          description: "Test payment from webhook test",
        },
      },
      test: true,
    };

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Test": "true",
        },
        body: JSON.stringify(testEvent),
      });

      if (response.ok) {
        // Update last verified timestamp
        await supabase.from("app_settings").upsert({
          key: "payment_webhook_last_verified",
          value: new Date().toISOString(),
          category: "payment",
          updated_at: new Date().toISOString(),
        });

        // Create audit log entry
        await supabase.from("audit_logs").insert({
          user_id: user.id,
          action: "WEBHOOK_TESTED",
          entity_type: "payment_processor",
          entity_id: "webhook",
          details: { webhook_url: webhookUrl, success: true },
        });

        return NextResponse.json({ success: true, message: "Webhook test successful" });
      } else {
        return NextResponse.json(
          { error: `Webhook returned status ${response.status}` },
          { status: 502 }
        );
      }
    } catch (error) {
      console.error("Error sending test webhook:", error);
      return NextResponse.json(
        { error: "Failed to send test webhook" },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Error in POST /api/admin/payments/test-webhook:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
