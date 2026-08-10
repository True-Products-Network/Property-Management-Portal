// PL-02: Business Accounts List
// Searchable tenant list with status, plan, usage, and support alerts

import { createClient } from "@/lib/supabase/server";
import { TenantsTable } from "@/components/platform/TenantsTable";
import { TenantsFilter } from "@/components/platform/TenantsFilter";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const status = searchParams.status as string | undefined;
  const search = searchParams.search as string | undefined;

  // Build query
  let query = supabase
    .from("tenants")
    .select(`
      *,
      tenant_subscriptions(
        status,
        plan_id,
        effective_date,
        grace_period_ends_at,
        plans(name, code)
      )
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data: tenants, error } = await query;

  if (error) {
    console.error("Error fetching tenants:", error);
  }

  // Get counts for filters
  const { count: totalCount } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true });

  const { count: activeCount } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: pastDueCount } = await supabase
    .from("tenant_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "past_due");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Accounts</h1>
          <p className="text-gray-500">Manage all tenant accounts on the platform</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-white">
            <Link href="/platform/tenants/new">
              <Plus className="mr-2 h-4 w-4" />
              Provision New Tenant
            </Link>
          </Button>
        </div>
      </div>

      <TenantsFilter
        totalCount={totalCount || 0}
        activeCount={activeCount || 0}
        pastDueCount={pastDueCount || 0}
        currentStatus={status}
      />

      <TenantsTable tenants={tenants || []} />
    </div>
  );
}
