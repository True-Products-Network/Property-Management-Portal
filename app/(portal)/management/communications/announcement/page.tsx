"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Megaphone, Loader2 } from "lucide-react";
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

interface FormData {
  associationId: string;
  propertyId: string;
  subject: string;
  content: string;
  type: string;
  sendToAll: boolean;
  scheduledAt: string;
}

const COMMUNICATION_TYPES = [
  { value: "announcement", label: "Announcement" },
  { value: "newsletter", label: "Newsletter" },
  { value: "notice", label: "Notice" },
  { value: "reminder", label: "Reminder" },
  { value: "urgent", label: "Urgent" },
];

export default function NewAnnouncementPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    associationId: "",
    propertyId: "",
    subject: "",
    content: "",
    type: "announcement",
    sendToAll: true,
    scheduledAt: "",
  });

  useEffect(() => {
    loadAssociations();
  }, []);

  useEffect(() => {
    if (formData.associationId) {
      loadProperties(formData.associationId);
    } else {
      setProperties([]);
      setFormData(prev => ({ ...prev, propertyId: "" }));
    }
  }, [formData.associationId]);

  async function loadAssociations() {
    try {
      const response = await fetch("/api/associations");
      if (response.ok) {
        const result = await response.json();
        if (result.success) setAssociations(result.data.data || []);
      }
    } catch (error) {
      console.error("Error loading associations:", error);
    } finally {
      setIsLoading(false);
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

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};

    if (!formData.associationId) newErrors.associationId = "Association is required";
    if (!formData.subject?.trim()) newErrors.subject = "Subject is required";
    if (!formData.content?.trim()) newErrors.content = "Content is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSending(true);
    try {
      const response = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          associationId: formData.associationId,
          propertyId: formData.propertyId || undefined,
          subject: formData.subject,
          content: formData.content,
          type: formData.type,
          sendToAll: formData.sendToAll,
          scheduledAt: formData.scheduledAt || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push("/management/communications");
        } else {
          alert(result.error || "Failed to send announcement");
        }
      } else {
        alert("Failed to send announcement");
      }
    } catch (error) {
      console.error("Error sending announcement:", error);
      alert("An error occurred while sending the announcement");
    } finally {
      setIsSending(false);
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
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Send Announcement</h1>
          <p className="text-[var(--secondary-text)] mt-1">Send a message to residents or staff</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[var(--teal)]" />
              Recipients
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

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Property (optional)
              </label>
              <select
                value={formData.propertyId}
                onChange={(e) => handleChange("propertyId", e.target.value)}
                className="input w-full"
                disabled={!formData.associationId}
              >
                <option value="">All Properties</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendToAll"
                checked={formData.sendToAll}
                onChange={(e) => handleChange("sendToAll", e.target.checked)}
                className="rounded border-[var(--border-color)]"
              />
              <label htmlFor="sendToAll" className="text-sm text-[var(--main-text)]">
                Send to all residents in selected association/property
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Message */}
        <Card>
          <CardHeader>
            <CardTitle>Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="input w-full"
                >
                  {COMMUNICATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Schedule Send (optional)
                </label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => handleChange("scheduledAt", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                placeholder="e.g., Monthly Newsletter - August 2026"
                className={errors.subject ? "border-red-500" : ""}
              />
              {errors.subject && <p className="text-sm text-red-500 mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
                rows={8}
                className={`input w-full ${errors.content ? "border-red-500" : ""}`}
                placeholder="Enter your message here..."
              />
              {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content}</p>}
            </div>
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
            disabled={isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Announcement
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
