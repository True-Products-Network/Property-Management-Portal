"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Save,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { EntitlementError } from "@/components/entitlements/EntitlementError";

interface Association {
  id: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
  associationId: string;
}

interface ReportFilters {
  associationId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
}

interface GeneratedReport {
  id: string;
  reportType: string;
  reportName: string;
  filters: ReportFilters;
  generatedAt: string;
  fileName: string;
  fileSize: number;
  documentId?: string;
}

const reportTypes = [
  { id: "summary", name: "Executive Summary", description: "Overview of all key metrics across associations", icon: BarChart3, category: "general" },
  { id: "financial", name: "Financial Report", description: "Payments, costs, and budget analysis", icon: DollarSign, category: "financial" },
  { id: "maintenance", name: "Maintenance Report", description: "Work orders and vendor activity", icon: Wrench, category: "operations" },
  { id: "occupancy", name: "Occupancy Report", description: "Unit status and property utilization", icon: Home, category: "operations" },
  { id: "compliance", name: "Compliance Report", description: "Matters and deadlines", icon: Scale, category: "operations" },
  { id: "activity", name: "Activity Report", description: "Recent changes and new records", icon: TrendingUp, category: "general" },
];

export default function ReportsPage() {
  const router = useRouter();
  const [associations, setAssociations] = useState<Association[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [filters, setFilters] = useState<ReportFilters>({
    associationId: "",
    propertyId: "",
    startDate: "",
    endDate: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [entitlementError, setEntitlementError] = useState<{feature: string; error: string; code?: string; action?: string} | null>(null);

  useEffect(() => {
    loadAssociations();
    loadGeneratedReports();
  }, []);

  useEffect(() => {
    if (filters.associationId) {
      loadProperties(filters.associationId);
    } else {
      setFilteredProperties([]);
      setFilters(prev => ({ ...prev, propertyId: "" }));
    }
  }, [filters.associationId]);

  async function loadAssociations() {
    try {
      const response = await fetch("/api/associations");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAssociations(result.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading associations:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProperties(associationId: string) {
    try {
      const response = await fetch(`/api/properties?associationId=${associationId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setProperties(result.data.data || []);
          setFilteredProperties(result.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  async function loadGeneratedReports() {
    try {
      // Load reports that were saved as documents
      const response = await fetch("/api/documents?documentType=inspection_report");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data?.data) {
          const reports: GeneratedReport[] = result.data.data
            .filter((doc: { title?: string }) => doc.title?.startsWith("Report:"))
            .map((doc: { 
              id: string; 
              title: string; 
              createdAt: string; 
              fileSize?: number;
              associationId?: string;
              propertyId?: string;
            }) => ({
              id: doc.id,
              reportType: "generated",
              reportName: doc.title.replace("Report: ", ""),
              filters: {
                associationId: doc.associationId || "",
                propertyId: doc.propertyId || "",
                startDate: "",
                endDate: "",
              },
              generatedAt: doc.createdAt,
              fileName: doc.title,
              fileSize: doc.fileSize || 0,
              documentId: doc.id,
            }));
          setGeneratedReports(reports);
        }
      }
    } catch (error) {
      console.error("Error loading generated reports:", error);
    }
  }

  async function generateReport(reportType: string) {
    setIsGenerating(true);
    const reportConfig = reportTypes.find(r => r.id === reportType);
    
    try {
      // Fetch report data with filters
      const params = new URLSearchParams();
      if (filters.associationId) params.append("associationId", filters.associationId);
      if (filters.propertyId) params.append("propertyId", filters.propertyId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      
      const response = await fetch(`/api/reports?${params}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to generate report");
      }

      // Generate CSV content based on report type
      const csvContent = generateCSVContent(reportType, result.data);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const fileName = `${reportType}-report-${new Date().toISOString().split("T")[0]}.csv`;
      
      // Create file for upload
      const file = new File([blob], fileName, { type: "text/csv" });
      
      // Upload to storage and create document record
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", `Report: ${reportConfig?.name}`);
      formData.append("documentType", "inspection_report");
      formData.append("category", "report");
      if (filters.associationId) formData.append("associationId", filters.associationId);
      if (filters.propertyId) formData.append("propertyId", filters.propertyId);

      // For now, we'll save the CSV content directly since we don't have file storage set up
      // In production, you'd upload to S3/Supabase Storage first
      const documentResponse = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Report: ${reportConfig?.name}`,
          fileName: fileName,
          filePath: `reports/${fileName}`, // Placeholder path
          fileSize: blob.size,
          contentType: "text/csv",
          documentType: "inspection_report",
          category: "report",
          associationId: filters.associationId || undefined,
          propertyId: filters.propertyId || undefined,
        }),
      });

      if (documentResponse.ok) {
        const docResult = await documentResponse.json();
        
        // Also download the file locally
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        // Refresh the generated reports list
        await loadGeneratedReports();
        
        alert(`Report "${reportConfig?.name}" generated and saved to Documents!`);
      } else if (documentResponse.status === 403) {
        const errorData = await documentResponse.json();
        setEntitlementError({
          feature: errorData.feature || "documents",
          error: errorData.error || "Feature not enabled",
          code: errorData.code,
          action: errorData.action
        });
      } else {
        throw new Error("Failed to save report document");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert(error instanceof Error ? error.message : "Failed to generate report");
    } finally {
      setIsGenerating(false);
    }
  }

  function generateCSVContent(reportType: string, data: any): string {
    const timestamp = new Date().toLocaleString();
    let rows: string[][] = [];
    
    // Header
    rows.push(["Report Type", reportTypes.find(r => r.id === reportType)?.name || reportType]);
    rows.push(["Generated At", timestamp]);
    if (filters.associationId) {
      const assoc = associations.find(a => a.id === filters.associationId);
      rows.push(["Association", assoc?.name || filters.associationId]);
    }
    if (filters.propertyId) {
      const prop = properties.find(p => p.id === filters.propertyId);
      rows.push(["Property", prop?.name || filters.propertyId]);
    }
    if (filters.startDate) rows.push(["Start Date", filters.startDate]);
    if (filters.endDate) rows.push(["End Date", filters.endDate]);
    rows.push(["", ""]);
    
    switch (reportType) {
      case "summary":
        rows.push(["EXECUTIVE SUMMARY"]);
        rows.push(["", ""]);
        rows.push(["Metric", "Value"]);
        rows.push(["Total Associations", data.summary?.totalAssociations || 0]);
        rows.push(["Total Properties", data.summary?.totalProperties || 0]);
        rows.push(["Total Units", data.summary?.totalUnits || 0]);
        rows.push(["Total Contacts", data.summary?.totalContacts || 0]);
        rows.push(["Active Associations", data.summary?.activeAssociations || 0]);
        rows.push(["Active Properties", data.summary?.activeProperties || 0]);
        rows.push(["Occupied Units", data.summary?.occupiedUnits || 0]);
        rows.push(["Vacant Units", data.summary?.vacantUnits || 0]);
        rows.push(["", ""]);
        rows.push(["Maintenance Overview"]);
        rows.push(["Open Requests", data.maintenance?.open || 0]);
        rows.push(["Completed Requests", data.maintenance?.completed || 0]);
        rows.push(["Emergency Requests", data.maintenance?.emergency || 0]);
        rows.push(["", ""]);
        rows.push(["Financial Overview"]);
        rows.push(["Total Collected", `$${(data.payments?.totalCollected || 0).toFixed(2)}`]);
        rows.push(["Pending Amount", `$${(data.payments?.pendingAmount || 0).toFixed(2)}`]);
        break;
        
      case "financial":
        rows.push(["FINANCIAL REPORT"]);
        rows.push(["", ""]);
        rows.push(["Category", "Value"]);
        rows.push(["Total Payments", data.payments?.total || 0]);
        rows.push(["Completed Payments", data.payments?.completed || 0]);
        rows.push(["Pending Payments", data.payments?.pending || 0]);
        rows.push(["Failed Payments", data.payments?.failed || 0]);
        rows.push(["Total Collected", `$${(data.payments?.totalCollected || 0).toFixed(2)}`]);
        rows.push(["Pending Amount", `$${(data.payments?.pendingAmount || 0).toFixed(2)}`]);
        rows.push(["", ""]);
        rows.push(["Maintenance Costs"]);
        rows.push(["Total Maintenance Cost", `$${(data.maintenance?.totalCost || 0).toFixed(2)}`]);
        rows.push(["", ""]);
        rows.push(["Compliance Fines"]);
        rows.push(["Total Fines", `$${(data.compliance?.totalFines || 0).toFixed(2)}`]);
        break;
        
      case "maintenance":
        rows.push(["MAINTENANCE REPORT"]);
        rows.push(["", ""]);
        rows.push(["Metric", "Value"]);
        rows.push(["Total Requests", data.maintenance?.total || 0]);
        rows.push(["Open Requests", data.maintenance?.open || 0]);
        rows.push(["Completed Requests", data.maintenance?.completed || 0]);
        rows.push(["Emergency Requests", data.maintenance?.emergency || 0]);
        rows.push(["Total Cost", `$${(data.maintenance?.totalCost || 0).toFixed(2)}`]);
        rows.push(["", ""]);
        rows.push(["By Category"]);
        if (data.maintenance?.byCategory) {
          Object.entries(data.maintenance.byCategory).forEach(([category, count]) => {
            rows.push([category, String(count)]);
          });
        }
        break;
        
      case "occupancy":
        rows.push(["OCCUPANCY REPORT"]);
        rows.push(["", ""]);
        rows.push(["Metric", "Value"]);
        rows.push(["Total Units", data.summary?.totalUnits || 0]);
        rows.push(["Occupied Units", data.summary?.occupiedUnits || 0]);
        rows.push(["Vacant Units", data.summary?.vacantUnits || 0]);
        rows.push(["Occupancy Rate", data.summary?.totalUnits ? 
          `${((data.summary.occupiedUnits / data.summary.totalUnits) * 100).toFixed(1)}%` : "0%"]);
        rows.push(["", ""]);
        rows.push(["Property Overview"]);
        rows.push(["Total Properties", data.summary?.totalProperties || 0]);
        rows.push(["Active Properties", data.summary?.activeProperties || 0]);
        break;
        
      case "compliance":
        rows.push(["COMPLIANCE REPORT"]);
        rows.push(["", ""]);
        rows.push(["Metric", "Value"]);
        rows.push(["Total Matters", data.compliance?.total || 0]);
        rows.push(["Open Matters", data.compliance?.open || 0]);
        rows.push(["Critical Matters", data.compliance?.critical || 0]);
        rows.push(["Overdue Matters", data.compliance?.overdue || 0]);
        rows.push(["Total Fines", `$${(data.compliance?.totalFines || 0).toFixed(2)}`]);
        break;
        
      case "activity":
        rows.push(["ACTIVITY REPORT"]);
        rows.push(["", ""]);
        rows.push(["New This Week"]);
        rows.push(["Associations", data.activity?.newThisWeek?.associations || 0]);
        rows.push(["Properties", data.activity?.newThisWeek?.properties || 0]);
        rows.push(["Units", data.activity?.newThisWeek?.units || 0]);
        rows.push(["Contacts", data.activity?.newThisWeek?.contacts || 0]);
        rows.push(["Maintenance Requests", data.activity?.newThisWeek?.maintenance || 0]);
        rows.push(["", ""]);
        rows.push(["New This Month"]);
        rows.push(["Associations", data.activity?.newThisMonth?.associations || 0]);
        rows.push(["Properties", data.activity?.newThisMonth?.properties || 0]);
        rows.push(["Units", data.activity?.newThisMonth?.units || 0]);
        rows.push(["Contacts", data.activity?.newThisMonth?.contacts || 0]);
        rows.push(["Maintenance Requests", data.activity?.newThisMonth?.maintenance || 0]);
        break;
        
      default:
        rows.push(["Report data not available for this type"]);
    }
    
    return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  }

  function viewDocument(documentId: string) {
    router.push(`/management/documents/${documentId}`);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Reports</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Generate and download reports for your properties
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div 
          className="cursor-pointer" 
          onClick={() => setShowFilters(!showFilters)}
        >
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[var(--teal)]" />
                Report Filters
              </span>
              {showFilters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </CardTitle>
          </CardHeader>
        </div>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Association</label>
                <select
                  value={filters.associationId}
                  onChange={(e) => setFilters(prev => ({ ...prev, associationId: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">All Associations</option>
                  {associations.map((assoc) => (
                    <option key={assoc.id} value={assoc.id}>
                      {assoc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Property</label>
                <select
                  value={filters.propertyId}
                  onChange={(e) => setFilters(prev => ({ ...prev, propertyId: e.target.value }))}
                  className="input w-full"
                  disabled={!filters.associationId}
                >
                  <option value="">All Properties</option>
                  {filteredProperties.map((prop) => (
                    <option key={prop.id} value={prop.id}>
                      {prop.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Entitlement Error */}
      {entitlementError && (
        <EntitlementError
          feature={entitlementError.feature}
          error={entitlementError.error}
          code={entitlementError.code}
          action={entitlementError.action}
        />
      )}

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-[var(--teal)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--main-text)]">{report.name}</h3>
                    <p className="text-sm text-[var(--secondary-text)] mt-1">
                      {report.description}
                    </p>
                    <Button
                      onClick={() => generateReport(report.id)}
                      disabled={isGenerating}
                      className="mt-4 w-full bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                      size="sm"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Generate & Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Generated Reports */}
      {generatedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5 text-[var(--teal)]" />
              Recently Generated Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {generatedReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-[var(--page-background)] rounded-lg hover:bg-[var(--border-color)] cursor-pointer transition-colors"
                  onClick={() => report.documentId && viewDocument(report.documentId)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-[var(--teal)]" />
                    <div>
                      <p className="font-medium text-[var(--main-text)]">{report.reportName}</p>
                      <p className="text-xs text-[var(--secondary-text)]">
                        Generated {new Date(report.generatedAt).toLocaleDateString()}
                        {report.fileSize > 0 && ` • ${(report.fileSize / 1024).toFixed(1)} KB`}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
