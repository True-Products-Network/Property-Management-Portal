"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, ClipboardCheck, Loader2, Pencil, Calendar } from "lucide-react";
import Link from "next/link";
import { EntitlementGuard } from "@/components/entitlements/EntitlementGuard";
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

interface CalendarSettings {
  enable_calendar_integration: string;
  ghl_inspection_calendar_url: string;
  calendar_provider: string;
}

function InspectionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inspectionId = searchParams.get("id");
  const isEditMode = !!inspectionId;
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
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
    loadCalendarSettings();
  }, []);

  useEffect(() => {
    if (isEditMode && inspectionId) {
      loadInspectionData(inspectionId);
    }
  }, [isEditMode, inspectionId]);

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
        fetch("/api/vendors?category=Inspector"),
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
      // Only set loading to false if not in edit mode
      // In edit mode, loading will be set to false after inspection data loads
      if (!isEditMode) {
        setIsLoading(false);
      }
    }
  }

  async function loadInspectionData(id: string) {
    try {
      const response = await fetch(`/api/inspections/${id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const inspection = result.data;
          setFormData({
            propertyId: inspection.propertyId || "",
            unitId: inspection.unitId || "",
            inspectionType: inspection.inspectionType || "",
            status: inspection.status || "scheduled",
            scheduledDate: inspection.scheduledDate || "",
            scheduledTime: inspection.scheduledTime || "",
            inspectorId: inspection.inspectorId || "",
            inspectorVendorId: inspection.inspectorVendorId || "",
            findings: inspection.findings || "",
            recommendations: inspection.recommendations || "",
            overallRating: inspection.overallRating || "",
            followUpRequired: inspection.followUpRequired || false,
          });
        }
      } else {
        alert("Failed to load inspection data");
      }
    } catch (error) {
      console.error("Error loading inspection data:", error);
      alert("An error occurred while loading the inspection");
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

  async function loadCalendarSettings() {
    try {
      const response = await fetch("/api/settings?category=calendar");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCalendarSettings(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading calendar settings:", error);
    }
  }

  function handleScheduleViaCalendar() {
    if (!calendarSettings?.ghl_inspection_calendar_url) {
      alert("Calendar URL not configured. Please contact your administrator.");
      return;
    }
    setShowCalendarModal(true);
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
      const url = isEditMode ? `/api/inspections/${inspectionId}` : "/api/inspections";
      const method = isEditMode ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
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
          const redirectId = isEditMode ? inspectionId : result.data.id;
          router.push(`/management/inspections/${redirectId}`);
        } else {
          alert(result.error || `Failed to ${isEditMode ? "update" : "create"} inspection`);
        }
      } else {
        alert(`Failed to ${isEditMode ? "update" : "create"} inspection`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} inspection:`, error);
      alert(`An error occurred while ${isEditMode ? "updating" : "creating"} the inspection`);
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
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {isEditMode ? "Edit Inspection" : "Schedule Inspection"}
            </h1>
            {isEditMode && (
              <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                Edit Mode
              </span>
            )}
          </div>
          <p className="text-[var(--secondary-text)] mt-1">
            {isEditMode ? "Update inspection details" : "Create a new property inspection"}
          </p>
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
                  defaultOptions={[
                    { value: "move_in", label: "Move In" },
                    { value: "move_out", label: "Move Out" },
                    { value: "annual", label: "Annual" },
                    { value: "quarterly", label: "Quarterly" },
                    { value: "safety", label: "Safety" },
                    { value: "maintenance", label: "Maintenance" },
                    { value: "insurance", label: "Insurance" },
                    { value: "pre_lease", label: "Pre-Lease" },
                    { value: "other", label: "Other" }
                  ]}
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

            {/* Calendar Integration */}
            {calendarSettings?.enable_calendar_integration === "true" && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      Schedule via Calendar
                    </p>
                    <p className="text-xs text-blue-600">
                      Let the inspector book their preferred time slot
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleScheduleViaCalendar}
                    className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Open Calendar
                  </Button>
                </div>
              </div>
            )}

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
            ) : isEditMode ? (
              <>
                <Pencil className="h-4 w-4 mr-2" />
                Save Changes
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

      {/* Calendar Modal */}
      {showCalendarModal && calendarSettings?.ghl_inspection_calendar_url && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">Schedule Inspection</h3>
                <p className="text-sm text-gray-500">
                  Select a date and time. The booking will sync back to this inspection record.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalendarModal(false)}
              >
                Close
              </Button>
            </div>
            <div className="flex-1 p-0 overflow-hidden">
              <iframe
                src={calendarSettings.ghl_inspection_calendar_url}
                className="w-full h-full border-0"
                allow="fullscreen"
              />
            </div>
            <div className="p-4 border-t bg-gray-50">
              <p className="text-xs text-gray-500">
                After booking, the selected date will automatically update in this inspection record.
                Make sure to save the inspection after closing this calendar.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap with EntitlementGuard and Suspense
export default function InspectionFormWrapper() {
  return (
    <EntitlementGuard featureKey="inspections">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
        </div>
      }>
        <InspectionForm />
      </Suspense>
    </EntitlementGuard>
  );
}
