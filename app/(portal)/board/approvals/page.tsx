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
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Search,
  DollarSign,
  Wrench,
  FileText,
  User,
  AlertTriangle,
} from "lucide-react";

interface ApprovalRequest {
  id: string;
  requestNumber: string;
  type: string;
  title: string;
  description: string;
  requestedAmount?: number;
  status: string;
  priority: string;
  submittedBy: string;
  submittedDate: string;
  deadline?: string;
  daysRemaining?: number;
  recommendation?: string;
}

export default function BoardApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/board/approvals");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load approvals");
      }

      setApprovals(result.data || []);
    } catch (error) {
      console.error("Error loading approvals:", error);
      setError(error instanceof Error ? error.message : "Failed to load approvals");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredApprovals = approvals.filter((approval) => {
    const matchesSearch =
      approval.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.requestNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || approval.type === typeFilter;
    const matchesStatus = statusFilter === "all" || approval.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-700">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-4 w-4" />;
      case "vendor":
        return <User className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <CheckCircle2 className="h-4 w-4" />;
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
        <Button onClick={loadApprovals} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Approval Queue</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Review and approve requests requiring board decision
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
                placeholder="Search approvals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-10 px-3 border rounded-md"
              >
                <option value="all">All Types</option>
                <option value="maintenance">Maintenance</option>
                <option value="vendor">Vendor</option>
                <option value="document">Document</option>
                <option value="capital">Capital</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approvals List */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-text)]" />
              <p className="text-[var(--secondary-text)]">No approvals found</p>
            </CardContent>
          </Card>
        ) : (
          filteredApprovals.map((approval) => (
            <Link key={approval.id} href={`/board/approvals/${approval.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-[var(--teal)]/10 flex items-center justify-center">
                          {getTypeIcon(approval.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{approval.title}</p>
                            {getStatusBadge(approval.status)}
                          </div>
                          <p className="text-sm text-[var(--secondary-text)]">
                            {approval.requestNumber} • Submitted by {approval.submittedBy}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-[var(--secondary-text)] mt-2">
                        {approval.description}
                      </p>
                      {approval.recommendation && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <strong>Management Recommendation:</strong> {approval.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {approval.requestedAmount && (
                        <div className="flex items-center gap-1 text-lg font-semibold">
                          <DollarSign className="h-5 w-5" />
                          {approval.requestedAmount.toLocaleString()}
                        </div>
                      )}
                      {approval.daysRemaining !== undefined && approval.status === "pending" && (
                        <div
                          className={`flex items-center gap-1 text-sm ${
                            approval.daysRemaining < 3 ? "text-red-600" : "text-[var(--secondary-text)]"
                          }`}
                        >
                          <Clock className="h-4 w-4" />
                          {approval.daysRemaining} days remaining
                        </div>
                      )}
                      <Button variant="ghost" size="sm">
                        Review
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
