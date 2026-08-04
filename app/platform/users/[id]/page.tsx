// PL-09: Platform User Detail
// View details of a platform user

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft, Shield, UserX, Calendar, Mail, User } from "lucide-react";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getUserDetails(userId: string) {
  try {
    const serviceClient = createServiceClient();
    const { data, error } = await serviceClient.auth.admin.getUserById(userId);
    
    if (error || !data.user) {
      return null;
    }
    
    return {
      email: data.user.email || "",
      full_name: data.user.user_metadata?.full_name,
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
}

export default async function PlatformUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    redirect("/platform-login");
  }

  // Check if user is platform admin
  const { data: platformRole } = await supabase
    .from("platform_user_roles")
    .select("role")
    .eq("user_id", currentUser.id)
    .is("revoked_at", null)
    .single();

  if (!platformRole || platformRole.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Get the platform user role
  const { data: platformUser, error } = await supabase
    .from("platform_user_roles")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !platformUser) {
    notFound();
  }

  // Get user details
  const userDetails = await getUserDetails(platformUser.user_id);
  
  // Get granted by user details if available
  let grantedByDetails = null;
  if (platformUser.granted_by) {
    grantedByDetails = await getUserDetails(platformUser.granted_by);
  }

  const getRoleBadge = (role: string) => {
    if (role === "PLATFORM_ADMIN") {
      return <Badge className="bg-red-600">Admin</Badge>;
    }
    return <Badge variant="secondary">Support</Badge>;
  };

  const getStatusBadge = (revokedAt: string | null) => {
    if (revokedAt) {
      return <Badge variant="outline" className="text-gray-500">Revoked</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/platform/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform User Details</h1>
        <p className="text-gray-500">View user information and access history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{userDetails?.full_name || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{userDetails?.email || "Unknown"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-medium font-mono text-sm">{platformUser.user_id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <div className="mt-1">{getRoleBadge(platformUser.role)}</div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="mt-1">{getStatusBadge(platformUser.revoked_at)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Access History Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Access History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Granted At</p>
              <p className="font-medium">
                {new Date(platformUser.granted_at).toLocaleString()}
              </p>
            </div>
            {platformUser.granted_by && (
              <div>
                <p className="text-sm text-gray-500">Granted By</p>
                <p className="font-medium">
                  {grantedByDetails?.full_name || grantedByDetails?.email || "Unknown"}
                </p>
                <p className="text-xs text-gray-500 font-mono">{platformUser.granted_by}</p>
              </div>
            )}
            {platformUser.revoked_at && (
              <div>
                <p className="text-sm text-gray-500">Revoked At</p>
                <p className="font-medium text-red-600">
                  {new Date(platformUser.revoked_at).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {platformUser.user_id !== currentUser.id && !platformUser.revoked_at && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Revoking access will immediately remove this user&apos;s platform privileges. 
              They will no longer be able to access the platform admin area.
            </p>
            <form action={`/api/platform/users/${platformUser.id}/revoke`} method="POST">
              <Button type="submit" variant="destructive">
                <UserX className="h-4 w-4 mr-2" />
                Revoke Platform Access
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
