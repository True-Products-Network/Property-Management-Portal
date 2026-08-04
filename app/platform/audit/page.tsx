// PL-11: Platform Audit Log
// Full audit log with filters and export

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Filter, ClipboardList, User, Calendar } from "lucide-react";
import Link from "next/link";

interface AuditEvent {
  id: string;
  actor_id: string | null;
  actor_type: string;
  tenant_id: string | null;
  action: string;
  action_category: string;
  target_type: string | null;
  target_id: string | null;
  previous_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  reason: string | null;
  ip_address: string | null;
  created_at: string;
  tenants?: {
    id: string;
    name: string;
    code: string;
  };
}

interface Tenant {
  id: string;
  name: string;
  code: string;
}

export default function AuditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categoryFilter = searchParams.get("category") || "";
  const tenantFilter = searchParams.get("tenant") || "";
  const actionFilter = searchParams.get("action") || "";

  const categories = ["tenant", "plan", "entitlement", "support", "integration", "security"];

  useEffect(() => {
    loadData();
  }, [categoryFilter, tenantFilter, actionFilter]);

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
        .from("platform_audit_events")
        .select(`
          *,
          tenants(id, name, code)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (categoryFilter) {
        query = query.eq("action_category", categoryFilter);
      }

      if (tenantFilter) {
        query = query.eq("tenant_id", tenantFilter);
      }

      if (actionFilter) {
        query = query.eq("action", actionFilter);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setEvents(data || []);

      // Get tenants for filter
      const { data: tenantsData } = await supabase
        .from("tenants")
        .select("id, name, code")
        .order("name");

      setTenants(tenantsData || []);
    } catch (e) {
      console.error("Error fetching audit events:", e);
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
    router.push(`/platform/audit?${params.toString()}`);
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      tenant: "bg-blue-100 text-blue-800",
      plan: "bg-green-100 text-green-800",
      entitlement: "bg-purple-100 text-purple-800",
      support: "bg-yellow-100 text-yellow-800",
      integration: "bg-pink-100 text-pink-800",
      security: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colors[category] || "bg-gray-100 text-gray-800"}>
        {category}
      </Badge>
    );
  };

  const formatValue = (value: Record<string, unknown> | null) => {
    if (!value) return "-";
    const entries = Object.entries(value);
    if (entries.length === 0) return "-";
    return entries.map(([k, v]) => `${k}: ${String(v).substring(0, 30)}`).join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Audit Log</h1>
          <p className="text-gray-500">Review all platform activity and changes</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading audit log. Please check database permissions.</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Category Filter */}
        <select
          className="border rounded-md px-3 py-1 text-sm"
          value={categoryFilter}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Tenant Filter */}
        <select
          className="border rounded-md px-3 py-1 text-sm"
          value={tenantFilter}
          onChange={(e) => updateFilter("tenant", e.target.value)}
        >
          <option value="">All Tenants</option>
          {tenants?.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {/* Action Filter */}
        <select
          className="border rounded-md px-3 py-1 text-sm"
          value={actionFilter}
          onChange={(e) => updateFilter("action", e.target.value)}
        >
          <option value="">All Actions</option>
          <option value="tenant_created">Tenant Created</option>
          <option value="tenant_updated">Tenant Updated</option>
          <option value="tenant_deleted">Tenant Deleted</option>
          <option value="subscription_created">Subscription Created</option>
          <option value="subscription_updated">Subscription Updated</option>
        </select>

        {(categoryFilter || tenantFilter || actionFilter) && (
          <Link
            href="/platform/audit"
            className="text-sm text-blue-600 hover:underline self-center"
          >
            Clear filters
          </Link>
        )}
      </div>

      {/* Audit Events Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <p className="text-gray-500">Loading...</p>
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No audit events found</p>
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(event.created_at).toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{event.actor_type}</p>
                        <p className="text-xs text-gray-500">{event.actor_id?.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getCategoryBadge(event.action_category)}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {event.action}
                    </code>
                  </TableCell>
                  <TableCell>
                    {event.target_type && (
                      <div>
                        <p className="text-sm">{event.target_type}</p>
                        <p className="text-xs text-gray-500">{event.target_id?.substring(0, 8)}...</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {event.reason && (
                        <p className="text-sm text-gray-600 mb-1">{event.reason}</p>
                      )}
                      {event.new_value && (
                        <p className="text-xs text-gray-400 truncate">
                          {formatValue(event.new_value)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
