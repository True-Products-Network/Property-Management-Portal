// Enhanced Audit Logging System
// Comprehensive logging for all system operations

import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export interface AuditContext {
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditEntry {
  // Core fields
  userId?: string;
  tenantId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  
  // Status tracking
  success: boolean;
  severity: "info" | "warning" | "error" | "critical";
  
  // Request/Response details
  requestMethod?: string;
  requestPath?: string;
  responseStatus?: number;
  durationMs?: number;
  
  // Data changes
  beforeValues?: Record<string, any>;
  afterValues?: Record<string, any>;
  
  // Additional context
  details?: Record<string, any>;
  errorMessage?: string;
  errorStack?: string;
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

// Extract context from NextRequest
export function extractAuditContext(request: NextRequest): Partial<AuditContext> {
  const headers = request.headers;
  
  return {
    ipAddress: headers.get("x-forwarded-for") || 
               headers.get("x-real-ip") || 
               headers.get("cf-connecting-ip") ||
               "unknown",
    userAgent: headers.get("user-agent") || "unknown",
    sessionId: headers.get("x-session-id") || undefined,
  };
}

// Main audit logging function
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.from("audit_logs").insert({
      user_id: entry.userId,
      tenant_id: entry.tenantId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      entity_name: entry.entityName,
      success: entry.success,
      severity: entry.severity,
      request_method: entry.requestMethod,
      request_path: entry.requestPath,
      response_status: entry.responseStatus,
      duration_ms: entry.durationMs,
      before_values: entry.beforeValues,
      after_values: entry.afterValues,
      details: entry.details,
      error_message: entry.errorMessage,
      error_stack: entry.errorStack,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      correlation_id: entry.correlationId || generateCorrelationId(),
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[Audit Log] Failed to insert:", error);
    }
  } catch (error) {
    // Never fail the main operation due to audit logging
    console.error("[Audit Log] Critical error:", error);
  }
}

// Generate correlation ID for tracking requests across services
function generateCorrelationId(): string {
  return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Pre-built audit loggers for common operations
export const auditLoggers = {
  // Authentication
  async loginSuccess(context: AuditContext, details: { email: string; method: string }) {
    await logAudit({
      userId: context.userId,
      tenantId: context.tenantId,
      action: "USER_LOGIN",
      entityType: "user",
      entityId: context.userId,
      success: true,
      severity: "info",
      details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  },

  async loginFailed(context: AuditContext, details: { email: string; reason: string }) {
    await logAudit({
      action: "USER_LOGIN_FAILED",
      entityType: "user",
      success: false,
      severity: "warning",
      details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  },

  async logout(context: AuditContext) {
    await logAudit({
      userId: context.userId,
      tenantId: context.tenantId,
      action: "USER_LOGOUT",
      entityType: "user",
      entityId: context.userId,
      success: true,
      severity: "info",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  },

  // CRUD Operations
  async create(
    context: AuditContext,
    entityType: string,
    entityId: string,
    entityName: string,
    afterValues: Record<string, any>,
    details?: Record<string, any>
  ) {
    await logAudit({
      userId: context.userId,
      tenantId: context.tenantId,
      action: `${entityType.toUpperCase()}_CREATE`,
      entityType,
      entityId,
      entityName,
      success: true,
      severity: "info",
      afterValues,
      details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  },

  async update(
    context: AuditContext,
    entityType: string,
    entityId: string,
    entityName: string,
    beforeValues: Record<string, any>,
    afterValues: Record<string, any>,
    details?: Record<string, any>
  ) {
    await logAudit({
      userId: context.userId,
      tenantId: context.tenantId,
      action: `${entityType.toUpperCase()}_UPDATE`,
      entityType,
      entityId,
      entityName,
      success: true,
      severity: "info",
      beforeValues,
      afterValues,
      details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  },

  async delete(
    context: AuditContext,
    entityType: string,
    entityId: string,
    entityName: string,
    beforeValues: Record<string, any>,
    details?: Record<string, any>
  ) {
    await logAudit({
      userId: context.userId,
      tenantId: context.tenantId,
      action: `${entityType.toUpperCase()}_DELETE`,
      entityType,
      entityId,
      entityName,
      success: true,
      severity: "warning",
      beforeValues,
      details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  },

  async view(
    context: AuditContext,
    entityType: string,
    entityId: string,
    entityName: string,
    details?: Record<string, any>
  ) {
    await logAudit({
      userId: context.userId,
      tenantId: context.tenantId,
      action: `${entityType.toUpperCase()}_VIEW`,
      entityType,
      entityId,
      entityName,
      success: true,
      severity: "info",
      details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  },

  // Errors
  async error(
    context: AuditContext,
    action: string,
    entityType: string,
    error: Error,
    details?: Record<string, any>
  ) {
    await logAudit({
      userId: context.userId,
      tenantId: context.tenantId,
      action,
      entityType,
      success: false,
      severity: "error",
      errorMessage: error.message,
      errorStack: error.stack,
      details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  },

  // Security
  async securityEvent(
    context: AuditContext,
    action: string,
    severity: "warning" | "error" | "critical",
    details: Record<string, any>
  ) {
    await logAudit({
      userId: context.userId,
      tenantId: context.tenantId,
      action,
      entityType: "security",
      success: false,
      severity,
      details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  },

  // API Operations
  async apiCall(
    context: AuditContext,
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    success: boolean,
    details?: Record<string, any>
  ) {
    const severity = success ? "info" : statusCode >= 500 ? "error" : "warning";
    
    await logAudit({
      userId: context.userId,
      tenantId: context.tenantId,
      action: "API_CALL",
      entityType: "api",
      success,
      severity,
      requestMethod: method,
      requestPath: path,
      responseStatus: statusCode,
      durationMs,
      details,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  },
};

// Higher-order function to wrap API handlers with audit logging
export function withAudit(
  handler: Function,
  options: {
    action: string;
    entityType: string;
    getEntityId?: (req: NextRequest, result: any) => string | undefined;
    getEntityName?: (req: NextRequest, result: any) => string | undefined;
    logSuccess?: boolean;
    logFailure?: boolean;
  }
) {
  return async function auditedHandler(request: NextRequest, ...args: any[]) {
    const startTime = Date.now();
    const context = extractAuditContext(request);
    
    try {
      // Get user session for context
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        context.userId = user.id;
        context.tenantId = user.user_metadata?.tenant_id;
      }
    } catch {
      // Continue without user context
    }

    try {
      const result = await handler(request, ...args);
      const duration = Date.now() - startTime;
      
      if (options.logSuccess !== false) {
        await logAudit({
          userId: context.userId,
          tenantId: context.tenantId,
          action: options.action,
          entityType: options.entityType,
          entityId: options.getEntityId?.(request, result),
          entityName: options.getEntityName?.(request, result),
          success: true,
          severity: "info",
          requestMethod: request.method,
          requestPath: request.nextUrl.pathname,
          durationMs: duration,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (options.logFailure !== false) {
        await logAudit({
          userId: context.userId,
          tenantId: context.tenantId,
          action: options.action,
          entityType: options.entityType,
          success: false,
          severity: "error",
          requestMethod: request.method,
          requestPath: request.nextUrl.pathname,
          durationMs: duration,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          errorStack: error instanceof Error ? error.stack : undefined,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        });
      }
      
      throw error;
    }
  };
}
