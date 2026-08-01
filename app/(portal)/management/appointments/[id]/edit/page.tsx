"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

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
  title: string;
  description: string;
  appointmentType: string;
  status: string;
  startTime: string;
  endTime: string;
  isVirtual: boolean;
  virtualMeetingLink: string;
  location: string;
  associationId: string;
  propertyId: string;
  unitId: string;
  organizerId: string;
}

const APPOINTMENT_TYPES = [
  { value: "meeting", label: "Meeting" },
  { value: "inspection", label: "Inspection" },
  { value: "maintenance", label: "Maintenance" },
  { value: "showing", label: "Showing" },
  { value: "consultation", label: "Consultation" },
  { value: "other", label: "Other" },
];

export default function EditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    appointmentType: "",
    status: "scheduled",
    startTime: "",
    endTime: "",
    isVirtual: false,
    virtualMeetingLink: "",
    location: "",
    associationId: "",
    propertyId: "",
    unitId: "",
    organizerId: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.propertyId) {
      loadUnits(formData.propertyId);
    } else {
      setUnits([]);
    }
  }, [formData.propertyId]);

  async function loadInitialData() {
    try {
      const [apptRes, assocRes, propsRes, contactsRes] = await Promise.all([
        fetch(`/api/appointments/${appointmentId}`),
        fetch("/api/associations"),
        fetch("/api/properties"),
        fetch("/api/contacts"),
      ]);

      if (apptRes.ok) {
        const apptData = await apptRes.json();
        if (apptData.success && apptData.data) {
          const appt = apptData.data;
          setFormData({
            title: appt.title || "",
            description: appt.description || "",
            appointmentType: appt.appointmentType || "",
            status: appt.status || "scheduled",
            startTime: appt.startTime ? new Date(appt.startTime).toISOString().slice(0, 16) : "",
            endTime: appt.endTime ? new Date(appt.endTime).toISOString().slice(0, 16) : "",
            isVirtual: appt.isVirtual || false,
            virtualMeetingLink: appt.virtualMeetingLink || "",
            location: appt.location || "",
            associationId: appt.associationId || "",
            propertyId: appt.propertyId || "",
            unitId: appt.unitId || "",
            organizerId: appt.organizerId || "",
          });
          if (appt.propertyId) {
            loadUnits(appt.propertyId);
          }
        }
      }

      if (assocRes.ok) {
        const assocData = await assocRes.json();
        if (assocData.success) setAssociations(assocData.data.data || []);
      }

      if (propsRes.ok) {
        const propsData = await propsRes.json();
        if (propsData.success) setProperties(propsData.data.data || []);
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        if (contactsData.success) setContacts(contactsData.data.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUnits(propertyId: string) {
    try {
      const res = await fetch(`/api/units?propertyId=${propertyId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUnits(data.data.data || []);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.appointmentType) newErrors.appointmentType = "Type is required";
    if (!formData.startTime) newErrors.startTime = "Start time is required";
    if (!formData.endTime) newErrors.endTime = "End time is required";
    if (!formData.isVirtual && !formData.location.trim()) {
      newErrors.location = "Location is required for in-person appointments";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push(`/management/appointments/${appointmentId}`);
      } else {
        const error = await res.json();
        alert(error.error?.message || "Failed to update appointment");
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#2f1fac]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/management/appointments/${appointmentId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#2f1fac]">Edit Appointment</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter appointment title"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Appointment Type *</label>
                <select
                  value={formData.appointmentType}
                  onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                  className={`w-full h-10 px-3 rounded-md border ${errors.appointmentType ? "border-red-500" : "border-input"} bg-background`}
                >
                  <option value="">Select type</option>
                  {APPOINTMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.appointmentType && <p className="text-sm text-red-500">{errors.appointmentType}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time *</label>
                <Input
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className={errors.startTime ? "border-red-500" : ""}
                />
                {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">End Time *</label>
                <Input
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className={errors.endTime ? "border-red-500" : ""}
                />
                {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isVirtual}
                    onChange={(e) => setFormData({ ...formData, isVirtual: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Virtual Appointment</span>
                </label>
              </div>

              {formData.isVirtual ? (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Virtual Meeting Link</label>
                  <Input
                    value={formData.virtualMeetingLink}
                    onChange={(e) => setFormData({ ...formData, virtualMeetingLink: e.target.value })}
                    placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  />
                </div>
              ) : (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">Location *</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter location address"
                    className={errors.location ? "border-red-500" : ""}
                  />
                  {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Association</label>
                <select
                  value={formData.associationId}
                  onChange={(e) => setFormData({ ...formData, associationId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select association</option>
                  {associations.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Property</label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, unitId: "" })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  disabled={!formData.propertyId}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background disabled:opacity-50"
                >
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.unitNumber}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Organizer</label>
                <select
                  value={formData.organizerId}
                  onChange={(e) => setFormData({ ...formData, organizerId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select organizer</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <Link href={`/management/appointments/${appointmentId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSaving} className="bg-[#2f1fac]">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
