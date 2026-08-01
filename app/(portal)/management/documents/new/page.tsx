"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, FileText, Loader2 } from "lucide-react";
import Link from "next/link";

interface Association {
  id: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
  associationId: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
}

interface FormData {
  title: string;
  documentType: string;
  category: string;
  status: string;
  issueDate: string;
  expiryDate: string;
  associationId: string;
  propertyId: string;
  unitId: string;
  isConfidential: boolean;
  requiresAcknowledgment: boolean;
  filePath: string;
}

const DOCUMENT_TYPES = [
  { value: "contract", label: "Contract" },
  { value: "lease", label: "Lease Agreement" },
  { value: "bylaws", label: "Bylaws" },
  { value: "rules", label: "Rules & Regulations" },
  { value: "financial", label: "Financial Report" },
  { value: "insurance", label: "Insurance Policy" },
  { value: "inspection", label: "Inspection Report" },
  { value: "maintenance", label: "Maintenance Record" },
  { value: "meeting", label: "Meeting Minutes" },
  { value: "notice", label: "Notice" },
  { value: "invoice", label: "Invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "other", label: "Other" },
];

const CATEGORIES = [
  { value: "legal", label: "Legal" },
  { value: "financial", label: "Financial" },
  { value: "operational", label: "Operational" },
  { value: "maintenance", label: "Maintenance" },
  { value: "resident", label: "Resident" },
  { value: "board", label: "Board" },
];

export default function NewDocumentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    title: "",
    documentType: "",
    category: "",
    status: "active",
    issueDate: "",
    expiryDate: "",
    associationId: "",
    propertyId: "",
    unitId: "",
    isConfidential: false,
    requiresAcknowledgment: false,
    filePath: "",
  });

  useEffect(() => {
    loadAssociations();
  }, []);

  useEffect(() => {
    if (formData.associationId) {
      loadProperties(formData.associationId);
    } else {
      setProperties([]);
      setFormData(prev => ({ ...prev, propertyId: "", unitId: "" }));
    }
  }, [formData.associationId]);

  useEffect(() => {
    if (formData.propertyId) {
      loadUnits(formData.propertyId);
    } else {
      setUnits([]);
      setFormData(prev => ({ ...prev, unitId: "" }));
    }
  }, [formData.propertyId]);

  async function loadAssociations() {
    try {
      const response = await fetch("/api/associations");
      if (response.ok) {
        const result = await response.json();
        if (result.success) setAssociations(result.data.data || []);
      }
    } catch (error) {
      console.error("Error loading associations:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProperties(associationId: string) {
    try {
      const response = await fetch(`/api/properties?associationId=${associationId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) setProperties(result.data.data || []);
      }
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  async function loadUnits(propertyId: string) {
    try {
      const response = await fetch(`/api/units?propertyId=${propertyId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) setUnits(result.data.data || []);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};

    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.documentType) newErrors.documentType = "Document type is required";
    if (!formData.filePath?.trim()) newErrors.filePath = "File path/URL is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          documentType: formData.documentType,
          category: formData.category || undefined,
          status: formData.status,
          issueDate: formData.issueDate || undefined,
          expiryDate: formData.expiryDate || undefined,
          associationId: formData.associationId || undefined,
          propertyId: formData.propertyId || undefined,
          unitId: formData.unitId || undefined,
          isConfidential: formData.isConfidential,
          requiresAcknowledgment: formData.requiresAcknowledgment,
          filePath: formData.filePath,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push(`/management/documents/${result.data.id}`);
        } else {
          alert(result.error || "Failed to create document");
        }
      } else {
        alert("Failed to create document");
      }
    } catch (error) {
      console.error("Error creating document:", error);
      alert("An error occurred while creating the document");
    } finally {
      setIsSaving(false);
    }
  }

  function handleChange(field: keyof FormData, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/management/documents">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Upload Document</h1>
          <p className="text-[var(--secondary-text)] mt-1">Add a new document to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--teal)]" />
              Document Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., 2024 Insurance Policy"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.documentType}
                  onChange={(e) => handleChange("documentType", e.target.value)}
                  className={`input w-full ${errors.documentType ? "border-red-500" : ""}`}
                >
                  <option value="">Select Type</option>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.documentType && <p className="text-sm text-red-500 mt-1">{errors.documentType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="input w-full"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Issue Date
                </label>
                <Input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => handleChange("issueDate", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Expiry Date
              </label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleChange("expiryDate", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>File</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                File Path / URL <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.filePath}
                onChange={(e) => handleChange("filePath", e.target.value)}
                placeholder="https://... or /path/to/file.pdf"
                className={errors.filePath ? "border-red-500" : ""}
              />
              {errors.filePath && <p className="text-sm text-red-500 mt-1">{errors.filePath}</p>}
              <p className="text-sm text-[var(--secondary-text)] mt-1">
                Enter the file URL or path. File upload functionality coming soon.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Relationships */}
        <Card>
          <CardHeader>
            <CardTitle>Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Association
              </label>
              <select
                value={formData.associationId}
                onChange={(e) => handleChange("associationId", e.target.value)}
                className="input w-full"
              >
                <option value="">Select Association</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>
                    {assoc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Property
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => handleChange("propertyId", e.target.value)}
                  className="input w-full"
                  disabled={!formData.associationId}
                >
                  <option value="">Select Property</option>
                  {properties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Unit
                </label>
                <select
                  value={formData.unitId}
                  onChange={(e) => handleChange("unitId", e.target.value)}
                  className="input w-full"
                  disabled={!formData.propertyId}
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      Unit {unit.unitNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isConfidential"
                checked={formData.isConfidential}
                onChange={(e) => handleChange("isConfidential", e.target.checked)}
                className="rounded border-[var(--border-color)]"
              />
              <label htmlFor="isConfidential" className="text-sm text-[var(--main-text)]">
                Confidential Document
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresAcknowledgment"
                checked={formData.requiresAcknowledgment}
                onChange={(e) => handleChange("requiresAcknowledgment", e.target.checked)}
                className="rounded border-[var(--border-color)]"
              />
              <label htmlFor="requiresAcknowledgment" className="text-sm text-[var(--main-text)]">
                Requires Acknowledgment
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/management/documents">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
