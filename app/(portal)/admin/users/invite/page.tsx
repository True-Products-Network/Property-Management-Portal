"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, User, Loader2, Send } from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

export default function InviteUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "owner",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.firstName?.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Create contact first
      const contactResponse = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          portalInvitationStatus: "invited",
        }),
      });

      if (!contactResponse.ok) {
        const error = await contactResponse.json();
        throw new Error(error.error || "Failed to create contact");
      }

      const contactData = await contactResponse.json();

      // Send invitation via GHL webhook
      const webhookResponse = await fetch("/api/webhooks/ghl/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contactData.data.id,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        }),
      });

      if (!webhookResponse.ok) {
        console.warn("GHL webhook failed, but contact was created");
      }

      alert(`Invitation sent to ${formData.email}!`);
      router.push("/admin/users");
    } catch (error) {
      console.error("Error inviting user:", error);
      alert(error instanceof Error ? error.message : "Failed to invite user");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            Invite User
          </h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Send portal access invitation to a new user
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--teal)]" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input w-full"
              >
                <option value="owner">Owner</option>
                <option value="tenant">Tenant</option>
                <option value="board_member">Board Member</option>
                <option value="property_manager">Property Manager</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* GHL Integration Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> An invitation email will be sent via GHL (GoHighLevel) 
              webhook. Make sure your GHL integration is configured in 
              <Link href="/admin/integrations" className="underline"> Admin → Integrations</Link>.
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/users">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending Invitation...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
