"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Building2, Loader2 } from "lucide-react";
import Link from "next/link";

interface Association {
  id: string;
  name: string;
}

interface FormData {
  associationId: string;
  name: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  type: string;
  status: string;
  yearBuilt: string;
  totalUnits: string;
  managementStartDate: string;
  accessInstructions: string;
  emergencyNotes: string;
  assignedStaffId: string;
  photoUrl: string;
}

export default function NewPropertyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    associationId: "",
    name: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    type: "",
    status: "active",
    yearBuilt: "",
    totalUnits: "",
    managementStartDate: "",
    accessInstructions: "",
    emergencyNotes: "",
    assignedStaffId: "",
    photoUrl: "",
  });

  useEffect(() => {
    loadAssociations();
  }, []);

  async function loadAssociations() {
    try {
      const response = await fetch("/api/associations");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAssociations(result.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading associations:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.associationId) newErrors.associationId = "Association is required";
    if (!formData.name?.trim()) newErrors.name = "Property name is required";
    if (!formData.addressStreet?.trim()) newErrors.addressStreet = "Street address is required";
    if (!formData.addressCity?.trim()) newErrors.addressCity = "City is required";
    if (!formData.addressState?.trim()) newErrors.addressState = "State is required";
    if (!formData.addressZip?.trim()) newErrors.addressZip = "ZIP code is required";
    if (!formData.type) newErrors.type = "Property type is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          associationId: formData.associationId,
          name: formData.name,
          addressStreet: formData.addressStreet,
          addressCity: formData.addressCity,
          addressState: formData.addressState,
          addressZip: formData.addressZip,
          type: formData.type,
          status: formData.status,
          yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : undefined,
          totalUnits: formData.totalUnits ? parseInt(formData.totalUnits) : undefined,
          managementStartDate: formData.managementStartDate || undefined,
          accessInstructions: formData.accessInstructions || undefined,
          emergencyNotes: formData.emergencyNotes || undefined,
          assignedStaffId: formData.assignedStaffId || undefined,
          photoUrl: formData.photoUrl || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push(`/management/properties/${result.data.id}`);
        } else {
          alert(result.error || "Failed to create property");
        }
      } else {
        alert("Failed to create property");
      }
    } catch (error) {
      console.error("Error creating property:", error);
      alert("An error occurred while creating the property");
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
        <Link href="/management/properties">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Add New Property</h1>
          <p className="text-[var(--secondary-text)] mt-1">Create a new property record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Association Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--teal)]" />
              Association
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Association <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.associationId}
                onChange={(e) => handleChange("associationId", e.target.value)}
                className={`input w-full ${errors.associationId ? "border-red-500" : ""}`}
              >
                <option value="">Select Association</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>
                    {assoc.name}
                  </option>
                ))}
              </select>
              {errors.associationId && (
                <p className="text-sm text-red-500 mt-1">{errors.associationId}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Property Information */}
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Property Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Oakwood Heights"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className={`input w-full ${errors.type ? "border-red-500" : ""}`}
                >
                  <option value="">Select Type</option>
                  <option value="Condominium">Condominium</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Single Family">Single Family</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Mixed Use">Mixed Use</option>
                </select>
                {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
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
                  <option value="inactive">Inactive</option>
                  <option value="under_construction">Under Construction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Year Built
                </label>
                <Input
                  type="number"
                  value={formData.yearBuilt}
                  onChange={(e) => handleChange("yearBuilt", e.target.value)}
                  placeholder="e.g., 2005"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Total Units
                </label>
                <Input
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) => handleChange("totalUnits", e.target.value)}
                  placeholder="e.g., 24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Management Start Date
                </label>
                <Input
                  type="date"
                  value={formData.managementStartDate}
                  onChange={(e) => handleChange("managementStartDate", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.addressStreet}
                onChange={(e) => handleChange("addressStreet", e.target.value)}
                placeholder="e.g., 1234 Main Street"
                className={errors.addressStreet ? "border-red-500" : ""}
              />
              {errors.addressStreet && (
                <p className="text-sm text-red-500 mt-1">{errors.addressStreet}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.addressCity}
                  onChange={(e) => handleChange("addressCity", e.target.value)}
                  placeholder="e.g., Chicago"
                  className={errors.addressCity ? "border-red-500" : ""}
                />
                {errors.addressCity && (
                  <p className="text-sm text-red-500 mt-1">{errors.addressCity}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.addressState}
                  onChange={(e) => handleChange("addressState", e.target.value)}
                  placeholder="e.g., IL"
                  className={errors.addressState ? "border-red-500" : ""}
                />
                {errors.addressState && (
                  <p className="text-sm text-red-500 mt-1">{errors.addressState}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.addressZip}
                  onChange={(e) => handleChange("addressZip", e.target.value)}
                  placeholder="e.g., 60601"
                  className={errors.addressZip ? "border-red-500" : ""}
                />
                {errors.addressZip && (
                  <p className="text-sm text-red-500 mt-1">{errors.addressZip}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo URL */}
        <Card>
          <CardHeader>
            <CardTitle>Property Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Photo URL (GHL Storage)
              </label>
              <Input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => handleChange("photoUrl", e.target.value)}
                placeholder="https://..."
              />
              <p className="text-sm text-[var(--secondary-text)] mt-1">
                Enter the URL of the property photo stored in GHL
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Access & Emergency */}
        <Card>
          <CardHeader>
            <CardTitle>Access & Emergency Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Access Instructions
              </label>
              <textarea
                value={formData.accessInstructions}
                onChange={(e) => handleChange("accessInstructions", e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Key location, gate codes, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Emergency Notes
              </label>
              <textarea
                value={formData.emergencyNotes}
                onChange={(e) => handleChange("emergencyNotes", e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Emergency contact, shut-off locations, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/management/properties">
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
                Create Property
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
