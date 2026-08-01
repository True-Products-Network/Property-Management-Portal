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
  ArrowLeft,
  Search,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Edit2,
  RefreshCw,
  Building2,
  Users,
  Wrench,
  ClipboardCheck,
  FileText,
  Scale,
  Tag,
  CreditCard,
  MessageSquare,
  CalendarDays,
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

interface RecordType {
  id: string;
  label: string;
  icon: string;
  fields: string[];
}

const RECORD_TYPES: RecordType[] = [
  {
    id: "Association Company",
    label: "Association Company",
    icon: "building",
    fields: ["Association Status", "Association Type"],
  },
  {
    id: "People",
    label: "People",
    icon: "users",
    fields: ["Contact Role(s)", "Board Position", "Preferred Contact Method"],
  },
  {
    id: "Vendor Company",
    label: "Vendor Company",
    icon: "truck",
    fields: ["Vendor Status", "Vendor Type"],
  },
  {
    id: "Property",
    label: "Property",
    icon: "building",
    fields: ["Property Status", "Property Type"],
  },
  {
    id: "Unit",
    label: "Unit",
    icon: "home",
    fields: ["Occupancy Status", "Rental Status"],
  },
  {
    id: "Maintenance Request",
    label: "Maintenance Request",
    icon: "wrench",
    fields: ["Category", "Urgency", "Current Status"],
  },
  {
    id: "Inspection",
    label: "Inspection",
    icon: "clipboard",
    fields: ["Overall Result", "Inspection Status"],
  },
  {
    id: "Document Record",
    label: "Document Record",
    icon: "file",
    fields: ["Document Type"],
  },
  {
    id: "Compliance Matter",
    label: "Compliance Matter",
    icon: "scale",
    fields: ["Compliance Status"],
  },
  {
    id: "Approval Request",
    label: "Approval Request",
    icon: "check_circle",
    fields: ["Approval Type", "Approval Status"],
  },
  {
    id: "Payment Record",
    label: "Payment Record",
    icon: "credit_card",
    fields: ["Payment Type", "Payment Status"],
  },
  {
    id: "Communication",
    label: "Communication",
    icon: "message",
    fields: ["Communication Type", "Communication Status"],
  },
  {
    id: "Appointment",
    label: "Appointment",
    icon: "calendar",
    fields: ["Appointment Type", "Appointment Status"],
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
  check_circle: CheckCircle2,
  credit_card: CreditCard,
  message: MessageSquare,
  calendar: CalendarDays,
};

export default function AdminDropdownsPage() {
  const [dropdowns, setDropdowns] = useState<Record<string, Record<string, DropdownValue[]>>>({});
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
    RECORD_TYPES.forEach((type) => {
      allExpanded[type.id] = true;
    });
    setExpandedTypes(allExpanded);
  }

  function collapseAll() {
    setExpandedTypes({});
  }

  const filteredTypes = RECORD_TYPES.filter((type) => {
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
              <Tag className="h-6 w-6 text-[var(--teal)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Record Types</p>
              <p className="text-2xl font-semibold">{RECORD_TYPES.length}</p>
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
              <p className="text-sm text-[var(--secondary-text)]">Fields</p>
              <p className="text-2xl font-semibold">
                {RECORD_TYPES.reduce((sum, t) => sum + t.fields.length, 0)}
              </p>
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
        {filteredTypes.map((recordType) => {
          const Icon = ICON_MAP[recordType.icon] || Tag;
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
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--teal)]/10 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-[var(--teal)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--main-text)]">{recordType.label}</h3>
                    <p className="text-sm text-[var(--secondary-text)]">
                      {recordType.fields.length} fields • {totalTypeValues} values
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                  <div className="p-4 space-y-4">
                    {recordType.fields.map((fieldName) => {
                      const values = typeValues[fieldName] || [];
                      const activeValues = values.filter((v) => v.isActive);

                      return (
                        <div
                          key={fieldName}
                          className="bg-[var(--page-background)] rounded-lg p-4"
                        >
                          {/* Field Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-[var(--main-text)]">{fieldName}</h4>
                              <p className="text-sm text-[var(--secondary-text)]">
                                {activeValues.length} active
                                {values.length > activeValues.length &&
                                  ` • ${values.length - activeValues.length} inactive`}
                              </p>
                            </div>
                          </div>

                          {/* Values Grid */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {values
                              .sort((a, b) => a.sortOrder - b.sortOrder)
                              .map((value) => (
                                <div
                                  key={value.id}
                                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                                    value.isActive
                                      ? "bg-white border-[var(--border-color)] hover:border-[var(--teal)]"
                                      : "bg-gray-100 border-gray-200 opacity-60"
                                  }`}
                                >
                                  {editingValue?.id === value.id ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        value={editingValue.label}
                                        onChange={(e) =>
                                          setEditingValue({
                                            ...editingValue,
                                            label: e.target.value,
                                          })
                                        }
                                        className="w-32 h-7 text-sm"
                                        autoFocus
                                      />
                                      <Button
                                        size="sm"
                                        className="h-7 px-2"
                                        onClick={() => handleSave(editingValue)}
                                      >
                                        <Save className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2"
                                        onClick={() => setEditingValue(null)}
                                      >
                                        <XCircle className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="text-sm font-medium">{value.label}</span>
                                      {value.isDefault && (
                                        <Badge className="bg-[var(--teal)] text-white text-xs px-1.5 py-0">
                                          Default
                                        </Badge>
                                      )}
                                      {!value.isActive && (
                                        <Badge className="bg-gray-200 text-gray-600 text-xs px-1.5 py-0">
                                          Inactive
                                        </Badge>
                                      )}
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
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
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleActive(value.id, !value.isActive);
                                          }}
                                        >
                                          {value.isActive ? (
                                            <XCircle className="h-3 w-3 text-amber-500" />
                                          ) : (
                                            <CheckCircle2 className="h-3 w-3 text-green-500" />
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
        })}
      </div>
    </div>
  );
}
