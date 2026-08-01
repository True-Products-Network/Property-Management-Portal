"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Calendar, Loader2, Edit3 } from "lucide-react";
import Link from "next/link";

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

interface FormData {
  associationId: string;
  propertyId: string;
  unitId: string;
  title: string;
  description: string;
  appointmentType: string;
  startTime: string;
  endTime: string;
  location: string;
  isVirtual: boolean;
  virtualLink: string;
  organizerId: string;
  status: string;
}

const APPOINTMENT_TYPES = [
  { value: "inspection", label: "Inspection" },
  { value: "maintenance", label: "Maintenance" },
  { value: "meeting", label: "Meeting" },
  { value: "showing", label: "Unit Showing" },
  { value: "consultation", label: "Consultation" },
  { value: "walkthrough", label: "Walkthrough" },
];

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("id");
  const isEditMode = !!appointmentId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    associationId: "",
    propertyId: "",
    unitId: "",
    title: "",
    description: "",
    appointmentType: "",
    startTime: "",
    endTime: "",
    location: "",
    isVirtual: false,
    virtualLink: "",
    organizerId: "",
    status: "scheduled",
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

      // If in edit mode, fetch appointment data
      if (isEditMode && appointmentId) {
        await loadAppointmentData(appointmentId);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAppointmentData(id: string) {
    try {
      const response = await fetch(`/api/appointments/${id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const appointment = result.data;
          // Format dates for datetime-local input (YYYY-MM-DDTHH:mm)
          const formatDateTime = (dateString: string | null) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16);
          };

          setFormData({
            associationId: appointment.associationId || "",
            propertyId: appointment.propertyId || "",
            unitId: appointment.unitId || "",
            title: appointment.title || "",
            description: appointment.description || "",
            appointmentType: appointment.appointmentType || "",
            startTime: formatDateTime(appointment.startTime),
            endTime: formatDateTime(appointment.endTime),
            location: appointment.location || "",
            isVirtual: appointment.isVirtual || false,
            virtualLink: appointment.virtualLink || "",
            organizerId: appointment.organizerId || "",
            status: appointment.status || "scheduled",
          });
        }
      } else {
        alert("Failed to load appointment data");
      }
    } catch (error) {
      console.error("Error loading appointment data:", error);
      alert("An error occurred while loading the appointment");
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

    if (!formData.associationId) newErrors.associationId = "Association is required";
    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.appointmentType) newErrors.appointmentType = "Type is required";
    if (!formData.startTime) newErrors.startTime = "Start time is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const url = isEditMode ? `/api/appointments/${appointmentId}` : "/api/appointments";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          associationId: formData.associationId,
          propertyId: formData.propertyId || undefined,
          unitId: formData.unitId || undefined,
          title: formData.title,
          description: formData.description || undefined,
          appointmentType: formData.appointmentType,
          startTime: formData.startTime,
          endTime: formData.endTime || undefined,
          location: formData.location || undefined,
          isVirtual: formData.isVirtual,
          virtualLink: formData.virtualLink || undefined,
          organizerId: formData.organizerId || undefined,
          status: formData.status,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const redirectId = isEditMode ? appointmentId : result.data.id;
          router.push(`/management/appointments/${redirectId}`);
        } else {
          alert(result.error || `Failed to ${isEditMode ? "update" : "create"} appointment`);
        }
      } else {
        alert(`Failed to ${isEditMode ? "update" : "create"} appointment`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} appointment:`, error);
      alert(`An error occurred while ${isEditMode ? "updating" : "creating"} the appointment`);
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
        <Link href="/management/communications">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {isEditMode ? "Edit Appointment" : "Schedule Appointment"}
            </h1>
            {isEditMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Edit3 className="h-3 w-3" />
                Edit Mode
              </span>
            )}
          </div>
          <p className="text-[var(--secondary-text)] mt-1">
            {isEditMode ? "Update appointment details" : "Create a new appointment or meeting"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[var(--teal)]" />
              Location
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
              {errors.associationId && <p className="text-sm text-red-500 mt-1">{errors.associationId}</p>}
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

        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.appointmentType}
                  onChange={(e) => handleChange("appointmentType", e.target.value)}
                  className={`input w-full ${errors.appointmentType ? "border-red-500" : ""}`}
                >
                  <option value="">Select Type</option>
                  {APPOINTMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.appointmentType && <p className="text-sm text-red-500 mt-1">{errors.appointmentType}</p>}
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
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Unit 101 Inspection"
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
                rows={3}
                className="input w-full"
                placeholder="Additional details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                  className={errors.startTime ? "border-red-500" : ""}
                />
                {errors.startTime && <p className="text-sm text-red-500 mt-1">{errors.startTime}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  End Time
                </label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Organizer
              </label>
              <select
                value={formData.organizerId}
                onChange={(e) => handleChange("organizerId", e.target.value)}
                className="input w-full"
              >
                <option value="">Select Organizer</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Location / Virtual */}
        <Card>
          <CardHeader>
            <CardTitle>Meeting Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isVirtual"
                checked={formData.isVirtual}
                onChange={(e) => handleChange("isVirtual", e.target.checked)}
                className="rounded border-[var(--border-color)]"
              />
              <label htmlFor="isVirtual" className="text-sm text-[var(--main-text)]">
                Virtual Meeting
              </label>
            </div>

            {formData.isVirtual ? (
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Virtual Meeting Link
                </label>
                <Input
                  type="url"
                  value={formData.virtualLink}
                  onChange={(e) => handleChange("virtualLink", e.target.value)}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="e.g., Main Office, Unit 101, etc."
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/management/communications">
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
                {isEditMode ? "Save Changes" : "Schedule Appointment"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
