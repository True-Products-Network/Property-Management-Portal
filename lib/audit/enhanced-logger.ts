// Enhanced Audit Logging System
// Comprehensive logging for all system operations

import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export interface AuditSettings {
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

// Cache settings for 1 minute to avoid repeated DB calls
let cachedSettings: AuditSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute

// Get audit settings from database
async function getAuditSettings(): Promise<AuditSettings> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedSettings;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "audit_settings")
      .single();

    if (error || !data) {
      cachedSettings = DEFAULT_SETTINGS;
    } else {
      cachedSettings = { ...DEFAULT_SETTINGS, ...data.value };
    }
  } catch {
    cachedSettings = DEFAULT_SETTINGS;
  }

  cacheTimestamp = now;
  return cachedSettings || DEFAULT_SETTINGS;
}

// Check if logging should occur based on settings
async function shouldLog(
  action: string,
  success: boolean,
  isRead: boolean
): Promise<boolean> {
  const settings = await getAuditSettings();

  // Master switch
  if (!settings.enabled) return false;

  // Authentication events
  if (action.includes("LOGIN") || action.includes("LOGOUT")) {
    return settings.logAuthentication;
  }

  // Security events
  if (action.includes("SECURITY") || action.includes("UNAUTHORIZED")) {
    return settings.logSecurityEvents;
  }

  // Read operations
  if (isRead) {
    return success ? settings.logSuccessfulReads : settings.logFailedReads;
  }

  // Write operations (create, update, delete)
  return success ? settings.logSuccessfulWrites : settings.logFailedWrites;
}

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
    // Determine if this is a read operation
    const isRead = entry.action.includes("_VIEW") || entry.action.includes("_LIST") || entry.action === "API_CALL";

    // Check if we should log based on settings
    const shouldLogEntry = await shouldLog(entry.action, entry.success, isRead);
    if (!shouldLogEntry) {
      return; // Skip logging based on settings
    }

    const supabase = await createClient();

    // Build insert object with only fields that exist in the database
    // This ensures backward compatibility if columns are missing
    const insertData: any = {
      user_id: entry.userId,
      tenant_id: entry.tenantId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      success: entry.success,
      severity: entry.severity,
      details: entry.details,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      created_at: new Date().toISOString(),
    };

    // Only add optional fields if they have values
    if (entry.entityName) insertData.entity_name = entry.entityName;
    if (entry.requestMethod) insertData.request_method = entry.requestMethod;
    if (entry.requestPath) insertData.request_path = entry.requestPath;
    if (entry.responseStatus) insertData.response_status = entry.responseStatus;
    if (entry.durationMs) insertData.duration_ms = entry.durationMs;
    if (entry.beforeValues) insertData.before_values = entry.beforeValues;
    if (entry.afterValues) insertData.after_values = entry.afterValues;
    if (entry.errorMessage) insertData.error_message = entry.errorMessage;
    if (entry.errorStack) insertData.error_stack = entry.errorStack;
    if (entry.correlationId || true) insertData.correlation_id = entry.correlationId || generateCorrelationId();

    const { error } = await supabase.from("audit_logs").insert(insertData);

    if (error) {
      console.error("[Audit Log] Failed to insert:", error);
      // Don't throw - just log the error
    }
  } catch (error) {
    // Never fail the main operation due to audit logging
    console.error("[Audit Log] Critical error (non-blocking):", error);
    // Silently continue - don't rethrow
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
