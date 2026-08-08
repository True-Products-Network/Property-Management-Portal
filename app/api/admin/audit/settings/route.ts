// Audit Settings API
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface AuditSettings {
  enabled: boolean;
  logSuccessfulReads: boolean;
  logFailedReads: boolean;
  logSuccessfulWrites: boolean;
  logFailedWrites: boolean;
  logAuthentication: boolean;
  logSecurityEvents: boolean;
  retentionDays: number;
}

const DEFAULT_SETTINGS: AuditSettings = {
  enabled: true,
  logSuccessfulReads: false,
  logFailedReads: true,
  logSuccessfulWrites: true,
  logFailedWrites: true,
  logAuthentication: true,
  logSecurityEvents: true,
  retentionDays: 90,
};

// GET /api/admin/audit/settings - Get current settings
export async function GET(request: NextRequest) {
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

    // Get settings from database
    const { data: settings, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "audit_settings")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching audit settings:", error);
      return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }

    const auditSettings: AuditSettings = settings?.value 
      ? { ...DEFAULT_SETTINGS, ...settings.value }
      : DEFAULT_SETTINGS;

    return NextResponse.json({ success: true, data: auditSettings });
  } catch (error) {
    console.error("Error in GET /api/admin/audit/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/audit/settings - Update settings
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate settings
    const settings: AuditSettings = {
      enabled: typeof body.enabled === "boolean" ? body.enabled : DEFAULT_SETTINGS.enabled,
      logSuccessfulReads: typeof body.logSuccessfulReads === "boolean" ? body.logSuccessfulReads : DEFAULT_SETTINGS.logSuccessfulReads,
      logFailedReads: typeof body.logFailedReads === "boolean" ? body.logFailedReads : DEFAULT_SETTINGS.logFailedReads,
      logSuccessfulWrites: typeof body.logSuccessfulWrites === "boolean" ? body.logSuccessfulWrites : DEFAULT_SETTINGS.logSuccessfulWrites,
      logFailedWrites: typeof body.logFailedWrites === "boolean" ? body.logFailedWrites : DEFAULT_SETTINGS.logFailedWrites,
      logAuthentication: typeof body.logAuthentication === "boolean" ? body.logAuthentication : DEFAULT_SETTINGS.logAuthentication,
      logSecurityEvents: typeof body.logSecurityEvents === "boolean" ? body.logSecurityEvents : DEFAULT_SETTINGS.logSecurityEvents,
      retentionDays: typeof body.retentionDays === "number" ? body.retentionDays : DEFAULT_SETTINGS.retentionDays,
    };

    // Upsert settings
    const { error } = await supabase
      .from("system_settings")
      .upsert({
        key: "audit_settings",
        value: settings,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }, { onConflict: "key" });

    if (error) {
      console.error("Error saving audit settings:", error);
      return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("Error in PUT /api/admin/audit/settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
