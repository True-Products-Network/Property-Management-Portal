"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Info, X, Search, Plus } from "lucide-react";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const FINANCIAL_PLATFORM_OPTIONS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
];

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
].map(m => ({ value: m, label: m }));

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export default function NewAssociationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const [formData, setFormData] = useState<{
    name: string;
    shortName: string;
    legalName: string;
    type: string;
    status: string;
    addressStreet: string;
    addressCity: string;
    addressState: string;
    addressZip: string;
    mailingAddress: string;
    phone: string;
    email: string;
    taxId: string;
    fiscalYear: string;
    fiscalYearEndMonth: string;
    fiscalYearEndDay: number | '';
    annualMeetingMonth: string;
    managementStartDate: string;
    financialPlatform: string;
    financialPortalLink: string;
    documentStorageLink: string;
    emergencyInstructions: string;
    generalNotes: string;
    propertyCount: number | '';
    unitCount: number | '';
    assignedManagerId: string;
    assignedManagerName: string;
  }>({
    name: "",
    shortName: "",
    legalName: "",
    type: "condominium",
    status: "active",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    mailingAddress: "",
    phone: "",
    email: "",
    taxId: "",
    fiscalYear: "",
    fiscalYearEndMonth: "",
    fiscalYearEndDay: '',
    annualMeetingMonth: "",
    managementStartDate: "",
    financialPlatform: "",
    financialPortalLink: "",
    documentStorageLink: "",
    emergencyInstructions: "",
    generalNotes: "",
    propertyCount: '',
    unitCount: '',
    assignedManagerId: "",
    assignedManagerName: "",
  });

  // Load all contacts for the tenant (pick list)
  async function loadContacts() {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/contacts?limit=100`);
      const result = await response.json();
      console.log("[LoadContacts] API response:", result);
      if (result.success) {
        const contactsData = result.data?.data || [];
        console.log("[LoadContacts] Loaded contacts:", contactsData.length);
        setExistingContacts(contactsData);
      } else {
        console.error("[LoadContacts] API returned error:", result.error);
        alert("Failed to load contacts: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("[LoadContacts] Error loading contacts:", error);
      alert("Error loading contacts. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  // Search/filter contacts locally
  function filterContacts(query: string) {
    if (!query || query.length < 2) {
      // Show all contacts if no search
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = existingContacts.filter((c: Contact) =>
      c.firstName?.toLowerCase().includes(lowerQuery) ||
      c.lastName?.toLowerCase().includes(lowerQuery) ||
      c.email?.toLowerCase().includes(lowerQuery)
    );
    setExistingContacts(filtered);
  }

  // Handle selecting an existing contact as manager
  function selectExistingManager(contact: Contact) {
    setFormData({
      ...formData,
      assignedManagerId: contact.id,
      assignedManagerName: `${contact.firstName} ${contact.lastName}`,
    });
    setShowManagerModal(false);
    setManagerSearchQuery("");
    setExistingContacts([]);
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

      console.log("[CreateManager] Contact created:", result.data);

      // Show GHL message if not connected
      if (result.ghlMessage) {
        alert(`Contact created successfully.\n\nNote: ${result.ghlMessage}`);
      }

      // Set the newly created manager - use the correct ID field
      const contactId = result.data?.id || result.data?.contactId;
      if (!contactId) {
        throw new Error("Contact created but no ID returned");
      }

      setFormData({
        ...formData,
        assignedManagerId: contactId,
        assignedManagerName: `${newManager.firstName} ${newManager.lastName}`,
      });

      // Reset and close modal
      setNewManager({ firstName: "", lastName: "", email: "", phone: "" });
      setShowNewManagerForm(false);
      setShowManagerModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to create manager");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validation: Email or Phone is required
    if (!formData.email && !formData.phone) {
      setError("Either Association Email or Association Phone is required");
      setIsSubmitting(false);
      return;
    }

    try {
      // Transform form data to match API schema
      const apiData = {
        name: formData.name,
        shortName: formData.shortName || undefined,
        legalName: formData.legalName || undefined,
        type: formData.type,
        addressStreet: formData.addressStreet || undefined,
        addressCity: formData.addressCity || undefined,
        addressState: formData.addressState || undefined,
        addressZip: formData.addressZip || undefined,
        mailingAddress: formData.mailingAddress || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        taxId: formData.taxId || undefined,
        fiscalYear: formData.fiscalYear || undefined,
        fiscalYearEndMonth: formData.fiscalYearEndMonth || undefined,
        fiscalYearEndDay: formData.fiscalYearEndDay ? parseInt(formData.fiscalYearEndDay.toString()) : undefined,
        annualMeetingMonth: formData.annualMeetingMonth || undefined,
        managementStartDate: formData.managementStartDate || undefined,
        assignedManagerId: formData.assignedManagerId ? formData.assignedManagerId : undefined,
        financialPlatform: formData.financialPlatform || undefined,
        financialPortalLink: formData.financialPortalLink || undefined,
        documentStorageLink: formData.documentStorageLink || undefined,
        emergencyInstructions: formData.emergencyInstructions || undefined,
        generalNotes: formData.generalNotes || undefined,
        propertyCount: formData.propertyCount ? parseInt(formData.propertyCount.toString()) : undefined,
        unitCount: formData.unitCount ? parseInt(formData.unitCount.toString()) : undefined,
      };

      console.log("[Association Create] Sending data:", apiData);
      console.log("[Association Create] Manager ID:", formData.assignedManagerId);

      const response = await fetch("/api/associations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Show detailed validation errors
        if (result.details && Array.isArray(result.details)) {
          const errorMessages = result.details.map((err: any) => `${err.path}: ${err.message}`).join("\n");
          throw new Error(`Validation failed:\n${errorMessages}`);
        }
        throw new Error(result.error || result.message || "Failed to create association");
      }

      // Show success message with Association ID
      alert(`Association created successfully!\n\nAssociation ID: ${result.data?.id || result.data?.associationId || 'N/A'}\nName: ${formData.name}`);
      
      router.push("/management/associations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Format phone number as user types - allows any input
  function formatPhoneNumber(value: string): string {
    // Just strip non-numeric characters and limit to 10 digits
    // Let the user type freely without forcing a mask
    const numbers = value.replace(/\D/g, "").slice(0, 10);
    return numbers;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/management/associations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Add Association</h1>
          <p className="text-[var(--secondary-text)]">Create a new association or community</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 whitespace-pre-line">
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
                  Association Name *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ridgeland Condominium Association"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Common/Short Name
                </label>
                <Input
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                  placeholder="e.g., Ridgeland Condos"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Legal Name
                </label>
                <Input
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="e.g., Ridgeland Condominium Association, Inc."
                />
              </div>

              <DropdownSelect
                recordType="Association Company"
                fieldName="Association Type"
                label="Association Type"
                value={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value })}
                placeholder="Select type..."
                required
              />

              <DropdownSelect
                recordType="Association Company"
                fieldName="Association Status"
                label="Association Status"
                value={formData.status}
                onChange={(value) => setFormData({ ...formData, status: value })}
                placeholder="Select status..."
                required
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Tax ID / EIN Number
                </label>
                <Input
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  placeholder="XX-XXXXXXX"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Number of Properties
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.propertyCount}
                  onChange={(e) => setFormData({ ...formData, propertyCount: e.target.value ? parseInt(e.target.value) : '' })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Number of Units
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.unitCount}
                  onChange={(e) => setFormData({ ...formData, unitCount: e.target.value ? parseInt(e.target.value) : '' })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Assigned Property Manager
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.assignedManagerName}
                    placeholder="Select or create a manager..."
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowManagerModal(true)}
                  >
                    {formData.assignedManagerId ? "Change" : "Select"}
                  </Button>
                  {formData.assignedManagerId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setFormData({ ...formData, assignedManagerId: "", assignedManagerName: "" })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.assignedManagerId && (
                  <p className="text-xs text-green-600">
                    Will be assigned as Property Manager for this association
                  </p>
                )}
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
                  Association Email {!formData.phone && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="board@example.org"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Association Phone {!formData.email && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
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
                value={formData.addressStreet}
                onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  City
                </label>
                <Input
                  value={formData.addressCity}
                  onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                  placeholder="Chicago"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  State
                </label>
                <Input
                  value={formData.addressState}
                  onChange={(e) => setFormData({ ...formData, addressState: e.target.value })}
                  placeholder="IL"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  ZIP Code
                </label>
                <Input
                  value={formData.addressZip}
                  onChange={(e) => setFormData({ ...formData, addressZip: e.target.value })}
                  placeholder="60601"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--main-text)]">
                Main Mailing Address (if different from above)
              </label>
              <textarea
                value={formData.mailingAddress}
                onChange={(e) => setFormData({ ...formData, mailingAddress: e.target.value })}
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
                <DropdownSelect
                  recordType="Association Company"
                  fieldName="Fiscal Year End Month"
                  value={formData.fiscalYearEndMonth}
                  onChange={(value) => setFormData({ ...formData, fiscalYearEndMonth: value })}
                  label="Fiscal Year End (Month)"
                  placeholder="Select month..."
                  defaultOptions={MONTH_OPTIONS}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Fiscal Year End (Day)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={formData.fiscalYearEndDay}
                  onChange={(e) => setFormData({ ...formData, fiscalYearEndDay: parseInt(e.target.value) || '' })}
                  placeholder="e.g., 31"
                />
              </div>

              <div className="space-y-2">
                <DropdownSelect
                  recordType="Association Company"
                  fieldName="Annual Meeting Month"
                  value={formData.annualMeetingMonth}
                  onChange={(value) => setFormData({ ...formData, annualMeetingMonth: value })}
                  label="Annual Meeting Month"
                  placeholder="Select month..."
                  defaultOptions={MONTH_OPTIONS}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Management Start Date
                </label>
                <Input
                  type="date"
                  value={formData.managementStartDate}
                  onChange={(e) => setFormData({ ...formData, managementStartDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <DropdownSelect
                  recordType="Association Company"
                  fieldName="Financial Platform"
                  value={formData.financialPlatform}
                  onChange={(value) => setFormData({ ...formData, financialPlatform: value })}
                  label="Financial Platform"
                  placeholder="Select platform..."
                  defaultOptions={FINANCIAL_PLATFORM_OPTIONS}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Financial Portal Link
                </label>
                <Input
                  type="url"
                  value={formData.financialPortalLink}
                  onChange={(e) => setFormData({ ...formData, financialPortalLink: e.target.value })}
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
                value={formData.documentStorageLink}
                onChange={(e) => setFormData({ ...formData, documentStorageLink: e.target.value })}
                placeholder="https://..."
              />
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
                value={formData.emergencyInstructions}
                onChange={(e) => setFormData({ ...formData, emergencyInstructions: e.target.value })}
                placeholder="Enter emergency contact procedures and instructions"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-[var(--border-color)] bg-white resize-y"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--main-text)]">
                General Notes
              </label>
              <textarea
                value={formData.generalNotes}
                onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
                placeholder="Enter any additional notes about this association"
                className="w-full min-h-[100px] px-3 py-2 rounded-md border border-[var(--border-color)] bg-white resize-y"
              />
            </div>
          </CardContent>
        </Card>

        {/* Association ID Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Association ID</p>
                <p className="text-sm text-blue-700">
                  The unique Association ID will be automatically generated when you create this record (e.g., ASSOC-123456).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Link href="/management/associations">
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
                Creating...
              </>
            ) : (
              "Create Association"
            )}
          </Button>
        </div>
      </form>

      {/* Manager Selection Modal */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Select Property Manager</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowManagerModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 overflow-y-auto">
              {!showNewManagerForm ? (
                <>
                  {/* Search existing contacts */}
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name or email..."
                        value={managerSearchQuery}
                        onChange={(e) => {
                          setManagerSearchQuery(e.target.value);
                          filterContacts(e.target.value);
                        }}
                        className="pl-10"
                      />
                    </div>

                    {/* Load contacts button / Contact list */}
                    {existingContacts.length === 0 && !isSearching ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={loadContacts}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Load Contacts
                      </Button>
                    ) : isSearching ? (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                      </div>
                    ) : existingContacts.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        <p className="text-sm text-gray-500">Select from existing contacts:</p>
                        {existingContacts.map((contact) => (
                          <button
                            key={contact.id}
                            onClick={() => selectExistingManager(contact)}
                            className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <p className="font-medium">
                              {contact.firstName} {contact.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{contact.email}</p>
                            {contact.phone && (
                              <p className="text-sm text-gray-500">{contact.phone}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : managerSearchQuery.length >= 2 ? (
                      <p className="text-center text-gray-500 py-4">No contacts found</p>
                    ) : null}

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
                          onChange={(e) => setNewManager({ ...newManager, firstName: e.target.value })}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mgr-lastName">Last Name *</Label>
                        <Input
                          id="mgr-lastName"
                          value={newManager.lastName}
                          onChange={(e) => setNewManager({ ...newManager, lastName: e.target.value })}
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
                        onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                        placeholder="john.doe@example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="mgr-phone">Phone</Label>
                      <Input
                        id="mgr-phone"
                        value={newManager.phone}
                        onChange={(e) => setNewManager({ ...newManager, phone: e.target.value })}
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
