// PL-10: Integration Details
// View details of a specific GHL integration

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, RefreshCw, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IntegrationDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform-login");
  }

  // Check platform role
  const { data: platformRole } = await supabase
    .from("platform_user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .single();

  if (!platformRole) {
    redirect("/unauthorized");
  }

  // Fetch the integration
  const { data: connection, error } = await supabase
    .from("association_ghl_credentials")
    .select(`
      *,
      associations(id, name, association_id, tenant_id, tenants(id, name))
    `)
    .eq("id", id)
    .single();

  if (error || !connection) {
    redirect("/platform/integrations");
  }

  const isConnected = !!connection.ghl_location_id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/platform/integrations">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Integrations
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Integration Details</h1>
          <p className="text-gray-500">GHL integration for {connection.associations?.name}</p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isConnected ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-gray-400" />
                <span>Disconnected</span>
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge className={isConnected ? "bg-green-600" : "bg-gray-400"}>
                {isConnected ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">
                {connection.updated_at 
                  ? new Date(connection.updated_at).toLocaleString() 
                  : "Never"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Association Info */}
      <Card>
        <CardHeader>
          <CardTitle>Association</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{connection.associations?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Association ID</p>
              <p className="font-mono text-sm">{connection.associations?.association_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tenant</p>
              <p className="font-medium">{connection.associations?.tenants?.name}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GHL Info */}
      <Card>
        <CardHeader>
          <CardTitle>GoHighLevel Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Location ID</p>
              <p className="font-mono text-sm">{connection.ghl_location_id || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location Name</p>
              <p className="font-medium">{connection.ghl_location_name || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Connected At</p>
              <p className="font-medium">
                {connection.created_at 
                  ? new Date(connection.created_at).toLocaleString() 
                  : "Unknown"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <form action={async () => {
              "use server";
              // Force sync action would go here
              redirect(`/platform/integrations/${id}`);
            }}>
              <Button type="submit" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Force Sync
              </Button>
            </form>

            <form action={async () => {
              "use server";
              const supabase = await createClient();
              await supabase
                .from("association_ghl_credentials")
                .delete()
                .eq("id", id);
              redirect("/platform/integrations");
            }}>
              <Button type="submit" variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Integration
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
