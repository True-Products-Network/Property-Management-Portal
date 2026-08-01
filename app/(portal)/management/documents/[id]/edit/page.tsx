"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

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

export default function EditDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

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
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.propertyId) {
      loadUnits(formData.propertyId);
    } else {
      setUnits([]);
    }
  }, [formData.propertyId]);

  async function loadInitialData() {
    try {
      const [docRes, propsRes, assocRes] = await Promise.all([
        fetch(`/api/documents/${documentId}`),
        fetch("/api/properties"),
        fetch("/api/associations"),
      ]);

      if (docRes.ok) {
        const docData = await docRes.json();
        if (docData.success && docData.data) {
          const doc = docData.data;
          setFormData({
            title: doc.title || "",
            documentType: doc.documentType || "",
            category: doc.category || "",
            status: doc.status || "active",
            issueDate: doc.issueDate ? doc.issueDate.split("T")[0] : "",
            expiryDate: doc.expiryDate ? doc.expiryDate.split("T")[0] : "",
            associationId: doc.associationId || "",
            propertyId: doc.propertyId || "",
            unitId: doc.unitId || "",
            isConfidential: doc.isConfidential || false,
            requiresAcknowledgment: doc.requiresAcknowledgment || false,
            filePath: doc.filePath || "",
          });
          if (doc.propertyId) {
            loadUnits(doc.propertyId);
          }
        }
      }

      if (propsRes.ok) {
        const propsData = await propsRes.json();
        if (propsData.success) setProperties(propsData.data.data || []);
      }

      if (assocRes.ok) {
        const assocData = await assocRes.json();
        if (assocData.success) setAssociations(assocData.data.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUnits(propertyId: string) {
    try {
      const res = await fetch(`/api/units?propertyId=${propertyId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUnits(data.data.data || []);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.documentType) newErrors.documentType = "Document type is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.filePath.trim()) newErrors.filePath = "File path is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(`/management/documents/${documentId}`);
      } else {
        const error = await res.json();
        alert(error.error?.message || "Failed to update document");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#2f1fac]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/management/documents/${documentId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#2f1fac]">Edit Document</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter document title"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Document Type *</label>
                <select
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className={`w-full h-10 px-3 rounded-md border ${errors.documentType ? "border-red-500" : "border-input"} bg-background`}
                >
                  <option value="">Select type</option>
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.documentType && <p className="text-sm text-red-500">{errors.documentType}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full h-10 px-3 rounded-md border ${errors.category ? "border-red-500" : "border-input"} bg-background`}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Issue Date</label>
                <Input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Expiry Date</label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">File Path/URL *</label>
                <Input
                  value={formData.filePath}
                  onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                  placeholder="Enter file path or URL"
                  className={errors.filePath ? "border-red-500" : ""}
                />
                {errors.filePath && <p className="text-sm text-red-500">{errors.filePath}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Association</label>
                <select
                  value={formData.associationId}
                  onChange={(e) => setFormData({ ...formData, associationId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select association</option>
                  {associations.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Property</label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, unitId: "" })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  disabled={!formData.propertyId}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background disabled:opacity-50"
                >
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.unitNumber}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isConfidential}
                      onChange={(e) => setFormData({ ...formData, isConfidential: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Confidential Document</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.requiresAcknowledgment}
                      onChange={(e) => setFormData({ ...formData, requiresAcknowledgment: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Requires Acknowledgment</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Link href={`/management/documents/${documentId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSaving} className="bg-[#2f1fac]">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
