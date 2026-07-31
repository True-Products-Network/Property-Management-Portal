import { prisma } from "@/lib/prisma";
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
      await prisma.auditEvent.create({
        data: {
          eventId,
          actorId: data.actorId,
          role: data.role,
          action: data.action,
          associationId: data.associationId,
          recordType: data.recordType,
          recordId: data.recordId,
          previousValue: data.previousValue ? JSON.parse(JSON.stringify(data.previousValue)) : null,
          newValue: data.newValue ? JSON.parse(JSON.stringify(data.newValue)) : null,
          correlationId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          reason: data.reason,
        },
      });
    } catch (error) {
      // Log to console as fallback - don't fail the operation due to audit logging
      console.error("Failed to write audit event:", error);
      console.log("Audit event data:", { eventId, ...data });
    }
  }

  async logIntegrationEvent(data: IntegrationEventData): Promise<void> {
    try {
      await prisma.integrationEvent.create({
        data: {
          provider: data.provider,
          eventType: data.eventType,
          status: data.status,
          payload: data.payload ? JSON.parse(JSON.stringify(data.payload)) : null,
          error: data.error ? JSON.parse(JSON.stringify(data.error)) : null,
          correlationId: data.correlationId,
        },
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
    const where: Record<string, unknown> = {};

    if (options.actorId) where.actorId = options.actorId;
    if (options.associationId) where.associationId = options.associationId;
    if (options.recordType) where.recordType = options.recordType;
    if (options.recordId) where.recordId = options.recordId;
    if (options.action) where.action = options.action;
    if (options.startDate || options.endDate) {
      where.occurredAt = {};
      if (options.startDate) (where.occurredAt as Record<string, Date>).gte = options.startDate;
      if (options.endDate) (where.occurredAt as Record<string, Date>).lte = options.endDate;
    }

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        take: options.limit || 50,
        skip: options.offset || 0,
        include: {
          actor: {
            select: {
              email: true,
              ghlContactId: true,
            },
          },
        },
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return { events, total };
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();
