// PL-09: Platform Users
// Manage platform admin and support users

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
import { Plus, Shield, UserX, Users } from "lucide-react";
import Link from "next/link";

interface PlatformUser {
  id: string;
  role: string;
  granted_at: string;
  granted_by: string | null;
  revoked_at: string | null;
  user_id: string;
}

interface UserDetails {
  id: string;
  email: string;
  raw_user_meta_data?: {
    full_name?: string;
  };
}

export default async function PlatformUsersPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform-login");
  }

  // Check if user is platform admin (only admins can manage platform users)
  const { data: platformRole } = await supabase
    .from("platform_user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .single();

  if (!platformRole || platformRole.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  // Get all platform users
  const { data: platformUsers, error } = await supabase
    .from("platform_user_roles")
    .select("*")
    .order("granted_at", { ascending: false });

  if (error) {
    console.error("Error fetching platform users:", error);
  }

  // Get user details - since we can't query auth.users directly,
  // we'll use the session user's info and fetch other details via API if needed
  // For now, we'll show what we can from the platform_user_roles table
  // and use a separate API call to get user details
  const userIds = platformUsers?.map((u: PlatformUser) => u.user_id) || [];
  let userDetails: Record<string, UserDetails> = {};
  
  // Add current user to details
  if (user) {
    userDetails[user.id] = {
      id: user.id,
      email: user.email || "",
      raw_user_meta_data: user.user_metadata as { full_name?: string },
    };
  }
  
  // For other users, we'll need to fetch via an API route since we can't access auth.users directly
  // For now, we'll show the user_id as a fallback
  platformUsers?.forEach((pu: PlatformUser) => {
    if (!userDetails[pu.user_id]) {
      userDetails[pu.user_id] = {
        id: pu.user_id,
        email: `User ID: ${pu.user_id.substring(0, 8)}...`,
      };
    }
  });

  // Get counts
  const { count: totalCount } = await supabase
    .from("platform_user_roles")
    .select("*", { count: "exact", head: true });

  const { count: adminCount } = await supabase
    .from("platform_user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "PLATFORM_ADMIN")
    .is("revoked_at", null);

  const { count: supportCount } = await supabase
    .from("platform_user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "PLATFORM_SUPPORT")
    .is("revoked_at", null);

  const { count: revokedCount } = await supabase
    .from("platform_user_roles")
    .select("*", { count: "exact", head: true })
    .not("revoked_at", "is", null);

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

  const activeUsers = (platformUsers || []).filter((u: PlatformUser) => !u.revoked_at);
  const revokedUsers = (platformUsers || []).filter((u: PlatformUser) => u.revoked_at);

  const getUserDisplay = (userId: string) => {
    const details = userDetails[userId];
    return {
      name: details?.raw_user_meta_data?.full_name || details?.email || "Unknown",
      email: details?.email || "No email",
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Users</h1>
          <p className="text-gray-500">Manage platform administrators and support staff</p>
        </div>
        <Button asChild>
          <Link href="/platform/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Platform User
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{totalCount || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-red-600">{adminCount || 0}</p>
            </div>
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Support Staff</p>
              <p className="text-2xl font-bold text-blue-600">{supportCount || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Revoked</p>
              <p className="text-2xl font-bold text-gray-600">{revokedCount || 0}</p>
            </div>
            <UserX className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Active Users ({activeUsers.length})</h2>
        </div>
        {activeUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No active platform users</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeUsers.map((platformUser: PlatformUser) => {
                const userDisplay = getUserDisplay(platformUser.user_id);
                return (
                  <TableRow key={platformUser.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{userDisplay.name}</p>
                        <p className="text-sm text-gray-500">{userDisplay.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(platformUser.role)}</TableCell>
                    <TableCell>
                      <div>
                        <p>{new Date(platformUser.granted_at).toLocaleDateString()}</p>
                        {platformUser.granted_by && (
                          <p className="text-xs text-gray-500">
                            by {userDetails[platformUser.granted_by]?.email || "System"}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(platformUser.revoked_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/platform/users/${platformUser.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        {platformUser.user_id !== user.id && (
                          <form action={`/api/platform/users/${platformUser.id}/revoke`} method="POST">
                            <Button type="submit" variant="ghost" size="sm" className="text-red-600">
                              <UserX className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Revoked Users */}
      {revokedUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-600">Revoked Access ({revokedUsers.length})</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Granted</TableHead>
                <TableHead>Revoked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revokedUsers.map((platformUser: PlatformUser) => {
                const userDisplay = getUserDisplay(platformUser.user_id);
                return (
                  <TableRow key={platformUser.id} className="opacity-60">
                    <TableCell>
                      <div>
                        <p className="font-medium">{userDisplay.name}</p>
                        <p className="text-sm text-gray-500">{userDisplay.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(platformUser.role)}</TableCell>
                    <TableCell>
                      {new Date(platformUser.granted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {platformUser.revoked_at && (
                        <span className="text-red-600">
                          {new Date(platformUser.revoked_at).toLocaleDateString()}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Platform Roles</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Platform Admin:</strong> Full access to all platform features, can manage tenants, plans, and other platform users.</p>
          <p><strong>Platform Support:</strong> Can view tenant data and access support sessions, but cannot modify platform settings or manage users.</p>
        </div>
      </div>
    </div>
  );
}
