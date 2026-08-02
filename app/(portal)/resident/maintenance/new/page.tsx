"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Save,
  Wrench,
  AlertTriangle,
  Home,
  Calendar,
  Upload,
  CheckCircle2,
} from "lucide-react";

interface Unit {
  id: string;
  unitNumber: string;
  propertyName: string;
}

interface FormData {
  unitId: string;
  location: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  safetyConcern: boolean;
  safetyDescription: string;
  accessInstructions: string;
  preferredDate: string;
  preferredTime: string;
  petsPresent: boolean;
  petDetails: string;
}

const CATEGORIES = [
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "hvac", label: "HVAC / Heating & Cooling" },
  { value: "appliance", label: "Appliance" },
  { value: "structural", label: "Structural / Drywall" },
  { value: "pest", label: "Pest Control" },
  { value: "landscaping", label: "Landscaping / Grounds" },
  { value: "common_area", label: "Common Area" },
  { value: "security", label: "Security / Locks" },
  { value: "other", label: "Other" },
];

const URGENCY_LEVELS = [
  { value: "low", label: "Low - Routine maintenance", color: "bg-blue-100 text-blue-700" },
  { value: "medium", label: "Medium - Minor issue", color: "bg-yellow-100 text-yellow-700" },
  { value: "high", label: "High - Significant problem", color: "bg-orange-100 text-orange-700" },
  { value: "emergency", label: "Emergency - Safety/Security issue", color: "bg-red-100 text-red-700" },
];

export default function NewMaintenanceRequestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    unitId: "",
    location: "",
    title: "",
    description: "",
    category: "",
    urgency: "medium",
    safetyConcern: false,
    safetyDescription: "",
    accessInstructions: "",
    preferredDate: "",
    preferredTime: "",
    petsPresent: false,
    petDetails: "",
  });

  useEffect(() => {
    loadUnits();
  }, []);

  async function loadUnits() {
    try {
      const response = await fetch("/api/resident/units");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUnits(result.data);
          // Pre-select if only one unit
          if (result.data.length === 1) {
            setFormData((prev) => ({ ...prev, unitId: result.data[0].id }));
          }
        }
      }
    } catch (error) {
      console.error("Error loading units:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function validateStep(step: number): boolean {
    const newErrors: Partial<FormData> = {};

    if (step === 1) {
      if (!formData.unitId) newErrors.unitId = "Please select a unit";
      if (!formData.title.trim()) newErrors.title = "Please provide a title";
      if (!formData.description.trim()) newErrors.description = "Please describe the problem";
      if (!formData.category) newErrors.category = "Please select a category";
    }

    if (step === 2 && formData.safetyConcern && !formData.safetyDescription.trim()) {
      newErrors.safetyDescription = "Please describe the safety concern";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handleBack() {
    setCurrentStep((prev) => prev - 1);
  }

  async function handleSubmit() {
    if (!validateStep(currentStep)) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/resident/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push(`/resident/maintenance/${result.data.id}`);
        } else {
          alert(result.error || "Failed to create request");
        }
      } else {
        alert("Failed to create maintenance request");
      }
    } catch (error) {
      console.error("Error creating request:", error);
      alert("An error occurred while creating the request");
    } finally {
      setIsSaving(false);
    }
  }

  function handleChange(field: keyof FormData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/resident/maintenance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            Submit Maintenance Request
          </h1>
          <p className="text-[var(--secondary-text)]">Step {currentStep} of 4</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`flex-1 h-2 rounded-full ${
              step <= currentStep ? "bg-[var(--teal)]" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Problem Details */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[var(--teal)]" />
              Problem Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Unit Selection */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Unit / Location <span className="text-red-500">*</span>
              </label>
              {units.length === 1 ? (
                <div className="p-3 bg-[var(--page-background)] rounded-lg">
                  <p className="font-medium">{units[0].unitNumber}</p>
                  <p className="text-sm text-[var(--secondary-text)]">{units[0].propertyName}</p>
                </div>
              ) : (
                <select
                  value={formData.unitId}
                  onChange={(e) => handleChange("unitId", e.target.value)}
                  className={`input w-full ${errors.unitId ? "border-red-500" : ""}`}
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unitNumber} - {unit.propertyName}
                    </option>
                  ))}
                  <option value="common">Common Area</option>
                </select>
              )}
              {errors.unitId && <p className="text-sm text-red-500 mt-1">{errors.unitId}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Brief description of the issue"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1">
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

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className={`input w-full ${errors.description ? "border-red-500" : ""}`}
                placeholder="Please describe the problem in detail..."
              />
              {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
            </div>

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium mb-2">Urgency Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {URGENCY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => handleChange("urgency", level.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      formData.urgency === level.value
                        ? "border-[var(--teal)] bg-[var(--teal)]/10"
                        : "border-[var(--border-color)] hover:bg-[var(--page-background)]"
                    }`}
                  >
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${level.color} mb-1`}>
                      {level.value.charAt(0).toUpperCase() + level.value.slice(1)}
                    </span>
                    <p className="text-sm">{level.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Safety */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-[var(--teal)]" />
              Safety Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Emergency?</strong> If this is a life-threatening emergency,
                please call 911 immediately. For urgent maintenance emergencies after hours,
                contact your property management emergency line.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.safetyConcern}
                  onChange={(e) => handleChange("safetyConcern", e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">This request involves a safety or security concern</span>
              </label>
            </div>

            {formData.safetyConcern && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Safety Concern Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.safetyDescription}
                  onChange={(e) => handleChange("safetyDescription", e.target.value)}
                  rows={3}
                  className={`input w-full ${errors.safetyDescription ? "border-red-500" : ""}`}
                  placeholder="Please describe the safety concern..."
                />
                {errors.safetyDescription && (
                  <p className="text-sm text-red-500 mt-1">{errors.safetyDescription}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Access */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-[var(--teal)]" />
              Access Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Access Instructions
              </label>
              <textarea
                value={formData.accessInstructions}
                onChange={(e) => handleChange("accessInstructions", e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="How should maintenance staff access your unit? (lockbox code, someone will be home, etc.)"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Preferred Date
                </label>
                <Input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => handleChange("preferredDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Preferred Time
                </label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => handleChange("preferredTime", e.target.value)}
                  className="input w-full"
                >
                  <option value="">Any time</option>
                  <option value="morning">Morning (8am - 12pm)</option>
                  <option value="afternoon">Afternoon (12pm - 5pm)</option>
                  <option value="evening">Evening (5pm - 8pm)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.petsPresent}
                  onChange={(e) => handleChange("petsPresent", e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Pets will be present during maintenance</span>
              </label>
            </div>

            {formData.petsPresent && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Pet Details
                </label>
                <Input
                  value={formData.petDetails}
                  onChange={(e) => handleChange("petDetails", e.target.value)}
                  placeholder="Type, breed, and any special instructions"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[var(--teal)]" />
              Review & Submit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--secondary-text)]">Unit</span>
                <span className="font-medium">
                  {units.find((u) => u.id === formData.unitId)?.unitNumber || "Common Area"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--secondary-text)]">Title</span>
                <span className="font-medium">{formData.title}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--secondary-text)]">Category</span>
                <span className="font-medium">
                  {CATEGORIES.find((c) => c.value === formData.category)?.label}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--secondary-text)]">Urgency</span>
                <span className="font-medium capitalize">{formData.urgency}</span>
              </div>
              <div className="py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--secondary-text)] block mb-1">Description</span>
                <span className="text-sm">{formData.description}</span>
              </div>
              {formData.safetyConcern && (
                <div className="py-2 border-b border-[var(--border-color)]">
                  <span className="text-[var(--secondary-text)] block mb-1">Safety Concern</span>
                  <span className="text-sm text-red-600">{formData.safetyDescription}</span>
                </div>
              )}
              {formData.preferredDate && (
                <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                  <span className="text-[var(--secondary-text)]">Preferred Date</span>
                  <span className="font-medium">
                    {new Date(formData.preferredDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 bg-[var(--page-background)] rounded-lg">
              <p className="text-sm text-[var(--secondary-text)]">
                By submitting this request, you authorize maintenance staff to enter your unit
                according to the access instructions provided. You will be notified when the
                request is received and when work is scheduled.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep > 1 ? (
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
        ) : (
          <Link href="/resident/maintenance">
            <Button variant="outline">Cancel</Button>
          </Link>
        )}

        {currentStep < 4 ? (
          <Button onClick={handleNext} className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
