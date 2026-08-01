"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Edit,
  Loader2,
  User,
  Calendar,
  AlertCircle,
  Trash2,
} from "lucide-react";

interface Approval {
  id: string;
  approvalId: string;
  associationId: string;
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
  maintenanceRequestId?: string;
  vendorId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const approvalId = params.id as string;

  const [approval, setApproval] = useState<Approval | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadApproval();
  }, [approvalId]);

  async function loadApproval() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/approvals/${approvalId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load approval");
      }

      setApproval(result.data);
      if (result.data.approvedAmount) {
        setApprovedAmount(result.data.approvedAmount.toString());
      } else if (result.data.requestedAmount) {
        setApprovedAmount(result.data.requestedAmount.toString());
      }
    } catch (error) {
      console.error("Error loading approval:", error);
      setError(error instanceof Error ? error.message : "Failed to load approval");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove() {
    if (!approval) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/approvals/${approvalId}?action=approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedAmount: parseFloat(approvedAmount) || 0 }),
      });

      const result = await response.json();

      if (result.success) {
        setApproval(result.data);
        setShowApproveModal(false);
      } else {
        alert(result.error || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving:", error);
      alert("An error occurred while approving");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleReject() {
    if (!approval) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/approvals/${approvalId}?action=reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const result = await response.json();

      if (result.success) {
        setApproval(result.data);
        setShowRejectModal(false);
      } else {
        alert(result.error || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("An error occurred while rejecting");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!approval) return;
    if (!confirm("Are you sure you want to delete this approval request?")) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(`/api/approvals/${approvalId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        router.push("/management/approvals");
      } else {
        alert(result.error || "Failed to delete approval");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("An error occurred while deleting");
    } finally {
      setIsActionLoading(false);
    }
  }

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case "rejected":
        return <XCircle className="h-6 w-6 text-red-600" />;
      case "pending":
        return <Clock className="h-6 w-6 text-amber-600" />;
      default:
        return <CheckSquare className="h-6 w-6 text-[var(--teal)]" />;
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
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-500">{error || "Approval not found"}</p>
        <Link href="/management/approvals">
          <Button variant="outline">Back to Approvals</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
            <Link
              href="/management/approvals"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Approvals
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {getStatusIcon(approval.status)}
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {approval.title}
            </h1>
            {getStatusBadge(approval.status)}
          </div>
          <p className="text-[var(--secondary-text)]">{approval.approvalId}</p>
        </div>
        <div className="flex items-center gap-2">
          {approval.status === "pending" && (
            <>
              <Button
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => setShowApproveModal(true)}
                disabled={isActionLoading}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => setShowRejectModal(true)}
                disabled={isActionLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
          <Link href={`/management/approvals/${approvalId}/edit`}>
            <Button variant="outline" disabled={isActionLoading}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={isActionLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Amount Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Requested Amount</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(approval.requestedAmount)}
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
                <p className="text-sm text-[var(--secondary-text)]">Approved Amount</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(approval.approvedAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Requested On</p>
                <p className="text-lg font-semibold">{formatDate(approval.requestedAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Approval Type</p>
                <p className="font-medium">{getApprovalTypeLabel(approval.approvalType)}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Status</p>
                <p className="font-medium">{approval.status}</p>
              </div>
            </div>
            {approval.description && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Description</p>
                <p className="font-medium">{approval.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Requested */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Requested</p>
                  <p className="text-sm text-[var(--secondary-text)]">
                    By {approval.requestedBy} on {formatDate(approval.requestedAt)}
                  </p>
                </div>
              </div>

              {/* Approved */}
              {approval.status === "approved" && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Approved</p>
                    <p className="text-sm text-[var(--secondary-text)]">
                      By {approval.approvedBy} on {formatDate(approval.approvedAt)}
                    </p>
                    {approval.approvedAmount && (
                      <p className="text-sm text-green-600">
                        Approved amount: {formatCurrency(approval.approvedAmount)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Rejected */}
              {approval.status === "rejected" && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Rejected</p>
                    <p className="text-sm text-[var(--secondary-text)]">
                      By {approval.deniedBy} on {formatDate(approval.deniedAt)}
                    </p>
                    {approval.denialReason && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        {approval.denialReason}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pending */}
              {approval.status === "pending" && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Awaiting Decision</p>
                    <p className="text-sm text-[var(--secondary-text)]">
                      This request is pending board approval
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Related Records */}
      {(approval.maintenanceRequestId || approval.vendorId) && (
        <Card>
          <CardHeader>
            <CardTitle>Related Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {approval.maintenanceRequestId && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--secondary-text)]">Maintenance Request:</span>
                  <Link
                    href={`/management/maintenance/${approval.maintenanceRequestId}`}
                    className="text-[var(--teal)] hover:underline text-sm"
                  >
                    View Request
                  </Link>
                </div>
              )}
              {approval.vendorId && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--secondary-text)]">Vendor:</span>
                  <Link
                    href={`/management/vendors/${approval.vendorId}`}
                    className="text-[var(--teal)] hover:underline text-sm"
                  >
                    View Vendor
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Approve Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Approved Amount
                </label>
                <input
                  type="number"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  className="input w-full"
                  placeholder="Enter approved amount"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowApproveModal(false)}
                  disabled={isActionLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Reject Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Reason for Rejection
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input w-full"
                  placeholder="Enter reason for rejection"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                  disabled={isActionLoading}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleReject}
                  disabled={isActionLoading || !rejectionReason.trim()}
                >
                  {isActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
