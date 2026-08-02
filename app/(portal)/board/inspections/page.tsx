"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  AlertCircle,
  ClipboardCheck,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Search,
  FileText,
  Building2,
} from "lucide-react";

interface Inspection {
  id: string;
  inspectionNumber: string;
  type: string;
  status: string;
  result?: string;
  scheduledDate?: string;
  completedDate?: string;
  propertyName: string;
  unitNumber?: string;
  inspectorName?: string;
  requiresAction: boolean;
  findings?: string;
}

export default function BoardInspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadInspections();
  }, []);

  async function loadInspections() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/board/inspections");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load inspections");
      }

      setInspections(result.data || []);
    } catch (error) {
      console.error("Error loading inspections:", error);
      setError(error instanceof Error ? error.message : "Failed to load inspections");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch =
      inspection.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.inspectionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inspection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-700">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getResultBadge = (result?: string) => {
    switch (result) {
      case "pass":
        return <Badge className="bg-green-100 text-green-700">Pass</Badge>;
      case "fail":
        return <Badge className="bg-red-100 text-red-700">Fail</Badge>;
      case "conditional":
        return <Badge className="bg-amber-100 text-amber-700">Conditional</Badge>;
      default:
        return null;
    }
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
        <Button onClick={loadInspections} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Inspections</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            View inspection schedules and reports
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
              <Input
                placeholder="Search inspections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 border rounded-md"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      <div className="space-y-4">
        {filteredInspections.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-text)]" />
              <p className="text-[var(--secondary-text)]">No inspections found</p>
            </CardContent>
          </Card>
        ) : (
          filteredInspections.map((inspection) => (
            <Link key={inspection.id} href={`/board/inspections/${inspection.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{inspection.type}</p>
                        {getStatusBadge(inspection.status)}
                        {inspection.result && getResultBadge(inspection.result)}
                        {inspection.requiresAction && (
                          <Badge className="bg-red-100 text-red-700">Action Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {inspection.inspectionNumber}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                        <span className="text-sm">{inspection.propertyName}</span>
                        {inspection.unitNumber && (
                          <span className="text-sm text-[var(--secondary-text)]">
                            Unit {inspection.unitNumber}
                          </span>
                        )}
                      </div>
                      {inspection.findings && (
                        <p className="text-sm text-[var(--secondary-text)] mt-2">
                          {inspection.findings}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {inspection.scheduledDate && (
                        <div className="flex items-center gap-1 text-sm text-[var(--secondary-text)]">
                          <Calendar className="h-4 w-4" />
                          {new Date(inspection.scheduledDate).toLocaleDateString()}
                        </div>
                      )}
                      {inspection.inspectorName && (
                        <p className="text-sm text-[var(--secondary-text)]">
                          Inspector: {inspection.inspectorName}
                        </p>
                      )}
                      <Button variant="ghost" size="sm">
                        View Report
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
