"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, ClipboardCheck, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
}

interface Vendor {
  id: string;
  companyName: string;
}

interface Inspection {
  id: string;
  propertyId: string;
  unitId?: string;
  inspectionType: string;
  status: string;
  scheduledDate: string;
  scheduledTime?: string;
  inspectorVendorId?: string;
  findings?: string;
  recommendations?: string;
  overallRating?: string;
  followUpRequired: boolean;
}

interface FormData {
  propertyId: string;
  unitId: string;
  inspectionType: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  inspectorVendorId: string;
  findings: string;
  recommendations: string;
  overallRating: string;
  followUpRequired: boolean;
}

export default function EditInspectionPage() {
  const router = useRouter();
  const params = useParams();
  const inspectionId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const [formData, setFormData] = useState<FormData>({
    propertyId: "",
    unitId: "",
    inspectionType: "",
    status: "scheduled",
    scheduledDate: "",
    scheduledTime: "",
    inspectorVendorId: "",
    findings: "",
    recommendations: "",
    overallRating: "",
    followUpRequired: false,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

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
      setIsLoading(true);
      setError(null);
      
      const [propsRes, vendorsRes, inspectionRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/vendors?category=Inspector"),
        fetch(`/api/inspections/${inspectionId}`),
      ]);

      if (propsRes.ok) {
        const propsData = await propsRes.json();
        if (propsData.success) setProperties(propsData.data.data || []);
      }
      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        if (vendorsData.success) setVendors(vendorsData.data.data || []);
      }
      
      if (inspectionRes.ok) {
        const result = await inspectionRes.json();
        if (result.success && result.data) {
          const data: Inspection = result.data;
          // Load units for the property first
          if (data.propertyId) {
            await loadUnits(data.propertyId);
          }
          // Populate form data
          setFormData({
            propertyId: data.propertyId || "",
            unitId: data.unitId || "",
            inspectionType: data.inspectionType || "",
            status: data.status || "scheduled",
            scheduledDate: data.scheduledDate || "",
            scheduledTime: data.scheduledTime || "",
            inspectorVendorId: data.inspectorVendorId || "",
            findings: data.findings || "",
            recommendations: data.recommendations || "",
            overallRating: data.overallRating || "",
            followUpRequired: data.followUpRequired || false,
          });
        } else {
          setError("Inspection not found");
        }
      } else {
        setError("Failed to load inspection");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("An error occurred while loading data");
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

    if (!formData.propertyId) newErrors.propertyId = "Property is required";
    if (!formData.inspectionType) newErrors.inspectionType = "Inspection type is required";
    if (!formData.scheduledDate) newErrors.scheduledDate = "Scheduled date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: formData.propertyId,
          unitId: formData.unitId || undefined,
          inspectionType: formData.inspectionType,
          status: formData.status,
          scheduledDate: formData.scheduledDate,
          scheduledTime: formData.scheduledTime || undefined,
          inspectorVendorId: formData.inspectorVendorId || undefined,
          findings: formData.findings || undefined,
          recommendations: formData.recommendations || undefined,
          overallRating: formData.overallRating || undefined,
          followUpRequired: formData.followUpRequired,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push(`/management/inspections/${inspectionId}`);
        } else {
          alert(result.error || "Failed to update inspection");
        }
      } else {
        alert("Failed to update inspection");
      }
    } catch (error) {
      console.error("Error updating inspection:", error);
      alert("An error occurred while updating the inspection");
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <div className="flex gap-2">
          <Button onClick={loadInitialData} variant="outline">
            Retry
          </Button>
          <Link href={`/management/inspections/${inspectionId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/management/inspections/${inspectionId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Edit Inspection</h1>
          <p className="text-[var(--secondary-text)] mt-1">Update inspection details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[var(--teal)]" />
              Location
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
                    {prop.name}
                  </option>
                ))}
              </select>
              {errors.propertyId && <p className="text-sm text-red-500 mt-1">{errors.propertyId}</p>}
            </div>

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

        {/* Inspection Details */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <DropdownSelect
                  recordType="Inspection"
                  fieldName="Inspection Type"
                  value={formData.inspectionType}
                  onChange={(value) => handleChange("inspectionType", value)}
                  placeholder="Select Type"
                  label="Inspection Type"
                  required
                  className={errors.inspectionType ? "[&_select]:border-red-500" : ""}
                />
                {errors.inspectionType && <p className="text-sm text-red-500 mt-1">{errors.inspectionType}</p>}
              </div>
              <div>
                <DropdownSelect
                  recordType="Inspection"
                  fieldName="Inspection Status"
                  value={formData.status}
                  onChange={(value) => handleChange("status", value)}
                  placeholder="Select Status"
                  label="Status"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Scheduled Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => handleChange("scheduledDate", e.target.value)}
                  className={errors.scheduledDate ? "border-red-500" : ""}
                />
                {errors.scheduledDate && <p className="text-sm text-red-500 mt-1">{errors.scheduledDate}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Scheduled Time
                </label>
                <Input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => handleChange("scheduledTime", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Inspector / Vendor
              </label>
              <select
                value={formData.inspectorVendorId}
                onChange={(e) => handleChange("inspectorVendorId", e.target.value)}
                className="input w-full"
              >
                <option value="">Select Inspector</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.companyName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Findings
              </label>
              <textarea
                value={formData.findings}
                onChange={(e) => handleChange("findings", e.target.value)}
                rows={4}
                className="input w-full"
                placeholder="Enter inspection findings..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Recommendations
              </label>
              <textarea
                value={formData.recommendations}
                onChange={(e) => handleChange("recommendations", e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Enter recommendations..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <DropdownSelect
                  recordType="Inspection"
                  fieldName="Overall Result"
                  value={formData.overallRating}
                  onChange={(value) => handleChange("overallRating", value)}
                  placeholder="Select Rating"
                  label="Overall Rating"
                />
              </div>
              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="followUpRequired"
                  checked={formData.followUpRequired}
                  onChange={(e) => handleChange("followUpRequired", e.target.checked)}
                  className="rounded border-[var(--border-color)] mr-2"
                />
                <label htmlFor="followUpRequired" className="text-sm text-[var(--main-text)]">
                  Follow-up Required
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href={`/management/inspections/${inspectionId}`}>
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