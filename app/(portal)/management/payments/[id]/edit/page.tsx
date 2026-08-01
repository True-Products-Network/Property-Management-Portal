"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, CreditCard, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Association {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

interface FormData {
  associationId: string;
  contactId: string;
  paymentType: string;
  amount: string;
  description: string;
  processor: string;
  status: string;
  invoiceNumber: string;
  processedDate: string;
}

const PAYMENT_TYPES = [
  { value: "assessment", label: "Assessment" },
  { value: "fee", label: "Fee" },
  { value: "fine", label: "Fine" },
  { value: "deposit", label: "Deposit" },
  { value: "other", label: "Other" },
];

export default function EditPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    associationId: "",
    contactId: "",
    paymentType: "",
    amount: "",
    description: "",
    processor: "stripe",
    status: "pending",
    invoiceNumber: "",
    processedDate: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [paymentRes, assocRes, contactsRes] = await Promise.all([
        fetch(`/api/payments/${paymentId}`),
        fetch("/api/associations"),
        fetch("/api/contacts"),
      ]);

      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        if (paymentData.success && paymentData.data) {
          const payment = paymentData.data;
          setFormData({
            associationId: payment.associationId || "",
            contactId: payment.contactId || "",
            paymentType: payment.paymentType || "",
            amount: payment.amount?.toString() || "",
            description: payment.description || "",
            processor: payment.processor || "stripe",
            status: payment.status || "pending",
            invoiceNumber: payment.invoiceNumber || "",
            processedDate: payment.processedDate ? payment.processedDate.split("T")[0] : "",
          });
        }
      }

      if (assocRes.ok) {
        const assocData = await assocRes.json();
        if (assocData.success) setAssociations(assocData.data.data || []);
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        if (contactsData.success) setContacts(contactsData.data.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};
    if (!formData.associationId) newErrors.associationId = "Association is required";
    if (!formData.contactId) newErrors.contactId = "Contact is required";
    if (!formData.paymentType) newErrors.paymentType = "Payment type is required";
    if (!formData.amount) newErrors.amount = "Amount is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(`/management/payments/${paymentId}`);
      } else {
        const error = await res.json();
        alert(error.error?.message || "Failed to update payment");
      }
    } catch (error) {
      console.error("Error saving payment:", error);
      alert("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#2f1fac]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/management/payments/${paymentId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#2f1fac]">Edit Payment</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Association *</label>
                <select
                  value={formData.associationId}
                  onChange={(e) => setFormData({ ...formData, associationId: e.target.value })}
                  className={`w-full h-10 px-3 rounded-md border ${errors.associationId ? "border-red-500" : "border-input"} bg-background`}
                >
                  <option value="">Select association</option>
                  {associations.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {errors.associationId && <p className="text-sm text-red-500">{errors.associationId}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contact *</label>
                <select
                  value={formData.contactId}
                  onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                  className={`w-full h-10 px-3 rounded-md border ${errors.contactId ? "border-red-500" : "border-input"} bg-background`}
                >
                  <option value="">Select contact</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
                {errors.contactId && <p className="text-sm text-red-500">{errors.contactId}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Type *</label>
                <select
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                  className={`w-full h-10 px-3 rounded-md border ${errors.paymentType ? "border-red-500" : "border-input"} bg-background`}
                >
                  <option value="">Select type</option>
                  {PAYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.paymentType && <p className="text-sm text-red-500">{errors.paymentType}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className={errors.amount ? "border-red-500" : ""}
                />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter payment description"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Processor</label>
                <select
                  value={formData.processor}
                  onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Number</label>
                <Input
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                  placeholder="e.g., INV-2024-001"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Processed Date</label>
                <Input
                  type="date"
                  value={formData.processedDate}
                  onChange={(e) => setFormData({ ...formData, processedDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Link href={`/management/payments/${paymentId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSaving} className="bg-[#2f1fac]">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
