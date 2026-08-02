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
  FileWarning,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Search,
  Clock,
  Gavel,
} from "lucide-react";

interface ComplianceMatter {
  id: string;
  matterNumber: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  dateIdentified: string;
  dueDate?: string;
  hearingDate?: string;
  fineAmount?: number;
  propertyName: string;
  unitNumber?: string;
  requiresBoardAction: boolean;
}

export default function BoardCompliancePage() {
  const [matters, setMatters] = useState<ComplianceMatter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadComplianceMatters();
  }, []);

  async function loadComplianceMatters() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/board/compliance");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load compliance matters");
      }

      setMatters(result.data || []);
    } catch (error) {
      console.error("Error loading compliance:", error);
      setError(error instanceof Error ? error.message : "Failed to load compliance matters");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredMatters = matters.filter((matter) => {
    const matchesSearch =
      matter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      matter.matterNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || matter.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-red-100 text-red-700">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-700">In Progress</Badge>;
      case "hearing_scheduled":
        return <Badge className="bg-purple-100 text-purple-700">Hearing Scheduled</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-700">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-red-100 text-red-700">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-700">Low</Badge>;
      default:
        return <Badge>{priority}</Badge>;
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
        <Button onClick={loadComplianceMatters} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Compliance Matters</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Track violations, hearings, and corrective actions
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
                placeholder="Search compliance matters..."
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
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="hearing_scheduled">Hearing Scheduled</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Matters List */}
      <div className="space-y-4">
        {filteredMatters.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileWarning className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-text)]" />
              <p className="text-[var(--secondary-text)]">No compliance matters found</p>
            </CardContent>
          </Card>
        ) : (
          filteredMatters.map((matter) => (
            <Link key={matter.id} href={`/board/compliance/${matter.id}`}>
              <Card
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  matter.requiresBoardAction ? "border-red-300" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{matter.title}</p>
                        {getStatusBadge(matter.status)}
                        {getPriorityBadge(matter.priority)}
                        {matter.requiresBoardAction && (
                          <Badge className="bg-red-100 text-red-700">Board Action Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {matter.matterNumber} • {matter.category}
                      </p>
                      <p className="text-sm text-[var(--secondary-text)] mt-2">
                        {matter.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[var(--secondary-text)]">
                        <span>{matter.propertyName}</span>
                        {matter.unitNumber && <span>Unit {matter.unitNumber}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {matter.fineAmount && (
                        <div className="text-lg font-semibold text-red-600">
                          Fine: ${matter.fineAmount.toLocaleString()}
                        </div>
                      )}
                      {matter.dueDate && (
                        <div className="flex items-center gap-1 text-sm text-[var(--secondary-text)]">
                          <Clock className="h-4 w-4" />
                          Due: {new Date(matter.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      {matter.hearingDate && (
                        <div className="flex items-center gap-1 text-sm text-purple-600">
                          <Gavel className="h-4 w-4" />
                          Hearing: {new Date(matter.hearingDate).toLocaleDateString()}
                        </div>
                      )}
                      <Button variant="ghost" size="sm">
                        View Details
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
