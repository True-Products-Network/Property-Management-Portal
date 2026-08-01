"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Workflow,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Users,
  Building2,
  Save,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface GhlRoleMapping {
  id: string;
  ghlContactRole: string;
  portalRole: string;
  portalVersion: string;
  defaultPermissions: string;
  requiresMFA: boolean;
  status: "active" | "inactive" | "unknown";
  userCount: number;
  description: string;
}

interface FormData {
  ghlContactRole: string;
  portalRole: string;
  portalVersion: string;
  requiresMFA: boolean;
  status: "active" | "inactive";
  description: string;
}

const PORTAL_ROLES = [
  { value: "admin", label: "Admin User" },
  { value: "management", label: "Management Staff" },
  { value: "board", label: "Board Member" },
  { value: "board_approver", label: "Board Approver" },
  { value: "owner", label: "Owner" },
  { value: "resident", label: "Resident" },
  { value: "vendor", label: "Vendor Contact" },
  { value: "inspector", label: "Inspector" },
  { value: "bookkeeper", label: "Restricted Finance" },
];

const PORTAL_VERSIONS = [
  { value: "management", label: "Management" },
  { value: "owner_resident", label: "Owner / Resident" },
  { value: "board", label: "Board" },
  { value: "vendor", label: "Vendor" },
];

export default function GhlRoleMappingPage() {
  const [mappings, setMappings] = useState<GhlRoleMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<GhlRoleMapping | null>(null);
  const [formData, setFormData] = useState<FormData>({
    ghlContactRole: "",
    portalRole: "",
    portalVersion: "",
    requiresMFA: false,
    status: "active",
    description: "",
  });
  const [unknownRoles, setUnknownRoles] = useState<string[]>([]);

  useEffect(() => {
    loadMappings();
    loadUnknownRoles();
  }, []);

  async function loadMappings() {
    try {
      const response = await fetch("/api/admin/ghl-role-mappings");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMappings(result.data || []);
        }
      } else {
        setMappings(getDefaultMappings());
      }
    } catch (error) {
      console.error("Error loading mappings:", error);
      setMappings(getDefaultMappings());
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUnknownRoles() {
    // In a real implementation, this would fetch from the API
    setUnknownRoles(["Former Board Member", "Temp Vendor"]);
  }

  function getDefaultMappings(): GhlRoleMapping[] {
    return [
      {
        id: "1",
        ghlContactRole: "Admin User",
        portalRole: "Admin User",
        portalVersion: "Management",
        defaultPermissions: "Full portal administration",
        requiresMFA: true,
        status: "active",
        userCount: 1,
        description: "Full access to all portal features and administration",
      },
      {
        id: "2",
        ghlContactRole: "Property Manager",
        portalRole: "Management Staff",
        portalVersion: "Management",
        defaultPermissions: "Assigned portfolio operations",
        requiresMFA: true,
        status: "active",
        userCount: 3,
        description: "Manage assigned properties, maintenance, and inspections",
      },
      {
        id: "3",
        ghlContactRole: "Board Member",
        portalRole: "Board Member",
        portalVersion: "Board",
        defaultPermissions: "Assigned Association view",
        requiresMFA: true,
        status: "active",
        userCount: 5,
        description: "View association data and participate in approvals",
      },
      {
        id: "4",
        ghlContactRole: "Board Approver",
        portalRole: "Board Approver",
        portalVersion: "Board",
        defaultPermissions: "Assigned approval actions",
        requiresMFA: true,
        status: "active",
        userCount: 2,
        description: "Specialized role for financial and policy approvals",
      },
      {
        id: "5",
        ghlContactRole: "Owner",
        portalRole: "Owner",
        portalVersion: "Owner / Resident",
        defaultPermissions: "Own associated records",
        requiresMFA: false,
        status: "active",
        userCount: 45,
        description: "Access to own property, unit, and related records",
      },
      {
        id: "6",
        ghlContactRole: "Resident",
        portalRole: "Resident",
        portalVersion: "Owner / Resident",
        defaultPermissions: "Own associated records",
        requiresMFA: false,
        status: "active",
        userCount: 78,
        description: "Access to own unit and related records",
      },
      {
        id: "7",
        ghlContactRole: "Vendor Contact",
        portalRole: "Vendor Contact",
        portalVersion: "Vendor",
        defaultPermissions: "Assigned vendor jobs",
        requiresMFA: false,
        status: "active",
        userCount: 12,
        description: "Access to assigned maintenance and inspection jobs",
      },
      {
        id: "8",
        ghlContactRole: "Inspector",
        portalRole: "Inspector",
        portalVersion: "Vendor or Management",
        defaultPermissions: "Assigned inspections",
        requiresMFA: true,
        status: "active",
        userCount: 4,
        description: "Access to assigned inspections and reports",
      },
      {
        id: "9",
        ghlContactRole: "Bookkeeper",
        portalRole: "Restricted Finance",
        portalVersion: "Management",
        defaultPermissions: "Approved financial screens only",
        requiresMFA: true,
        status: "active",
        userCount: 1,
        description: "Limited access to financial reports and payment data",
      },
    ];
  }

  function handleEdit(mapping: GhlRoleMapping) {
    setEditingMapping(mapping);
    setFormData({
      ghlContactRole: mapping.ghlContactRole,
      portalRole: mapping.portalRole,
      portalVersion: mapping.portalVersion,
      requiresMFA: mapping.requiresMFA,
      status: mapping.status,
      description: mapping.description,
    });
    setShowModal(true);
  }

  function handleCreate() {
    setEditingMapping(null);
    setFormData({
      ghlContactRole: "",
      portalRole: "",
      portalVersion: "",
      requiresMFA: false,
      status: "active",
      description: "",
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!formData.ghlContactRole.trim() || !formData.portalRole.trim()) {
      alert("GHL Contact Role and Portal Role are required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        defaultPermissions: PORTAL_ROLES.find((r) => r.label === formData.portalRole)?.label || formData.portalRole,
      };

      const url = editingMapping
        ? `/api/admin/ghl-role-mappings/${editingMapping.id}`
        : "/api/admin/ghl-role-mappings";
      const method = editingMapping ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowModal(false);
        loadMappings();
        alert(editingMapping ? "Mapping updated successfully" : "Mapping created successfully");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save mapping");
      }
    } catch (error) {
      console.error("Error saving mapping:", error);
      alert("An error occurred while saving the mapping");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this mapping?")) return;

    try {
      const response = await fetch(`/api/admin/ghl-role-mappings/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadMappings();
        alert("Mapping deleted successfully");
      } else {
        alert("Failed to delete mapping");
      }
    } catch (error) {
      console.error("Error deleting mapping:", error);
      alert("An error occurred while deleting the mapping");
    }
  }

  const filteredMappings = mappings.filter(
    (mapping) =>
      mapping.ghlContactRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mapping.portalRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mapping.description.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">GHL Contact Role Mapping</h1>
            <p className="text-[var(--secondary-text)] mt-1">Map GHL Contact Roles to portal permissions</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
          <Plus className="h-4 w-4 mr-2" />
          Add Mapping
        </Button>
      </div>

      {/* Unknown Roles Alert */}
      {unknownRoles.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Unknown GHL Contact Roles Detected</h3>
                <p className="text-sm text-red-700 mt-1">
                  The following GHL Contact Role values cannot be mapped to portal roles:
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {unknownRoles.map((role) => (
                    <Badge key={role} className="bg-red-100 text-red-700">
                      {role}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-red-600 mt-3">
                  Contacts with these roles will have no portal access until mappings are created.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Total Mappings</p>
            <p className="text-2xl font-semibold">{mappings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Active</p>
            <p className="text-2xl font-semibold">{mappings.filter((m) => m.status === "active").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Require MFA</p>
            <p className="text-2xl font-semibold">{mappings.filter((m) => m.requiresMFA).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Mapped Users</p>
            <p className="text-2xl font-semibold">{mappings.reduce((sum, m) => sum + m.userCount, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
          <Input
            placeholder="Search mappings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Mappings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Role Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">GHL Contact Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Portal Role</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Version</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">MFA</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Users</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMappings.map((mapping) => (
                <tr
                  key={mapping.id}
                  className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--teal)]/10 flex items-center justify-center">
                        <Workflow className="h-4 w-4 text-[var(--teal)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--main-text)]">{mapping.ghlContactRole}</p>
                        <p className="text-xs text-[var(--secondary-text)]">{mapping.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{mapping.portalRole}</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-[var(--secondary-text)]">{mapping.portalVersion}</span>
                  </td>
                  <td className="py-3 px-4">
                    {mapping.requiresMFA ? (
                      <Badge className="bg-green-100 text-green-700">Required</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700">Optional</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">{mapping.userCount} users</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(mapping)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(mapping.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800">About GHL Contact Role Mapping</h3>
              <p className="text-sm text-blue-700 mt-1">
                This mapping determines how GHL Contact Role values translate to portal access. When a user signs in,
                their GHL Contact Role is matched to a portal role, which determines their permissions and available features.
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                <li>Unknown or blank Contact Roles produce no portal access</li>
                <li>Changes take effect on next user sign-in</li>
                <li>Inactive mappings are ignored during role resolution</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapping Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="border-b border-[var(--border-color)] p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingMapping ? "Edit Mapping" : "Create New Mapping"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">GHL Contact Role *</label>
                <Input
                  value={formData.ghlContactRole}
                  onChange={(e) => setFormData({ ...formData, ghlContactRole: e.target.value })}
                  placeholder="e.g., Property Manager"
                />
                <p className="text-xs text-[var(--secondary-text)] mt-1">
                  Must match the Contact Role value in GHL exactly
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Portal Role *</label>
                <select
                  value={formData.portalRole}
                  onChange={(e) => setFormData({ ...formData, portalRole: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Select portal role</option>
                  {PORTAL_ROLES.map((role) => (
                    <option key={role.value} value={role.label}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Portal Version *</label>
                <select
                  value={formData.portalVersion}
                  onChange={(e) => setFormData({ ...formData, portalVersion: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Select version</option>
                  {PORTAL_VERSIONS.map((version) => (
                    <option key={version.value} value={version.label}>
                      {version.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this role can access"
                />
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
                      {editingMapping ? "Save Changes" : "Create Mapping"}
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
