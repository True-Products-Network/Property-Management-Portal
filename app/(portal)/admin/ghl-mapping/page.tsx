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
  ghl_contact_role: string;
  portal_role: string;
  portal_version: string;
  default_permissions: string;
  requires_mfa: boolean;
  status: string;
  user_count: number;
  description: string;
}

interface FormData {
  ghlContactRole: string;
  portalRole: string;
  portalVersion: string;
  requiresMFA: boolean;
  status: string;
  description: string;
}

const PORTAL_ROLES = [
  { value: "Admin User", label: "Admin User" },
  { value: "Management Staff", label: "Management Staff" },
  { value: "Board Member", label: "Board Member" },
  { value: "Board Approver", label: "Board Approver" },
  { value: "Owner", label: "Owner" },
  { value: "Resident", label: "Resident" },
  { value: "Vendor Contact", label: "Vendor Contact" },
  { value: "Inspector", label: "Inspector" },
  { value: "Restricted Finance", label: "Restricted Finance" },
];

const PORTAL_VERSIONS = [
  { value: "Management", label: "Management" },
  { value: "Owner / Resident", label: "Owner / Resident" },
  { value: "Board", label: "Board" },
  { value: "Vendor", label: "Vendor" },
];

export default function GhlRoleMappingPage() {
  const [mappings, setMappings] = useState<GhlRoleMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<GhlRoleMapping | null>(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormData>({
    ghlContactRole: "",
    portalRole: "",
    portalVersion: "",
    requiresMFA: false,
    status: "active",
    description: "",
  });

  useEffect(() => {
    loadMappings();
  }, []);

  async function loadMappings() {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await fetch("/api/admin/ghl-role-mappings");
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setMappings(result.data);
        } else {
          setMappings([]);
        }
      } else {
        setMappings([]);
      }
    } catch (error) {
      console.error("Error loading mappings:", error);
      setMappings([]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleEdit(mapping: GhlRoleMapping) {
    setEditingMapping(mapping);
    setFormData({
      ghlContactRole: mapping.ghl_contact_role,
      portalRole: mapping.portal_role,
      portalVersion: mapping.portal_version,
      requiresMFA: mapping.requires_mfa,
      status: mapping.status,
      description: mapping.description || "",
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
        defaultPermissions: formData.portalRole,
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
      mapping.ghl_contact_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mapping.portal_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mapping.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <p className="text-2xl font-semibold text-green-600">
              {mappings.filter((m) => m.status === "active").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Require MFA</p>
            <p className="text-2xl font-semibold">
              {mappings.filter((m) => m.requires_mfa).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Total Users</p>
            <p className="text-2xl font-semibold">
              {mappings.reduce((sum, m) => sum + (m.user_count || 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search mappings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mappings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--page-background)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="text-left p-4 font-medium">GHL Contact Role</th>
                  <th className="text-left p-4 font-medium">Portal Role</th>
                  <th className="text-left p-4 font-medium">Version</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Users</th>
                  <th className="text-left p-4 font-medium w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMappings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <Workflow className="h-12 w-12 mx-auto mb-3 text-[var(--secondary-text)]" />
                      <p className="text-[var(--secondary-text)]">No mappings found</p>
                    </td>
                  </tr>
                ) : (
                  filteredMappings.map((mapping) => (
                    <tr key={mapping.id} className="border-b border-[var(--border-color)] hover:bg-[var(--page-background)]">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-[var(--teal)]" />
                          <span className="font-medium">{mapping.ghl_contact_role}</span>
                        </div>
                      </td>
                      <td className="p-4">{mapping.portal_role}</td>
                      <td className="p-4">
                        <Badge variant="outline">{mapping.portal_version}</Badge>
                      </td>
                      <td className="p-4">
                        {mapping.status === "active" ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[var(--secondary-text)]" />
                          <span>{mapping.user_count || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(mapping)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => handleDelete(mapping.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {editingMapping ? "Edit Mapping" : "Add Mapping"}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
                  className="w-full border rounded-md px-3 py-2"
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
                  className="w-full border rounded-md px-3 py-2"
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
