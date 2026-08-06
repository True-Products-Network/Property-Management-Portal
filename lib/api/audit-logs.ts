// Audit Logging Helper
// Log actions to the audit_logs table for better error detection and tracking

import { createClient } from "@/lib/supabase/server";

export interface AuditLogEntry {
  userId?: string;
  tenantId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();
    
    await supabase.from("audit_logs").insert({
      user_id: entry.userId,
      tenant_id: entry.tenantId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      details: entry.details,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error("[Audit Log] Failed to log:", error);
  }
}

// Helper to log API errors with context
export async function logApiError(
  request: Request,
  error: Error,
  context: {
    userId?: string;
    tenantId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: Record<string, any>;
  }
): Promise<void> {
  const headers = request.headers;
  
  await logAudit({
    userId: context.userId,
    tenantId: context.tenantId,
    action: `ERROR: ${context.action}`,
    entityType: context.entityType,
    entityId: context.entityId,
    details: {
      error: error.message,
      stack: error.stack,
      ...context.details,
    },
    ipAddress: headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined,
    userAgent: headers.get("user-agent") || undefined,
  });
}
