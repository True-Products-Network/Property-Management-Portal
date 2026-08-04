"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Shield, Loader2, Edit3 } from "lucide-react";
import Link from "next/link";
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

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

interface ComplianceData {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  identifiedDate?: string;
  dueDate?: string;
  assignedTo?: string;
  associationId?: string;
  propertyId?: string;
  unitId?: string;
  resolutionNotes?: string;
  fineAmount?: number;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  identifiedDate: string;
  dueDate: string;
  assignedTo: string;
  associationId: string;
  propertyId: string;
  unitId: string;
  resolutionNotes: string;
  fineAmount: string;
}

const CATEGORIES = [
  { value: "violation", label: "Violation" },
  { value: "delinquency", label: "Delinquency" },
  { value: "insurance", label: "Insurance Issue" },
  { value: "permit", label: "Permit Issue" },
  { value: "safety", label: "Safety Concern" },
  { value: "maintenance", label: "Maintenance Required" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

function NewComplianceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const complianceId = searchParams.get("id");
  const isEditMode = !!complianceId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    status: "open",
    identifiedDate: "",
    dueDate: "",
    assignedTo: "",
    associationId: "",
    propertyId: "",
    unitId: "",
    resolutionNotes: "",
    fineAmount: "",
  });

  useEffect(() => {
    loadInitialData();
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

  async function loadInitialData() {
    try {
      const [assocRes, contactsRes] = await Promise.all([
        fetch("/api/associations"),
        fetch("/api/contacts"),
      ]);

      if (assocRes.ok) {
        const assocData = await assocRes.json();
        if (assocData.success) setAssociations(assocData.data.data || []);
      }
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        if (contactsData.success) setContacts(contactsData.data.data || []);
      }

      // If in edit mode, load compliance data
      if (isEditMode && complianceId) {
        await loadComplianceData(complianceId);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadComplianceData(id: string) {
    try {
      const response = await fetch(`/api/compliance/${id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data: ComplianceData = result.data;
          
          // Populate form data
          setFormData({
            title: data.title || "",
            description: data.description || "",
            category: data.category || "",
            priority: data.priority || "medium",
            status: data.status || "open",
            identifiedDate: data.identifiedDate ? data.identifiedDate.split('T')[0] : "",
            dueDate: data.dueDate ? data.dueDate.split('T')[0] : "",
            assignedTo: data.assignedTo || "",
            associationId: data.associationId || "",
            propertyId: data.propertyId || "",
            unitId: data.unitId || "",
            resolutionNotes: data.resolutionNotes || "",
            fineAmount: data.fineAmount ? data.fineAmount.toString() : "",
          });

          // Load related data for cascading dropdowns
          if (data.associationId) {
            await loadProperties(data.associationId);
          }
          if (data.propertyId) {
            await loadUnits(data.propertyId);
          }
        }
      } else {
        alert("Failed to load compliance matter data");
      }
    } catch (error) {
      console.error("Error loading compliance data:", error);
      alert("An error occurred while loading the compliance matter");
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
    if (!formData.category) newErrors.category = "Category is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        identifiedDate: formData.identifiedDate || undefined,
        dueDate: formData.dueDate || undefined,
        assignedTo: formData.assignedTo || undefined,
        associationId: formData.associationId || undefined,
        propertyId: formData.propertyId || undefined,
        unitId: formData.unitId || undefined,
        resolutionNotes: formData.resolutionNotes || undefined,
        fineAmount: formData.fineAmount ? parseFloat(formData.fineAmount) : undefined,
      };

      let response;
      if (isEditMode && complianceId) {
        // Update existing compliance matter
        response = await fetch(`/api/compliance/${complianceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new compliance matter
        response = await fetch("/api/compliance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const redirectId = isEditMode ? complianceId : result.data.id;
          router.push(`/management/compliance/${redirectId}`);
        } else {
          alert(result.error || `Failed to ${isEditMode ? 'update' : 'create'} compliance matter`);
        }
      } else {
        alert(`Failed to ${isEditMode ? 'update' : 'create'} compliance matter`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} compliance matter:`, error);
      alert(`An error occurred while ${isEditMode ? 'updating' : 'creating'} the compliance matter`);
    } finally {
      setIsSaving(false);
    }
  }

  function handleChange(field: keyof FormData, value: string) {
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
        <Link href="/management/compliance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {isEditMode ? "Edit Compliance Matter" : "New Compliance Matter"}
            </h1>
            {isEditMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Edit3 className="h-3 w-3" />
                Edit Mode
              </span>
            )}
          </div>
          <p className="text-[var(--secondary-text)] mt-1">
            {isEditMode ? "Update compliance matter details" : "Record a compliance issue or violation"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Issue Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--teal)]" />
              Issue Details
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
                placeholder="e.g., Late Fee Assessment - Unit 101"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className="input w-full"
                placeholder="Detailed description of the compliance matter..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className={`input w-full ${errors.category ? "border-red-500" : ""}`}
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleChange("priority", e.target.value)}
                  className="input w-full"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
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
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Assigned To
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => handleChange("assignedTo", e.target.value)}
                  className="input w-full"
                >
                  <option value="">Unassigned</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates & Fine */}
        <Card>
          <CardHeader>
            <CardTitle>Dates & Fine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Identified Date
                </label>
                <Input
                  type="date"
                  value={formData.identifiedDate}
                  onChange={(e) => handleChange("identifiedDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Fine Amount
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.fineAmount}
                onChange={(e) => handleChange("fineAmount", e.target.value)}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
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

        {/* Resolution */}
        <Card>
          <CardHeader>
            <CardTitle>Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Resolution Notes
              </label>
              <textarea
                value={formData.resolutionNotes}
                onChange={(e) => handleChange("resolutionNotes", e.target.value)}
                rows={4}
                className="input w-full"
                placeholder="How was this matter resolved?"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/management/compliance">
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
                {isEditMode ? "Save Changes" : "Create Compliance Matter"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function NewComplianceFormPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    }>
      <NewComplianceForm />
    </Suspense>
  );
}

// Wrap with EntitlementGuard
export default function NewComplianceWrapper() {
  return (
    <EntitlementGuard featureKey="compliance">
      <NewComplianceForm />
    </EntitlementGuard>
  );
}
