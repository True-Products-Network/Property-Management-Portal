"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Building2,
  FileText,
  Calendar,
  ExternalLink,
} from "lucide-react";

interface Payment {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
  paymentType?: string;
  paymentMode?: string;
  processor: string;
  invoiceNumber?: string;
  ghlPaymentLinkUrl?: string;
  ghlInvoiceId?: string;
  dueDate?: string;
  initiatedAt: string;
  completedAt?: string;
  propertyName?: string;
  unitNumber?: string;
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export default function OwnerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [outstandingBalance, setOutstandingBalance] = useState(0);

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/owner/payments");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load payments");
      }

      setPayments(result.data.payments || []);
      setOutstandingBalance(result.data.outstandingBalance || 0);
    } catch (error) {
      console.error("Error loading payments:", error);
      setError(error instanceof Error ? error.message : "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }

  const pendingPayments = payments.filter(p => p.status === "pending" || p.status === "invoiced");
  const completedPayments = payments.filter(p => p.status === "completed" || p.status === "paid");
  const overduePayments = pendingPayments.filter(p => {
    if (!p.dueDate) return false;
    return new Date(p.dueDate) < new Date();
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
      case "invoiced":
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
      case "completed":
      case "paid":
        return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      case "refunded":
        return <Badge className="bg-gray-100 text-gray-700">Refunded</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
        <Button onClick={loadPayments} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">My Payments</h1>
        <p className="text-[var(--secondary-text)] mt-1">
          View payment history and manage outstanding balances
        </p>
      </div>

      {/* Outstanding Balance Alert */}
      {outstandingBalance > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">Outstanding Balance</p>
                  <p className="text-3xl font-bold text-red-700">
                    {formatCurrency(outstandingBalance)}
                  </p>
                  <p className="text-sm text-red-600">
                    {pendingPayments.length} pending payment{pendingPayments.length !== 1 ? "s" : ""}
                    {overduePayments.length > 0 && ` • ${overduePayments.length} overdue`}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {pendingPayments.map(payment => (
                  payment.ghlPaymentLinkUrl && (
                    <a
                      key={payment.id}
                      href={payment.ghlPaymentLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay {formatCurrency(payment.amount)}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </a>
                  )
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Payments</p>
                <p className="text-2xl font-semibold">{payments.length}</p>
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
                <p className="text-sm text-[var(--secondary-text)]">Paid</p>
                <p className="text-2xl font-semibold">{completedPayments.length}</p>
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
                <p className="text-2xl font-semibold">{pendingPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--teal)]/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Paid</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(completedPayments.reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments */}
      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Pending Payments
            </CardTitle>
            <CardDescription>
              Payments awaiting your action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div 
                  key={payment.id} 
                  className={`p-4 rounded-lg border ${
                    overduePayments.includes(payment) 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-[var(--page-background)] border-[var(--border-color)]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{payment.paymentType || "Payment"}</p>
                        {getStatusBadge(payment.status)}
                        {overduePayments.includes(payment) && (
                          <Badge className="bg-red-100 text-red-700">Overdue</Badge>
                        )}
                      </div>
                      {payment.invoiceNumber && (
                        <p className="text-sm text-[var(--secondary-text)]">
                          Invoice: {payment.invoiceNumber}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm text-[var(--secondary-text)]">
                        {payment.propertyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {payment.propertyName}
                          </span>
                        )}
                        {payment.unitNumber && (
                          <span>Unit {payment.unitNumber}</span>
                        )}
                      </div>
                      {payment.dueDate && (
                        <p className={`text-sm mt-1 ${overduePayments.includes(payment) ? 'text-red-600 font-medium' : 'text-[var(--secondary-text)]'}`}>
                          Due: {new Date(payment.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      {payment.lineItems && payment.lineItems.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                          {payment.lineItems.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-[var(--secondary-text)]">{item.description}</span>
                              <span>{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-2xl font-bold">{formatCurrency(payment.amount)}</p>
                      {payment.ghlPaymentLinkUrl ? (
                        <a
                          href={payment.ghlPaymentLinkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </a>
                      ) : (
                        <Button disabled className="bg-gray-300">
                          <Clock className="h-4 w-4 mr-2" />
                          Processing
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Record of your past payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {completedPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-3 text-[var(--secondary-text)] opacity-50" />
              <p className="text-[var(--secondary-text)]">No payment history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-[var(--page-background)] rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{payment.paymentType || "Payment"}</p>
                        {getStatusBadge(payment.status)}
                      </div>
                      {payment.invoiceNumber && (
                        <p className="text-sm text-[var(--secondary-text)]">
                          Invoice: {payment.invoiceNumber}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-[var(--secondary-text)]">
                        {payment.propertyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {payment.propertyName}
                          </span>
                        )}
                        {payment.unitNumber && (
                          <span>Unit {payment.unitNumber}</span>
                        )}
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {payment.completedAt 
                            ? new Date(payment.completedAt).toLocaleDateString()
                            : new Date(payment.initiatedAt).toLocaleDateString()
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-[var(--secondary-text)]">
                      {payment.processor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
