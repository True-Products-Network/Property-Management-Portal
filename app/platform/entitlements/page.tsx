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
  const featureFilter = searchParams.feature as string | undefined;
  const typeFilter = searchParams.type as string | undefined;

  // Fetch entitlements with error handling
  let entitlements: Entitlement[] = [];
  let fetchError = null;
  
  try {
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

    const { data, error } = await query;
    
    if (error) {
      console.error("Error fetching entitlements:", error);
      fetchError = error;
    } else {
      entitlements = data || [];
    }
  } catch (e) {
    console.error("Exception fetching entitlements:", e);
    fetchError = e;
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
            <Plus className="h-4 w-4 mr-2" />
            Add Entitlement
          </Link>
        </Button>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading entitlements. Please check database permissions.</p>
          <p className="text-red-600 text-sm mt-1">{String(fetchError)}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        {/* Tenant Filter */}
        <select 
          className="border rounded-md px-3 py-1 text-sm"
          name="tenant"
        >
          <option value="">All Tenants</option>
          {tenants?.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {/* Feature Filter */}
        <select 
          className="border rounded-md px-3 py-1 text-sm"
          name="feature"
        >
          <option value="">All Features</option>
          {features?.map((f: any) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select 
          className="border rounded-md px-3 py-1 text-sm"
          name="type"
        >
          <option value="">All Types</option>
          <option value="addon">Add-on</option>
          <option value="override">Override</option>
          <option value="trial">Trial</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold">{totalCount || 0}</p>
          <p className="text-sm text-gray-500">Total Entitlements</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold">{addonCount || 0}</p>
          <p className="text-sm text-gray-500">Add-ons</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold">{overrideCount || 0}</p>
          <p className="text-sm text-gray-500">Overrides</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-2xl font-bold">{trialCount || 0}</p>
          <p className="text-sm text-gray-500">Trials</p>
        </div>
      </div>

      {/* Entitlements Table */}
      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Limit</TableHead>
              <TableHead>Dates</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entitlements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No entitlements found</p>
                </TableCell>
              </TableRow>
            ) : (
              entitlements.map((ent: Entitlement) => (
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
                    {ent.limit_value !== null ? ent.limit_value : "Unlimited"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>From: {new Date(ent.effective_date).toLocaleDateString()}</p>
                      {ent.expiration_date && (
                        <p className="text-red-600">
                          Until: {new Date(ent.expiration_date).toLocaleDateString()}
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
