// PL-08: Usage & Limits
// Display tenant usage across all features with visual indicators

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, AlertTriangle, BarChart3, Filter } from "lucide-react";
import Link from "next/link";

interface UsageRecord {
  id: string;
  feature_code: string;
  current_count: number;
  limit_value: number | null;
  period_start: string;
  period_end: string;
  last_updated: string;
  tenants: {
    id: string;
    name: string;
    code: string;
  };
}

export default async function UsagePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform-login");
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

  const tenantFilter = searchParams.tenant as string | undefined;
  const statusFilter = searchParams.status as string | undefined;

  // Build query
  let query = supabase
    .from("tenant_usage")
    .select(`
      *,
      tenants(id, name, code)
    `)
    .order("last_updated", { ascending: false });

  if (tenantFilter) {
    query = query.eq("tenant_id", tenantFilter);
  }

  const { data: usage, error } = await query;

  if (error) {
    console.error("Error fetching usage:", error);
  }

  // Get tenants for filter
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, code")
    .order("name");

  // Calculate statistics
  const usageRecords = (usage || []) as UsageRecord[];
  const totalRecords = usageRecords.length;
  
  const withLimits = usageRecords.filter(u => u.limit_value !== null);
  const approachingLimit = withLimits.filter(u => {
    if (!u.limit_value) return false;
    const percentage = (u.current_count / u.limit_value) * 100;
    return percentage >= 80 && percentage < 100;
  });
  
  const overLimit = withLimits.filter(u => {
    if (!u.limit_value) return false;
    return u.current_count > u.limit_value;
  });

  const getUsagePercentage = (current: number, limit: number | null) => {
    if (!limit) return null;
    return Math.min(100, Math.round((current / limit) * 100));
  };

  const getUsageStatus = (current: number, limit: number | null) => {
    if (!limit) return { label: "Unlimited", variant: "secondary" as const };
    const percentage = (current / limit) * 100;
    if (percentage > 100) return { label: "Over Limit", variant: "destructive" as const };
    if (percentage >= 90) return { label: "Critical", variant: "destructive" as const };
    if (percentage >= 80) return { label: "Warning", variant: "default" as const };
    return { label: "Good", variant: "outline" as const };
  };

  const filteredUsage = usageRecords.filter((record) => {
    if (!statusFilter) return true;
    const status = getUsageStatus(record.current_count, record.limit_value);
    if (statusFilter === "over") return status.label === "Over Limit";
    if (statusFilter === "warning") return status.label === "Warning" || status.label === "Critical";
    if (statusFilter === "good") return status.label === "Good";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usage & Limits</h1>
          <p className="text-gray-500">Monitor tenant feature usage across the platform</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-2xl font-bold">{totalRecords}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">With Limits</p>
              <p className="text-2xl font-bold">{withLimits.length}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold">L</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approaching Limit</p>
              <p className="text-2xl font-bold text-yellow-600">{approachingLimit.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Over Limit</p>
              <p className="text-2xl font-bold text-red-600">{overLimit.length}</p>
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
            defaultValue={tenantFilter || ""}
          >
            <option value="">All Tenants</option>
            {tenants?.map((t: { id: string; name: string }) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            defaultValue={statusFilter || ""}
          >
            <option value="">All Status</option>
            <option value="good">Good</option>
            <option value="warning">Warning</option>
            <option value="over">Over Limit</option>
          </select>

          {(tenantFilter || statusFilter) && (
            <Link
              href="/platform/usage"
              className="text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </Link>
          )}
        </div>
      </div>

      {/* Usage Table */}
      <div className="bg-white rounded-lg shadow">
        {filteredUsage.length === 0 ? (
          <div className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No usage records found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsage.map((record: UsageRecord) => {
                const percentage = getUsagePercentage(record.current_count, record.limit_value);
                const status = getUsageStatus(record.current_count, record.limit_value);
                
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.tenants?.name}</p>
                        <p className="text-sm text-gray-500">{record.tenants?.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{record.feature_code}</p>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">{record.current_count.toLocaleString()}</span>
                        {record.limit_value && (
                          <span className="text-gray-500"> / {record.limit_value.toLocaleString()}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-48">
                      {percentage !== null ? (
                        <div className="space-y-1">
                          <Progress 
                            value={percentage} 
                            className="h-2"
                          />
                          <p className="text-xs text-gray-500 text-right">{percentage}%</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No limit</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={status.variant}
                        className={status.label === "Critical" ? "bg-red-600" : ""}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(record.period_start).toLocaleDateString()}</p>
                        <p className="text-gray-500">to {new Date(record.period_end).toLocaleDateString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(record.last_updated).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">Usage Status Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Good</Badge>
            <span className="text-gray-600">Below 80% of limit</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge>Warning</Badge>
            <span className="text-gray-600">80-90% of limit</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Critical</Badge>
            <span className="text-gray-600">90-100% of limit</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive">Over Limit</Badge>
            <span className="text-gray-600">Exceeded limit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
