// PL-07: Entitlements & Add-ons
// Manage tenant entitlements and feature add-ons

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
import { Plus, Filter, Package } from "lucide-react";
import Link from "next/link";

interface Entitlement {
  id: string;
  entitlement_type: string;
  is_enabled: boolean;
  limit_value: number | null;
  effective_date: string;
  expiration_date: string | null;
  reason: string | null;
  created_at: string;
  tenants: {
    id: string;
    name: string;
    code: string;
  };
  features: {
    id: string;
    code: string;
    name: string;
    category: string;
  };
}

export default async function EntitlementsPage({
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

  const tenantFilter = searchParams.tenant as string | undefined;
  const featureFilter = searchParams.feature as string | undefined;
  const typeFilter = searchParams.type as string | undefined;

  // Build query
  let query = supabase
    .from("tenant_entitlements")
    .select(`
      *,
      tenants(id, name, code),
      features(id, code, name, category)
    `)
    .order("created_at", { ascending: false });

  if (tenantFilter) {
    query = query.eq("tenant_id", tenantFilter);
  }

  if (featureFilter) {
    query = query.eq("feature_id", featureFilter);
  }

  if (typeFilter) {
    query = query.eq("entitlement_type", typeFilter);
  }

  const { data: entitlements, error } = await query;

  if (error) {
    console.error("Error fetching entitlements:", error);
  }

  // Get tenants for filter
  const { data: tenants } = await supabase
    .from("tenants")
    .select("id, name, code")
    .order("name");

  // Get features for filter
  const { data: features } = await supabase
    .from("features")
    .select("id, code, name, category")
    .eq("is_active", true)
    .order("name");

  // Get counts
  const { count: totalCount } = await supabase
    .from("tenant_entitlements")
    .select("*", { count: "exact", head: true });

  const { count: addonCount } = await supabase
    .from("tenant_entitlements")
    .select("*", { count: "exact", head: true })
    .eq("entitlement_type", "addon");

  const { count: overrideCount } = await supabase
    .from("tenant_entitlements")
    .select("*", { count: "exact", head: true })
    .eq("entitlement_type", "override");

  const { count: trialCount } = await supabase
    .from("tenant_entitlements")
    .select("*", { count: "exact", head: true })
    .eq("entitlement_type", "trial");

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      addon: "default",
      override: "secondary",
      trial: "outline",
    };
    return <Badge variant={variants[type] || "default"}>{type}</Badge>;
  };

  const getStatusBadge = (isEnabled: boolean) => {
    return isEnabled ? (
      <Badge variant="default" className="bg-green-600">Active</Badge>
    ) : (
      <Badge variant="outline" className="text-gray-500">Inactive</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Entitlements & Add-ons</h1>
          <p className="text-gray-500">Manage tenant feature entitlements and add-ons</p>
        </div>
        <Button asChild>
          <Link href="/platform/entitlements/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Entitlement
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Entitlements</p>
          <p className="text-2xl font-bold">{totalCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Add-ons</p>
          <p className="text-2xl font-bold text-blue-600">{addonCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Overrides</p>
          <p className="text-2xl font-bold text-purple-600">{overrideCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Trials</p>
          <p className="text-2xl font-bold text-orange-600">{trialCount || 0}</p>
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
            onChange={(e) => {
              const url = new URL(window.location.href);
              if (e.target.value) {
                url.searchParams.set("tenant", e.target.value);
              } else {
                url.searchParams.delete("tenant");
              }
              window.location.href = url.toString();
            }}
          >
            <option value="">All Tenants</option>
            {tenants?.map((t: { id: string; name: string }) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            defaultValue={featureFilter || ""}
          >
            <option value="">All Features</option>
            {features?.map((f: { id: string; name: string }) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>

          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            defaultValue={typeFilter || ""}
          >
            <option value="">All Types</option>
            <option value="addon">Add-on</option>
            <option value="override">Override</option>
            <option value="trial">Trial</option>
          </select>

          {(tenantFilter || featureFilter || typeFilter) && (
            <Link
              href="/platform/entitlements"
              className="text-sm text-blue-600 hover:underline"
            >
              Clear filters
            </Link>
          )}
        </div>
      </div>

      {/* Entitlements Table */}
      <div className="bg-white rounded-lg shadow">
        {(entitlements || []).length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No entitlements found</p>
            <p className="text-sm text-gray-400 mt-1">
              Add entitlements to grant features to tenants
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Limit</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(entitlements || []).map((ent: Entitlement) => (
                <TableRow key={ent.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{ent.tenants?.name}</p>
                      <p className="text-sm text-gray-500">{ent.tenants?.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{ent.features?.name}</p>
                      <p className="text-sm text-gray-500">{ent.features?.category}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(ent.entitlement_type)}</TableCell>
                  <TableCell>{getStatusBadge(ent.is_enabled)}</TableCell>
                  <TableCell>
                    {ent.limit_value !== null ? ent.limit_value.toLocaleString() : "Unlimited"}
                  </TableCell>
                  <TableCell>
                    {new Date(ent.effective_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {ent.expiration_date ? (
                      <span className={new Date(ent.expiration_date) < new Date() ? "text-red-600" : ""}>
                        {new Date(ent.expiration_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
