"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import { ArrowLeft, Loader2, Save, Home } from "lucide-react";

interface Property {
  id: string;
  name: string;
  associationId: string;
  associationName: string;
}

interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  displayName?: string;
  type?: string;
  status: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string;
  occupancyStatus?: string;
  rentalStatus?: string;
  parkingSpot?: string;
  storageUnit?: string;
  moveInDate?: string;
  moveOutDate?: string;
  mailingAddress?: string;
  accessNotes?: string;
}

export default function EditUnitPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = params.id as string;
  
  const [unit, setUnit] = useState<Unit | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Unit>>({});

  useEffect(() => {
    loadData();
  }, [unitId]);

  async function loadData() {
    try {
      setIsLoading(true);
      
      // Load unit
      const unitRes = await fetch(`/api/units/${unitId}`);
      if (!unitRes.ok) throw new Error("Failed to fetch unit");
      const unitData = await unitRes.json();
      if (!unitData.success) throw new Error(unitData.error);
      setUnit(unitData.data);
      setFormData(unitData.data);
      
      // Load properties
      const propsRes = await fetch("/api/properties");
      if (propsRes.ok) {
        const propsData = await propsRes.json();
        if (propsData.success) setProperties(propsData.data.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/units/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update unit");
      }

      router.push(`/management/units/${unitId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsSaving(false);
    }
  }

  function handleChange(field: keyof Unit, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  const selectedProperty = properties.find(p => p.id === formData.propertyId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error && !unit) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">{error}</p>
        <Link href="/management/units">
          <Button variant="outline">Back to Units</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/management/units/${unitId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Edit Unit</h1>
          <p className="text-[var(--secondary-text)]">Unit {unit?.unitNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

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
                value={formData.propertyId || ""}
                onChange={(e) => handleChange("propertyId", e.target.value)}
                className="input w-full"
                required
              >
                <option value="">Select Property</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
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
                  required
                  value={formData.unitNumber || ""}
                  onChange={(e) => handleChange("unitNumber", e.target.value)}
                  placeholder="e.g., 101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Display Name
                </label>
                <Input
                  value={formData.displayName || ""}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  placeholder="e.g., Unit 101 - John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Status
                </label>
                <select
                  value={formData.status || ""}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="input w-full"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DropdownSelect
                recordType="Unit"
                fieldName="Unit Type"
                value={formData.type || ""}
                onChange={(value) => handleChange("type", value)}
                placeholder="Select Type"
                label="Unit Type"
              />
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Floor
                </label>
                <Input
                  value={formData.floor || ""}
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
                  value={formData.squareFeet || ""}
                  onChange={(e) => handleChange("squareFeet", parseInt(e.target.value) || "")}
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
                  value={formData.bedrooms || ""}
                  onChange={(e) => handleChange("bedrooms", parseInt(e.target.value) || "")}
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
                  value={formData.bathrooms || ""}
                  onChange={(e) => handleChange("bathrooms", parseFloat(e.target.value) || "")}
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
              <DropdownSelect
                recordType="Unit"
                fieldName="Occupancy Status"
                value={formData.occupancyStatus || ""}
                onChange={(value) => handleChange("occupancyStatus", value)}
                placeholder="Select Status"
                label="Occupancy Status"
              />
              <DropdownSelect
                recordType="Unit"
                fieldName="Rental Status"
                value={formData.rentalStatus || ""}
                onChange={(value) => handleChange("rentalStatus", value)}
                placeholder="Select Status"
                label="Rental Status"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Parking Spot
                </label>
                <Input
                  value={formData.parkingSpot || ""}
                  onChange={(e) => handleChange("parkingSpot", e.target.value)}
                  placeholder="e.g., P-101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Storage Unit
                </label>
                <Input
                  value={formData.storageUnit || ""}
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
                  value={formData.moveInDate || ""}
                  onChange={(e) => handleChange("moveInDate", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Move-out Date
                </label>
                <Input
                  type="date"
                  value={formData.moveOutDate || ""}
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
                value={formData.mailingAddress || ""}
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
                value={formData.accessNotes || ""}
                onChange={(e) => handleChange("accessNotes", e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Key location, special access instructions, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link href={`/management/units/${unitId}`}>
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
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
