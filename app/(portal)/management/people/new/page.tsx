"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, UserPlus, Loader2 } from "lucide-react";
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

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobilePhone: string;
  workPhone: string;
  roles: string[];
  boardPosition: string;
  status: string;
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
  associationId: string;
  propertyId: string;
  unitId: string;
  isPrimaryContact: boolean;
}

const CONTACT_ROLES = [
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
];

const BOARD_POSITIONS = [
  { value: "", label: "Not a Board Member" },
  { value: "president", label: "President" },
  { value: "vice_president", label: "Vice President" },
  { value: "treasurer", label: "Treasurer" },
  { value: "secretary", label: "Secretary" },
  { value: "member_at_large", label: "Member at Large" },
  { value: "committee_chair", label: "Committee Chair" },
];

export default function NewContactPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    mobilePhone: "",
    workPhone: "",
    roles: [],
    boardPosition: "",
    status: "active",
    preferredContactMethod: "email",
    mailingPreference: "email",
    emailPermission: false,
    smsPermission: false,
    mailingAddressStreet: "",
    mailingAddressCity: "",
    mailingAddressState: "",
    mailingAddressZip: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    associationId: "",
    propertyId: "",
    unitId: "",
    isPrimaryContact: false,
  });

  useEffect(() => {
    loadAssociations();
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

  async function loadAssociations() {
    try {
      const response = await fetch("/api/associations");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAssociations(result.data.data || []);
        }
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
        if (result.success) {
          setProperties(result.data.data || []);
        }
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
        if (result.success) {
          setUnits(result.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading units:", error);
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
    if (formData.roles.length === 0) newErrors.roles = ["At least one role is required"];
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          mobilePhone: formData.mobilePhone || undefined,
          workPhone: formData.workPhone || undefined,
          roles: formData.roles,
          boardPosition: formData.boardPosition || undefined,
          status: formData.status,
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
          associationId: formData.associationId || undefined,
          propertyId: formData.propertyId || undefined,
          unitId: formData.unitId || undefined,
          isPrimaryContact: formData.isPrimaryContact,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push(`/management/people/${result.data.id}`);
        } else {
          alert(result.error || "Failed to create contact");
        }
      } else {
        alert("Failed to create contact");
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      alert("An error occurred while creating the contact");
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

  function toggleRole(role: string) {
    const newRoles = formData.roles.includes(role)
      ? formData.roles.filter(r => r !== role)
      : [...formData.roles, role];
    handleChange("roles", newRoles);
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
        <Link href="/management/people">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Add New Contact</h1>
          <p className="text-[var(--secondary-text)] mt-1">Create a new owner, tenant, or staff contact</p>
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

        {/* Roles & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Roles & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-2">
                Contact Roles <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CONTACT_ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${
                      formData.roles.includes(role.value)
                        ? "bg-[var(--teal)]/10 border-[var(--teal)]"
                        : "bg-white border-[var(--border-color)] hover:bg-[var(--page-background)]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(role.value)}
                      onChange={() => toggleRole(role.value)}
                      className="sr-only"
                    />
                    <span className="text-sm">{role.label}</span>
                  </label>
                ))}
              </div>
              {errors.roles && <p className="text-sm text-red-500 mt-1">{errors.roles[0]}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Board Position
                </label>
                <select
                  value={formData.boardPosition}
                  onChange={(e) => handleChange("boardPosition", e.target.value)}
                  className="input w-full"
                >
                  {BOARD_POSITIONS.map((pos) => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relationships */}
        <Card>
          <CardHeader>
            <CardTitle>Relationships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Association
              </label>
              <select
                value={formData.associationId}
                onChange={(e) => handleChange("associationId", e.target.value)}
                className="input w-full"
              >
                <option value="">Select Association</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>
                    {assoc.name}
                  </option>
                ))}
              </select>
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimaryContact"
                checked={formData.isPrimaryContact}
                onChange={(e) => handleChange("isPrimaryContact", e.target.checked)}
                className="rounded border-[var(--border-color)]"
              />
              <label htmlFor="isPrimaryContact" className="text-sm text-[var(--main-text)]">
                Primary Contact for this unit
              </label>
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
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="sms">SMS/Text</option>
                  <option value="mail">Mail</option>
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
                  <option value="email">Email</option>
                  <option value="mail">Physical Mail</option>
                  <option value="both">Both</option>
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
          <Link href="/management/people">
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
                Create Contact
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
