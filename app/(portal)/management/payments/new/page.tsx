"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, CreditCard, Loader2, Edit3 } from "lucide-react";
import Link from "next/link";
import { EntitlementGuard } from "@/components/entitlements/EntitlementGuard";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

interface Association {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

interface Unit {
  id: string;
  unitNumber: string;
}

interface FormData {
  associationId: string;
  contactId: string;
  unitId: string;
  paymentType: string;
  amount: string;
  description: string;
  processor: string;
  status: string;
  invoiceNumber: string;
}

const PAYMENT_TYPE_OPTIONS = [
  { value: "assessment", label: "Assessment" },
  { value: "fee", label: "Fee" },
  { value: "fine", label: "Fine" },
  { value: "maintenance", label: "Maintenance Charge" },
  { value: "special_assessment", label: "Special Assessment" },
  { value: "deposit", label: "Deposit" },
];

const PROCESSOR_OPTIONS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

function PaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("id");
  const isEditMode = !!paymentId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    associationId: "",
    contactId: "",
    unitId: "",
    paymentType: "",
    amount: "",
    description: "",
    processor: "stripe",
    status: "pending",
    invoiceNumber: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [assocRes, contactsRes] = await Promise.all([
        fetch("/api/associations"),
        fetch("/api/contacts"),
      ]);

      if (assocRes.ok) {
        const assocData = await assocRes.json();
        if (assocData.success) setAssociations(assocData.data.data || []);
      }
      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        if (contactsData.success) setContacts(contactsData.data.data || []);
      }

      // If in edit mode, fetch the payment data
      if (isEditMode && paymentId) {
        await loadPaymentData(paymentId);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadPaymentData(id: string) {
    try {
      const response = await fetch(`/api/payments/${id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const payment = result.data;
          setFormData({
            associationId: payment.associationId || "",
            contactId: payment.contactId || "",
            unitId: payment.unitId || "",
            paymentType: payment.paymentType || "",
            amount: payment.amount?.toString() || "",
            description: payment.description || "",
            processor: payment.processor || "stripe",
            status: payment.status || "pending",
            invoiceNumber: payment.invoiceNumber || "",
          });
        }
      } else {
        console.error("Failed to load payment data");
        alert("Failed to load payment data for editing");
      }
    } catch (error) {
      console.error("Error loading payment data:", error);
      alert("An error occurred while loading the payment data");
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};

    if (!formData.associationId) newErrors.associationId = "Association is required";
    if (!formData.contactId) newErrors.contactId = "Contact is required";
    if (!formData.paymentType) newErrors.paymentType = "Payment type is required";
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const url = isEditMode ? `/api/payments/${paymentId}` : "/api/payments";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          associationId: formData.associationId,
          contactId: formData.contactId,
          unitId: formData.unitId || undefined,
          paymentType: formData.paymentType,
          amount: parseFloat(formData.amount),
          description: formData.description || undefined,
          processor: formData.processor,
          status: formData.status,
          invoiceNumber: formData.invoiceNumber || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const redirectId = isEditMode ? paymentId : result.data.id;
          router.push(`/management/payments/${redirectId}`);
        } else {
          alert(result.error || `Failed to ${isEditMode ? "update" : "create"} payment`);
        }
      } else {
        alert(`Failed to ${isEditMode ? "update" : "create"} payment`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} payment:`, error);
      alert(`An error occurred while ${isEditMode ? "updating" : "creating"} the payment`);
    } finally {
      setIsSaving(false);
    }
  }

  function handleChange(field: keyof FormData, value: string) {
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
        <Link href="/management/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {isEditMode ? "Edit Payment" : "Record Payment"}
            </h1>
            {isEditMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Edit3 className="h-3 w-3" />
                Edit Mode
              </span>
            )}
          </div>
          <p className="text-[var(--secondary-text)] mt-1">
            {isEditMode ? "Update payment details" : "Record a new payment or charge"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[var(--teal)]" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  Contact <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.contactId}
                  onChange={(e) => handleChange("contactId", e.target.value)}
                  className={`input w-full ${errors.contactId ? "border-red-500" : ""}`}
                >
                  <option value="">Select Contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName}
                    </option>
                  ))}
                </select>
                {errors.contactId && <p className="text-sm text-red-500 mt-1">{errors.contactId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <DropdownSelect
                  recordType="payment"
                  fieldName="type"
                  value={formData.paymentType}
                  onChange={(value) => handleChange("paymentType", value)}
                  label="Payment Type"
                  placeholder="Select Type"
                  required
                  className={errors.paymentType ? "[&_select]:border-red-500" : ""}
                  defaultOptions={PAYMENT_TYPE_OPTIONS}
                />
                {errors.paymentType && <p className="text-sm text-red-500 mt-1">{errors.paymentType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  placeholder="0.00"
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className="input w-full"
                placeholder="Payment description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <DropdownSelect
                  recordType="payment"
                  fieldName="processor"
                  value={formData.processor}
                  onChange={(value) => handleChange("processor", value)}
                  label="Processor"
                  defaultOptions={PROCESSOR_OPTIONS}
                />
              </div>
              <div>
                <DropdownSelect
                  recordType="payment"
                  fieldName="status"
                  value={formData.status}
                  onChange={(value) => handleChange("status", value)}
                  label="Status"
                  defaultOptions={STATUS_OPTIONS}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Invoice Number
              </label>
              <Input
                value={formData.invoiceNumber}
                onChange={(e) => handleChange("invoiceNumber", e.target.value)}
                placeholder="e.g., INV-12345"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/management/payments">
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
                {isEditMode ? "Save Changes" : "Record Payment"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Wrap with EntitlementGuard and Suspense
export default function PaymentFormWrapper() {
  return (
    <EntitlementGuard featureKey="payments">
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
        </div>
      }>
        <PaymentForm />
      </Suspense>
    </EntitlementGuard>
  );
}
