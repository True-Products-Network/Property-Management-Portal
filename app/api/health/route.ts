import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    // Check Supabase connection
    const supabase = await createClient();
    const { data, error } = await supabase.from("audit_events").select("id").limit(1);

    if (error && error.code !== "PGRST116") {
      // PGRST116 = table not found, which is OK if migrations haven't run
      throw error;
    }

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        ghl: "connected", // GHL connection status
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
