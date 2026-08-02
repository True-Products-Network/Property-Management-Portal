"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Users,
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface ApprovalDetail {
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
  managementNotes?: string;
  budgetImpact?: string;
  priorActions?: string[];
  attachments?: Attachment[];
  votes?: Vote[];
}

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

interface Vote {
  id: string;
  boardMember: string;
  decision: string;
  notes?: string;
  votedAt: string;
}

export default function BoardApprovalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [approval, setApproval] = useState<ApprovalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadApprovalDetail();
  }, [params.id]);

  async function loadApprovalDetail() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/board/approvals/${params.id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load approval");
      }

      setApproval(result.data);
    } catch (error) {
      console.error("Error loading approval:", error);
      setError(error instanceof Error ? error.message : "Failed to load approval");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitDecision() {
    if (!decision) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/board/approvals/${params.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to submit decision");
      }

      router.push("/board/approvals");
    } catch (error) {
      console.error("Error submitting decision:", error);
      alert(error instanceof Error ? error.message : "Failed to submit decision");
    } finally {
      setIsSubmitting(false);
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
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={loadApprovalDetail} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-[var(--secondary-text)]">Approval request not found</p>
        <Link href="/board/approvals">
          <Button variant="outline">Back to Approvals</Button>
        </Link>
      </div>
    );
  }

  const isPending = approval.status === "pending";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/board/approvals">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">{approval.title}</h1>
            <Badge
              className={
                approval.status === "approved"
                  ? "bg-green-100 text-green-700"
                  : approval.status === "rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }
            >
              {approval.status}
            </Badge>
          </div>
          <p className="text-[var(--secondary-text)]">
            {approval.requestNumber} • Submitted by {approval.submittedBy} on{" "}
            {new Date(approval.submittedDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{approval.description}</p>

              {approval.requestedAmount && (
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-[var(--teal)]" />
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Requested Amount</p>
                    <p className="text-xl font-semibold">
                      ${approval.requestedAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {approval.budgetImpact && (
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Budget Impact</p>
                  <p>{approval.budgetImpact}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Management Recommendation */}
          {approval.recommendation && (
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <FileText className="h-5 w-5" />
                  Management Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p>{approval.recommendation}</p>
                {approval.managementNotes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-[var(--secondary-text)]">Additional Notes</p>
                    <p className="mt-1">{approval.managementNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Prior Actions */}
          {approval.priorActions && approval.priorActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prior Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {approval.priorActions.map((action, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-sm flex-shrink-0">
                        {index + 1}
                      </span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Decision Form */}
          {isPending && (
            <Card>
              <CardHeader>
                <CardTitle>Your Decision</CardTitle>
                <CardDescription>Cast your vote on this request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: "approved", label: "Approve", icon: CheckCircle2, color: "green" },
                    { value: "approved_with_conditions", label: "Approve with Conditions", icon: CheckCircle2, color: "blue" },
                    { value: "rejected", label: "Reject", icon: XCircle, color: "red" },
                    { value: "more_info", label: "More Info Needed", icon: HelpCircle, color: "amber" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDecision(option.value)}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        decision === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <option.icon
                        className={`h-6 w-6 mx-auto mb-2 ${
                          decision === option.value ? `text-${option.color}-600` : "text-gray-400"
                        }`}
                      />
                      <p className="text-sm font-medium">{option.label}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any comments or conditions..."
                    className="mt-2"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={submitDecision}
                    disabled={!decision || isSubmitting}
                    className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Submit Decision
                  </Button>
                  <Link href="/board/approvals">
                    <Button variant="outline">Cancel</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {approval.daysRemaining !== undefined && isPending && (
                <div
                  className={`flex items-center gap-2 ${
                    approval.daysRemaining < 3 ? "text-red-600" : "text-[var(--secondary-text)]"
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span>{approval.daysRemaining} days remaining</span>
                </div>
              )}

              <div>
                <p className="text-sm text-[var(--secondary-text)]">Submitted By</p>
                <p className="font-medium">{approval.submittedBy}</p>
              </div>

              <div>
                <p className="text-sm text-[var(--secondary-text)]">Date Submitted</p>
                <p className="font-medium">
                  {new Date(approval.submittedDate).toLocaleDateString()}
                </p>
              </div>

              {approval.deadline && (
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Decision Deadline</p>
                  <p className="font-medium">{new Date(approval.deadline).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {approval.attachments && approval.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Attachments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {approval.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-[var(--secondary-text)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{attachment.name}</p>
                      <p className="text-xs text-[var(--secondary-text)]">{attachment.size}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Current Votes */}
          {approval.votes && approval.votes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Board Votes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {approval.votes.map((vote) => (
                  <div key={vote.id} className="flex items-center justify-between">
                    <span className="text-sm">{vote.boardMember}</span>
                    <Badge
                      className={
                        vote.decision === "approved"
                          ? "bg-green-100 text-green-700"
                          : vote.decision === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {vote.decision}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
