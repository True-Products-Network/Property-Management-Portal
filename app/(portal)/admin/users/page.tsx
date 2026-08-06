"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Search, Filter, MoreHorizontal, Mail, UserX, UserCheck, Users, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
  status: string;
  createdAt: string;
  lastSignInAt?: string;
  associationId?: string;
  associationName?: string;
  tenantId?: string;
  tenantName?: string;
}

interface Association {
  id: string;
  name: string;
}

interface Tenant {
  id: string;
  name: string;
}

export default function UserMaintenancePage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [associationFilter, setAssociationFilter] = useState("");
  const [tenantFilter, setTenantFilter] = useState("");
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownOpen) {
        setDropdownOpen(null);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  async function updateUserStatus(userId: string, status: string) {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        // Refresh user list
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update user status');
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      alert('Failed to update user status');
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Refresh user list
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  }

  // Fetch associations and check if platform admin
  useEffect(() => {
    async function fetchAssociations() {
      try {
        const res = await fetch("/api/user/associations");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAssociations(data.data || []);
          }
        }
      } catch (err) {
        console.error("Error fetching associations:", err);
      }
    }
    fetchAssociations();

    // Check if user is platform admin
    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const roles = data.user?.user_metadata?.roles || [];
          setIsPlatformAdmin(roles.includes("PLATFORM_ADMIN") || data.user?.user_metadata?.is_platform_admin);
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
      }
    }
    checkAdmin();
  }, []);

  // Fetch tenants for platform admin
  useEffect(() => {
    if (!isPlatformAdmin) return;
    
    async function fetchTenants() {
      try {
        const res = await fetch("/api/platform/tenants");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setTenants(data.data || []);
          }
        }
      } catch (err) {
        console.error("Error fetching tenants:", err);
      }
    }
    fetchTenants();
  }, [isPlatformAdmin]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        
        // Build query URL with filters
        let url = "/api/admin/users";
        const params = new URLSearchParams();
        if (associationFilter) {
          params.append("associationId", associationFilter);
        }
        if (tenantFilter) {
          params.append("tenantId", tenantFilter);
        }
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const usersRes = await fetch(url);

        if (!usersRes.ok) {
          if (usersRes.status === 401) {
            router.push("/access-denied");
            return;
          }
          const errorData = await usersRes.json().catch(() => ({}));
          // Pass through the full error message if available
          const errorMessage = errorData.message || errorData.error || `Failed to fetch users (${usersRes.status})`;
          throw new Error(errorMessage);
        }

        const usersData = await usersRes.json();

        if (!usersData.success) {
          throw new Error(usersData.error || "Failed to fetch users");
        }

        setUsers(usersData.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [router, associationFilter, tenantFilter]);

  // Filter users based on search (client-side)
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      !searchQuery || 
      (user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      !statusFilter || 
      user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "inactive":
      case "suspended":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700";
      case "manager":
        return "bg-blue-100 text-blue-700";
      case "user":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              User Maintenance
            </h1>
            <p className="text-[var(--secondary-text)] mt-1">Loading...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse h-32 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    const isSetupError = error.includes("Account setup incomplete");
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              User Maintenance
            </h1>
          </div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
        <Card className={isSetupError ? "border-amber-300" : ""}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${isSetupError ? "bg-amber-100" : "bg-red-100"}`}>
                {isSetupError ? (
                  <Users className="h-6 w-6 text-amber-600" />
                ) : (
                  <UserX className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${isSetupError ? "text-amber-800" : "text-red-800"}`}>
                  {isSetupError ? "Account Setup Required" : "Error Loading Users"}
                </h3>
                <p className="text-[var(--secondary-text)] mt-2 whitespace-pre-wrap">
                  {error}
                </p>
                {isSetupError && (
                  <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>Next steps:</strong>
                    </p>
                    <ul className="text-sm text-amber-700 mt-2 list-disc list-inside">
                      <li>Contact your system administrator</li>
                      <li>Or sign out and complete the registration process</li>
                      <li>Or recreate your account through Platform Admin</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              User Maintenance
            </h1>
            <p className="text-[var(--secondary-text)] mt-1">
              Manage portal users, invitations, and access
            </p>
          </div>
        </div>
        <Link href="/admin/users/invite">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)] z-10" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full h-10 pl-10 pr-4 rounded-md border border-[var(--border-color)] bg-white text-[var(--main-text)] placeholder:text-[var(--secondary-text)] focus:outline-none focus:ring-2 focus:ring-[var(--teal)] focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {isPlatformAdmin && (
              <select 
                className="input w-48"
                value={tenantFilter}
                onChange={(e) => setTenantFilter(e.target.value)}
              >
                <option value="">All Tenants</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
              </select>
            )}
            <select 
              className="input w-48"
              value={associationFilter}
              onChange={(e) => setAssociationFilter(e.target.value)}
            >
              <option value="">All Associations</option>
              <option value="tenant-level">Tenant Level (No Association)</option>
              {associations.map((assoc) => (
                <option key={assoc.id} value={assoc.id}>{assoc.name}</option>
              ))}
            </select>
            <select 
              className="input w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
            <button className="btn btn-secondary">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length > 0 ? (
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">User</th>
                  {isPlatformAdmin && (
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Tenant</th>
                  )}
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Association</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Last Sign In</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-navy)] flex items-center justify-center text-white text-sm font-medium">
                          {(user.name || user.firstName || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--main-text)]">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}</p>
                          <p className="text-sm text-[var(--secondary-text)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    {isPlatformAdmin && (
                      <td className="py-3 px-4 text-sm text-[var(--secondary-text)]">
                        {user.tenantName || (user.tenantId ? 'Loading...' : 'No Tenant')}
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm text-[var(--secondary-text)]">
                      {user.associationName || (user.associationId ? 'Loading...' : 'Tenant Level')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getRoleBadgeClass(user.role)}>
                        {user.role || 'User'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusBadgeClass(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--secondary-text)]">
                      {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 relative">
                        <button 
                          className="p-1.5 text-[var(--secondary-text)] hover:text-[var(--teal)] rounded-lg hover:bg-[var(--page-background)]"
                          title="Send email"
                          onClick={() => window.location.href = `mailto:${user.email}`}
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        {user.status !== 'active' && (
                          <button 
                            className="p-1.5 text-[var(--secondary-text)] hover:text-green-600 rounded-lg hover:bg-[var(--page-background)]"
                            title="Activate user"
                            onClick={() => updateUserStatus(user.id, 'active')}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                        )}
                        {user.status === 'active' && (
                          <button 
                            className="p-1.5 text-[var(--secondary-text)] hover:text-amber-600 rounded-lg hover:bg-[var(--page-background)]"
                            title="Suspend user"
                            onClick={() => updateUserStatus(user.id, 'suspended')}
                            disabled={actionLoading === user.id}
                          >
                            {actionLoading === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                          </button>
                        )}
                        <div className="relative">
                          <button 
                            className="p-1.5 text-[var(--secondary-text)] hover:text-[var(--main-text)] rounded-lg hover:bg-[var(--page-background)]"
                            title="More options"
                            onClick={() => setDropdownOpen(dropdownOpen === user.id ? null : user.id)}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {dropdownOpen === user.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-[var(--border-color)] z-50 py-1">
                              <button
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                onClick={() => { deleteUser(user.id); setDropdownOpen(null); }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
              <p className="text-sm mt-1">
                {searchQuery || statusFilter
                  ? "Try adjusting your filters"
                  : "Users will appear here once they are added to the system"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--secondary-text)]">
          Showing {filteredUsers.length > 0 ? 1 : 0} to {filteredUsers.length} of {filteredUsers.length} users
        </p>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" disabled>
            Previous
          </button>
          <button className="btn btn-secondary" disabled>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
