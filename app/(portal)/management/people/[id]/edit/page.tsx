"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, UserPlus, Loader2, AlertCircle } from "lucide-react";
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
  email: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  preferredContactMethod?: string;
  mailingPreference?: string;
  emailPermission: boolean;
  smsPermission: boolean;
  mailingAddressStreet?: string;
  mailingAddressCity?: string;
  mailingAddressState?: string;
  mailingAddressZip?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  roles?: string[];
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobilePhone: string;
  workPhone: string;
  preferredContactMethod: string;
  mailingPreference: string;
  emailPermission: boolean;
  smsPermission: boolean;
  mailingAddressStreet: string;
  mailingAddressCity: string;
  mailingAddressState: string;
  mailingAddressZip: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
  roles: string[];
}

const CONTACT_METHODS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS/Text" },
  { value: "mail", label: "Mail" },
];

const MAILING_PREFERENCES = [
  { value: "email", label: "Email" },
  { value: "physical", label: "Physical Mail" },
  { value: "both", label: "Both" },
];

export default function EditContactPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mobilePhone: "",
    workPhone: "",
    preferredContactMethod: "email",
    mailingPreference: "email",
    roles: [],
    emailPermission: false,
    smsPermission: false,
    mailingAddressStreet: "",
    mailingAddressCity: "",
    mailingAddressState: "",
    mailingAddressZip: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
  });

  useEffect(() => {
    loadContact();
  }, [contactId]);

  async function loadContact() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/contacts/${contactId}`);
      const result = await response.json();
      console.log("[Edit Contact] API response:", result);
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load contact");
      }
      
      const contact: Contact = result.data;
      console.log("[Edit Contact] Contact data:", contact);
      setFormData({
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email || "",
        phone: contact.phone || "",
        mobilePhone: contact.mobilePhone || "",
        workPhone: contact.workPhone || "",
        preferredContactMethod: contact.preferredContactMethod || "email",
        mailingPreference: contact.mailingPreference || "email",
        emailPermission: contact.emailPermission || false,
        smsPermission: contact.smsPermission || false,
        mailingAddressStreet: contact.mailingAddressStreet || "",
        mailingAddressCity: contact.mailingAddressCity || "",
        mailingAddressState: contact.mailingAddressState || "",
        mailingAddressZip: contact.mailingAddressZip || "",
        emergencyContactName: contact.emergencyContactName || "",
        emergencyContactPhone: contact.emergencyContactPhone || "",
        emergencyContactRelationship: contact.emergencyContactRelationship || "",
        roles: contact.roles || [],
      });
    } catch (error) {
      console.error("Error loading contact:", error);
      setError(error instanceof Error ? error.message : "Failed to load contact");
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName?.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          mobilePhone: formData.mobilePhone || undefined,
          workPhone: formData.workPhone || undefined,
          preferredContactMethod: formData.preferredContactMethod,
          mailingPreference: formData.mailingPreference,
          emailPermission: formData.emailPermission,
          smsPermission: formData.smsPermission,
          mailingAddressStreet: formData.mailingAddressStreet || undefined,
          mailingAddressCity: formData.mailingAddressCity || undefined,
          mailingAddressState: formData.mailingAddressState || undefined,
          mailingAddressZip: formData.mailingAddressZip || undefined,
          emergencyContactName: formData.emergencyContactName || undefined,
          emergencyContactPhone: formData.emergencyContactPhone || undefined,
          emergencyContactRelationship: formData.emergencyContactRelationship || undefined,
          roles: formData.roles,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push(`/management/people/${contactId}`);
        } else {
          alert(result.error || "Failed to update contact");
        }
      } else {
        alert("Failed to update contact");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      alert("An error occurred while updating the contact");
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
          <Button onClick={loadContact} variant="outline">
            Retry
          </Button>
          <Link href={`/management/people/${contactId}`}>
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
        <Link href={`/management/people/${contactId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Edit Contact</h1>
          <p className="text-[var(--secondary-text)] mt-1">Update contact information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[var(--teal)]" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="e.g., John"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="e.g., Smith"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="e.g., john.smith@example.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="e.g., (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Mobile Phone
                </label>
                <Input
                  type="tel"
                  value={formData.mobilePhone}
                  onChange={(e) => handleChange("mobilePhone", e.target.value)}
                  placeholder="e.g., (555) 987-6543"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Work Phone
                </label>
                <Input
                  type="tel"
                  value={formData.workPhone}
                  onChange={(e) => handleChange("workPhone", e.target.value)}
                  placeholder="e.g., (555) 456-7890"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "owner", label: "Owner" },
                { value: "co_owner", label: "Co-Owner" },
                { value: "tenant", label: "Tenant" },
                { value: "occupant", label: "Occupant" },
                { value: "board_president", label: "Board President" },
                { value: "board_treasurer", label: "Board Treasurer" },
                { value: "board_secretary", label: "Board Secretary" },
                { value: "board_member", label: "Board Member" },
                { value: "property_manager", label: "Property Manager" },
                { value: "assistant_manager", label: "Assistant Manager" },
                { value: "maintenance_staff", label: "Maintenance Staff" },
                { value: "vendor_contact", label: "Vendor Contact" },
                { value: "emergency_contact", label: "Emergency Contact" },
                { value: "other", label: "Other" },
              ].map((role) => (
                <div key={role.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`role-${role.value}`}
                    checked={formData.roles?.includes(role.value)}
                    onChange={(e) => {
                      const currentRoles = formData.roles || [];
                      if (e.target.checked) {
                        handleChange("roles", [...currentRoles, role.value]);
                      } else {
                        handleChange("roles", currentRoles.filter((r) => r !== role.value));
                      }
                    }}
                    className="rounded border-[var(--border-color)]"
                  />
                  <label htmlFor={`role-${role.value}`} className="text-sm text-[var(--main-text)]">
                    {role.label}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Communication Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Communication Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Preferred Contact Method
                </label>
                <select
                  value={formData.preferredContactMethod}
                  onChange={(e) => handleChange("preferredContactMethod", e.target.value)}
                  className="input w-full"
                >
                  {CONTACT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Mailing Preference
                </label>
                <select
                  value={formData.mailingPreference}
                  onChange={(e) => handleChange("mailingPreference", e.target.value)}
                  className="input w-full"
                >
                  {MAILING_PREFERENCES.map((pref) => (
                    <option key={pref.value} value={pref.value}>
                      {pref.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emailPermission"
                  checked={formData.emailPermission}
                  onChange={(e) => handleChange("emailPermission", e.target.checked)}
                  className="rounded border-[var(--border-color)]"
                />
                <label htmlFor="emailPermission" className="text-sm text-[var(--main-text)]">
                  Email Permission Granted
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smsPermission"
                  checked={formData.smsPermission}
                  onChange={(e) => handleChange("smsPermission", e.target.checked)}
                  className="rounded border-[var(--border-color)]"
                />
                <label htmlFor="smsPermission" className="text-sm text-[var(--main-text)]">
                  SMS Permission Granted
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mailing Address */}
        <Card>
          <CardHeader>
            <CardTitle>Mailing Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Street Address
              </label>
              <Input
                value={formData.mailingAddressStreet}
                onChange={(e) => handleChange("mailingAddressStreet", e.target.value)}
                placeholder="e.g., 1234 Main Street"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  City
                </label>
                <Input
                  value={formData.mailingAddressCity}
                  onChange={(e) => handleChange("mailingAddressCity", e.target.value)}
                  placeholder="e.g., Chicago"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  State
                </label>
                <Input
                  value={formData.mailingAddressState}
                  onChange={(e) => handleChange("mailingAddressState", e.target.value)}
                  placeholder="e.g., IL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  ZIP Code
                </label>
                <Input
                  value={formData.mailingAddressZip}
                  onChange={(e) => handleChange("mailingAddressZip", e.target.value)}
                  placeholder="e.g., 60601"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Emergency Contact Name
                </label>
                <Input
                  value={formData.emergencyContactName}
                  onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                  placeholder="e.g., Jane Smith"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Emergency Contact Phone
                </label>
                <Input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
                  placeholder="e.g., (555) 123-4567"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Relationship
              </label>
              <Input
                value={formData.emergencyContactRelationship}
                onChange={(e) => handleChange("emergencyContactRelationship", e.target.value)}
                placeholder="e.g., Spouse"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href={`/management/people/${contactId}`}>
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
