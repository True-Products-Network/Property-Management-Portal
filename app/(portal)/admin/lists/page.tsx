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
  Save,
  X,
  Loader2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Settings,
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
  values: CategoryValue[];
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

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showValueModal, setShowValueModal] = useState(false);
  const [editingValue, setEditingValue] = useState<CategoryValue | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
      setIsLoading(true);
      const response = await fetch("/api/admin/categories");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Transform API data into categories with fields
          const cats: Category[] = result.data.map((item: any) => {
            const fields = [...new Set(item.values?.map((v: any) => v.field_name) || [])];
            return {
              id: item.id,
              name: item.id, // Use record_type as name (will capitalize in render)
              values: item.values || [],
              fields: fields as string[],
            };
          });
          setCategories(cats);
        }
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleCategory(categoryId: string) {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  }

  function expandAll() {
    setExpandedCategories(categories.map((c) => c.id));
  }

  function collapseAll() {
    setExpandedCategories([]);
  }

  function handleAddValue(categoryId: string, fieldName: string) {
    setSelectedCategory(categoryId);
    setFormData({
      value: "",
      label: "",
      description: "",
      sortOrder: 0,
      isActive: true,
      field_name: fieldName,
    });
    setEditingValue(null);
    setShowValueModal(true);
  }

  function handleEditValue(value: CategoryValue) {
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

  async function handleSave() {
    if (!formData.value || !formData.label) return;

    setIsSaving(true);
    try {
      const url = editingValue
        ? `/api/admin/dropdowns/${editingValue.id}`
        : "/api/admin/dropdowns";
      const method = editingValue ? "PUT" : "POST";

      const body = editingValue
        ? {
            value: formData.value,
            label: formData.label,
            sortOrder: formData.sortOrder,
            isDefault: false,
          }
        : {
            recordType: selectedCategory,
            fieldName: formData.field_name,
            value: formData.value,
            label: formData.label,
            sortOrder: formData.sortOrder,
          };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowValueModal(false);
        loadCategories();
      }
    } catch (error) {
      console.error("Error saving value:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/admin/dropdowns/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        loadCategories();
      }
    } catch (error) {
      console.error("Error toggling value:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this value?")) return;

    try {
      const response = await fetch(`/api/admin/dropdowns/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadCategories();
      }
    } catch (error) {
      console.error("Error deleting value:", error);
    }
  }

  // Filter categories based on search
  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (cat.name.toLowerCase().includes(query)) return true;
    if (cat.fields.some((f) => f.toLowerCase().includes(query))) return true;
    if (cat.values.some((v) => v.label.toLowerCase().includes(query))) return true;
    return false;
  });

  // Capitalize first letter of each word
  function capitalizeWords(str: string) {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  const totalValues = categories.reduce((sum, cat) => sum + cat.values.length, 0);
  const totalFields = categories.reduce((sum, cat) => sum + cat.fields.length, 0);

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
              Category Maintenance
            </h1>
            <p className="text-[var(--secondary-text)] mt-1">
              Manage category values across all record types
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--teal)]/10 rounded-xl flex items-center justify-center">
              <Settings className="h-6 w-6 text-[var(--teal)]" />
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
              <Tag className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Fields</p>
              <p className="text-2xl font-semibold">{totalFields}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
          <Input
            placeholder="Search categories, fields, or values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          <Button variant="outline" size="sm" onClick={loadCategories}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 text-[var(--secondary-text)]">
            {searchQuery ? "No matching categories found" : "No categories configured"}
          </div>
        ) : (
          filteredCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const valuesByField: Record<string, CategoryValue[]> = {};

            category.values.forEach((v) => {
              if (!valuesByField[v.field_name]) {
                valuesByField[v.field_name] = [];
              }
              valuesByField[v.field_name].push(v);
            });

            return (
              <Card key={category.id} className="overflow-hidden">
                {/* Category Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--page-background)] transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-[var(--secondary-text)]" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-[var(--secondary-text)]" />
                    )}
                    <div>
                      <h3 className="font-medium text-[var(--main-text)]">
                        {capitalizeWords(category.name)}
                      </h3>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {category.fields.length} fields · {category.values.length} values
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{category.values.length}</Badge>
                </div>

                {/* Fields and Values */}
                {isExpanded && (
                  <div className="border-t">
                    <div className="p-4 space-y-6">
                      {category.fields.map((fieldName) => {
                        const values = valuesByField[fieldName] || [];

                        return (
                          <div key={fieldName} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm text-[var(--main-text)]">
                                {fieldName}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {values.length} values
                              </Badge>
                            </div>

                            <div className="space-y-1">
                              {values
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((value) => (
                                  <div
                                    key={value.id}
                                    className={`flex items-center justify-between p-2 rounded-lg border ${
                                      value.isActive
                                        ? "bg-white border-gray-200"
                                        : "bg-gray-50 border-gray-100 opacity-60"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                        {value.value}
                                      </code>
                                      <span className="text-sm">{value.label}</span>
                                      {!value.isActive && (
                                        <Badge variant="secondary" className="text-xs">
                                          Inactive
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditValue(value);
                                        }}
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-6 w-6 p-0 ${
                                          value.isActive ? "text-green-600" : "text-gray-400"
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleActive(value.id, !value.isActive);
                                        }}
                                      >
                                        {value.isActive ? (
                                          <CheckCircle2 className="h-3 w-3" />
                                        ) : (
                                          <XCircle className="h-3 w-3" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-red-500"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(value.id);
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleAddValue(category.id, fieldName)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Value
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Value Modal */}
      {showValueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editingValue ? "Edit Value" : "Add New Value"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code (Value)</label>
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="e.g., active"
                  disabled={!!editingValue}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Display Label</label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Active"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order</label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowValueModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
