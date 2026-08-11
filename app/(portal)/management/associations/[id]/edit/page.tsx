"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Save, Search, X, Plus } from "lucide-react";
import { DropdownSelect } from "@/components/ui/DropdownSelect";
import { Label } from "@/components/ui/label";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const FINANCIAL_PLATFORMS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
];

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface Association {
  id: string;
  associationId: string;
  name: string;
  shortName?: string;
  legalName?: string;
  type: string;
  status: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  mailingAddress?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  fiscalYear?: string;
  fiscalYearEndMonth?: string;
  fiscalYearEndDay?: number;
  annualMeetingMonth?: string;
  managementStartDate?: string;
  financialPlatform?: string;
  financialPortalLink?: string;
  documentStorageLink?: string;
  emergencyInstructions?: string;
  generalNotes?: string;
  propertyCount?: number;
  unitCount?: number;
  assignedManagerId?: string;
  assignedManagerName?: string;
}

export default function EditAssociationPage() {
  const params = useParams();
  const router = useRouter();
  const associationId = params.id as string;
  
  const [association, setAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Association>>({});

  // Manager selection modal state
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = useState("");
  const [existingContacts, setExistingContacts] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewManagerForm, setShowNewManagerForm] = useState(false);

  // New manager form state
  const [newManager, setNewManager] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    loadAssociation();
  }, [associationId]);

  async function loadAssociation() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/associations/${associationId}`);
      if (!response.ok) throw new Error("Failed to fetch association");
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setAssociation(result.data);
      setFormData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validation: Email or Phone is required
    if (!formData.email && !formData.phone) {
      setError("Either Business Email or Business Phone is required");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/associations/${associationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update association");
      }

      router.push(`/management/associations/${associationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsSaving(false);
    }
  }

  function handleChange(field: keyof Association, value: string | number) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // Format phone number as user types
  function formatPhoneNumber(value: string): string {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 0) return "";
    if (numbers.length <= 3) return `+1 (${numbers}`;
    if (numbers.length <= 6) return `+1 (${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `+1 (${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  }

  // Load all contacts for the tenant (pick list)
  async function loadContacts() {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/contacts?limit=100`);
      const result = await response.json();
      if (result.success) {
        setExistingContacts(result.data?.data || []);
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    } finally {
      setIsSearching(false);
    }
  }

  // Handle selecting an existing contact as manager
  function selectExistingManager(contact: Contact) {
    setFormData((prev) => ({
      ...prev,
      assignedManagerId: contact.id,
      assignedManagerName: `${contact.firstName} ${contact.lastName}`,
    }));
    setShowManagerModal(false);
    setManagerSearchQuery("");
  }

  // Handle creating a new manager
  async function createNewManager() {
    if (!newManager.firstName || !newManager.lastName || !newManager.email) {
      alert("First name, last name, and email are required");
      return;
    }

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newManager.firstName,
          lastName: newManager.lastName,
          email: newManager.email,
          phone: newManager.phone,
          roleType: "property_manager",
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create contact");
      }

      const contactId = result.data?.id || result.data?.contactId;
      if (!contactId) {
        throw new Error("Contact created but no ID returned");
      }

      setFormData((prev) => ({
        ...prev,
        assignedManagerId: contactId,
        assignedManagerName: `${newManager.firstName} ${newManager.lastName}`,
      }));

      setNewManager({ firstName: "", lastName: "", email: "", phone: "" });
      setShowNewManagerForm(false);
      setShowManagerModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create manager");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error && !association) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">{error}</p>
        <Link href="/management/associations">
          <Button variant="outline">Back to Businesses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/management/associations/${associationId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Edit Business</h1>
          <p className="text-[var(--secondary-text)]">{association?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Business Name *
                </label>
                <Input
                  required
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Ridgeland Condominium Business"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Common/Short Name
                </label>
                <Input
                  value={formData.shortName || ""}
                  onChange={(e) => handleChange("shortName", e.target.value)}
                  placeholder="e.g., Ridgeland Condos"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Legal Name
                </label>
                <Input
                  value={formData.legalName || ""}
                  onChange={(e) => handleChange("legalName", e.target.value)}
                  placeholder="e.g., Ridgeland Condominium Business, Inc."
                />
              </div>

              <div className="space-y-2">
                <DropdownSelect
                  recordType="Association Company"
                  fieldName="Association Type"
                  label="Business Type *"
                  value={formData.type || ""}
                  onChange={(value) => handleChange("type", value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <DropdownSelect
                  recordType="Association Company"
                  fieldName="Association Status"
                  label="Business Status *"
                  value={formData.status || ""}
                  onChange={(value) => handleChange("status", value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Tax ID / EIN Number
                </label>
                <Input
                  value={formData.taxId || ""}
                  onChange={(e) => handleChange("taxId", e.target.value)}
                  placeholder="XX-XXXXXXX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <p className="text-sm text-[var(--secondary-text)]">Email or Phone is required</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Business Email {!formData.phone && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="board@example.org"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Business Phone {!formData.email && <span className="text-red-500">*</span>}
                </label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", formatPhoneNumber(e.target.value))}
                  placeholder="+1 (555) 123-4567"
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
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--main-text)]">
                Street Address
              </label>
              <Input
                value={formData.addressStreet || ""}
                onChange={(e) => handleChange("addressStreet", e.target.value)}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  City
                </label>
                <Input
                  value={formData.addressCity || ""}
                  onChange={(e) => handleChange("addressCity", e.target.value)}
                  placeholder="Chicago"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  State
                </label>
                <Input
                  value={formData.addressState || ""}
                  onChange={(e) => handleChange("addressState", e.target.value)}
                  placeholder="IL"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  ZIP Code
                </label>
                <Input
                  value={formData.addressZip || ""}
                  onChange={(e) => handleChange("addressZip", e.target.value)}
                  placeholder="60601"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--main-text)]">
                Main Mailing Address (if different from above)
              </label>
              <textarea
                value={formData.mailingAddress || ""}
                onChange={(e) => handleChange("mailingAddress", e.target.value)}
                placeholder="Enter mailing address if different from physical address"
                className="w-full min-h-[80px] px-3 py-2 rounded-md border border-[var(--border-color)] bg-white resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial & Administrative */}
        <Card>
          <CardHeader>
            <CardTitle>Financial & Administrative</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Fiscal Year End (Month)
                </label>
                <select
                  value={formData.fiscalYearEndMonth || ""}
                  onChange={(e) => handleChange("fiscalYearEndMonth", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-color)] bg-white"
                >
                  <option value="">Select month...</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Fiscal Year End (Day)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={formData.fiscalYearEndDay || ""}
                  onChange={(e) => handleChange("fiscalYearEndDay", parseInt(e.target.value) || "")}
                  placeholder="e.g., 31"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Annual Meeting Month
                </label>
                <select
                  value={formData.annualMeetingMonth || ""}
                  onChange={(e) => handleChange("annualMeetingMonth", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-color)] bg-white"
                >
                  <option value="">Select month...</option>
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Management Start Date
                </label>
                <Input
                  type="date"
                  value={formData.managementStartDate || ""}
                  onChange={(e) => handleChange("managementStartDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Financial Platform
                </label>
                <select
                  value={formData.financialPlatform || ""}
                  onChange={(e) => handleChange("financialPlatform", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-color)] bg-white"
                >
                  <option value="">Select platform...</option>
                  {FINANCIAL_PLATFORMS.map((platform) => (
                    <option key={platform.value} value={platform.value}>{platform.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Financial Portal Link
                </label>
                <Input
                  type="url"
                  value={formData.financialPortalLink || ""}
                  onChange={(e) => handleChange("financialPortalLink", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--main-text)]">
                Records/Document Storage Link
              </label>
              <Input
                type="url"
                value={formData.documentStorageLink || ""}
                onChange={(e) => handleChange("documentStorageLink", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Operational Details */}
        <Card>
          <CardHeader>
            <CardTitle>Operational Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Number of Properties with +/- buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Number of Properties
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const current = formData.propertyCount || 0;
                      if (current > 0) {
                        handleChange("propertyCount", current - 1);
                      }
                    }}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    value={formData.propertyCount || 0}
                    onChange={(e) => handleChange("propertyCount", parseInt(e.target.value) || 0)}
                    className="text-center"
                    style={{ width: "80px" }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const current = formData.propertyCount || 0;
                      handleChange("propertyCount", current + 1);
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Number of Units with +/- buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Number of Units
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const current = formData.unitCount || 0;
                      if (current > 0) {
                        handleChange("unitCount", current - 1);
                      }
                    }}
                  >
                    -
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    value={formData.unitCount || 0}
                    onChange={(e) => handleChange("unitCount", parseInt(e.target.value) || 0)}
                    className="text-center"
                    style={{ width: "80px" }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const current = formData.unitCount || 0;
                      handleChange("unitCount", current + 1);
                    }}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            {/* Assigned Property Manager */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--main-text)]">
                Assigned Property Manager
              </label>
              <div className="flex items-center gap-3">
                {formData.assignedManagerId ? (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="px-3 py-2 bg-gray-100 rounded-md flex-1">
                      <span className="text-sm font-medium">
                        {formData.assignedManagerName || "Selected Manager"}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          assignedManagerId: undefined,
                          assignedManagerName: undefined,
                        }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowManagerModal(true);
                      loadContacts();
                    }}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Select Property Manager
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes & Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--main-text)]">
                Emergency Instructions
              </label>
              <textarea
                value={formData.emergencyInstructions || ""}
                onChange={(e) => handleChange("emergencyInstructions", e.target.value)}
                placeholder="Enter emergency contact procedures and instructions"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-[var(--border-color)] bg-white resize-y"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--main-text)]">
                General Notes
              </label>
              <textarea
                value={formData.generalNotes || ""}
                onChange={(e) => handleChange("generalNotes", e.target.value)}
                placeholder="Enter any additional notes about this association"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-[var(--border-color)] bg-white resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link href={`/management/associations/${associationId}`}>
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

      {/* Manager Selection Modal */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {showNewManagerForm ? "Create New Manager" : "Select Property Manager"}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowManagerModal(false);
                  setShowNewManagerForm(false);
                  setManagerSearchQuery("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {!showNewManagerForm ? (
                <>
                  {/* Search existing contacts */}
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search contacts..."
                        value={managerSearchQuery}
                        onChange={(e) => {
                          setManagerSearchQuery(e.target.value);
                          if (e.target.value.length >= 2) {
                            const lowerQuery = e.target.value.toLowerCase();
                            setExistingContacts(
                              existingContacts.filter(
                                (c: Contact) =>
                                  c.firstName?.toLowerCase().includes(lowerQuery) ||
                                  c.lastName?.toLowerCase().includes(lowerQuery) ||
                                  c.email?.toLowerCase().includes(lowerQuery)
                              )
                            );
                          }
                        }}
                        className="pl-10"
                      />
                    </div>

                    {isSearching ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {existingContacts.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">
                            {managerSearchQuery.length < 2
                              ? "Type at least 2 characters to search"
                              : "No contacts found"}
                          </p>
                        ) : (
                          existingContacts.slice(0, 10).map((contact: Contact) => (
                            <button
                              key={contact.id}
                              type="button"
                              onClick={() => selectExistingManager(contact)}
                              className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                            >
                              <p className="font-medium">
                                {contact.firstName} {contact.lastName}
                              </p>
                              <p className="text-sm text-gray-500">{contact.email}</p>
                              {contact.phone && (
                                <p className="text-sm text-gray-500">{contact.phone}</p>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    {/* Divider */}
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-2 text-sm text-gray-500">or</span>
                      </div>
                    </div>

                    {/* Create new manager button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowNewManagerForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Property Manager
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* New manager form */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Create New Property Manager</h3>
                    <p className="text-sm text-gray-500">
                      This person will be created as a contact and automatically assigned the Property Manager role for this association.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="mgr-firstName">First Name *</Label>
                        <Input
                          id="mgr-firstName"
                          value={newManager.firstName}
                          onChange={(e) =>
                            setNewManager({ ...newManager, firstName: e.target.value })
                          }
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mgr-lastName">Last Name *</Label>
                        <Input
                          id="mgr-lastName"
                          value={newManager.lastName}
                          onChange={(e) =>
                            setNewManager({ ...newManager, lastName: e.target.value })
                          }
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mgr-email">Email *</Label>
                      <Input
                        id="mgr-email"
                        type="email"
                        value={newManager.email}
                        onChange={(e) =>
                          setNewManager({ ...newManager, email: e.target.value })
                        }
                        placeholder="john.doe@example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="mgr-phone">Phone</Label>
                      <Input
                        id="mgr-phone"
                        value={newManager.phone}
                        onChange={(e) =>
                          setNewManager({ ...newManager, phone: e.target.value })
                        }
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        onClick={createNewManager}
                        className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                      >
                        Create & Assign
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewManagerForm(false)}
                      >
                        Back to Search
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
