"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wrench,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Home,
  Building2,
  Upload,
  Camera,
} from "lucide-react";

interface Property {
  id: string;
  name: string;
  addressStreet: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  displayName?: string;
  propertyId: string;
}

interface FormData {
  propertyId: string;
  unitId: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  photoUrl: string;
}

const CATEGORIES = [
  { value: "", label: "Select a category" },
  { value: "HVAC", label: "HVAC (Heating/Cooling)" },
  { value: "Plumbing", label: "Plumbing" },
  { value: "Electrical", label: "Electrical" },
  { value: "Appliance", label: "Appliance" },
  { value: "Structural", label: "Structural" },
  { value: "Cosmetic", label: "Cosmetic" },
  { value: "Safety", label: "Safety" },
  { value: "Cleaning", label: "Cleaning" },
  { value: "Landscaping", label: "Landscaping" },
  { value: "Other", label: "Other" },
];

const URGENCY_LEVELS = [
  { value: "normal", label: "Normal - Routine maintenance" },
  { value: "low", label: "Low - Not urgent" },
  { value: "urgent", label: "Urgent - Needs attention soon" },
  { value: "emergency", label: "Emergency - Immediate attention required" },
];

export default function SubmitMaintenanceRequestPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [contactId, setContactId] = useState<string>("");

  const [formData, setFormData] = useState<FormData>({
    propertyId: "",
    unitId: "",
    title: "",
    description: "",
    category: "",
    urgency: "normal",
    photoUrl: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    loadOwnerData();
  }, []);

  async function loadOwnerData() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/owner/properties");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load properties");
      }

      setProperties(result.data.properties || []);
      setUnits(result.data.units || []);
      
      // Set default property if only one
      if (result.data.properties.length === 1) {
        setFormData(prev => ({ ...prev, propertyId: result.data.properties[0].id }));
      }
    } catch (error) {
      console.error("Error loading properties:", error);
      setError(error instanceof Error ? error.message : "Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  }

  // Get units for selected property
  const availableUnits = units.filter(u => u.propertyId === formData.propertyId);

  // Reset unit when property changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, unitId: "" }));
  }, [formData.propertyId]);

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.propertyId) {
      newErrors.propertyId = "Please select a property";
    }
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: formData.propertyId,
          unitId: formData.unitId || undefined,
          title: formData.title,
          description: formData.description,
          category: formData.category || undefined,
          urgency: formData.urgency,
          // The API will use the current user's contact ID as reportedBy
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to submit request");
      }

      setSuccess(true);
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/owner/maintenance");
      }, 2000);
    } catch (error) {
      console.error("Error submitting request:", error);
      setError(error instanceof Error ? error.message : "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link href="/owner/maintenance" className="inline-flex items-center text-[var(--teal)] hover:underline mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Maintenance
        </Link>
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
            <h3 className="text-lg font-medium mb-2">No Properties Found</h3>
            <p className="text-[var(--secondary-text)] max-w-md mx-auto">
              You don&apos;t have any properties associated with your account. 
              Please contact your property management to link your properties.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold text-green-900 mb-2">Request Submitted!</h3>
            <p className="text-green-700 mb-6">
              Your maintenance request has been submitted successfully. You will be notified when there are updates.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/owner/maintenance">
                <Button variant="outline">View All Requests</Button>
              </Link>
              <Link href="/owner">
                <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">Go to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Link */}
      <Link href="/owner/maintenance" className="inline-flex items-center text-[var(--teal)] hover:underline mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Maintenance
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">Submit Maintenance Request</h1>
        <p className="text-[var(--secondary-text)] mt-1">
          Describe the issue and we&apos;ll get it resolved as soon as possible
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[var(--teal)]" />
              Request Details
            </CardTitle>
            <CardDescription>
              Provide details about the maintenance issue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Property Selection */}
            <div>
              <label className="label required">Property</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="input pl-10"
                  disabled={properties.length === 1}
                >
                  <option value="">Select a property</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.propertyId && (
                <p className="text-red-500 text-sm mt-1">{errors.propertyId}</p>
              )}
            </div>

            {/* Unit Selection */}
            {formData.propertyId && availableUnits.length > 0 && (
              <div>
                <label className="label">Unit (Optional)</label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
                  <select
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    className="input pl-10"
                  >
                    <option value="">Select a unit (if applicable)</option>
                    {availableUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber}
                        {unit.displayName && unit.displayName !== `Unit ${unit.unitNumber}` 
                          ? ` - ${unit.displayName}` 
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label className="label required">Urgency Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {URGENCY_LEVELS.map((level) => (
                  <label
                    key={level.value}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.urgency === level.value
                        ? "border-[var(--teal)] bg-[var(--teal)]/5"
                        : "border-[var(--border-color)] hover:bg-[var(--page-background)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={level.value}
                      checked={formData.urgency === level.value}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${
                        level.value === "emergency" ? "text-red-600" : ""
                      }`}>
                        {level.label.split(" - ")[0]}
                      </p>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {level.label.split(" - ")[1]}
                      </p>
                    </div>
                    {formData.urgency === level.value && (
                      <CheckCircle2 className="h-5 w-5 text-[var(--teal)]" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="label required">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief summary of the issue (e.g., 'Leaky faucet in kitchen')"
                maxLength={100}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="label required">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Please describe the issue in detail. Include when it started, any steps to reproduce, and the exact location."
                rows={5}
                className="input resize-none"
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
              )}
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                Minimum 10 characters
              </p>
            </div>

            {/* Photo URL */}
            <div>
              <label className="label">Photo URL (Optional)</label>
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
                <Input
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="https://... (link to photo of the issue)"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                You can provide a URL to a photo of the issue (e.g., from cloud storage)
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Link href="/owner/maintenance" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
