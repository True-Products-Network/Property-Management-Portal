// PL-10: Association Integrations
// Manage GHL integrations for all associations

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link2, RefreshCw, AlertTriangle, CheckCircle, MoreHorizontal, Filter, ExternalLink } from "lucide-react";
import Link from "next/link";

interface GhlConnection {
  id: string;
  association_id: string;
  ghl_location_id: string;
  ghl_location_name: string | null;
  is_active: boolean;
  sync_enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_error: string | null;
  connected_at: string;
  disconnected_at: string | null;
  associations: {
    id: string;
    name: string;
    code: string;
    tenant_id: string;
    tenants: {
      id: string;
      name: string;
    };
  };
}

interface Tenant {
  id: string;
  name: string;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [connections, setConnections] = useState<GhlConnection[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    syncEnabled: 0,
    errors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantFilter = searchParams.get("tenant") || "";
  const statusFilter = searchParams.get("status") || "";

  useEffect(() => {
    loadData();
  }, [tenantFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/platform-login");
        return;
      }

      // Check platform role
      const { data: platformRole } = await supabase
        .from("platform_user_roles")
        .select("role")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .single();

      if (!platformRole) {
        router.push("/unauthorized");
        return;
      }

      // Build query
      let query = supabase
        .from("association_ghl_connections")
        .select(`
          *,
          associations(id, name, code, tenant_id, tenants(id, name))
        `)
        .order("connected_at", { ascending: false });

      if (tenantFilter) {
        query = query.eq("associations.tenant_id", tenantFilter);
      }

      if (statusFilter === "active") {
        query = query.eq("is_active", true);
      } else if (statusFilter === "inactive") {
        query = query.eq("is_active", false);
      } else if (statusFilter === "error") {
        query = query.eq("last_sync_status", "error");
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setConnections(data || []);

      // Get tenants for filter
      const { data: tenantsData } = await supabase
        .from("tenants")
        .select("id, name")
        .order("name");

      setTenants(tenantsData || []);

      // Get counts
      const { count: totalCount } = await supabase
        .from("association_ghl_connections")
        .select("*", { count: "exact", head: true });

      const { count: activeCount } = await supabase
        .from("association_ghl_connections")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      const { count: syncEnabledCount } = await supabase
        .from("association_ghl_connections")
        .select("*", { count: "exact", head: true })
        .eq("sync_enabled", true);

      const { count: errorCount } = await supabase
        .from("association_ghl_connections")
        .select("*", { count: "exact", head: true })
        .eq("last_sync_status", "error");

      setStats({
        total: totalCount || 0,
        active: activeCount || 0,
        syncEnabled: syncEnabledCount || 0,
        errors: errorCount || 0,
      });
    } catch (e) {
      console.error("Error fetching integrations:", e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/platform/integrations?${params.toString()}`);
  };

  const getStatusBadge = (connection: GhlConnection) => {
    if (!connection.is_active) {
      return <Badge variant="outline" className="text-gray-500">Disconnected</Badge>;
    }
    if (connection.last_sync_status === "error") {
      return <Badge variant="destructive">Error</Badge>;
    }
    if (connection.last_sync_status === "success") {
      return <Badge className="bg-green-600">Connected</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  const getLastSyncText = (connection: GhlConnection) => {
    if (!connection.last_sync_at) {
      return <span className="text-gray-400">Never</span>;
    }
    const date = new Date(connection.last_sync_at);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return <span className="text-green-600">Just now</span>;
    } else if (diffHours < 24) {
      return <span className="text-gray-600">{Math.round(diffHours)} hours ago</span>;
    } else {
      return <span className="text-gray-600">{date.toLocaleDateString()}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Association Integrations</h1>
          <p className="text-gray-500">Manage GoHighLevel integrations across all associations</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/platform/integrations/logs">
            <ExternalLink className="mr-2 h-4 w-4" />
            View Sync Logs
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading integrations.</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Connections</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Link2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sync Enabled</p>
              <p className="text-2xl font-bold text-blue-600">{stats.syncEnabled}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Errors</p>
              <p className="text-2xl font-bold text-red-600">{stats.errors}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={tenantFilter}
            onChange={(e) => updateFilter("tenant", e.target.value)}
          >
            <option value="">All Tenants</option>
            {tenants?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={statusFilter}
            onChange={(e) => updateFilter("status", e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="error">Error</option>
          </select>

          {(tenantFilter || statusFilter) && (
            <Link
              href="/platform/integrations"
              className="text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </Link>
          )}
        </div>
      </div>

      {/* Connections Table */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : connections.length === 0 ? (
          <div className="p-8 text-center">
            <Link2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No integrations found</p>
            <p className="text-sm text-gray-400 mt-1">
              Associations will appear here when they connect their GHL account
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Association</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>GHL Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sync</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.map((connection) => (
                <TableRow key={connection.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{connection.associations?.name}</p>
                      <p className="text-sm text-gray-500">{connection.associations?.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{connection.associations?.tenants?.name}</p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{connection.ghl_location_name || "Unknown"}</p>
                      <p className="text-xs text-gray-500 font-mono">{connection.ghl_location_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(connection)}</TableCell>
                  <TableCell>
                    <Switch 
                      checked={connection.sync_enabled} 
                      disabled={!connection.is_active}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      {getLastSyncText(connection)}
                      {connection.last_error && (
                        <p className="text-xs text-red-600 truncate max-w-xs" title={connection.last_error}>
                          {connection.last_error}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/platform/integrations/${connection.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Force Sync
                        </DropdownMenuItem>
                        {connection.is_active ? (
                          <DropdownMenuItem className="text-red-600">
                            Disconnect
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-green-600">
                            Reconnect
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Sync Status Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">Sync Status Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-600">Connected</Badge>
            <span className="text-gray-600">Active and syncing</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Pending</Badge>
            <span className="text-gray-600">Connected but no sync yet</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Error</Badge>
            <span className="text-gray-600">Last sync failed</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-gray-500">Disconnected</Badge>
            <span className="text-gray-600">Integration disabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
