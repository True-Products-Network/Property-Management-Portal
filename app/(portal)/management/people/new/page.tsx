"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, UserPlus, Loader2, Edit3 } from "lucide-react";
import Link from "next/link";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

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
  // 10 Portal Roles
  { value: "admin_user", label: "Admin User" },
  { value: "association_manager", label: "Association Manager" },
  { value: "board_member", label: "Board Member" },
  { value: "finance_user", label: "Finance User" },
  { value: "owner", label: "Owner" },
  { value: "portfolio_manager", label: "Portfolio Manager" },
  { value: "resident", label: "Resident" },
  { value: "staff", label: "Staff" },
  { value: "vendor_contractor", label: "Vendor Contractor" },
  { value: "property_manager", label: "Property Manager" },
  // 5 Additional Roles
  { value: "emergency_contact", label: "Emergency Contact" },
  { value: "inspector", label: "Inspector" },
  { value: "co_owner", label: "Co-Owner" },
  { value: "maintenance_contact", label: "Maintenance Contact" },
  { value: "other", label: "Other" },
];

const BOARD_POSITION_OPTIONS = [
  { value: "", label: "Not a Board Member" },
  { value: "president", label: "Board President" },
  { value: "vice_president", label: "Vice President" },
  { value: "treasurer", label: "Treasurer" },
  { value: "secretary", label: "Secretary" },
  { value: "member_at_large", label: "Member at Large" },
  { value: "committee_chair", label: "Committee Chair" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const PREFERRED_CONTACT_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "mail", label: "Mail" },
];

const MAILING_PREFERENCE_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "physical", label: "Physical Mail" },
  { value: "both", label: "Both" },
];

function ContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId = searchParams.get("id");
  const isEditMode = !!contactId;

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

  useEffect(() => {
    if (isEditMode && contactId) {
      loadContactData(contactId);
    }
  }, [isEditMode, contactId]);

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
      if (!isEditMode) {
        setIsLoading(false);
      }
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

  async function loadContactData(id: string) {
    try {
      const response = await fetch(`/api/contacts/${id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const contact = result.data;
          setFormData({
            firstName: contact.firstName || "",
            lastName: contact.lastName || "",
            email: contact.email || "",
            phone: contact.phone || "",
            mobilePhone: contact.mobilePhone || "",
            workPhone: contact.workPhone || "",
            roles: contact.roles || [],
            boardPosition: contact.boardPosition || "",
            status: contact.status || "active",
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
            associationId: contact.associationId || "",
            propertyId: contact.propertyId || "",
            unitId: contact.unitId || "",
            isPrimaryContact: contact.isPrimaryContact || false,
          });
        } else {
          alert("Contact not found");
          router.push("/management/people");
        }
      } else {
        alert("Failed to load contact data");
        router.push("/management/people");
      }
    } catch (error) {
      console.error("Error loading contact:", error);
      alert("An error occurred while loading the contact");
      router.push("/management/people");
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
    if (formData.roles.length === 0) newErrors.roles = ["At least one role is required"];
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const payload = {
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
      };

      const url = isEditMode ? `/api/contacts/${contactId}` : "/api/contacts";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const redirectId = isEditMode ? contactId : result.data.id;
          router.push(`/management/people/${redirectId}`);
        } else {
          alert(result.error || `Failed to ${isEditMode ? "update" : "create"} contact`);
        }
      } else {
        alert(`Failed to ${isEditMode ? "update" : "create"} contact`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} contact:`, error);
      alert(`An error occurred while ${isEditMode ? "updating" : "creating"} the contact`);
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
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {isEditMode ? "Edit Contact" : "Add New Contact"}
            </h1>
            {isEditMode && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                <Edit3 className="h-3 w-3 mr-1" />
                Edit Mode
              </span>
            )}
          </div>
          <p className="text-[var(--secondary-text)] mt-1">
            {isEditMode 
              ? "Update contact information and preferences" 
              : "Create a new owner, tenant, or staff contact"}
          </p>
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
                <DropdownSelect
                  recordType="People"
                  fieldName="Board Position"
                  value={formData.boardPosition}
                  onChange={(value) => handleChange("boardPosition", value)}
                  label="Board Position"
                  defaultOptions={BOARD_POSITION_OPTIONS}
                />
              </div>
              <div>
                <DropdownSelect
                  recordType="People"
                  fieldName="status"
                  value={formData.status}
                  onChange={(value) => handleChange("status", value)}
                  label="Status"
                  defaultOptions={STATUS_OPTIONS}
                />
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
                <DropdownSelect
                  recordType="People"
                  fieldName="Preferred Contact Method"
                  value={formData.preferredContactMethod}
                  onChange={(value) => handleChange("preferredContactMethod", value)}
                  label="Preferred Contact Method"
                  defaultOptions={PREFERRED_CONTACT_OPTIONS}
                />
              </div>
              <div>
                <DropdownSelect
                  recordType="People"
                  fieldName="Mailing Preference"
                  value={formData.mailingPreference}
                  onChange={(value) => handleChange("mailingPreference", value)}
                  label="Mailing Preference"
                  defaultOptions={MAILING_PREFERENCE_OPTIONS}
                />
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
                {isEditMode ? "Save Changes" : "Create Contact"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Wrap with Suspense only (contacts are core functionality)
export default function NewContactWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    }>
      <ContactForm />
    </Suspense>
  );
}
