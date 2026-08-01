"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, Search, Filter, MoreHorizontal, Mail, UserX, UserCheck, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Contact {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  portalInvitationStatus: string;
  createdAt: string;
}

interface UserWithStatus extends Contact {
  name: string;
  status: string;
}

export default function UserMaintenancePage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        
        // Fetch contacts
        const contactsRes = await fetch("/api/contacts?pageSize=100");

        if (!contactsRes.ok) {
          if (contactsRes.status === 401) {
            router.push("/access-denied");
            return;
          }
          throw new Error("Failed to fetch contacts");
        }

        const contactsData = await contactsRes.json();

        if (!contactsData.success) {
          throw new Error(contactsData.error || "Failed to fetch contacts");
        }

        const contacts: Contact[] = contactsData.data?.data || [];

        // Map contacts to users
        const usersWithStatus: UserWithStatus[] = contacts.map((contact) => {
          const status = contact.portalInvitationStatus === "active" || contact.portalInvitationStatus === "accepted" 
            ? "active" 
            : contact.portalInvitationStatus === "pending" || contact.portalInvitationStatus === "invited"
            ? "pending"
            : "inactive";

          return {
            ...contact,
            name: `${contact.firstName} ${contact.lastName}`,
            status,
          };
        });

        setUsers(usersWithStatus);
        setError(null);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err instanceof Error ? err.message : "Failed to load users");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [router]);

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      !searchQuery || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      !statusFilter || 
      user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
      case "accepted":
        return "bg-green-100 text-green-700";
      case "pending":
      case "invited":
        return "bg-amber-100 text-amber-700";
      case "inactive":
      case "suspended":
        return "bg-red-100 text-red-700";
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
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              User Maintenance
            </h1>
            <p className="text-[var(--error)] mt-1">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="input pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
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
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Contact ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary-navy)] flex items-center justify-center text-white text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--main-text)]">{user.name}</p>
                          <p className="text-sm text-[var(--secondary-text)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--secondary-text)]">
                      {user.contactId}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getStatusBadgeClass(user.status)}>
                        {user.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button 
                          className="p-1.5 text-[var(--secondary-text)] hover:text-[var(--teal)] rounded-lg hover:bg-[var(--page-background)]"
                          title="Send email"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1.5 text-[var(--secondary-text)] hover:text-green-600 rounded-lg hover:bg-[var(--page-background)]"
                          title="Activate user"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1.5 text-[var(--secondary-text)] hover:text-[var(--error)] rounded-lg hover:bg-[var(--page-background)]"
                          title="Deactivate user"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1.5 text-[var(--secondary-text)] hover:text-[var(--main-text)] rounded-lg hover:bg-[var(--page-background)]"
                          title="More options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
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
