"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Loader2,
  AlertCircle,
  Search,
  ClipboardCheck,
  Calendar,
  ArrowRight,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
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
}

export default function OwnerInspectionsPage() {
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

      const response = await fetch("/api/owner/inspections");
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
      searchQuery === "" ||
      inspection.inspectionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.propertyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || inspection.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-teal-100 text-teal-700">In Progress</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getResultBadge = (result?: string) => {
    switch (result) {
      case "pass":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle2 className="h-3 w-3 mr-1" /> Pass</Badge>;
      case "conditional":
        return <Badge className="bg-amber-100 text-amber-700"><AlertTriangle className="h-3 w-3 mr-1" /> Conditional</Badge>;
      case "fail":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" /> Fail</Badge>;
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">My Inspections</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            View inspection schedules and results for your properties
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
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--secondary-text)]" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inspections List */}
      {filteredInspections.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-text)]" />
            <p className="text-[var(--secondary-text)] mb-2">No inspections found</p>
            <p className="text-sm text-[var(--secondary-text)]">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "You don't have any inspections scheduled at this time"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredInspections.map((inspection) => (
            <Card key={inspection.id} className={inspection.requiresAction ? "border-amber-300" : ""}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 bg-[var(--teal)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck className="h-5 w-5 text-[var(--teal)]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{inspection.type}</h3>
                          {getStatusBadge(inspection.status)}
                          {getResultBadge(inspection.result)}
                          {inspection.requiresAction && (
                            <Badge className="bg-amber-100 text-amber-700">Action Required</Badge>
                          )}
                        </div>
                        <p className="text-sm text-[var(--secondary-text)]">
                          {inspection.inspectionNumber}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-[var(--secondary-text)]">Property:</span>
                        <p className="font-medium">{inspection.propertyName}</p>
                        {inspection.unitNumber && (
                          <p className="text-[var(--secondary-text)]">Unit {inspection.unitNumber}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-[var(--secondary-text)]">
                          {inspection.status === "completed" ? "Completed:" : "Scheduled:"}
                        </span>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(
                            inspection.status === "completed"
                              ? inspection.completedDate || inspection.scheduledDate!
                              : inspection.scheduledDate!
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      {inspection.inspectorName && (
                        <div>
                          <span className="text-[var(--secondary-text)]">Inspector:</span>
                          <p className="font-medium">{inspection.inspectorName}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/owner/inspections/${inspection.id}`}>
                      <Button variant="outline" className="border-[var(--teal)] text-[var(--teal)]">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
