"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CreditCard,
  Edit,
  Loader2,
  Building2,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";

interface Payment {
  id: string;
  paymentId: string;
  associationId: string;
  contactId: string;
  unitId?: string;
  paymentType?: string;
  amount: number;
  description?: string;
  processor: string;
  processorTransactionId?: string;
  status: string;
  initiatedAt: string;
  completedAt?: string;
  paymentMethodType?: string;
  invoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
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

interface Association {
  id: string;
  name: string;
}

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [association, setAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paymentId) {
      loadPayment();
    }
  }, [paymentId]);

  async function loadPayment() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/payments/${paymentId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load payment");
      }

      setPayment(result.data);

      // Load related data
      if (result.data.contactId) {
        const contactRes = await fetch(`/api/contacts/${result.data.contactId}`);
        if (contactRes.ok) {
          const contactData = await contactRes.json();
          if (contactData.success) setContact(contactData.data);
        }
      }

      if (result.data.unitId) {
        const unitRes = await fetch(`/api/units/${result.data.unitId}`);
        if (unitRes.ok) {
          const unitData = await unitRes.json();
          if (unitData.success) setUnit(unitData.data);
        }
      }

      if (result.data.associationId) {
        const assocRes = await fetch(`/api/associations/${result.data.associationId}`);
        if (assocRes.ok) {
          const assocData = await assocRes.json();
          if (assocData.success) setAssociation(assocData.data);
        }
      }
    } catch (error) {
      console.error("Error loading payment:", error);
      setError(error instanceof Error ? error.message : "Failed to load payment");
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      case "refunded":
        return <Badge className="bg-gray-100 text-gray-700">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      assessment: "Assessment",
      special_assessment: "Special Assessment",
      late_fee: "Late Fee",
      fine: "Fine",
      vendor_payment: "Vendor Payment",
      deposit: "Deposit",
      other: "Other",
    };
    return types[type || ""] || type || "-";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <div className="flex gap-2">
          <Button onClick={loadPayment} variant="outline">
            Retry
          </Button>
          <Link href="/management/payments">
            <Button variant="outline">Back to Payments</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">Payment not found</p>
        <Link href="/management/payments">
          <Button variant="outline" className="mt-4">
            Back to Payments
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
            <Link
              href="/management/payments"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Payments
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              Payment {payment.paymentId}
            </h1>
            {getStatusBadge(payment.status)}
          </div>
          {payment.invoiceNumber && (
            <p className="text-[var(--secondary-text)]">Invoice: {payment.invoiceNumber}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/management/payments/${paymentId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Amount</p>
                <p className="text-2xl font-semibold">{formatCurrency(payment.amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Processor</p>
                <p className="text-lg font-semibold capitalize">{payment.processor}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Payment Type</p>
                <p className="text-lg font-semibold">{getPaymentTypeLabel(payment.paymentType)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                {payment.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : payment.status === "pending" ? (
                  <Clock className="h-5 w-5 text-amber-600" />
                ) : payment.status === "failed" ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CreditCard className="h-5 w-5 text-[var(--teal)]" />
                )}
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Status</p>
                <div className="mt-1">{getStatusBadge(payment.status)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Payment ID</p>
                <p className="mt-1 font-medium">{payment.paymentId}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Amount</p>
                <p className="mt-1 font-medium text-lg">{formatCurrency(payment.amount)}</p>
              </div>
            </div>

            {payment.description && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Description</p>
                <p className="mt-1">{payment.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Payment Type</p>
              <p className="mt-1">{getPaymentTypeLabel(payment.paymentType)}</p>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Processor</p>
              <p className="mt-1 capitalize">{payment.processor}</p>
            </div>

            {payment.processorTransactionId && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Transaction ID</p>
                <p className="mt-1 font-mono text-sm">{payment.processorTransactionId}</p>
              </div>
            )}

            {payment.paymentMethodType && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Payment Method</p>
                <p className="mt-1 capitalize">{payment.paymentMethodType.replace("_", " ")}</p>
              </div>
            )}

            {payment.invoiceNumber && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Invoice Number</p>
                <p className="mt-1">{payment.invoiceNumber}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status & Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Current Status</p>
              <div className="mt-1">{getStatusBadge(payment.status)}</div>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Initiated</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-[var(--secondary-text)]" />
                <span>{formatDate(payment.initiatedAt)}</span>
              </div>
            </div>

            {payment.completedAt && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Completed</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{formatDate(payment.completedAt)}</span>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Created</p>
              <p className="mt-1">{formatDate(payment.createdAt)}</p>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Last Updated</p>
              <p className="mt-1">{formatDate(payment.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Related Records */}
      <Card>
        <CardHeader>
          <CardTitle>Related Records</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {association && (
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Association</p>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                <Link
                  href={`/management/associations/${association.id}`}
                  className="text-[var(--teal)] hover:underline"
                >
                  {association.name}
                </Link>
              </div>
            </div>
          )}

          {contact && (
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Contact</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-[var(--secondary-text)]" />
                <Link
                  href={`/management/people/${contact.id}`}
                  className="text-[var(--teal)] hover:underline"
                >
                  {contact.firstName} {contact.lastName}
                </Link>
              </div>
            </div>
          )}

          {unit && (
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Unit</p>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                <Link
                  href={`/management/units/${unit.id}`}
                  className="text-[var(--teal)] hover:underline"
                >
                  Unit {unit.unitNumber}
                </Link>
              </div>
            </div>
          )}

          {!association && !contact && !unit && (
            <p className="text-[var(--secondary-text)]">No related records</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
