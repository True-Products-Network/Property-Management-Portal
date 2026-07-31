import { createClient } from "@/lib/supabase/server";
import { generateEventId, generateCorrelationId } from "@/lib/utils";

export interface AuditEventData {
  actorId: string;
  role: string;
  action: string;
  associationId?: string;
  recordType?: string;
  recordId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

export interface IntegrationEventData {
  provider: string;
  eventType: string;
  status: "success" | "error" | "retry";
  payload?: unknown;
  error?: unknown;
  correlationId?: string;
}

export class AuditLogger {
  async logAuditEvent(data: AuditEventData): Promise<void> {
    const eventId = generateEventId();
    const correlationId = data.correlationId || generateCorrelationId();

    try {
      const supabase = await createClient();
      
      await supabase.from("audit_events").insert({
        event_id: eventId,
        actor_id: data.actorId,
        role: data.role,
        action: data.action,
        association_id: data.associationId,
        record_type: data.recordType,
        record_id: data.recordId,
        previous_value: data.previousValue,
        new_value: data.newValue,
        correlation_id: correlationId,
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        reason: data.reason,
        occurred_at: new Date().toISOString(),
      });
    } catch (error) {
      // Log to console as fallback - don't fail the operation due to audit logging
      console.error("Failed to write audit event:", error);
      console.log("Audit event data:", { eventId, ...data });
    }
  }

  async logIntegrationEvent(data: IntegrationEventData): Promise<void> {
    try {
      const supabase = await createClient();
      
      await supabase.from("integration_events").insert({
        provider: data.provider,
        event_type: data.eventType,
        status: data.status,
        payload: data.payload,
        error: data.error,
        correlation_id: data.correlationId,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to write integration event:", error);
      console.log("Integration event data:", data);
    }
  }

  async getAuditEvents(options: {
    actorId?: string;
    associationId?: string;
    recordType?: string;
    recordId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    events: unknown[];
    total: number;
  }> {
    const supabase = await createClient();
    
    let query = supabase
      .from("audit_events")
      .select("*, actor:actor_id(email, ghl_contact_id)", { count: "exact" });

    if (options.actorId) query = query.eq("actor_id", options.actorId);
    if (options.associationId) query = query.eq("association_id", options.associationId);
    if (options.recordType) query = query.eq("record_type", options.recordType);
    if (options.recordId) query = query.eq("record_id", options.recordId);
    if (options.action) query = query.eq("action", options.action);
    if (options.startDate) query = query.gte("occurred_at", options.startDate.toISOString());
    if (options.endDate) query = query.lte("occurred_at", options.endDate.toISOString());

    const { data, error, count } = await query
      .order("occurred_at", { ascending: false })
      .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

    if (error) {
      console.error("Failed to fetch audit events:", error);
      return { events: [], total: 0 };
    }

    return { events: data || [], total: count || 0 };
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();
