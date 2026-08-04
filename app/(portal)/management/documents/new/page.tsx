"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, FileText, Loader2, Edit, Upload, Link } from "lucide-react";
import LinkComponent from "next/link";
import { EntitlementGuard } from "@/components/entitlements/EntitlementGuard";

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

interface DocumentData {
  id: string;
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
  fileName: string;
  fileSize: number;
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
  fileName: string;
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

type UploadMethod = "file" | "url";

function NewDocumentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentId = searchParams.get("id");
  const isEditMode = !!documentId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    fileName: "",
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

  useEffect(() => {
    if (isEditMode && associations.length > 0) {
      loadDocument();
    }
  }, [isEditMode, associations]);

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
      if (!isEditMode) {
        setIsLoading(false);
      }
    }
  }

  async function loadDocument() {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const doc: DocumentData = result.data;
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
            fileName: doc.fileName || "",
          });
          if (doc.filePath && !doc.filePath.startsWith("http")) {
            setUploadMethod("url");
          }
        } else {
          alert("Document not found");
          router.push("/management/documents");
        }
      } else {
        alert("Failed to load document");
        router.push("/management/documents");
      }
    } catch (error) {
      console.error("Error loading document:", error);
      alert("An error occurred while loading the document");
      router.push("/management/documents");
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));
    }
  }

  async function uploadFile(): Promise<string | null> {
    if (!selectedFile) return formData.filePath;
    
    setIsUploading(true);
    try {
      // Create FormData for file upload
      const uploadData = new FormData();
      uploadData.append("file", selectedFile);
      
      // Upload to your storage API
      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      const result = await response.json();
      return result.url || result.filePath;
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};

    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.documentType) newErrors.documentType = "Document type is required";
    
    if (uploadMethod === "file" && !isEditMode) {
      if (!selectedFile && !formData.filePath) {
        newErrors.filePath = "Please select a file to upload";
      }
    } else if (uploadMethod === "url") {
      if (!formData.filePath?.trim()) {
        newErrors.filePath = "File URL is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      let filePath = formData.filePath;
      let fileSize = 0;

      // Upload file if selected
      if (uploadMethod === "file" && selectedFile) {
        const uploadedPath = await uploadFile();
        if (!uploadedPath) {
          setIsSaving(false);
          return;
        }
        filePath = uploadedPath;
        fileSize = selectedFile.size;
      }

      const payload = {
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
        filePath: filePath,
        fileName: formData.fileName || (selectedFile?.name),
        fileSize: fileSize || undefined,
      };

      const url = isEditMode ? `/api/documents/${documentId}` : "/api/documents";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/management/documents");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save document");
      }
    } catch (error) {
      console.error("Error saving document:", error);
      alert("An error occurred while saving the document");
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LinkComponent href="/management/documents">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </LinkComponent>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {isEditMode ? "Edit Document" : "Upload Document"}
            </h1>
            <p className="text-[var(--secondary-text)] mt-1">
              {isEditMode ? "Update document details" : "Upload a new document to the system"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Section */}
        {!isEditMode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-[var(--teal)]" />
                Document File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Method Toggle */}
              <div className="flex gap-2 p-1 bg-[var(--page-background)] rounded-lg w-fit">
                <button
                  type="button"
                  onClick={() => setUploadMethod("file")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    uploadMethod === "file"
                      ? "bg-white text-[var(--teal)] shadow-sm"
                      : "text-[var(--secondary-text)] hover:text-[var(--main-text)]"
                  }`}
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMethod("url")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    uploadMethod === "url"
                      ? "bg-white text-[var(--teal)] shadow-sm"
                      : "text-[var(--secondary-text)] hover:text-[var(--main-text)]"
                  }`}
                >
                  <Link className="h-4 w-4" />
                  File URL
                </button>
              </div>

              {/* File Upload */}
              {uploadMethod === "file" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select File <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-[var(--border-color)] rounded-lg p-8 text-center hover:border-[var(--teal)] transition-colors">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <Upload className="h-10 w-10 text-[var(--secondary-text)] mb-3" />
                      <p className="text-sm font-medium text-[var(--main-text)]">
                        {selectedFile ? selectedFile.name : "Click to select a file"}
                      </p>
                      <p className="text-xs text-[var(--secondary-text)] mt-1">
                        PDF, Word, Excel, or images up to 50MB
                      </p>
                    </label>
                  </div>
                  {errors.filePath && (
                    <p className="text-sm text-red-500 mt-2">{errors.filePath}</p>
                  )}
                </div>
              )}

              {/* URL Input */}
              {uploadMethod === "url" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    File URL <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="url"
                    value={formData.filePath}
                    onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                    placeholder="https://example.com/document.pdf"
                    className={errors.filePath ? "border-red-500" : ""}
                  />
                  {errors.filePath && (
                    <p className="text-sm text-red-500 mt-1">{errors.filePath}</p>
                  )}
                  <p className="text-xs text-[var(--secondary-text)] mt-2">
                    Enter a direct link to the file (GHL storage, Google Drive, etc.)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Document Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--teal)]" />
              Document Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={errors.title ? "border-red-500" : ""}
                placeholder="Enter document title"
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
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className={`input w-full ${errors.documentType ? "border-red-500" : ""}`}
                >
                  <option value="">Select type</option>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.documentType && (
                  <p className="text-sm text-red-500 mt-1">{errors.documentType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Select category</option>
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
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input w-full"
                >
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="pending_review">Pending Review</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Association
                </label>
                <select
                  value={formData.associationId}
                  onChange={(e) => setFormData({ ...formData, associationId: e.target.value })}
                  className="input w-full"
                >
                  <option value="">Select association</option>
                  {associations.map((assoc) => (
                    <option key={assoc.id} value={assoc.id}>
                      {assoc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Property
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="input w-full"
                  disabled={!formData.associationId}
                >
                  <option value="">Select property</option>
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
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  className="input w-full"
                  disabled={!formData.propertyId}
                >
                  <option value="">Select unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unitNumber}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Issue Date
                </label>
                <Input
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-6 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isConfidential}
                  onChange={(e) => setFormData({ ...formData, isConfidential: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">Confidential</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requiresAcknowledgment}
                  onChange={(e) =>
                    setFormData({ ...formData, requiresAcknowledgment: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm">Requires Acknowledgment</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <LinkComponent href="/management/documents">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </LinkComponent>
          <Button
            type="submit"
            className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
            disabled={isSaving || isUploading}
          >
            {isSaving || isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isUploading ? "Uploading..." : "Saving..."}
              </>
            ) : isEditMode ? (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Save Changes
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

// Wrap with EntitlementGuard
export default function NewDocumentWrapper() {
  return (
    <EntitlementGuard featureKey="documents">
      <NewDocumentForm />
    </EntitlementGuard>
  );
}
