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
  ChevronRight,
  ChevronDown,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  XCircle,
  GripVertical,
} from "lucide-react";

interface CategoryValue {
  id: string;
  value: string;
  label: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  recordCount: number;
  field_name: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  apiName: string;
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
  field_name: string;
}

const CATEGORY_DEFINITIONS = [
  {
    id: "association_company",
    name: "Association Company",
    description: "Association types and statuses",
    icon: "building",
    apiName: "Association Company",
  },
  {
    id: "people",
    name: "People",
    description: "Contact roles, board positions, and preferences",
    icon: "users",
    apiName: "People",
  },
  {
    id: "vendor_company",
    name: "Vendor Company",
    description: "Vendor types and statuses",
    icon: "truck",
    apiName: "Vendor Company",
  },
  {
    id: "property",
    name: "Property",
    description: "Property types and statuses",
    icon: "building",
    apiName: "Property",
  },
  {
    id: "unit",
    name: "Unit",
    description: "Unit occupancy and rental statuses",
    icon: "home",
    apiName: "Unit",
  },
  {
    id: "maintenance_request",
    name: "Maintenance Request",
    description: "Maintenance categories, urgency levels, and statuses",
    icon: "wrench",
    apiName: "Maintenance Request",
  },
  {
    id: "inspection",
    name: "Inspection",
    description: "Inspection results and statuses",
    icon: "clipboard",
    apiName: "Inspection",
  },
  {
    id: "document_record",
    name: "Document Record",
    description: "Document types and confidentiality levels",
    icon: "file",
    apiName: "Document Record",
  },
  {
    id: "compliance_matter",
    name: "Compliance Matter",
    description: "Compliance statuses",
    icon: "scale",
    apiName: "Compliance Matter",
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
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
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
    field_name: "",
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
            // Match by finding category with matching apiName
            const category = Array.from(categoriesMap.values()).find(
              (cat) => cat.apiName === item.id
            );
            
            if (category && item.values) {
              for (const value of item.values) {
                category.values.push({
                  id: value.id,
                  value: value.value,
                  label: value.label,
                  description: value.description,
                  sortOrder: value.sortOrder || 0,
                  isActive: value.isActive !== false,
                  recordCount: 0,
                  field_name: value.field_name,
                });
                
                if (value.field_name && !category.fields.includes(value.field_name)) {
                  category.fields.push(value.field_name);
                }
              }
            }
          }
          
          setCategories(Array.from(categoriesMap.values()));
        }
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleCategory(categoryId: string) {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  function handleAddValue(categoryId: string, fieldName: string = "") {
    setSelectedCategory(categoryId);
    setEditingValue(null);
    setFormData({
      value: "",
      label: "",
      description: "",
      sortOrder: 0,
      isActive: true,
      field_name: fieldName,
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
      field_name: value.field_name,
    });
    setShowValueModal(true);
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

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.values.some(v => v.label.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalValues = categories.reduce((sum, cat) => sum + cat.values.length, 0);

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
              Manage dropdown values and controlled lists
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--teal)]/10 rounded-xl flex items-center justify-center">
              <Tag className="h-6 w-6 text-[var(--teal)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Categories</p>
              <p className="text-2xl font-semibold">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Total Values</p>
              <p className="text-2xl font-semibold">{totalValues}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Active Fields</p>
              <p className="text-2xl font-semibold">
                {categories.reduce((sum, cat) => sum + cat.fields.length, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
          <Input
            placeholder="Search categories or values..."
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

      {/* Categories List */}
      <div className="space-y-3">
        {filteredCategories.map((category) => {
          const Icon = ICON_MAP[category.icon] || Tag;
          const isExpanded = expandedCategories.includes(category.id);
          const valueCount = category.values.length;
          
          return (
            <Card key={category.id} className="overflow-hidden">
              {/* Category Header */}
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--page-background)] transition-colors"
                onClick={() => toggleCategory(category.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--teal)]/10 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[var(--teal)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--main-text)]">{category.name}</h3>
                    <p className="text-sm text-[var(--secondary-text)]">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm">
                    {valueCount} values
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {category.fields.length} fields
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddValue(category.id);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-[var(--secondary-text)]" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-[var(--secondary-text)]" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-[var(--border-color)]">
                  {category.fields.length === 0 ? (
                    <div className="p-8 text-center text-[var(--secondary-text)]">
                      <p>No values defined yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => handleAddValue(category.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Value
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 space-y-6">
                      {category.fields.map((fieldName) => {
                        const fieldValues = category.values
                          .filter((v) => v.field_name === fieldName)
                          .sort((a, b) => a.sortOrder - b.sortOrder);
                        
                        return (
                          <div key={fieldName} className="bg-[var(--page-background)] rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-[var(--main-text)]">{fieldName}</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleAddValue(category.id, fieldName)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {fieldValues.map((value) => (
                                <div
                                  key={value.id}
                                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                                    value.isActive
                                      ? "bg-white border-[var(--border-color)] hover:border-[var(--teal)]"
                                      : "bg-gray-50 border-gray-200 opacity-60"
                                  }`}
                                >
                                  <GripVertical className="h-4 w-4 text-gray-300 cursor-move" />
                                  <span className="font-medium text-sm">{value.label}</span>
                                  {!value.isActive && (
                                    <Badge className="bg-gray-100 text-gray-600 text-xs">Inactive</Badge>
                                  )}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleEditValue(category.id, value)}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
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
                  Field Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.field_name}
                  onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                  placeholder="e.g., Property Status"
                  disabled={!!editingValue}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Value Code <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="e.g., active"
                  disabled={!!editingValue}
                />
                <p className="text-xs text-[var(--secondary-text)] mt-1">
                  Unique identifier, cannot be changed later
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Display Label <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Active"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sort Order</label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
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
    </div>
  );
}
