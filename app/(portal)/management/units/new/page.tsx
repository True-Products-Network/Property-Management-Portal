"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Home, Loader2, Pencil } from "lucide-react";
import Link from "next/link";

interface Property {
  id: string;
  name: string;
  associationId: string;
  associationName: string;
}

interface DropdownOption {
  value: string;
  label: string;
}

interface FormData {
  propertyId: string;
  unitNumber: string;
  displayName: string;
  type: string;
  status: string;
  squareFeet: string;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  occupancyStatus: string;
  rentalStatus: string;
  parkingSpot: string;
  storageUnit: string;
  moveInDate: string;
  moveOutDate: string;
  mailingAddress: string;
  accessNotes: string;
}

export default function NewUnitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const unitId = searchParams.get("id");
  const isEditMode = !!unitId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [unitTypes, setUnitTypes] = useState<DropdownOption[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    propertyId: "",
    unitNumber: "",
    displayName: "",
    type: "",
    status: "active",
    squareFeet: "",
    bedrooms: "",
    bathrooms: "",
    floor: "",
    occupancyStatus: "",
    rentalStatus: "",
    parkingSpot: "",
    storageUnit: "",
    moveInDate: "",
    moveOutDate: "",
    mailingAddress: "",
    accessNotes: "",
  });

  useEffect(() => {
    loadProperties();
    loadDropdowns();
  }, []);

  useEffect(() => {
    if (isEditMode && unitId) {
      loadUnitData(unitId);
    }
  }, [isEditMode, unitId]);

  async function loadDropdowns() {
    try {
      const response = await fetch("/api/admin/dropdowns");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Get unit types from dropdown settings
          const unitTypeDropdowns = result.data.find(
            (d: any) => d.recordType === 'unit' && d.fieldName === 'type'
          );
          if (unitTypeDropdowns?.values) {
            setUnitTypes(unitTypeDropdowns.values);
          }
        }
      }
    } catch (error) {
      console.error("Error loading dropdowns:", error);
    }
  }

  async function loadProperties() {
    try {
      const response = await fetch("/api/properties");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProperties(result.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading properties:", error);
    } finally {
      // Only set loading to false if not in edit mode
      // In edit mode, loading will be set to false after unit data loads
      if (!isEditMode) {
        setIsLoading(false);
      }
    }
  }

  async function loadUnitData(id: string) {
    try {
      const response = await fetch(`/api/units/${id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const unit = result.data;
          setFormData({
            propertyId: unit.propertyId || "",
            unitNumber: unit.unitNumber || "",
            displayName: unit.displayName || "",
            type: unit.type || "",
            status: unit.status || "active",
            squareFeet: unit.squareFeet?.toString() || "",
            bedrooms: unit.bedrooms?.toString() || "",
            bathrooms: unit.bathrooms?.toString() || "",
            floor: unit.floor || "",
            occupancyStatus: unit.occupancyStatus || "",
            rentalStatus: unit.rentalStatus || "",
            parkingSpot: unit.parkingSpot || "",
            storageUnit: unit.storageUnit || "",
            moveInDate: unit.moveInDate || "",
            moveOutDate: unit.moveOutDate || "",
            mailingAddress: unit.mailingAddress || "",
            accessNotes: unit.accessNotes || "",
          });
        }
      }
    } catch (error) {
      console.error("Error loading unit data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.propertyId) newErrors.propertyId = "Property is required";
    if (!formData.unitNumber?.trim()) newErrors.unitNumber = "Unit number is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const payload = {
        propertyId: formData.propertyId,
        unitNumber: formData.unitNumber,
        displayName: formData.displayName || undefined,
        type: formData.type || undefined,
        status: formData.status,
        squareFeet: formData.squareFeet ? parseInt(formData.squareFeet) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseFloat(formData.bathrooms) : undefined,
        floor: formData.floor || undefined,
        occupancyStatus: formData.occupancyStatus || undefined,
        rentalStatus: formData.rentalStatus || undefined,
        parkingSpot: formData.parkingSpot || undefined,
        storageUnit: formData.storageUnit || undefined,
        moveInDate: formData.moveInDate || undefined,
        moveOutDate: formData.moveOutDate || undefined,
        mailingAddress: formData.mailingAddress || undefined,
        accessNotes: formData.accessNotes || undefined,
      };

      const url = isEditMode ? `/api/units/${unitId}` : "/api/units";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push(`/management/units/${isEditMode ? unitId : result.data.id}`);
        } else {
          alert(result.error || `Failed to ${isEditMode ? "update" : "create"} unit`);
        }
      } else {
        alert(`Failed to ${isEditMode ? "update" : "create"} unit`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} unit:`, error);
      alert(`An error occurred while ${isEditMode ? "updating" : "creating"} the unit`);
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
        <Link href="/management/units">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {isEditMode ? "Edit Unit" : "Add New Unit"}
            </h1>
            {isEditMode && (
              <span className="px-2 py-1 text-xs font-medium bg-[var(--teal)]/10 text-[var(--teal)] rounded-full flex items-center gap-1">
                <Pencil className="h-3 w-3" />
                Edit Mode
              </span>
            )}
          </div>
          <p className="text-[var(--secondary-text)] mt-1">
            {isEditMode ? "Update unit details" : "Create a new unit record"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-[var(--teal)]" />
              Property
            </CardTitle>
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
                    {prop.name} ({prop.associationName})
                  </option>
                ))}
              </select>
              {errors.propertyId && (
                <p className="text-sm text-red-500 mt-1">{errors.propertyId}</p>
              )}
            </div>
            {selectedProperty && (
              <div className="p-3 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm text-[var(--secondary-text)]">
                  Association: <span className="font-medium text-[var(--main-text)]">{selectedProperty.associationName}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unit Information */}
        <Card>
          <CardHeader>
            <CardTitle>Unit Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Unit Number <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.unitNumber}
                  onChange={(e) => handleChange("unitNumber", e.target.value)}
                  placeholder="e.g., 101"
                  className={errors.unitNumber ? "border-red-500" : ""}
                />
                {errors.unitNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.unitNumber}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Display Name
                </label>
                <Input
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder="e.g., Unit 101 - John Doe"
                />
              </div>
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
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Unit Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select Type</option>
                  {unitTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Floor
                </label>
                <Input
                  value={formData.floor}
                  onChange={(e) => handleChange("floor", e.target.value)}
                  placeholder="e.g., 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Square Feet
                </label>
                <Input
                  type="number"
                  value={formData.squareFeet}
                  onChange={(e) => handleChange("squareFeet", e.target.value)}
                  placeholder="e.g., 850"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Bedrooms
                </label>
                <Input
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleChange("bedrooms", e.target.value)}
                  placeholder="e.g., 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Bathrooms
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange("bathrooms", e.target.value)}
                  placeholder="e.g., 1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Occupancy & Rental */}
        <Card>
          <CardHeader>
            <CardTitle>Occupancy & Rental Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Occupancy Status
                </label>
                <select
                  value={formData.occupancyStatus}
                  onChange={(e) => handleChange("occupancyStatus", e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select Status</option>
                  <option value="occupied">Occupied</option>
                  <option value="vacant">Vacant</option>
                  <option value="under_renovation">Under Renovation</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Rental Status
                </label>
                <select
                  value={formData.rentalStatus}
                  onChange={(e) => handleChange("rentalStatus", e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select Status</option>
                  <option value="owner_occupied">Owner Occupied</option>
                  <option value="tenant_occupied">Tenant Occupied</option>
                  <option value="vacant">Vacant</option>
                  <option value="for_rent">For Rent</option>
                  <option value="for_sale">For Sale</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Parking Spot
                </label>
                <Input
                  value={formData.parkingSpot}
                  onChange={(e) => handleChange("parkingSpot", e.target.value)}
                  placeholder="e.g., P-101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Storage Unit
                </label>
                <Input
                  value={formData.storageUnit}
                  onChange={(e) => handleChange("storageUnit", e.target.value)}
                  placeholder="e.g., S-12"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Move-in Date
                </label>
                <Input
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => handleChange("moveInDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Move-out Date
                </label>
                <Input
                  type="date"
                  value={formData.moveOutDate}
                  onChange={(e) => handleChange("moveOutDate", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mailing & Access */}
        <Card>
          <CardHeader>
            <CardTitle>Mailing Address & Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Mailing Address (if different from property)
              </label>
              <textarea
                value={formData.mailingAddress}
                onChange={(e) => handleChange("mailingAddress", e.target.value)}
                rows={2}
                className="input w-full"
                placeholder="Enter mailing address if different from property address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Access Notes
              </label>
              <textarea
                value={formData.accessNotes}
                onChange={(e) => handleChange("accessNotes", e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Key location, special access instructions, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/management/units">
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
                {isEditMode ? "Save Changes" : "Create Unit"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
