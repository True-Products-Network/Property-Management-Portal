// PL-11: Platform Audit Log
// Full audit log with filters and export

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
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

  const actorFilter = searchParams.actor as string | undefined;
  const actionFilter = searchParams.action as string | undefined;
  const categoryFilter = searchParams.category as string | undefined;
  const tenantFilter = searchParams.tenant as string | undefined;
  const dateFrom = searchParams.from as string | undefined;
  const dateTo = searchParams.to as string | undefined;

  // Build query
  let query = supabase
    .from("platform_audit_events")
    .select(`
      *,
      tenants(id, name, code)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (actorFilter) {
    query = query.eq("actor_id", actorFilter);
  }

  if (actionFilter) {
    query = query.eq("action", actionFilter);
  }

  if (categoryFilter) {
    query = query.eq("action_category", categoryFilter);
  }

  if (tenantFilter) {
    query = query.eq("tenant_id", tenantFilter);
  }

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }

  if (dateTo) {
    query = query.lte("created_at", dateTo + "T23:59:59");
  }

  const { data: events, error } = await query;

  if (error) {
    console.error("Error fetching audit events:", error);
  }

  // Get tenants for filter
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, code")
    .order("name");

  // Get unique categories
  const categories = [
    { value: "tenant", label: "Tenant" },
    { value: "plan", label: "Plan" },
    { value: "entitlement", label: "Entitlement" },
    { value: "support", label: "Support" },
    { value: "integration", label: "Integration" },
    { value: "security", label: "Security" },
  ];

  // Get counts by category
  const { data: categoryCounts } = await supabase
    .from("platform_audit_events")
    .select("action_category", { count: "exact" })
    .group("action_category");

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      tenant: "default",
      plan: "secondary",
      entitlement: "outline",
      support: "default",
      integration: "secondary",
      security: "destructive",
    };
    return <Badge variant={colors[category] || "default"}>{category}</Badge>;
  };

  const getActorBadge = (actorType: string) => {
    if (actorType === "platform_admin") {
      return <Badge className="bg-red-600">Admin</Badge>;
    }
    if (actorType === "platform_support") {
      return <Badge variant="secondary">Support</Badge>;
    }
    return <Badge variant="outline">System</Badge>;
  };

  const formatValue = (value: Record<string, unknown> | null) => {
    if (!value) return null;
    const entries = Object.entries(value).slice(0, 3);
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
          <Download className="mr-2 h-4 w-4" />
          Export Audit Data
        </Button>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => {
          const count = (categoryCounts || []).find(
            (c: { action_category: string }) => c.action_category === cat.value
          );
          return (
            <div key={cat.value} className="bg-white rounded-lg shadow p-3">
              <p className="text-xs text-gray-500 uppercase">{cat.label}</p>
              <p className="text-xl font-bold">{count ? "1" : "0"}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tenant</label>
            <select
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              defaultValue={tenantFilter || ""}
            >
              <option value="">All Tenants</option>
              {tenants?.map((t: { id: string; name: string }) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Category</label>
            <select
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              defaultValue={categoryFilter || ""}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Action</label>
            <input
              type="text"
              placeholder="Filter by action..."
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              defaultValue={actionFilter || ""}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Actor ID</label>
            <input
              type="text"
              placeholder="User ID..."
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              defaultValue={actorFilter || ""}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">From Date</label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              defaultValue={dateFrom || ""}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">To Date</label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-1.5 text-sm"
              defaultValue={dateTo || ""}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button size="sm">Apply Filters</Button>
          {(actorFilter || actionFilter || categoryFilter || tenantFilter || dateFrom || dateTo) && (
            <Link
              href="/platform/audit"
              className="text-sm text-blue-600 hover:underline"
            >
              Clear all filters
            </Link>
          )}
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-lg shadow">
        {(events || []).length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No audit events found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(events || []).map((event: AuditEvent) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        {new Date(event.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-400" />
                        {getActorBadge(event.actor_type)}
                        {event.actor_id && (
                          <span className="text-xs text-gray-500 font-mono">
                            {event.actor_id.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(event.action_category)}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {event.action}
                      </code>
                    </TableCell>
                    <TableCell>
                      {event.tenants ? (
                        <Link 
                          href={`/platform/tenants/${event.tenant_id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {event.tenants.name}
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.target_type && event.target_id ? (
                        <div className="text-xs">
                          <span className="text-gray-500">{event.target_type}:</span>
                          <br />
                          <span className="font-mono">{event.target_id.substring(0, 16)}...</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {event.previous_value && (
                          <div className="text-xs text-red-600 truncate" title={JSON.stringify(event.previous_value)}>
                            - {formatValue(event.previous_value)}
                          </div>
                        )}
                        {event.new_value && (
                          <div className="text-xs text-green-600 truncate" title={JSON.stringify(event.new_value)}>
                            + {formatValue(event.new_value)}
                          </div>
                        )}
                        {event.reason && (
                          <div className="text-xs text-gray-500 mt-1 italic">
                            Reason: {event.reason}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <p>Showing last 100 events</p>
        <p>For full export, use the Export button above</p>
      </div>
    </div>
  );
}
