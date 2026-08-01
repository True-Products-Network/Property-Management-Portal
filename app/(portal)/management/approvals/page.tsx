"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckSquare,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Loader2,
  DollarSign,
} from "lucide-react";

interface Approval {
  id: string;
  approvalId: string;
  title: string;
  description?: string;
  approvalType?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  status: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  denialReason?: string;
  deniedBy?: string;
  deniedAt?: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/approvals");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load approvals");
      }

      setApprovals(result.data.data || []);
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
      (approval.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.approvalId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || approval.status === statusFilter;

    return matchesSearch && matchesStatus;
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

  const getApprovalTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      maintenance: "Maintenance",
      capital_improvement: "Capital Improvement",
      vendor_contract: "Vendor Contract",
      budget_item: "Budget Item",
      policy_change: "Policy Change",
      assessment: "Assessment",
      other: "Other",
    };
    return types[type || ""] || type || "-";
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Approvals</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage board approvals and decisions
          </p>
        </div>
        <Link href="/management/approvals/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <CheckSquare className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Requests</p>
                <p className="text-2xl font-semibold">{approvals.length}</p>
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
                  {approvals.filter((a) => a.status === "pending").length}
                </p>
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
                <p className="text-sm text-[var(--secondary-text)]">Approved</p>
                <p className="text-2xl font-semibold">
                  {approvals.filter((a) => a.status === "approved").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Rejected</p>
                <p className="text-2xl font-semibold">
                  {approvals.filter((a) => a.status === "rejected").length}
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
                placeholder="Search approvals..."
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Request
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Requested
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredApprovals.map((approval) => (
                  <tr
                    key={approval.id}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/management/approvals/${approval.id}`}
                        className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                      >
                        {approval.title}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {approval.approvalId}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {getApprovalTypeLabel(approval.approvalType)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-[var(--secondary-text)]" />
                        <span className="text-sm">
                          {formatCurrency(
                            approval.status === "approved"
                              ? approval.approvedAmount
                              : approval.requestedAmount
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(approval.status)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[var(--secondary-text)]">
                        {formatDate(approval.requestedAt)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/management/approvals/${approval.id}`}>
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
          {filteredApprovals.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              {searchQuery || statusFilter !== "all"
                ? "No approvals found matching your criteria."
                : "No approvals yet. Click 'New Request' to create one."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
