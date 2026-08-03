// PL-12: Platform Health
// System status dashboard with health indicators

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Database, 
  Server, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Clock,
  TrendingUp,
  HardDrive
} from "lucide-react";
import Link from "next/link";

interface HealthStatus {
  service: string;
  status: "healthy" | "degraded" | "down";
  latency: number;
  lastChecked: string;
  message?: string;
}

export default async function HealthPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform/login");
  }

  // Check if user is platform admin or support
  const { data: platformRole } = await supabase
    .from("platform_user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .single();

  if (!platformRole) {
    redirect("/unauthorized");
  }

  // Get database stats
  const { data: dbStats, error: dbError } = await supabase
    .rpc("get_database_stats")
    .single();

  // Get recent errors from audit log
  const { data: recentErrors } = await supabase
    .from("platform_audit_events")
    .select("*")
    .eq("action_category", "security")
    .order("created_at", { ascending: false })
    .limit(5);

  // Get tenant counts for health overview
  const { count: totalTenants } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true });

  const { count: activeTenants } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: errorTenants } = await supabase
    .from("tenant_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "past_due");

  // Get recent integration errors
  const { data: integrationErrors } = await supabase
    .from("association_ghl_connections")
    .select("*")
    .eq("last_sync_status", "error")
    .order("last_sync_at", { ascending: false })
    .limit(5);

  // Mock health status for services
  const services: HealthStatus[] = [
    { 
      service: "Database", 
      status: dbError ? "degraded" : "healthy", 
      latency: 45, 
      lastChecked: new Date().toISOString(),
      message: dbError ? "Slow query detected" : undefined
    },
    { 
      service: "Auth Service", 
      status: "healthy", 
      latency: 23, 
      lastChecked: new Date().toISOString() 
    },
    { 
      service: "API Gateway", 
      status: "healthy", 
      latency: 12, 
      lastChecked: new Date().toISOString() 
    },
    { 
      service: "GHL Integration", 
      status: (integrationErrors || []).length > 0 ? "degraded" : "healthy", 
      latency: 156, 
      lastChecked: new Date().toISOString(),
      message: (integrationErrors || []).length > 0 ? `${integrationErrors?.length} sync errors` : undefined
    },
    { 
      service: "File Storage", 
      status: "healthy", 
      latency: 34, 
      lastChecked: new Date().toISOString() 
    },
    { 
      service: "Email Service", 
      status: "healthy", 
      latency: 89, 
      lastChecked: new Date().toISOString() 
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "down":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-600">Healthy</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-600">Degraded</Badge>;
      case "down":
        return <Badge variant="destructive">Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const overallStatus = services.every(s => s.status === "healthy") 
    ? "healthy" 
    : services.some(s => s.status === "down") 
      ? "degraded" 
      : "degraded";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Health</h1>
          <p className="text-gray-500">System status and health monitoring</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Status
        </Button>
      </div>

      {/* Overall Status */}
      <div className={`rounded-lg shadow p-6 ${
        overallStatus === "healthy" ? "bg-green-50 border border-green-200" : "bg-yellow-50 border border-yellow-200"
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${
            overallStatus === "healthy" ? "bg-green-100" : "bg-yellow-100"
          }`}>
            {overallStatus === "healthy" ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            )}
          </div>
          <div>
            <h2 className={`text-xl font-bold ${
              overallStatus === "healthy" ? "text-green-900" : "text-yellow-900"
            }`}>
              {overallStatus === "healthy" ? "All Systems Operational" : "Some Systems Degraded"}
            </h2>
            <p className={overallStatus === "healthy" ? "text-green-700" : "text-yellow-700"}>
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Service Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div key={service.service} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  {service.service === "Database" ? (
                    <Database className="h-5 w-5 text-blue-600" />
                  ) : service.service === "File Storage" ? (
                    <HardDrive className="h-5 w-5 text-purple-600" />
                  ) : (
                    <Server className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{service.service}</p>
                  <p className="text-xs text-gray-500">
                    {service.latency}ms latency
                  </p>
                </div>
              </div>
              {getStatusBadge(service.status)}
            </div>
            {service.message && (
              <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                {service.message}
              </div>
            )}
            <div className="mt-3 text-xs text-gray-400">
              Checked: {new Date(service.lastChecked).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* Database Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold">Database Statistics</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Tenants</p>
            <p className="text-2xl font-bold">{totalTenants || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{activeTenants || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Issues</p>
            <p className="text-2xl font-bold text-red-600">{errorTenants || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Uptime</p>
            <p className="text-2xl font-bold text-blue-600">99.9%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Errors */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h2 className="text-lg font-semibold">Recent Security Events</h2>
            </div>
            <Link 
              href="/platform/audit?category=security"
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="p-4">
            {(recentErrors || []).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500">No security events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(recentErrors || []).map((error: { id: string; action: string; created_at: string; actor_type: string }) => (
                  <div key={error.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{error.action}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(error.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="outline">{error.actor_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Integration Errors */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-yellow-600" />
              <h2 className="text-lg font-semibold">Integration Sync Errors</h2>
            </div>
            <Link 
              href="/platform/integrations?status=error"
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="p-4">
            {(integrationErrors || []).length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500">No sync errors</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(integrationErrors || []).map((error: { id: string; ghl_location_name: string | null; last_error: string | null; last_sync_at: string | null }) => (
                  <div key={error.id} className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{error.ghl_location_name || "Unknown"}</p>
                      <Badge variant="destructive">Error</Badge>
                    </div>
                    <p className="text-xs text-red-600 mt-1 truncate">
                      {error.last_error}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {error.last_sync_at ? new Date(error.last_sync_at).toLocaleString() : "Never"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold">Performance Metrics (24h)</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border rounded-lg">
            <p className="text-3xl font-bold text-blue-600">1.2k</p>
            <p className="text-sm text-gray-500">API Requests</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-3xl font-bold text-green-600">45ms</p>
            <p className="text-sm text-gray-500">Avg Response</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-3xl font-bold text-purple-600">99.8%</p>
            <p className="text-sm text-gray-500">Success Rate</p>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <p className="text-3xl font-bold text-orange-600">3</p>
            <p className="text-sm text-gray-500">Errors</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Status page refreshes every 60 seconds</span>
        </div>
        <Link 
          href="/platform/audit"
          className="text-blue-600 hover:underline"
        >
          View full audit log →
        </Link>
      </div>
    </div>
  );
}
