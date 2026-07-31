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
  GripVertical,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

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

const RECORD_TYPES = [
  {
    id: "Association Company",
    label: "Association Company",
    fields: ["Association Status", "Association Type"],
  },
  {
    id: "People",
    label: "People",
    fields: ["Contact Role(s)", "Board Position", "Preferred Contact Method"],
  },
  {
    id: "Vendor Company",
    label: "Vendor Company",
    fields: ["Vendor Status", "Vendor Type"],
  },
  {
    id: "Property",
    label: "Property",
    fields: ["Property Status", "Property Type"],
  },
  {
    id: "Unit",
    label: "Unit",
    fields: ["Occupancy Status", "Rental Status"],
  },
  {
    id: "Maintenance Request",
    label: "Maintenance Request",
    fields: ["Category", "Urgency", "Current Status"],
  },
  {
    id: "Inspection",
    label: "Inspection",
    fields: ["Overall Result", "Inspection Status"],
  },
  {
    id: "Document Record",
    label: "Document Record",
    fields: ["Document Type"],
  },
  {
    id: "Compliance Matter",
    label: "Compliance Matter",
    fields: ["Compliance Status"],
  },
];

export default function AdminDropdownsPage() {
  const [dropdowns, setDropdowns] = useState<Record<string, Record<string, DropdownValue[]>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
  const [editingValue, setEditingValue] = useState<DropdownValue | null>(null);
  const [newValue, setNewValue] = useState({ value: "", label: "" });
  const [activeField, setActiveField] = useState<{ type: string; field: string } | null>(null);

  useEffect(() => {
    loadDropdowns();
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">Dropdown Settings</h1>
        <p className="text-[var(--secondary-text)] mt-1">
          Manage dropdown values for all record types across the portal
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {RECORD_TYPES.map((recordType) => (
          <Card key={recordType.id}>
            <CardHeader className="pb-3">
              <button
                onClick={() =>
                  setExpandedTypes((prev) => ({
                    ...prev,
                    [recordType.id]: !prev[recordType.id],
                  }))
                }
                className="flex items-center justify-between w-full"
              >
                <CardTitle className="text-lg">{recordType.label}</CardTitle>
                {expandedTypes[recordType.id] ? (
                  <ChevronDown className="h-5 w-5 text-[var(--secondary-text)]" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-[var(--secondary-text)]" />
                )}
              </button>
            </CardHeader>

            {expandedTypes[recordType.id] && (
              <CardContent className="space-y-4">
                {recordType.fields.map((fieldName) => {
                  const fieldKey = `${recordType.id}-${fieldName}`;
                  const values = dropdowns[recordType.id]?.[fieldName] || [];

                  return (
                    <div key={fieldKey} className="border border-[var(--border-color)] rounded-lg p-4">
                      <button
                        onClick={() =>
                          setExpandedFields((prev) => ({
                            ...prev,
                            [fieldKey]: !prev[fieldKey],
                          }))
                        }
                        className="flex items-center justify-between w-full mb-3"
                      >
                        <h3 className="font-medium text-[var(--main-text)]">{fieldName}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{values.length} values</Badge>
                          {expandedFields[fieldKey] ? (
                            <ChevronDown className="h-4 w-4 text-[var(--secondary-text)]" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-[var(--secondary-text)]" />
                          )}
                        </div>
                      </button>

                      {expandedFields[fieldKey] && (
                        <div className="space-y-2">
                          {values.map((value) => (
                            <div
                              key={value.id}
                              className="flex items-center gap-3 p-2 bg-[var(--page-background)] rounded-lg"
                            >
                              <GripVertical className="h-4 w-4 text-[var(--secondary-text)] cursor-move" />

                              {editingValue?.id === value.id ? (
                                <>
                                  <Input
                                    value={editingValue.value}
                                    onChange={(e) =>
                                      setEditingValue({ ...editingValue, value: e.target.value })
                                    }
                                    className="w-32"
                                    placeholder="Value"
                                  />
                                  <Input
                                    value={editingValue.label}
                                    onChange={(e) =>
                                      setEditingValue({ ...editingValue, label: e.target.value })
                                    }
                                    className="flex-1"
                                    placeholder="Label"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSave(editingValue)}
                                  >
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingValue(null)}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <span className="w-32 font-mono text-sm text-[var(--secondary-text)]">
                                    {value.value}
                                  </span>
                                  <span className="flex-1">{value.label}</span>
                                  {value.isDefault && (
                                    <Badge className="bg-[var(--teal)] text-white">Default</Badge>
                                  )}
                                  <Badge variant={value.isActive ? "default" : "secondary"}>
                                    {value.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingValue(value)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleActive(value.id, !value.isActive)}
                                  >
                                    {value.isActive ? "Deactivate" : "Activate"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleDelete(value.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          ))}

                          {/* Add new value */}
                          {activeField?.type === recordType.id &&
                          activeField?.field === fieldName ? (
                            <div className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
                              <Input
                                value={newValue.value}
                                onChange={(e) =>
                                  setNewValue({ ...newValue, value: e.target.value })
                                }
                                className="w-32"
                                placeholder="Value (key)"
                              />
                              <Input
                                value={newValue.label}
                                onChange={(e) =>
                                  setNewValue({ ...newValue, label: e.target.value })
                                }
                                className="flex-1"
                                placeholder="Label (display)"
                              />
                              <Button
                                size="sm"
                                onClick={() => handleCreate(recordType.id, fieldName)}
                                disabled={!newValue.value || !newValue.label}
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
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
                      )}
                    </div>
                  );
                })}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
