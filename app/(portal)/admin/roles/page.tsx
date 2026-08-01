"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckSquare,
  XSquare,
  Users,
  Building2,
  FileText,
  DollarSign,
  Wrench,
  ClipboardCheck,
  Settings,
  Save,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface Permission {
  module: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  approve?: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  userCount: number;
  isDefault: boolean;
  requiresMFA: boolean;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  description: string;
  requiresMFA: boolean;
  status: "active" | "inactive";
}

const DEFAULT_MODULES = [
  { id: "dashboard", name: "Dashboard", icon: Building2 },
  { id: "associations", name: "Associations", icon: Building2 },
  { id: "properties", name: "Properties", icon: Building2 },
  { id: "units", name: "Units", icon: Building2 },
  { id: "people", name: "People", icon: Users },
  { id: "vendors", name: "Vendors", icon: Users },
  { id: "maintenance", name: "Maintenance", icon: Wrench },
  { id: "inspections", name: "Inspections", icon: ClipboardCheck },
  { id: "documents", name: "Documents", icon: FileText },
  { id: "approvals", name: "Approvals", icon: CheckSquare },
  { id: "compliance", name: "Compliance", icon: AlertCircle },
  { id: "payments", name: "Payments", icon: DollarSign },
  { id: "communications", name: "Communications", icon: Building2 },
  { id: "reports", name: "Reports", icon: FileText },
  { id: "settings", name: "Settings", icon: Settings },
];

const DEFAULT_PERMISSIONS: Permission[] = DEFAULT_MODULES.map((m) => ({
  module: m.id,
  read: false,
  write: false,
  delete: false,
  approve: false,
}));

export default function RolesAndPermissionsPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    requiresMFA: false,
    status: "active",
  });
  const [permissions, setPermissions] = useState<Permission[]>(DEFAULT_PERMISSIONS);
  const [auditReason, setAuditReason] = useState("");

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    try {
      const response = await fetch("/api/admin/roles");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRoles(result.data || []);
        }
      } else {
        // Load default roles if API fails
        setRoles(getDefaultRoles());
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      setRoles(getDefaultRoles());
    } finally {
      setIsLoading(false);
    }
  }

  function getDefaultRoles(): Role[] {
    return [
      {
        id: "admin",
        name: "Admin User",
        description: "Full portal administration access",
        permissions: DEFAULT_MODULES.map((m) => ({
          module: m.id,
          read: true,
          write: true,
          delete: true,
          approve: true,
        })),
        userCount: 1,
        isDefault: true,
        requiresMFA: true,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "management",
        name: "Management Staff",
        description: "Assigned portfolio operations",
        permissions: DEFAULT_MODULES.map((m) => ({
          module: m.id,
          read: true,
          write: m.id !== "settings",
          delete: false,
          approve: ["maintenance", "inspections", "approvals"].includes(m.id),
        })),
        userCount: 0,
        isDefault: true,
        requiresMFA: true,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "board",
        name: "Board Member",
        description: "Assigned Association view and approvals",
        permissions: DEFAULT_MODULES.map((m) => ({
          module: m.id,
          read: ["dashboard", "associations", "properties", "documents", "reports"].includes(m.id),
          write: false,
          delete: false,
          approve: ["approvals"].includes(m.id),
        })),
        userCount: 0,
        isDefault: true,
        requiresMFA: true,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "owner",
        name: "Owner",
        description: "Own associated records",
        permissions: DEFAULT_MODULES.map((m) => ({
          module: m.id,
          read: ["dashboard", "properties", "units", "maintenance", "documents", "payments"].includes(m.id),
          write: ["maintenance"].includes(m.id),
          delete: false,
          approve: false,
        })),
        userCount: 0,
        isDefault: true,
        requiresMFA: false,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "resident",
        name: "Resident",
        description: "Own associated records",
        permissions: DEFAULT_MODULES.map((m) => ({
          module: m.id,
          read: ["dashboard", "units", "maintenance", "documents"].includes(m.id),
          write: ["maintenance"].includes(m.id),
          delete: false,
          approve: false,
        })),
        userCount: 0,
        isDefault: true,
        requiresMFA: false,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "vendor",
        name: "Vendor Contact",
        description: "Assigned vendor jobs",
        permissions: DEFAULT_MODULES.map((m) => ({
          module: m.id,
          read: ["dashboard", "maintenance", "inspections"].includes(m.id),
          write: ["maintenance"].includes(m.id),
          delete: false,
          approve: false,
        })),
        userCount: 0,
        isDefault: true,
        requiresMFA: false,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  function handleEdit(role: Role) {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      requiresMFA: role.requiresMFA,
      status: role.status,
    });
    setPermissions(role.permissions);
    setAuditReason("");
    setShowModal(true);
  }

  function handleCreate() {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      requiresMFA: false,
      status: "active",
    });
    setPermissions(DEFAULT_PERMISSIONS);
    setAuditReason("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      alert("Role name is required");
      return;
    }
    if (!auditReason.trim() && editingRole) {
      alert("Please provide a reason for this change (audit requirement)");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        permissions,
        auditReason: auditReason || "Created new role",
      };

      const url = editingRole ? `/api/admin/roles/${editingRole.id}` : "/api/admin/roles";
      const method = editingRole ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowModal(false);
        loadRoles();
        alert(editingRole ? "Role updated successfully" : "Role created successfully");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save role");
      }
    } catch (error) {
      console.error("Error saving role:", error);
      alert("An error occurred while saving the role");
    } finally {
      setIsSaving(false);
    }
  }

  function togglePermission(moduleId: string, type: "read" | "write" | "delete" | "approve") {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.module !== moduleId) return p;
        const newValue = !p[type];
        // If turning off read, turn off all other permissions
        if (type === "read" && !newValue) {
          return { ...p, read: false, write: false, delete: false, approve: false };
        }
        // If turning on write/delete/approve, ensure read is on
        if (type !== "read" && newValue) {
          return { ...p, [type]: true, read: true };
        }
        return { ...p, [type]: newValue };
      })
    );
  }

  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">Roles & Permissions</h1>
            <p className="text-[var(--secondary-text)] mt-1">Configure portal roles and access levels</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Total Roles</p>
            <p className="text-2xl font-semibold">{roles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Active Roles</p>
            <p className="text-2xl font-semibold">{roles.filter((r) => r.status === "active").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Total Users</p>
            <p className="text-2xl font-semibold">{roles.reduce((sum, r) => sum + r.userCount, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Require MFA</p>
            <p className="text-2xl font-semibold">{roles.filter((r) => r.requiresMFA).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Portal Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Users</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">MFA</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role) => (
                <tr key={role.id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--teal)]/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-[var(--teal)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--main-text)]">{role.name}</p>
                        <p className="text-xs text-[var(--secondary-text)]">{role.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{role.userCount} users</Badge>
                  </td>
                  <td className="py-3 px-4">
                    {role.requiresMFA ? (
                      <Badge className="bg-green-100 text-green-700">Required</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700">Optional</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge className={role.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {role.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[var(--border-color)] p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingRole ? "Edit Role" : "Create New Role"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Role Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Role Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter role name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter role description"
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requiresMFA}
                    onChange={(e) => setFormData({ ...formData, requiresMFA: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Require MFA</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === "active"}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.checked ? "active" : "inactive" })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Active</span>
                </label>
              </div>

              {/* Permissions Matrix */}
              <div>
                <h3 className="font-medium mb-4">Permissions</h3>
                <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[var(--page-background)]">
                      <tr>
                        <th className="text-left py-2 px-4 text-sm font-medium">Module</th>
                        <th className="text-center py-2 px-4 text-sm font-medium">Read</th>
                        <th className="text-center py-2 px-4 text-sm font-medium">Write</th>
                        <th className="text-center py-2 px-4 text-sm font-medium">Delete</th>
                        <th className="text-center py-2 px-4 text-sm font-medium">Approve</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DEFAULT_MODULES.map((module) => {
                        const perm = permissions.find((p) => p.module === module.id);
                        return (
                          <tr key={module.id} className="border-t border-[var(--border-color)]">
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-2">
                                <module.icon className="h-4 w-4 text-[var(--secondary-text)]" />
                                <span className="text-sm">{module.name}</span>
                              </div>
                            </td>
                            <td className="py-2 px-4 text-center">
                              <button
                                onClick={() => togglePermission(module.id, "read")}
                                className={`w-6 h-6 rounded flex items-center justify-center ${
                                  perm?.read ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {perm?.read ? <CheckSquare className="h-4 w-4" /> : <XSquare className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="py-2 px-4 text-center">
                              <button
                                onClick={() => togglePermission(module.id, "write")}
                                className={`w-6 h-6 rounded flex items-center justify-center ${
                                  perm?.write ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {perm?.write ? <CheckSquare className="h-4 w-4" /> : <XSquare className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="py-2 px-4 text-center">
                              <button
                                onClick={() => togglePermission(module.id, "delete")}
                                className={`w-6 h-6 rounded flex items-center justify-center ${
                                  perm?.delete ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {perm?.delete ? <CheckSquare className="h-4 w-4" /> : <XSquare className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="py-2 px-4 text-center">
                              <button
                                onClick={() => togglePermission(module.id, "approve")}
                                className={`w-6 h-6 rounded flex items-center justify-center ${
                                  perm?.approve ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                {perm?.approve ? <CheckSquare className="h-4 w-4" /> : <XSquare className="h-4 w-4" />}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Reason */}
              {editingRole && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reason for Change * <span className="text-xs text-gray-500">(required for audit log)</span>
                  </label>
                  <Input
                    value={auditReason}
                    onChange={(e) => setAuditReason(e.target.value)}
                    placeholder="e.g., Added maintenance approval rights for property managers"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-4 border-t border-[var(--border-color)]">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingRole ? "Save Changes" : "Create Role"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
