// PL-04: Edit Tenant
// Load existing tenant data and use TenantForm for editing

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TenantForm } from "@/components/platform/TenantForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import Link from "next/link";

interface EditTenantPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTenantPage({ params }: EditTenantPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform-login");
  }

  // Check if user is platform admin (only admins can edit tenants)
  const { data: platformRole } = await supabase
    .from("platform_user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .single();

  if (!platformRole || platformRole.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Fetch tenant details
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select(`
      *,
      tenant_subscriptions(plan_id)
    `)
    .eq("id", id)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const subscription = tenant.tenant_subscriptions?.[0];

  const initialData = {
    name: tenant.name,
    code: tenant.code,
    status: tenant.status,
    primaryEmail: tenant.primary_email || "",
    primaryPhone: tenant.primary_phone || "",
    billingEmail: tenant.billing_email || "",
    timezone: tenant.timezone,
    locale: tenant.locale,
    planId: subscription?.plan_id || "",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/platform/tenants/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Edit Tenant</h1>
          </div>
          <p className="text-gray-500 mt-1">
            Update settings for {tenant.name}
          </p>
        </div>
      </div>

      <TenantForm tenantId={id} initialData={initialData} />
    </div>
  );
}
