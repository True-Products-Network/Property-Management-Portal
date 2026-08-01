"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface Payment {
  id: string;
  paymentId: string;
  associationId: string;
  contactId: string;
  unitId?: string;
  paymentType?: string;
  amount: number;
  processor: string;
  processorTransactionId?: string;
  status: string;
  initiatedAt: string;
  completedAt?: string;
  paymentMethodType?: string;
  invoiceNumber?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [processorFilter, setProcessorFilter] = useState<string>("all");

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/payments");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load payments");
      }

      setPayments(result.data.data || []);
    } catch (error) {
      console.error("Error loading payments:", error);
      setError(error instanceof Error ? error.message : "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.paymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.invoiceNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.processor.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesProcessor = processorFilter === "all" || payment.processor === processorFilter;

    return matchesSearch && matchesStatus && matchesProcessor;
  });

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
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate stats
  const totalCollected = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const stripeCount = payments.filter((p) => p.processor === "stripe").length;
  const paypalCount = payments.filter((p) => p.processor === "paypal").length;

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
        <p className="text-red-500">{error}</p>
        <Button onClick={loadPayments} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Payments</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage payments and billing
          </p>
        </div>
        <Link href="/management/payments/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Collected</p>
                <p className="text-2xl font-semibold">{formatCurrency(totalCollected)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Completed</p>
                <p className="text-2xl font-semibold">
                  {payments.filter((p) => p.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Pending</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(pendingAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">By Processor</p>
                <p className="text-lg font-semibold">
                  Stripe: {stripeCount} | PayPal: {paypalCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
              <Input
                placeholder="Search payments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                value={processorFilter}
                onChange={(e) => setProcessorFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Processors</option>
                <option value="stripe">Stripe</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Payment ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Processor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/management/payments/${payment.id}`}
                        className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                      >
                        {payment.paymentId}
                      </Link>
                      {payment.invoiceNumber && (
                        <p className="text-sm text-[var(--secondary-text)]">
                          Invoice: {payment.invoiceNumber}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {getPaymentTypeLabel(payment.paymentType)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">
                        {formatCurrency(payment.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="capitalize">
                        {payment.processor}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(payment.status)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[var(--secondary-text)]">
                        {formatDate(payment.completedAt || payment.initiatedAt)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/management/payments/${payment.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              {searchQuery || statusFilter !== "all" || processorFilter !== "all"
                ? "No payments found matching your criteria."
                : "No payments yet. Click 'Record Payment' to create one."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
