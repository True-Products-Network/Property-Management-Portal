"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  RefreshCw,
  Tag,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface DropdownValue {
  id: string;
  recordType: string;
  fieldName: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
}

// Dynamic record type built from API data
interface RecordTypeInfo {
  id: string;
  label: string;
  fields: string[];
}

export default function AdminDropdownsPage() {
  const [dropdowns, setDropdowns] = useState<Record<string, Record<string, DropdownValue[]>>>({});
  const [recordTypes, setRecordTypes] = useState<RecordTypeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  const [editingValue, setEditingValue] = useState<DropdownValue | null>(null);
  const [newValue, setNewValue] = useState({ value: "", label: "" });
  const [activeField, setActiveField] = useState<{ type: string; field: string } | null>(null);

  useEffect(() => {
    loadDropdowns();
  }, []);

  // Build record types dynamically from API data
  useEffect(() => {
    const types: RecordTypeInfo[] = [];
    
    Object.entries(dropdowns).forEach(([recordType, fields]) => {
      // Capitalize first letter of each word
      const capitalizedLabel = recordType
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      types.push({
        id: recordType,
        label: capitalizedLabel,
        fields: Object.keys(fields),
      });
    });
    
    // Sort by label
    types.sort((a, b) => a.label.localeCompare(b.label));
    setRecordTypes(types);
  }, [dropdowns]);

  async function loadDropdowns() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/dropdowns");
      if (!response.ok) throw new Error("Failed to fetch dropdown settings");
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setDropdowns(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(value: DropdownValue) {
    try {
      const response = await fetch(`/api/admin/dropdowns/${value.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: value.value,
          label: value.label,
          sortOrder: value.sortOrder,
          isDefault: value.isDefault,
        }),
      });

      if (!response.ok) throw new Error("Failed to update");
      setEditingValue(null);
      loadDropdowns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleCreate(recordType: string, fieldName: string) {
    if (!newValue.value || !newValue.label) return;

    try {
      const response = await fetch("/api/admin/dropdowns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordType,
          fieldName,
          value: newValue.value,
          label: newValue.label,
        }),
      });

      if (!response.ok) throw new Error("Failed to create");
      setNewValue({ value: "", label: "" });
      setActiveField(null);
      loadDropdowns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/admin/dropdowns/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error("Failed to toggle");
      loadDropdowns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this value?")) return;

    try {
      const response = await fetch(`/api/admin/dropdowns/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");
      loadDropdowns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  function toggleType(typeId: string) {
    setExpandedTypes((prev) => ({
      ...prev,
      [typeId]: !prev[typeId],
    }));
  }

  function expandAll() {
    const allExpanded: Record<string, boolean> = {};
    recordTypes.forEach((type) => {
      allExpanded[type.id] = true;
    });
    setExpandedTypes(allExpanded);
  }

  function collapseAll() {
    setExpandedTypes({});
  }

  // Filter record types based on search
  const filteredTypes = recordTypes.filter((type) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (type.label.toLowerCase().includes(query)) return true;
    if (type.fields.some((f) => f.toLowerCase().includes(query))) return true;
    // Check values
    const typeDropdowns = dropdowns[type.id];
    if (typeDropdowns) {
      for (const field of type.fields) {
        const values = typeDropdowns[field] || [];
        if (values.some((v) => v.label.toLowerCase().includes(query))) return true;
      }
    }
    return false;
  });

  const totalValues = Object.values(dropdowns).reduce(
    (sum, typeData) =>
      sum +
      Object.values(typeData).reduce((fieldSum, values) => fieldSum + values.length, 0),
    0
  );

  const totalFields = recordTypes.reduce((sum, t) => sum + t.fields.length, 0);

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
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">Dropdown Settings</h1>
            <p className="text-[var(--secondary-text)] mt-1">
              Manage dropdown values for all record types
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
              <p className="text-sm text-[var(--secondary-text)]">Record Types</p>
              <p className="text-2xl font-semibold">{recordTypes.length}</p>
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

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      {/* Search and Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
          <Input
            placeholder="Search record types, fields, or values..."
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
          <Button variant="outline" size="sm" onClick={loadDropdowns}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Record Types List */}
      <div className="space-y-3">
        {filteredTypes.length === 0 ? (
          <div className="text-center py-12 text-[var(--secondary-text)]">
            {searchQuery ? "No matching record types found" : "No dropdown settings configured"}
          </div>
        ) : (
          filteredTypes.map((recordType) => {
            const isExpanded = expandedTypes[recordType.id];
            const typeValues = dropdowns[recordType.id] || {};
            const totalTypeValues = Object.values(typeValues).reduce(
              (sum, vals) => sum + vals.length,
              0
            );

            return (
              <Card key={recordType.id} className="overflow-hidden">
                {/* Record Type Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[var(--page-background)] transition-colors"
                  onClick={() => toggleType(recordType.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-[var(--secondary-text)]" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-[var(--secondary-text)]" />
                    )}
                    <div>
                      <h3 className="font-medium text-[var(--main-text)]">{recordType.label}</h3>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {recordType.fields.length} fields · {totalTypeValues} values
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{totalTypeValues}</Badge>
                </div>

                {/* Fields and Values */}
                {isExpanded && (
                  <div className="border-t">
                    <div className="p-4 space-y-6">
                      {recordType.fields.map((fieldName) => {
                        const values = typeValues[fieldName] || [];

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
                                    {editingValue?.id === value.id ? (
                                      <>
                                        <div className="flex items-center gap-2 flex-1">
                                          <Input
                                            value={editingValue.value}
                                            onChange={(e) =>
                                              setEditingValue({
                                                ...editingValue,
                                                value: e.target.value,
                                              })
                                            }
                                            className="w-32 h-8 text-sm"
                                          />
                                          <Input
                                            value={editingValue.label}
                                            onChange={(e) =>
                                              setEditingValue({
                                                ...editingValue,
                                                label: e.target.value,
                                              })
                                            }
                                            className="flex-1 h-8 text-sm"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Button
                                            size="sm"
                                            className="h-8"
                                            onClick={() => handleSave(editingValue)}
                                          >
                                            <Save className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8"
                                            onClick={() => setEditingValue(null)}
                                          >
                                            <XCircle className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </>
                                    ) : (
                                      <>
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
                                          {value.isDefault && (
                                            <Badge className="text-xs bg-[var(--teal)]">
                                              Default
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
                                              setEditingValue(value);
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
                                      </>
                                    )}
                                  </div>
                                ))}
                            </div>

                            {/* Add New Value */}
                            {activeField?.type === recordType.id &&
                            activeField?.field === fieldName ? (
                              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-[var(--teal)]">
                                <Input
                                  value={newValue.value}
                                  onChange={(e) =>
                                    setNewValue({ ...newValue, value: e.target.value })
                                  }
                                  className="w-32 h-8 text-sm"
                                  placeholder="Code"
                                />
                                <Input
                                  value={newValue.label}
                                  onChange={(e) =>
                                    setNewValue({ ...newValue, label: e.target.value })
                                  }
                                  className="flex-1 h-8 text-sm"
                                  placeholder="Display label"
                                />
                                <Button
                                  size="sm"
                                  className="h-8"
                                  onClick={() => handleCreate(recordType.id, fieldName)}
                                  disabled={!newValue.value || !newValue.label}
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8"
                                  onClick={() => {
                                    setActiveField(null);
                                    setNewValue({ value: "", label: "" });
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                                onClick={() =>
                                  setActiveField({ type: recordType.id, field: fieldName })
                                }
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Value
                              </Button>
                            )}
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
    </div>
  );
}
