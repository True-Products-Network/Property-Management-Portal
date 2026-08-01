"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, FileText, Plus, Trash2, Loader2, Mail } from "lucide-react";
import Link from "next/link";

interface Association {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Unit {
  id: string;
  unitNumber: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface FormData {
  associationId: string;
  contactId: string;
  unitId: string;
  paymentType: string;
  description: string;
  processor: string;
  invoiceNumber: string;
  dueDate: string;
  sendEmail: boolean;
  lineItems: LineItem[];
}

const PAYMENT_TYPES = [
  { value: "assessment", label: "Assessment" },
  { value: "special_assessment", label: "Special Assessment" },
  { value: "late_fee", label: "Late Fee" },
  { value: "fine", label: "Fine" },
  { value: "vendor_payment", label: "Vendor Payment" },
  { value: "deposit", label: "Deposit" },
  { value: "other", label: "Other" },
];

const PROCESSORS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
];

export default function CreateInvoicePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  
  const [formData, setFormData] = useState<FormData>({
    associationId: "",
    contactId: "",
    unitId: "",
    paymentType: "",
    description: "",
    processor: "stripe",
    invoiceNumber: "",
    dueDate: "",
    sendEmail: true,
    lineItems: [{ id: "1", description: "", quantity: 1, unitPrice: 0 }],
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  // Load units when association changes
  useEffect(() => {
    if (formData.associationId) {
      loadUnits(formData.associationId);
    }
  }, [formData.associationId]);

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
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUnits(associationId: string) {
    try {
      const response = await fetch(`/api/units?associationId=${associationId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) setUnits(data.data.data || []);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  function calculateTotal(): number {
    return formData.lineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  }

  function addLineItem() {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
    };
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
  }

  function removeLineItem(id: string) {
    if (formData.lineItems.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id),
    }));
  }

  function updateLineItem(id: string, field: keyof LineItem, value: string | number) {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.associationId) newErrors.associationId = "Association is required";
    if (!formData.contactId) newErrors.contactId = "Contact is required";
    if (!formData.paymentType) newErrors.paymentType = "Payment type is required";
    if (!formData.dueDate) newErrors.dueDate = "Due date is required";
    
    // Validate line items
    const invalidItems = formData.lineItems.some(
      item => !item.description || item.quantity <= 0 || item.unitPrice <= 0
    );
    if (invalidItems) {
      newErrors.lineItems = "All line items must have description, quantity, and price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const lineItemsForApi = formData.lineItems.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
      }));

      const response = await fetch("/api/payments/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          associationId: formData.associationId,
          contactId: formData.contactId,
          unitId: formData.unitId || undefined,
          paymentType: formData.paymentType,
          amount: calculateTotal(),
          processor: formData.processor,
          invoiceNumber: formData.invoiceNumber || undefined,
          lineItems: lineItemsForApi,
          dueDate: formData.dueDate || undefined,
          description: formData.description || undefined,
          sendEmail: formData.sendEmail,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push(`/management/payments/${result.data.id}`);
        } else {
          alert(result.error || "Failed to create invoice");
        }
      } else {
        alert("Failed to create invoice");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("An error occurred while creating the invoice");
    } finally {
      setIsSaving(false);
    }
  }

  function handleChange(field: keyof FormData, value: string | boolean) {
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            Create Invoice
          </h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Create a formal invoice with line items via GHL
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--teal)]" />
              Invoice Details
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
                      {contact.firstName} {contact.lastName} ({contact.email})
                    </option>
                  ))}
                </select>
                {errors.contactId && <p className="text-sm text-red-500 mt-1">{errors.contactId}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Unit (Optional)
                </label>
                <select
                  value={formData.unitId}
                  onChange={(e) => handleChange("unitId", e.target.value)}
                  className="input w-full"
                  disabled={!formData.associationId}
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unitNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Payment Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.paymentType}
                  onChange={(e) => handleChange("paymentType", e.target.value)}
                  className={`input w-full ${errors.paymentType ? "border-red-500" : ""}`}
                >
                  <option value="">Select Type</option>
                  {PAYMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.paymentType && <p className="text-sm text-red-500 mt-1">{errors.paymentType}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleChange("dueDate", e.target.value)}
                  className={errors.dueDate ? "border-red-500" : ""}
                />
                {errors.dueDate && <p className="text-sm text-red-500 mt-1">{errors.dueDate}</p>}
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
                placeholder="Invoice description or notes..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Processor
              </label>
              <select
                value={formData.processor}
                onChange={(e) => handleChange("processor", e.target.value)}
                className="input w-full"
              >
                {PROCESSORS.map((proc) => (
                  <option key={proc.value} value={proc.value}>
                    {proc.label}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Line Items</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLineItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.lineItems && (
              <p className="text-sm text-red-500">{errors.lineItems}</p>
            )}
            
            {formData.lineItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-start p-4 bg-[var(--page-background)] rounded-lg">
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                    Description
                  </label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                    Qty
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                    Unit Price
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-medium text-[var(--secondary-text)] mb-1">
                    Amount
                  </label>
                  <p className="text-sm font-medium py-2">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </p>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(item.id)}
                    disabled={formData.lineItems.length <= 1}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t">
              <div className="text-right">
                <p className="text-sm text-[var(--secondary-text)]">Total Amount</p>
                <p className="text-2xl font-semibold text-[var(--teal)]">
                  ${calculateTotal().toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Send Options */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[var(--teal)]" />
                <div>
                  <p className="font-medium">Send Invoice via Email</p>
                  <p className="text-sm text-[var(--secondary-text)]">
                    Automatically send the invoice to the contact via GHL
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sendEmail}
                  onChange={(e) => handleChange("sendEmail", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
              </label>
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
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Invoice
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
