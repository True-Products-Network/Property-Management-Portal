"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  FileText,
  Search,
  Filter,
  Download,
  User,
  LogIn,
  Shield,
  CheckSquare,
  DollarSign,
  Settings,
  Workflow,
  AlertTriangle,
  Eye,
  UserPlus,
  Lock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
} from "lucide-react";

interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  severity: "info" | "warning" | "error" | "critical";
  success?: boolean;
  statusLabel?: string;
  requestMethod?: string;
  requestPath?: string;
  responseStatus?: number;
  durationMs?: number;
  beforeValues?: Record<string, unknown>;
  afterValues?: Record<string, unknown>;
  errorMessage?: string;
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  SIGN_IN: LogIn,
  SIGN_IN_FAILED: AlertTriangle,
  MFA_ENABLED: Shield,
  MFA_DISABLED: Shield,
  INVITATION_SENT: UserPlus,
  INVITATION_ACCEPTED: UserPlus,
  ROLE_CREATED: Shield,
  ROLE_UPDATED: Shield,
  ROLE_DELETED: Shield,
  USER_SUSPENDED: Lock,
  USER_ACTIVATED: User,
  RECORD_VIEWED: Eye,
  RECORD_EXPORTED: Download,
  APPROVAL_GRANTED: CheckSquare,
  APPROVAL_DENIED: CheckSquare,
  PAYMENT_CREATED: DollarSign,
  PAYMENT_REFUNDED: DollarSign,
  PAYMENT_VOIDED: DollarSign,
  PAYMENT_FAILED: AlertTriangle,
  INTEGRATION_UPDATED: Settings,
  WORKFLOW_STARTED: Workflow,
  WORKFLOW_FAILED: AlertTriangle,
};

const ACTION_LABELS: Record<string, string> = {
  SIGN_IN: "Sign In",
  SIGN_IN_FAILED: "Failed Sign In",
  MFA_ENABLED: "MFA Enabled",
  MFA_DISABLED: "MFA Disabled",
  INVITATION_SENT: "Invitation Sent",
  INVITATION_ACCEPTED: "Invitation Accepted",
  ROLE_CREATED: "Role Created",
  ROLE_UPDATED: "Role Updated",
  ROLE_DELETED: "Role Deleted",
  USER_SUSPENDED: "User Suspended",
  USER_ACTIVATED: "User Activated",
  RECORD_VIEWED: "Record Viewed",
  RECORD_EXPORTED: "Data Exported",
  APPROVAL_GRANTED: "Approval Granted",
  APPROVAL_DENIED: "Approval Denied",
  PAYMENT_CREATED: "Payment Created",
  PAYMENT_REFUNDED: "Payment Refunded",
  PAYMENT_VOIDED: "Payment Voided",
  PAYMENT_FAILED: "Payment Failed",
  INTEGRATION_UPDATED: "Integration Updated",
  WORKFLOW_STARTED: "Workflow Started",
  WORKFLOW_FAILED: "Workflow Failed",
  GHL_MAPPING_CREATED: "GHL Mapping Created",
  GHL_MAPPING_UPDATED: "GHL Mapping Updated",
  GHL_MAPPING_DELETED: "GHL Mapping Deleted",
};

const ENTITY_COLORS: Record<string, string> = {
  user: "bg-blue-100 text-blue-700",
  portal_role: "bg-purple-100 text-purple-700",
  ghl_role_mapping: "bg-teal-100 text-teal-700",
  contact: "bg-green-100 text-green-700",
  maintenance_request: "bg-orange-100 text-orange-700",
  payment: "bg-yellow-100 text-yellow-700",
  workflow: "bg-pink-100 text-pink-700",
  integration: "bg-gray-100 text-gray-700",
};

export default function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterSeverity, setFilterSeverity] = useState<string>("");
  const [filterSuccess, setFilterSuccess] = useState<string>("");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const response = await fetch("/api/admin/audit");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEvents(result.data || []);
        }
      } else {
        setEvents(getDefaultEvents());
      }
    } catch (error) {
      console.error("Error loading audit events:", error);
      setEvents(getDefaultEvents());
    } finally {
      setIsLoading(false);
    }
  }

  function getDefaultEvents(): AuditEvent[] {
    const now = new Date();
    return [
      {
        id: "1",
        timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        userId: "user_1",
        userName: "Admin User",
        userEmail: "admin@example.com",
        action: "ROLE_UPDATED",
        entityType: "portal_role",
        entityId: "role_1",
        entityName: "Management Staff",
        details: { reason: "Added maintenance approval rights", changes: { permissions: "updated" } },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        severity: "info",
      },
      {
        id: "2",
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        userId: "user_2",
        userName: "John Smith",
        userEmail: "john@example.com",
        action: "SIGN_IN",
        entityType: "user",
        entityId: "user_2",
        entityName: "John Smith",
        details: { method: "email_password", mfa: true },
        ipAddress: "192.168.1.105",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        severity: "info",
      },
      {
        id: "3",
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        userId: "user_3",
        userName: "Jane Doe",
        userEmail: "jane@example.com",
        action: "APPROVAL_GRANTED",
        entityType: "maintenance_request",
        entityId: "mr_123",
        entityName: "HVAC Repair - Unit 205",
        details: { amount: 1250, vendor: "Cool Air Services" },
        ipAddress: "192.168.1.110",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)",
        severity: "info",
      },
      {
        id: "4",
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        userId: "user_1",
        userName: "Admin User",
        userEmail: "admin@example.com",
        action: "PAYMENT_REFUNDED",
        entityType: "payment",
        entityId: "pay_456",
        entityName: "Payment #456",
        details: { amount: 299.99, reason: "Customer request" },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        severity: "warning",
      },
      {
        id: "5",
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        userId: "unknown",
        userName: "Unknown",
        userEmail: "-",
        action: "SIGN_IN_FAILED",
        entityType: "user",
        entityId: "-",
        entityName: "-",
        details: { email: "hacker@evil.com", reason: "Invalid password" },
        ipAddress: "203.0.113.45",
        userAgent: "Mozilla/5.0 (compatible; Bot/1.0)",
        severity: "error",
      },
      {
        id: "6",
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        userId: "user_4",
        userName: "Bob Wilson",
        userEmail: "bob@example.com",
        action: "RECORD_EXPORTED",
        entityType: "contact",
        entityId: "all",
        entityName: "All Contacts",
        details: { record_count: 156, format: "CSV" },
        ipAddress: "192.168.1.120",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        severity: "warning",
      },
      {
        id: "7",
        timestamp: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        userId: "user_1",
        userName: "Admin User",
        userEmail: "admin@example.com",
        action: "INTEGRATION_UPDATED",
        entityType: "integration",
        entityId: "ghl",
        entityName: "GoHighLevel",
        details: { setting: "webhook_url", previous: "old_url", new: "new_url" },
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        severity: "info",
      },
      {
        id: "8",
        timestamp: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
        userId: "system",
        userName: "System",
        userEmail: "system@localhost",
        action: "WORKFLOW_FAILED",
        entityType: "workflow",
        entityId: "wf_123",
        entityName: "Payment Notification",
        details: { error: "GHL API timeout", retry_count: 3 },
        ipAddress: "127.0.0.1",
        userAgent: "System/1.0",
        severity: "error",
      },
    ];
  }

  function toggleExpand(eventId: string) {
    setExpandedEvent(expandedEvent === eventId ? null : eventId);
  }

  function getSeverityColor(severity: string): string {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "error":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  }

  async function handleExport() {
    const csv = [
      ["Timestamp", "User", "Action", "Entity Type", "Entity", "Severity", "IP Address"].join(","),
      ...filteredEvents.map((e) =>
        [
          new Date(e.timestamp).toISOString(),
          `"${e.userName}"`,
          e.action,
          e.entityType,
          `"${e.entityName}"`,
          e.severity,
          e.ipAddress,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchQuery === "" ||
      event.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.entityName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = filterAction === "" || event.action === filterAction;
    const matchesSeverity = filterSeverity === "" || event.severity === filterSeverity;
    const matchesSuccess = filterSuccess === "" || 
      (filterSuccess === "success" && event.success === true) ||
      (filterSuccess === "failed" && event.success === false);

    return matchesSearch && matchesAction && matchesSeverity && matchesSuccess;
  });

  const uniqueActions = Array.from(new Set(events.map((e) => e.action)));

  const stats = {
    total: events.length,
    info: events.filter((e) => e.severity === "info").length,
    warning: events.filter((e) => e.severity === "warning").length,
    error: events.filter((e) => e.severity === "error" || e.severity === "critical").length,
    success: events.filter((e) => e.success === true).length,
    failed: events.filter((e) => e.success === false).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">Audit Log</h1>
            <p className="text-[var(--secondary-text)] mt-1">System activity and security events</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Total Events</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Success</p>
            <p className="text-2xl font-semibold text-green-600">{stats.success}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Failed</p>
            <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Info</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.info}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Warnings</p>
            <p className="text-2xl font-semibold text-yellow-600">{stats.warning}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Errors</p>
            <p className="text-2xl font-semibold text-red-600">{stats.error}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="input"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {ACTION_LABELS[action] || action}
                </option>
              ))}
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="input"
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={filterSuccess}
              onChange={(e) => setFilterSuccess(e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--border-color)]">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-[var(--secondary-text)]">
                No events found matching your filters
              </div>
            ) : (
              filteredEvents.map((event) => {
                const Icon = ACTION_ICONS[event.action] || FileText;
                return (
                  <div key={event.id} className="hover:bg-[var(--page-background)]">
                    <div
                      className="p-4 flex items-center gap-4 cursor-pointer"
                      onClick={() => toggleExpand(event.id)}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getSeverityColor(event.severity)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[var(--main-text)]">
                            {ACTION_LABELS[event.action] || event.action}
                          </p>
                          <Badge className={ENTITY_COLORS[event.entityType] || "bg-gray-100 text-gray-700"}>
                            {event.entityType}
                          </Badge>
                          <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                          {event.success !== undefined && (
                            <Badge className={event.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                              {event.success ? "Success" : "Failed"}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[var(--secondary-text)] truncate">
                          {event.userName} • {event.entityName}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="text-[var(--secondary-text)]">
                          {new Date(event.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-[var(--secondary-text)]">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {expandedEvent === event.id ? (
                        <ChevronUp className="h-5 w-5 text-[var(--secondary-text)]" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[var(--secondary-text)]" />
                      )}
                    </div>

                    {expandedEvent === event.id && (
                      <div className="px-4 pb-4 pl-16">
                        <div className="bg-[var(--page-background)] rounded-lg p-4 space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-[var(--secondary-text)]">User</p>
                              <p className="font-medium">{event.userName}</p>
                              <p className="text-xs text-[var(--secondary-text)]">{event.userEmail}</p>
                            </div>
                            <div>
                              <p className="text-[var(--secondary-text)]">Entity</p>
                              <p className="font-medium">{event.entityName}</p>
                              <p className="text-xs text-[var(--secondary-text)]">ID: {event.entityId}</p>
                            </div>
                            <div>
                              <p className="text-[var(--secondary-text)]">IP Address</p>
                              <p className="font-medium">{event.ipAddress}</p>
                            </div>
                            <div>
                              <p className="text-[var(--secondary-text)]">Timestamp</p>
                              <p className="font-medium">{new Date(event.timestamp).toLocaleString()}</p>
                            </div>
                          </div>

                          {Object.keys(event.details).length > 0 && (
                            <div>
                              <p className="text-[var(--secondary-text)] text-sm mb-1">Details</p>
                              <pre className="text-xs bg-white p-2 rounded border border-[var(--border-color)] overflow-x-auto">
                                {JSON.stringify(event.details, null, 2)}
                              </pre>
                            </div>
                          )}

                          {(event.beforeValues || event.afterValues) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {event.beforeValues && (
                                <div>
                                  <p className="text-[var(--secondary-text)] text-sm mb-1">Before</p>
                                  <pre className="text-xs bg-white p-2 rounded border border-[var(--border-color)] overflow-x-auto">
                                    {JSON.stringify(event.beforeValues, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {event.afterValues && (
                                <div>
                                  <p className="text-[var(--secondary-text)] text-sm mb-1">After</p>
                                  <pre className="text-xs bg-white p-2 rounded border border-[var(--border-color)] overflow-x-auto">
                                    {JSON.stringify(event.afterValues, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}

                          {event.errorMessage && (
                            <div>
                              <p className="text-red-600 text-sm mb-1">Error</p>
                              <pre className="text-xs bg-red-50 text-red-700 p-2 rounded border border-red-200 overflow-x-auto">
                                {event.errorMessage}
                              </pre>
                            </div>
                          )}

                          <div>
                            <p className="text-[var(--secondary-text)] text-sm mb-1">User Agent</p>
                            <p className="text-xs text-[var(--main-text)] truncate">{event.userAgent}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
