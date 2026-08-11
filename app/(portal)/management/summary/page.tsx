"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Home,
  Users,
  Wrench,
  Scale,
  CheckSquare,
  DollarSign,
  FileText,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Truck,
  MessageSquare,
} from "lucide-react";

interface ReportData {
  summary: {
    totalBusinesses: number;
    totalProperties: number;
    totalUnits: number;
    totalContacts: number;
    totalVendors: number;
    totalCommunications: number;
    activeBusinesses: number;
    activeProperties: number;
    occupiedUnits: number;
    vacantUnits: number;
  };
  communications: {
    total: number;
    sent: number;
    scheduled: number;
    draft: number;
  };
  maintenance: {
    total: number;
    open: number;
    completed: number;
    emergency: number;
    byCategory: Record<string, number>;
    totalCost: number;
  };
  inspections: {
    total: number;
    scheduled: number;
    completed: number;
    overdue: number;
    averageRating: number;
  };
  compliance: {
    total: number;
    open: number;
    critical: number;
    overdue: number;
    totalFines: number;
  };
  approvals: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalRequested: number;
    totalApproved: number;
  };
  payments: {
    total: number;
    completed: number;
    pending: number;
    failed: number;
    totalCollected: number;
    pendingAmount: number;
  };
  documents: {
    total: number;
    active: number;
    expired: number;
    expiringSoon: number;
    totalStorage: number;
  };
  activity: {
    newThisWeek: {
      businesses: number;
      properties: number;
      units: number;
      contacts: number;
      maintenance: number;
    };
    newThisMonth: {
      businesses: number;
      properties: number;
      units: number;
      contacts: number;
      maintenance: number;
    };
  };
  generatedAt: string;
}

export default function SummaryPage() {
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReportData();
  }, []);

  async function loadReportData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/reports");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load report data");
      }

      setReportData(result.data);
    } catch (error) {
      console.error("Error loading report data:", error);
      setError(error instanceof Error ? error.message : "Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/management/portfolio">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portfolio
            </Button>
          </Link>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>Error loading summary data: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/management/portfolio">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Portfolio
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6 text-center text-[var(--secondary-text)]">
            <p>No summary data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, maintenance, inspections, compliance, approvals, payments, documents, activity, communications } = reportData;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Portfolio Summary</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Complete overview of your property management portfolio
          </p>
        </div>
        <Link href="/management/portfolio">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Portfolio
          </Button>
        </Link>
      </div>

      {/* Key Metrics - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Businesses</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {summary.totalBusinesses}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {summary.activeBusinesses} active
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-[var(--teal)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Properties</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {summary.totalProperties}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {summary.activeProperties} active
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Home className="h-6 w-6 text-[var(--teal)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Vendors</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {summary.totalVendors}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  service providers
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Truck className="h-6 w-6 text-[var(--teal)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Communications</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {communications?.sent || 0}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  messages sent
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-[var(--teal)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Moved up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--teal)]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New This Week */}
            <div className="p-4 bg-[var(--page-background)] rounded-lg">
              <h4 className="font-medium text-[var(--main-text)] mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--teal)]" />
                New This Week
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--secondary-text)]">Businesses</span>
                  <Badge variant="outline">+{activity.newThisWeek.businesses}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--secondary-text)]">Properties</span>
                  <Badge variant="outline">+{activity.newThisWeek.properties}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--secondary-text)]">Units</span>
                  <Badge variant="outline">+{activity.newThisWeek.units}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--secondary-text)]">Contacts</span>
                  <Badge variant="outline">+{activity.newThisWeek.contacts}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--secondary-text)]">Maintenance Requests</span>
                  <Badge variant="outline">+{activity.newThisWeek.maintenance}</Badge>
                </div>
              </div>
            </div>

            {/* New This Month */}
            <div className="p-4 bg-[var(--page-background)] rounded-lg">
              <h4 className="font-medium text-[var(--main-text)] mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[var(--teal)]" />
                New This Month
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--secondary-text)]">Businesses</span>
                  <Badge variant="outline">+{activity.newThisMonth.businesses}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--secondary-text)]">Properties</span>
                  <Badge variant="outline">+{activity.newThisMonth.properties}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--secondary-text)]">Units</span>
                  <Badge variant="outline">+{activity.newThisMonth.units}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--secondary-text)]">Contacts</span>
                  <Badge variant="outline">+{activity.newThisMonth.contacts}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--secondary-text)]">Maintenance Requests</span>
                  <Badge variant="outline">+{activity.newThisMonth.maintenance}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[var(--teal)]" />
              Maintenance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-[var(--page-background)] rounded-lg">
                <p className="text-2xl font-semibold text-[var(--main-text)]">{maintenance.total}</p>
                <p className="text-xs text-[var(--secondary-text)]">Total</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-semibold text-amber-700">{maintenance.open}</p>
                <p className="text-xs text-amber-600">Open</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-semibold text-green-700">{maintenance.completed}</p>
                <p className="text-xs text-green-600">Completed</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-[var(--secondary-text)]">Emergency Requests</span>
              <Badge className="bg-red-100 text-red-700">{maintenance.emergency}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--secondary-text)]">Total Cost</span>
              <span className="font-semibold">${maintenance.totalCost.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-[var(--teal)]" />
              Compliance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-[var(--page-background)] rounded-lg">
                <p className="text-xl font-semibold text-[var(--main-text)]">{compliance.total}</p>
                <p className="text-xs text-[var(--secondary-text)]">Total</p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-xl font-semibold text-amber-700">{compliance.open}</p>
                <p className="text-xs text-amber-600">Open</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <p className="text-xl font-semibold text-red-700">{compliance.critical}</p>
                <p className="text-xs text-red-600">Critical</p>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded-lg">
                <p className="text-xl font-semibold text-orange-700">{compliance.overdue}</p>
                <p className="text-xs text-orange-600">Overdue</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-[var(--secondary-text)]">Total Fines</span>
              <span className="font-semibold text-red-600">${compliance.totalFines.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Inspections Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[var(--teal)]" />
              Inspections Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-[var(--page-background)] rounded-lg">
                <p className="text-xl font-semibold text-[var(--main-text)]">{inspections.total}</p>
                <p className="text-xs text-[var(--secondary-text)]">Total</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-xl font-semibold text-blue-700">{inspections.scheduled}</p>
                <p className="text-xs text-blue-600">Scheduled</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-xl font-semibold text-green-700">{inspections.completed}</p>
                <p className="text-xs text-green-600">Completed</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <p className="text-xl font-semibold text-red-700">{inspections.overdue}</p>
                <p className="text-xs text-red-600">Overdue</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-[var(--secondary-text)]">Average Rating</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{inspections.averageRating.toFixed(1)}</span>
                <span className="text-yellow-500">★</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[var(--teal)]" />
              Payments Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-[var(--page-background)] rounded-lg">
                <p className="text-xl font-semibold text-[var(--main-text)]">{payments.total}</p>
                <p className="text-xs text-[var(--secondary-text)]">Total</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-xl font-semibold text-green-700">{payments.completed}</p>
                <p className="text-xs text-green-600">Completed</p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-xl font-semibold text-amber-700">{payments.pending}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <p className="text-xl font-semibold text-red-700">{payments.failed}</p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-[var(--secondary-text)]">Total Collected</span>
              <span className="font-semibold text-green-600">${payments.totalCollected.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--secondary-text)]">Pending Amount</span>
              <span className="font-semibold text-amber-600">${payments.pendingAmount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Documents Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--teal)]" />
              Documents Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-[var(--page-background)] rounded-lg">
                <p className="text-xl font-semibold text-[var(--main-text)]">{documents.total}</p>
                <p className="text-xs text-[var(--secondary-text)]">Total</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-xl font-semibold text-green-700">{documents.active}</p>
                <p className="text-xs text-green-600">Active</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <p className="text-xl font-semibold text-red-700">{documents.expired}</p>
                <p className="text-xs text-red-600">Expired</p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-xl font-semibold text-amber-700">{documents.expiringSoon}</p>
                <p className="text-xs text-amber-600">Expiring</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-[var(--secondary-text)]">Total Storage</span>
              <span className="font-semibold">{(documents.totalStorage / 1024 / 1024).toFixed(2)} MB</span>
            </div>
          </CardContent>
        </Card>

        {/* Approvals Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-[var(--teal)]" />
              Approvals Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-[var(--page-background)] rounded-lg">
                <p className="text-xl font-semibold text-[var(--main-text)]">{approvals.total}</p>
                <p className="text-xs text-[var(--secondary-text)]">Total</p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-xl font-semibold text-amber-700">{approvals.pending}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-xl font-semibold text-green-700">{approvals.approved}</p>
                <p className="text-xs text-green-600">Approved</p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <p className="text-xl font-semibold text-red-700">{approvals.rejected}</p>
                <p className="text-xs text-red-600">Rejected</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-[var(--secondary-text)]">Total Requested</span>
              <span className="font-semibold">${approvals.totalRequested.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--secondary-text)]">Total Approved</span>
              <span className="font-semibold text-green-600">${approvals.totalApproved.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-[var(--secondary-text)]">
        <p>Last updated: {new Date(reportData.generatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
