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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Shield, UserX, MoreHorizontal, Users } from "lucide-react";
import Link from "next/link";

interface PlatformUser {
  id: string;
  role: string;
  granted_at: string;
  granted_by: string | null;
  revoked_at: string | null;
  user_id: string;
  users?: {
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  grantedByUser?: {
    email: string;
  };
}

export default async function PlatformUsersPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform/login");
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

  // Get all platform users with their auth details
  const { data: platformUsers, error } = await supabase
    .from("platform_user_roles")
    .select(`
      *,
      users:user_id(email, user_metadata)
    `)
    .order("granted_at", { ascending: false });

  if (error) {
    console.error("Error fetching platform users:", error);
  }

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
          <h2 className="text-lg font-semibold">Active Users</h2>
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
              {activeUsers.map((platformUser: PlatformUser) => (
                <TableRow key={platformUser.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {platformUser.users?.user_metadata?.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">{platformUser.users?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(platformUser.role)}</TableCell>
                  <TableCell>
                    <div>
                      <p>{new Date(platformUser.granted_at).toLocaleDateString()}</p>
                      {platformUser.granted_by && (
                        <p className="text-xs text-gray-500">
                          by {platformUser.grantedByUser?.email || "System"}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(platformUser.revoked_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => window.location.href = `/platform/users/${platformUser.id}`}>
                          View Details
                        </DropdownMenuItem>
                        {platformUser.user_id !== user.id && (
                          <DropdownMenuItem className="text-red-600">
                            <UserX className="mr-2 h-4 w-4" />
                            Revoke Access
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Revoked Users */}
      {revokedUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-600">Revoked Access</h2>
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
              {revokedUsers.map((platformUser: PlatformUser) => (
                <TableRow key={platformUser.id} className="opacity-60">
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {platformUser.users?.user_metadata?.full_name || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">{platformUser.users?.email}</p>
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
              ))}
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
