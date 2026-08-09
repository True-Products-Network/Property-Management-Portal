"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Save, Building2 } from "lucide-react";

interface Association {
  id: string;
  name: string;
  assignedManagerId?: string;
}

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
}

interface Property {
  id: string;
  associationId: string;
  name: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  type: string;
  status: string;
  yearBuilt?: number;
  totalUnits?: number;
  managementStartDate?: string;
  accessInstructions?: string;
  emergencyNotes?: string;
  assignedStaffId?: string;
  photoUrl?: string;
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Property>>({});

  useEffect(() => {
    loadData();
  }, [propertyId]);

  // Load contacts when association changes
  useEffect(() => {
    if (formData.associationId) {
      loadContacts(formData.associationId);
    } else {
      setContacts([]);
    }
  }, [formData.associationId]);

  async function loadData() {
    try {
      setIsLoading(true);
      
      // Load property
      const propRes = await fetch(`/api/properties/${propertyId}`);
      if (!propRes.ok) throw new Error("Failed to fetch property");
      const propData = await propRes.json();
      if (!propData.success) throw new Error(propData.error);
      setProperty(propData.data);
      setFormData(propData.data);
      
      // Load associations
      const assocRes = await fetch("/api/associations");
      if (assocRes.ok) {
        const assocData = await assocRes.json();
        if (assocData.success) setAssociations(assocData.data.data || []);
      }
      
      // Load contacts for the property's association
      if (propData.data.associationId) {
        await loadContacts(propData.data.associationId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadContacts(associationId: string) {
    try {
      console.log("[Property Edit] Loading contacts for association:", associationId);
      // Load contacts for this association
      const response = await fetch(`/api/contacts?associationId=${associationId}`);
      if (response.ok) {
        const result = await response.json();
        console.log("[Property Edit] Contacts loaded:", result);
        if (result.success && result.data) {
          // Show all contacts (not just managers) since roles may vary
          console.log("[Property Edit] All contacts:", result.data.data);
          console.log("[Property Edit] Current assignedStaffId:", formData.assignedStaffId);
          setContacts(result.data.data);
        }
      }
    } catch (error) {
      console.error("[Property Edit] Error loading contacts:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update property");
      }

      router.push(`/management/properties/${propertyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsSaving(false);
    }
  }

  function handleChange(field: keyof Property, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">{error}</p>
        <Link href="/management/properties">
          <Button variant="outline">Back to Properties</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/management/properties/${propertyId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Edit Property</h1>
          <p className="text-[var(--secondary-text)]">{property?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Association Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--teal)]" />
              Association
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Association <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.associationId || ""}
                onChange={(e) => handleChange("associationId", e.target.value)}
                className="input w-full"
                required
              >
                <option value="">Select Association</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>
                    {assoc.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Property Information */}
        <Card>
          <CardHeader>
            <CardTitle>Property Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Property Name <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Oakwood Heights"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Property Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type || ""}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select Type</option>
                  <option value="Condominium">Condominium</option>
                  <option value="Apartment">Apartment</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Single Family">Single Family</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Mixed Use">Mixed Use</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Status
                </label>
                <select
                  value={formData.status || ""}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="input w-full"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="under_construction">Under Construction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Year Built
                </label>
                <Input
                  type="number"
                  value={formData.yearBuilt || ""}
                  onChange={(e) => handleChange("yearBuilt", parseInt(e.target.value) || "")}
                  placeholder="e.g., 2005"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Total Units
                </label>
                <Input
                  type="number"
                  value={formData.totalUnits || ""}
                  onChange={(e) => handleChange("totalUnits", parseInt(e.target.value) || "")}
                  placeholder="e.g., 24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Assigned Property Manager <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assignedStaffId || ""}
                  onChange={(e) => handleChange("assignedStaffId", e.target.value)}
                  className="input w-full"
                  required
                >
                  <option value="">Select Property Manager</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName} {contact.email ? `(${contact.email})` : ""}
                    </option>
                  ))}
                </select>
                {contacts.length === 0 && formData.associationId && (
                  <p className="text-sm text-amber-600 mt-1">
                    No property managers found. Please add a contact with Property Manager role to this association first.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Management Start Date
                </label>
                <Input
                  type="date"
                  value={formData.managementStartDate || ""}
                  onChange={(e) => handleChange("managementStartDate", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Street Address <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formData.addressStreet || ""}
                onChange={(e) => handleChange("addressStreet", e.target.value)}
                placeholder="e.g., 1234 Main Street"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.addressCity || ""}
                  onChange={(e) => handleChange("addressCity", e.target.value)}
                  placeholder="e.g., Chicago"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.addressState || ""}
                  onChange={(e) => handleChange("addressState", e.target.value)}
                  placeholder="e.g., IL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={formData.addressZip || ""}
                  onChange={(e) => handleChange("addressZip", e.target.value)}
                  placeholder="e.g., 60601"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo URL */}
        <Card>
          <CardHeader>
            <CardTitle>Property Photo</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Photo URL (GHL Storage)
              </label>
              <Input
                type="url"
                value={formData.photoUrl || ""}
                onChange={(e) => handleChange("photoUrl", e.target.value)}
                placeholder="https://..."
              />
              <p className="text-sm text-[var(--secondary-text)] mt-1">
                Enter the URL of the property photo stored in GHL
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Access & Emergency */}
        <Card>
          <CardHeader>
            <CardTitle>Access & Emergency Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Access Instructions
              </label>
              <textarea
                value={formData.accessInstructions || ""}
                onChange={(e) => handleChange("accessInstructions", e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Key location, gate codes, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Emergency Notes
              </label>
              <textarea
                value={formData.emergencyNotes || ""}
                onChange={(e) => handleChange("emergencyNotes", e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Emergency contact, shut-off locations, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link href={`/management/properties/${propertyId}`}>
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
