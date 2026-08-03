// PL-04: Provision Tenant
// Create new tenant with subscription

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TenantForm } from "@/components/platform/TenantForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import Link from "next/link";

export default async function NewTenantPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform/login");
  }

  // Check if user is platform admin (only admins can create tenants)
  const { data: platformRole } = await supabase
    .from("platform_user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .single();

  if (!platformRole || platformRole.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/platform/tenants">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Provision New Tenant</h1>
          </div>
          <p className="text-gray-500 mt-1">
            Create a new business account with subscription
          </p>
        </div>
      </div>

      <TenantForm />
    </div>
  );
}
