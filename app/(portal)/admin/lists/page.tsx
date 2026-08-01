"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Building2,
  Users,
  Wrench,
  ClipboardCheck,
  FileText,
  Scale,
  Save,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";

interface CategoryValue {
  id: string;
  value: string;
  label: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  recordCount: number;
  fieldName: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  values: CategoryValue[];
  isSystem: boolean;
  fields: string[];
}

interface FormData {
  value: string;
  label: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

const CATEGORY_DEFINITIONS = [
  {
    id: "company_types",
    name: "Company Types",
    description: "Types of companies and organizations",
    icon: "building",
  },
  {
    id: "contact_roles",
    name: "Contact Roles",
    description: "Roles assigned to contacts in the system",
    icon: "users",
  },
  {
    id: "vendor_types",
    name: "Vendor Types",
    description: "Categories of vendors and service providers",
    icon: "truck",
  },
  {
    id: "property_types",
    name: "Property Types",
    description: "Types of properties managed",
    icon: "building",
  },
  {
    id: "unit_types",
    name: "Unit Types",
    description: "Types of residential and commercial units",
    icon: "home",
  },
  {
    id: "maintenance_categories",
    name: "Maintenance Categories",
    description: "Categories for maintenance requests",
    icon: "wrench",
  },
  {
    id: "maintenance_statuses",
    name: "Maintenance Statuses",
    description: "Status values for maintenance requests",
    icon: "wrench",
  },
  {
    id: "inspection_types",
    name: "Inspection Types",
    description: "Types of property inspections",
    icon: "clipboard",
  },
  {
    id: "inspection_results",
    name: "Inspection Results",
    description: "Possible outcomes of inspections",
    icon: "clipboard",
  },
  {
    id: "document_types",
    name: "Document Types",
    description: "Categories of documents and files",
    icon: "file",
  },
  {
    id: "document_confidentiality",
    name: "Document Confidentiality",
    description: "Confidentiality levels for documents",
    icon: "file",
  },
  {
    id: "compliance_types",
    name: "Compliance Types",
    description: "Types of compliance matters",
    icon: "scale",
  },
  {
    id: "compliance_statuses",
    name: "Compliance Statuses",
    description: "Status values for compliance matters",
    icon: "scale",
  },
];

const ICON_MAP: Record<string, React.ElementType> = {
  building: Building2,
  users: Users,
  truck: Tag,
  home: Tag,
  wrench: Wrench,
  clipboard: ClipboardCheck,
  file: FileText,
  scale: Scale,
};

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showValueModal, setShowValueModal] = useState(false);
  const [editingValue, setEditingValue] = useState<CategoryValue | null>(null);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [retiringValue, setRetiringValue] = useState<CategoryValue | null>(null);
  const [replacementValue, setReplacementValue] = useState("");
  const [formData, setFormData] = useState<FormData>({
    value: "",
    label: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Group values by record_type and collect unique field_names
          const categoriesMap = new Map<string, Category>();
          
          for (const def of CATEGORY_DEFINITIONS) {
            categoriesMap.set(def.id, {
              ...def,
              values: [],
              fields: [],
              isSystem: true,
            });
          }
          
          for (const item of result.data || []) {
            const catId = item.record_type?.toLowerCase().replace(/\s+/g, '_');
            const category = categoriesMap.get(catId);
            
            if (category) {
              category.values.push({
                id: item.id,
                value: item.value,
                label: item.label,
                description: item.description,
                sortOrder: item.sort_order || 0,
                isActive: item.is_active !== false,
                recordCount: 0,
                fieldName: item.field_name,
              });
              
              if (item.field_name && !category.fields.includes(item.field_name)) {
                category.fields.push(item.field_name);
              }
            }
          }
          
          setCategories(Array.from(categoriesMap.values()));
        }
      } else {
        // Use default categories if API fails
        setCategories(
          CATEGORY_DEFINITIONS.map((def) => ({
            ...def,
            values: [],
            fields: [],
            isSystem: true,
          }))
        );
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories(
        CATEGORY_DEFINITIONS.map((def) => ({
          ...def,
          values: [],
          fields: [],
          isSystem: true,
        }))
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleAddValue(categoryId: string) {
    setSelectedCategory(categoryId);
    setEditingValue(null);
    setFormData({
      value: "",
      label: "",
      description: "",
      sortOrder: 0,
      isActive: true,
    });
    setShowValueModal(true);
  }

  function handleEditValue(categoryId: string, value: CategoryValue) {
    setSelectedCategory(categoryId);
    setEditingValue(value);
    setFormData({
      value: value.value,
      label: value.label,
      description: value.description || "",
      sortOrder: value.sortOrder,
      isActive: value.isActive,
    });
    setShowValueModal(true);
  }

  function handleRetireValue(categoryId: string, value: CategoryValue) {
    if (value.recordCount > 0) {
      setSelectedCategory(categoryId);
      setRetiringValue(value);
      setReplacementValue("");
      setShowRetireModal(true);
    } else {
      // Safe to delete if no records use it
      handleDeleteValue(categoryId, value.id);
    }
  }

  async function handleSaveValue() {
    if (!formData.value.trim() || !formData.label.trim()) {
      alert("Value and Label are required");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingValue
        ? `/api/admin/categories/${selectedCategory}/values/${editingValue.id}`
        : `/api/admin/categories/${selectedCategory}/values`;
      const method = editingValue ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowValueModal(false);
        loadCategories();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save value");
      }
    } catch (error) {
      console.error("Error saving value:", error);
      alert("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteValue(categoryId: string, valueId: string) {
    if (!confirm("Are you sure you want to delete this value?")) return;

    try {
      const response = await fetch(
        `/api/admin/categories/${categoryId}/values/${valueId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        loadCategories();
      } else {
        alert("Failed to delete value");
      }
    } catch (error) {
      console.error("Error deleting value:", error);
      alert("An error occurred while deleting");
    }
  }

  async function handleConfirmRetire() {
    if (!replacementValue) {
      alert("Please select a replacement value");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/admin/categories/${selectedCategory}/values/${retiringValue?.id}/retire`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replacementValue }),
        }
      );

      if (response.ok) {
        setShowRetireModal(false);
        loadCategories();
      } else {
        alert("Failed to retire value");
      }
    } catch (error) {
      console.error("Error retiring value:", error);
      alert("An error occurred while retiring");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValues = categories.reduce((sum, cat) => sum + cat.values.length, 0);
  const activeValues = categories.reduce(
    (sum, cat) => sum + cat.values.filter((v) => v.isActive).length,
    0
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
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              Category Management
            </h1>
            <p className="text-[var(--secondary-text)] mt-1">
              Manage controlled lists and dropdown values
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Categories</p>
            <p className="text-2xl font-semibold">{categories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Total Values</p>
            <p className="text-2xl font-semibold">{totalValues}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Active Values</p>
            <p className="text-2xl font-semibold text-green-600">{activeValues}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-[var(--secondary-text)]">Inactive</p>
            <p className="text-2xl font-semibold text-gray-500">
              {totalValues - activeValues}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
          <Input
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={loadCategories}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCategories.map((category) => {
          const Icon = ICON_MAP[category.icon] || Tag;
          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[var(--teal)]/10 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddValue(category.id)}
                    className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Value
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {category.values.length === 0 ? (
                  <p className="text-sm text-[var(--secondary-text)] text-center py-4">
                    No values defined yet
                  </p>
                ) : (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {category.fields.map((fieldName) => (
                      <div key={fieldName}>
                        <p className="text-xs font-medium text-[var(--secondary-text)] uppercase tracking-wider mb-2">
                          {fieldName}
                        </p>
                        <div className="space-y-2">
                          {category.values
                            .filter((v) => v.fieldName === fieldName)
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((value) => (
                              <div
                                key={value.id}
                                className="flex items-center justify-between p-3 bg-[var(--page-background)] rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex flex-col">
                                    <span className="font-medium">{value.label}</span>
                                    <span className="text-xs text-[var(--secondary-text)]">
                                      {value.value}
                                      {value.recordCount > 0 && (
                                        <span className="ml-2 text-amber-600">
                                          ({value.recordCount} records)
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  {!value.isActive && (
                                    <Badge className="bg-gray-100 text-gray-700">
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditValue(category.id, value)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRetireValue(category.id, value)}
                                    className={
                                      value.recordCount > 0
                                  ? "text-amber-600"
                                  : "text-red-500"
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Value Modal */}
      {showValueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b border-[var(--border-color)] p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingValue ? "Edit Value" : "Add New Value"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowValueModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Value (Code) <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="e.g., hvac_repair"
                  disabled={!!editingValue}
                />
                <p className="text-xs text-[var(--secondary-text)] mt-1">
                  Unique identifier, cannot be changed later
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Label <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  placeholder="e.g., HVAC Repair"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sort Order</label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-[var(--border-color)]">
                <Button variant="outline" onClick={() => setShowValueModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveValue}
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
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retire Modal */}
      {showRetireModal && retiringValue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="border-b border-[var(--border-color)] p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Retire Value
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowRetireModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> This value is used by{" "}
                  <strong>{retiringValue.recordCount}</strong> existing records.
                  You must select a replacement value before retiring.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Value to Retire
                </label>
                <Input value={retiringValue.label} disabled />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Replacement Value <span className="text-red-500">*</span>
                </label>
                <select
                  value={replacementValue}
                  onChange={(e) => setReplacementValue(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select replacement</option>
                  {selectedCategory &&
                    categories
                      .find((c) => c.id === selectedCategory)
                      ?.values.filter((v) => v.id !== retiringValue.id && v.isActive)
                      .map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                </select>
                <p className="text-xs text-[var(--secondary-text)] mt-1">
                  All {retiringValue.recordCount} records will be updated to use the
                  replacement value
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-[var(--border-color)]">
                <Button variant="outline" onClick={() => setShowRetireModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmRetire}
                  disabled={isSaving || !replacementValue}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Retire & Replace"
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
