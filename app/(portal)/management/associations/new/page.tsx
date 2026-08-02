"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Info } from "lucide-react";

const ASSOCIATION_TYPES = [
  { value: "condominium", label: "Condominium" },
  { value: "hoa", label: "HOA (Homeowners Association)" },
  { value: "cooperative", label: "Cooperative" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "other", label: "Other" },
];

const ASSOCIATION_STATUSES = [
  { value: "prospect", label: "Prospect" },
  { value: "onboarding", label: "Onboarding" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On-Hold" },
  { value: "ending_management", label: "Ending Management" },
  { value: "inactive", label: "Inactive" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const FINANCIAL_PLATFORMS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
];

export default function NewAssociationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        legalName: formData.legalName || undefined,
        type: formData.type.charAt(0).toUpperCase() + formData.type.slice(1), // Convert to proper case
        addressStreet: formData.addressStreet || undefined,
        addressCity: formData.addressCity || undefined,
        addressState: formData.addressState || undefined,
        addressZip: formData.addressZip || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        fiscalYear: formData.fiscalYear || undefined,
        annualMeetingMonth: formData.annualMeetingMonth || undefined,
        managementStartDate: formData.managementStartDate || undefined,
        assignedManagerId: formData.assignedManagerId || undefined,
        propertyCount: formData.propertyCount ? parseInt(formData.propertyCount.toString()) : undefined,
        unitCount: formData.unitCount ? parseInt(formData.unitCount.toString()) : undefined,
      };

      const response = await fetch("/api/associations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Show detailed validation errors
        if (result.details) {
          const errorMessages = result.details.map((err: any) => `${err.path}: ${err.message}`).join("\n");
          throw new Error(`Validation failed:\n${errorMessages}`);
        }
        throw new Error(result.error || "Failed to create association");
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

  // Format phone number as user types
  function formatPhoneNumber(value: string): string {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 0) return "";
    if (numbers.length <= 3) return `+1 (${numbers}`;
    if (numbers.length <= 6) return `+1 (${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return `+1 (${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Association Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-color)] bg-white"
                >
                  {ASSOCIATION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Association Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-color)] bg-white"
                >
                  {ASSOCIATION_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

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
                  Assigned Manager
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.assignedManagerName}
                    placeholder="Select a manager..."
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => alert("Manager selection modal would open here")}
                  >
                    Select
                  </Button>
                </div>
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
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Fiscal Year End (Month)
                </label>
                <select
                  value={formData.fiscalYearEndMonth}
                  onChange={(e) => setFormData({ ...formData, fiscalYearEndMonth: e.target.value })}
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
                  value={formData.fiscalYearEndDay}
                  onChange={(e) => setFormData({ ...formData, fiscalYearEndDay: parseInt(e.target.value) || '' })}
                  placeholder="e.g., 31"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Annual Meeting Month
                </label>
                <select
                  value={formData.annualMeetingMonth}
                  onChange={(e) => setFormData({ ...formData, annualMeetingMonth: e.target.value })}
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
                  value={formData.managementStartDate}
                  onChange={(e) => setFormData({ ...formData, managementStartDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Financial Platform
                </label>
                <select
                  value={formData.financialPlatform}
                  onChange={(e) => setFormData({ ...formData, financialPlatform: e.target.value })}
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
    </div>
  );
}
