"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const FINANCIAL_PLATFORMS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
];

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
      setError("Either Association Email or Association Phone is required");
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
          <Button variant="outline">Back to Associations</Button>
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Edit Association</h1>
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
                  Association Name *
                </label>
                <Input
                  required
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g., Ridgeland Condominium Association"
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
                  placeholder="e.g., Ridgeland Condominium Association, Inc."
                />
              </div>

              <div className="space-y-2">
                <DropdownSelect
                  recordType="Association Company"
                  fieldName="Association Type"
                  label="Association Type *"
                  value={formData.type || ""}
                  onChange={(value) => handleChange("type", value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <DropdownSelect
                  recordType="Association Company"
                  fieldName="Association Status"
                  label="Association Status *"
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
                  Association Email {!formData.phone && <span className="text-red-500">*</span>}
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
                  Association Phone {!formData.email && <span className="text-red-500">*</span>}
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
    </div>
  );
}
