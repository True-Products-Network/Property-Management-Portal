"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  DollarSign,
  Users,
  Building2,
  Home,
  Wrench,
  CheckSquare,
  Scale,
  AlertCircle,
  Loader2,
  Calendar,
  Clock,
} from "lucide-react";

interface ReportData {
  summary: {
    totalAssociations: number;
    totalProperties: number;
    totalUnits: number;
    totalContacts: number;
    totalVendors: number;
    activeAssociations: number;
    activeProperties: number;
    occupiedUnits: number;
    vacantUnits: number;
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
      associations: number;
      properties: number;
      units: number;
      contacts: number;
      maintenance: number;
    };
    newThisMonth: {
      associations: number;
      properties: number;
      units: number;
      contacts: number;
      maintenance: number;
    };
  };
  generatedAt: string;
}

const reportTypes = [
  { id: "summary", name: "Executive Summary", description: "Overview of all key metrics", icon: BarChart3 },
  { id: "financial", name: "Financial Report", description: "Payments, costs, and budget analysis", icon: DollarSign },
  { id: "maintenance", name: "Maintenance Report", description: "Work orders and vendor activity", icon: Wrench },
  { id: "occupancy", name: "Occupancy Report", description: "Unit status and property utilization", icon: Home },
  { id: "compliance", name: "Compliance Report", description: "Matters and deadlines", icon: Scale },
  { id: "activity", name: "Activity Report", description: "Recent changes and new records", icon: TrendingUp },
];

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

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

  function generateReport(reportType: string) {
    setIsGenerating(true);
    setSelectedReport(reportType);

    // Simulate report generation delay
    setTimeout(() => {
      setIsGenerating(false);
      // In a real implementation, this would generate and download a PDF/CSV
      alert(`Report "${reportTypes.find(r => r.id === reportType)?.name}" generated! Download would start here.`);
    }, 1500);
  }

  function downloadReport() {
    if (!reportData) return;

    // Create CSV content
    const csvContent = [
      ["Metric", "Value"],
      ["Total Associations", reportData.summary.totalAssociations],
      ["Total Properties", reportData.summary.totalProperties],
      ["Total Units", reportData.summary.totalUnits],
      ["Total Contacts", reportData.summary.totalContacts],
      ["Total Vendors", reportData.summary.totalVendors],
      ["Active Associations", reportData.summary.activeAssociations],
      ["Active Properties", reportData.summary.activeProperties],
      ["Occupied Units", reportData.summary.occupiedUnits],
      ["Vacant Units", reportData.summary.vacantUnits],
      ["", ""],
      ["Maintenance", ""],
      ["Total Requests", reportData.maintenance.total],
      ["Open Requests", reportData.maintenance.open],
      ["Completed Requests", reportData.maintenance.completed],
      ["Emergency Requests", reportData.maintenance.emergency],
      ["Total Cost", `$${reportData.maintenance.totalCost.toFixed(2)}`],
      ["", ""],
      ["Compliance", ""],
      ["Total Matters", reportData.compliance.total],
      ["Open Matters", reportData.compliance.open],
      ["Critical Matters", reportData.compliance.critical],
      ["Total Fines", `$${reportData.compliance.totalFines.toFixed(2)}`],
      ["", ""],
      ["Payments", ""],
      ["Total Payments", reportData.payments.total],
      ["Completed Payments", reportData.payments.completed],
      ["Total Collected", `$${reportData.payments.totalCollected.toFixed(2)}`],
      ["Pending Amount", `$${reportData.payments.pendingAmount.toFixed(2)}`],
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={loadReportData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">No report data available</p>
        <Button onClick={loadReportData} variant="outline" className="mt-4">
          Load Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Reports</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Generate and download reports from real data
          </p>
        </div>
        <Button
          className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
          onClick={downloadReport}
        >
          <Download className="h-4 w-4 mr-2" />
          Download CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Associations</p>
                <p className="text-2xl font-semibold">{reportData.summary.totalAssociations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Properties</p>
                <p className="text-2xl font-semibold">{reportData.summary.totalProperties}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Contacts</p>
                <p className="text-2xl font-semibold">{reportData.summary.totalContacts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Maintenance</p>
                <p className="text-2xl font-semibold">{reportData.maintenance.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Types */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              const isSelected = selectedReport === report.id;
              return (
                <div
                  key={report.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "border-[var(--teal)] bg-teal-50"
                      : "border-[var(--border-color)] hover:border-[var(--teal)] hover:bg-[var(--page-background)]"
                  }`}
                  onClick={() => generateReport(report.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{report.name}</h3>
                      <p className="text-sm text-[var(--secondary-text)]">{report.description}</p>
                    </div>
                    {isGenerating && isSelected && (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--teal)]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[var(--teal)]" />
              Maintenance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm text-[var(--secondary-text)]">Total Requests</p>
                <p className="text-2xl font-semibold">{reportData.maintenance.total}</p>
              </div>
              <div className="p-3 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm text-[var(--secondary-text)]">Open</p>
                <p className="text-2xl font-semibold">{reportData.maintenance.open}</p>
              </div>
              <div className="p-3 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm text-[var(--secondary-text)]">Completed</p>
                <p className="text-2xl font-semibold">{reportData.maintenance.completed}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">Emergency</p>
                <p className="text-2xl font-semibold text-red-600">{reportData.maintenance.emergency}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--border-color)]">
              <p className="text-sm text-[var(--secondary-text)]">Total Cost</p>
              <p className="text-2xl font-semibold">
                ${reportData.maintenance.totalCost.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-[var(--teal)]" />
              Compliance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm text-[var(--secondary-text)]">Total Matters</p>
                <p className="text-2xl font-semibold">{reportData.compliance.total}</p>
              </div>
              <div className="p-3 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm text-[var(--secondary-text)]">Open</p>
                <p className="text-2xl font-semibold">{reportData.compliance.open}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">Critical</p>
                <p className="text-2xl font-semibold text-red-600">{reportData.compliance.critical}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-600">Overdue</p>
                <p className="text-2xl font-semibold text-amber-600">{reportData.compliance.overdue}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--border-color)]">
              <p className="text-sm text-[var(--secondary-text)]">Total Fines</p>
              <p className="text-2xl font-semibold">
                ${reportData.compliance.totalFines.toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payments Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[var(--teal)]" />
              Payments Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm text-[var(--secondary-text)]">Total Payments</p>
                <p className="text-2xl font-semibold">{reportData.payments.total}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Completed</p>
                <p className="text-2xl font-semibold text-green-600">{reportData.payments.completed}</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-600">Pending</p>
                <p className="text-2xl font-semibold text-amber-600">{reportData.payments.pending}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">Failed</p>
                <p className="text-2xl font-semibold text-red-600">{reportData.payments.failed}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--border-color)] space-y-2">
              <div className="flex justify-between">
                <p className="text-sm text-[var(--secondary-text)]">Total Collected</p>
                <p className="font-semibold">${reportData.payments.totalCollected.toFixed(2)}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-[var(--secondary-text)]">Pending Amount</p>
                <p className="font-semibold text-amber-600">${reportData.payments.pendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--teal)]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                New This Week
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-[var(--page-background)] rounded text-center">
                  <p className="text-lg font-semibold">{reportData.activity.newThisWeek.properties}</p>
                  <p className="text-xs text-[var(--secondary-text)]">Properties</p>
                </div>
                <div className="p-2 bg-[var(--page-background)] rounded text-center">
                  <p className="text-lg font-semibold">{reportData.activity.newThisWeek.contacts}</p>
                  <p className="text-xs text-[var(--secondary-text)]">Contacts</p>
                </div>
                <div className="p-2 bg-[var(--page-background)] rounded text-center">
                  <p className="text-lg font-semibold">{reportData.activity.newThisWeek.maintenance}</p>
                  <p className="text-xs text-[var(--secondary-text)]">Maintenance</p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--border-color)]">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                New This Month
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 bg-[var(--page-background)] rounded text-center">
                  <p className="text-lg font-semibold">{reportData.activity.newThisMonth.properties}</p>
                  <p className="text-xs text-[var(--secondary-text)]">Properties</p>
                </div>
                <div className="p-2 bg-[var(--page-background)] rounded text-center">
                  <p className="text-lg font-semibold">{reportData.activity.newThisMonth.contacts}</p>
                  <p className="text-xs text-[var(--secondary-text)]">Contacts</p>
                </div>
                <div className="p-2 bg-[var(--page-background)] rounded text-center">
                  <p className="text-lg font-semibold">{reportData.activity.newThisMonth.maintenance}</p>
                  <p className="text-xs text-[var(--secondary-text)]">Maintenance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents & Inspections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--teal)]" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm text-[var(--secondary-text)]">Total Documents</p>
                <p className="text-2xl font-semibold">{reportData.documents.total}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Active</p>
                <p className="text-2xl font-semibold text-green-600">{reportData.documents.active}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--border-color)] space-y-2">
              <div className="flex justify-between">
                <p className="text-sm text-[var(--secondary-text)]">Expired</p>
                <p className="font-semibold text-red-600">{reportData.documents.expired}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-[var(--secondary-text)]">Expiring Soon</p>
                <p className="font-semibold text-amber-600">{reportData.documents.expiringSoon}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-[var(--secondary-text)]">Total Storage</p>
                <p className="font-semibold">{formatFileSize(reportData.documents.totalStorage)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-[var(--teal)]" />
              Inspections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm text-[var(--secondary-text)]">Total Inspections</p>
                <p className="text-2xl font-semibold">{reportData.inspections.total}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Scheduled</p>
                <p className="text-2xl font-semibold text-blue-600">{reportData.inspections.scheduled}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Completed</p>
                <p className="text-2xl font-semibold text-green-600">{reportData.inspections.completed}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">Overdue</p>
                <p className="text-2xl font-semibold text-red-600">{reportData.inspections.overdue}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-[var(--border-color)]">
              <div className="flex justify-between">
                <p className="text-sm text-[var(--secondary-text)]">Average Rating</p>
                <p className="font-semibold">
                  {reportData.inspections.averageRating > 0
                    ? reportData.inspections.averageRating.toFixed(1) + "/5"
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Generated Info */}
      <div className="text-center text-sm text-[var(--secondary-text)]">
        <p>Report generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
