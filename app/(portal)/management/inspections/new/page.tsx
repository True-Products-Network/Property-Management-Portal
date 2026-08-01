"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, ClipboardCheck, Loader2 } from "lucide-react";
import Link from "next/link";

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

interface FormData {
  propertyId: string;
  unitId: string;
  inspectionType: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string;
  inspectorId: string;
  inspectorVendorId: string;
  findings: string;
  recommendations: string;
  overallRating: string;
  followUpRequired: boolean;
}

const INSPECTION_TYPES = [
  { value: "annual", label: "Annual Inspection" },
  { value: "move_in", label: "Move-In Inspection" },
  { value: "move_out", label: "Move-Out Inspection" },
  { value: "safety", label: "Safety Inspection" },
  { value: "maintenance", label: "Maintenance Inspection" },
  { value: "complaint", label: "Complaint Inspection" },
  { value: "insurance", label: "Insurance Inspection" },
];

const OVERALL_RATINGS = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export default function NewInspectionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
    inspectorId: "",
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
      const [propsRes, vendorsRes] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/vendors"),
      ]);

      if (propsRes.ok) {
        const propsData = await propsRes.json();
        if (propsData.success) setProperties(propsData.data.data || []);
      }
      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        if (vendorsData.success) setVendors(vendorsData.data.data || []);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
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
      const response = await fetch("/api/inspections", {
        method: "POST",
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
          router.push(`/management/inspections/${result.data.id}`);
        } else {
          alert(result.error || "Failed to create inspection");
        }
      } else {
        alert("Failed to create inspection");
      }
    } catch (error) {
      console.error("Error creating inspection:", error);
      alert("An error occurred while creating the inspection");
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
        <Link href="/management/inspections">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Schedule Inspection</h1>
          <p className="text-[var(--secondary-text)] mt-1">Create a new property inspection</p>
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
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Inspection Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.inspectionType}
                  onChange={(e) => handleChange("inspectionType", e.target.value)}
                  className={`input w-full ${errors.inspectionType ? "border-red-500" : ""}`}
                >
                  <option value="">Select Type</option>
                  {INSPECTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.inspectionType && <p className="text-sm text-red-500 mt-1">{errors.inspectionType}</p>}
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
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Overall Rating
                </label>
                <select
                  value={formData.overallRating}
                  onChange={(e) => handleChange("overallRating", e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select Rating</option>
                  {OVERALL_RATINGS.map((rating) => (
                    <option key={rating.value} value={rating.value}>
                      {rating.label}
                    </option>
                  ))}
                </select>
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
          <Link href="/management/inspections">
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
                Schedule Inspection
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
