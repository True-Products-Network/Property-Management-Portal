"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Wrench, Loader2, Edit3 } from "lucide-react";
import Link from "next/link";

interface Property {
  id: string;
  name: string;
  associationId: string;
  associationName: string;
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
  email: string;
}

interface Vendor {
  id: string;
  companyName: string;
}

interface FormData {
  reporterId: string;
  propertyId: string;
  unitId: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  assignedVendorId: string;
  assignedStaffId: string;
  estimatedCost: string;
  requestedDate: string;
  scheduledDate: string;
  vendorNotes: string;
  internalNotes: string;
}

const CATEGORIES = [
  { value: "repair", label: "Repair" },
  { value: "maintenance", label: "Maintenance" },
  { value: "inspection", label: "Inspection" },
  { value: "cleaning", label: "Cleaning" },
  { value: "landscaping", label: "Landscaping" },
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "security", label: "Security" },
  { value: "other", label: "Other" },
];

const URGENCY_LEVELS = [
  { value: "low", label: "Low - Routine" },
  { value: "medium", label: "Medium - Soon" },
  { value: "high", label: "High - Urgent" },
  { value: "emergency", label: "Emergency - Immediate" },
];

function MaintenanceRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    reporterId: "",
    propertyId: "",
    unitId: "",
    title: "",
    description: "",
    category: "",
    urgency: "medium",
    status: "new",
    assignedVendorId: "",
    assignedStaffId: "",
    estimatedCost: "",
    requestedDate: "",
    scheduledDate: "",
    vendorNotes: "",
    internalNotes: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load maintenance request data when in edit mode
  useEffect(() => {
    if (isEditMode && editId && properties.length > 0 && contacts.length > 0 && vendors.length > 0) {
      loadMaintenanceRequest(editId);
    }
  }, [isEditMode, editId, properties.length, contacts.length, vendors.length]);

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
      const [propsRes, contactsRes, vendorsRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/contacts"),
        fetch("/api/vendors"),
      ]);

      if (propsRes.ok) {
        const propsData = await propsRes.json();
        if (propsData.success) setProperties(propsData.data.data || []);
      }
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        if (contactsData.success) setContacts(contactsData.data.data || []);
      }
      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        if (vendorsData.success) setVendors(vendorsData.data.data || []);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      // Don't set isLoading to false yet if in edit mode - wait for maintenance request data
      if (!isEditMode) {
        setIsLoading(false);
      }
    }
  }

  async function loadMaintenanceRequest(id: string) {
    try {
      const response = await fetch(`/api/maintenance/${id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const data = result.data;
          // Load units for the property first
          if (data.propertyId) {
            await loadUnits(data.propertyId);
          }
          // Populate form data
          setFormData({
            reporterId: data.reportedByContactId || "",
            propertyId: data.propertyId || "",
            unitId: data.unitId || "",
            title: data.title || "",
            description: data.description || "",
            category: data.category || "",
            urgency: data.urgency || "medium",
            status: data.status || "new",
            assignedVendorId: data.assignedVendorId || "",
            assignedStaffId: data.assignedStaffId || "",
            estimatedCost: data.estimatedCost?.toString() || "",
            requestedDate: data.requestedDate ? data.requestedDate.split("T")[0] : "",
            scheduledDate: data.scheduledDate ? data.scheduledDate.split("T")[0] : "",
            vendorNotes: data.vendorNotes || "",
            internalNotes: data.resolutionNotes || "",
          });
        }
      } else {
        alert("Failed to load maintenance request");
        router.push("/management/maintenance");
      }
    } catch (error) {
      console.error("Error loading maintenance request:", error);
      alert("An error occurred while loading the maintenance request");
      router.push("/management/maintenance");
    } finally {
      setIsLoading(false);
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

    if (!formData.reporterId) newErrors.reporterId = "Reporter is required";
    if (!formData.propertyId) newErrors.propertyId = "Property is required";
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.description?.trim()) newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.urgency) newErrors.urgency = "Urgency is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const url = isEditMode ? `/api/maintenance/${editId}` : "/api/maintenance";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedByContactId: formData.reporterId,
          propertyId: formData.propertyId,
          unitId: formData.unitId || undefined,
          title: formData.title,
          description: formData.description,
          category: formData.category,
          urgency: formData.urgency,
          status: formData.status,
          assignedVendorId: formData.assignedVendorId || undefined,
          assignedStaffId: formData.assignedStaffId || undefined,
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
          requestedDate: formData.requestedDate || undefined,
          scheduledDate: formData.scheduledDate || undefined,
          vendorNotes: formData.vendorNotes || undefined,
          internalNotes: formData.internalNotes || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const redirectId = isEditMode ? editId : result.data.id;
          router.push(`/management/maintenance/${redirectId}`);
        } else {
          alert(result.error || `Failed to ${isEditMode ? "update" : "create"} maintenance request`);
        }
      } else {
        alert(`Failed to ${isEditMode ? "update" : "create"} maintenance request`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} maintenance request:`, error);
      alert(`An error occurred while ${isEditMode ? "updating" : "creating"} the maintenance request`);
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

  const selectedProperty = properties.find(p => p.id === formData.propertyId);

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
        <Link href="/management/maintenance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {isEditMode ? "Edit Maintenance Request" : "New Maintenance Request"}
            </h1>
            {isEditMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                <Edit3 className="h-3 w-3" />
                Edit Mode
              </span>
            )}
          </div>
          <p className="text-[var(--secondary-text)] mt-1">
            {isEditMode ? "Update the maintenance request details" : "Create a new maintenance or repair request"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reporter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[var(--teal)]" />
              Reporter Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Reported By <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.reporterId}
                onChange={(e) => handleChange("reporterId", e.target.value)}
                className={`input w-full ${errors.reporterId ? "border-red-500" : ""}`}
              >
                <option value="">Select Contact</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} ({contact.email})
                  </option>
                ))}
              </select>
              {errors.reporterId && <p className="text-sm text-red-500 mt-1">{errors.reporterId}</p>}
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
                Property <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.propertyId}
                onChange={(e) => handleChange("propertyId", e.target.value)}
                className={`input w-full ${errors.propertyId ? "border-red-500" : ""}`}
              >
                <option value="">Select Property</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
              {errors.propertyId && <p className="text-sm text-red-500 mt-1">{errors.propertyId}</p>}
            </div>

            {selectedProperty && (
              <div className="p-3 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm text-[var(--secondary-text)]">
                  Association: <span className="font-medium text-[var(--main-text)]">{selectedProperty.associationName}</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Unit (optional)
              </label>
              <select
                value={formData.unitId}
                onChange={(e) => handleChange("unitId", e.target.value)}
                className="input w-full"
                disabled={!formData.propertyId}
              >
                <option value="">Common Area / No Specific Unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Unit {unit.unitNumber}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Problem Details */}
        <Card>
          <CardHeader>
            <CardTitle>Problem Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Brief summary of the issue"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className={`input w-full ${errors.description ? "border-red-500" : ""}`}
                placeholder="Detailed description of the problem..."
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
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
                  Urgency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => handleChange("urgency", e.target.value)}
                  className={`input w-full ${errors.urgency ? "border-red-500" : ""}`}
                >
                  {URGENCY_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                {errors.urgency && <p className="text-sm text-red-500 mt-1">{errors.urgency}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Assigned Vendor
                </label>
                <select
                  value={formData.assignedVendorId}
                  onChange={(e) => handleChange("assignedVendorId", e.target.value)}
                  className="input w-full"
                >
                  <option value="">Unassigned</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Estimated Cost
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.estimatedCost}
                  onChange={(e) => handleChange("estimatedCost", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Requested Date
                </label>
                <Input
                  type="date"
                  value={formData.requestedDate}
                  onChange={(e) => handleChange("requestedDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Scheduled Date
                </label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleChange("scheduledDate", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Vendor Notes
              </label>
              <textarea
                value={formData.vendorNotes}
                onChange={(e) => handleChange("vendorNotes", e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Notes for the vendor..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Internal Notes
              </label>
              <textarea
                value={formData.internalNotes}
                onChange={(e) => handleChange("internalNotes", e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Internal notes (not visible to reporter)..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/management/maintenance">
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
                {isEditMode ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Save Changes" : "Create Request"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Wrap the component with Suspense for useSearchParams
export default function NewMaintenanceRequestPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    }>
      <MaintenanceRequestForm />
    </Suspense>
  );
}
