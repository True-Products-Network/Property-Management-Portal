import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { mockGhlAdapter } from "@/lib/ghl/mock-adapter";
import { Plus, Search, Filter, MoreHorizontal, Mail, UserX, UserCheck } from "lucide-react";

export default async function UserMaintenancePage() {
  const user = await getSession();

  if (!user || !isAdmin(user.roles)) {
    redirect("/access-denied");
  }

  // Get test users from mock adapter
  const contacts = await mockGhlAdapter.getContactsByAssociation("TEST-ASSOC-RIDGELAND");

  const users = contacts.map((contact) => ({
    id: contact.id,
    name: `${contact.firstName} ${contact.lastName}`,
    email: contact.email,
    roles: contact.roles,
    status: contact.portalAccessStatus,
    lastActive: "2 hours ago", // Mock data
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            User Maintenance
          </h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage portal users, invitations, and access
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Invite User
        </button>
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
                />
              </div>
            </div>
            <select className="input w-40">
              <option value="">All Roles</option>
              <option value="admin">Admin User</option>
              <option value="management">Management Staff</option>
              <option value="owner">Owner</option>
              <option value="board">Board Member</option>
              <option value="vendor">Vendor</option>
            </select>
            <select className="input w-40">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
            <button className="btn btn-secondary">
              <Filter className="h-4 w-4" />
              Filter
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary-navy)] flex items-center justify-center text-white text-sm font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--main-text)]">{user.name}</p>
                        <p className="text-sm text-[var(--secondary-text)]">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className="px-2 py-0.5 bg-[var(--page-background)] text-xs rounded-full text-[var(--secondary-text)]"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${
                        user.status === "active"
                          ? "status-active"
                          : user.status === "pending"
                          ? "status-pending"
                          : "status-closed"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="text-[var(--secondary-text)]">{user.lastActive}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-[var(--secondary-text)] hover:text-[var(--teal)] rounded-lg hover:bg-[var(--page-background)]">
                        <Mail className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-[var(--secondary-text)] hover:text-green-600 rounded-lg hover:bg-[var(--page-background)]">
                        <UserCheck className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-[var(--secondary-text)] hover:text-[var(--error)] rounded-lg hover:bg-[var(--page-background)]">
                        <UserX className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-[var(--secondary-text)] hover:text-[var(--main-text)] rounded-lg hover:bg-[var(--page-background)]">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--secondary-text)]">
          Showing 1 to {users.length} of {users.length} users
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
