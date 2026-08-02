"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  FileWarning,
  Calendar,
  Clock,
  Building2,
  Home,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  MessageSquare,
  Gavel,
  Send,
} from "lucide-react";

interface Notice {
  id: string;
  matterNumber: string;
  title: string;
  type: string;
  status: string;
  date: string;
  responseDeadline?: string;
  propertyName: string;
  unitNumber?: string;
  ruleReference?: string;
  factualDescription: string;
  evidence?: string;
  requiredAction?: string;
  isOverdue: boolean;
  hearingDate?: string;
  hearingLocation?: string;
  correctiveAction?: string;
  resolution?: string;
}

interface Document {
  id: string;
  title: string;
  documentType: string;
  uploadedAt: string;
}

export default function OwnerNoticeDetailPage() {
  const params = useParams();
  const noticeId = params.id as string;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingHearing, setIsRequestingHearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    loadNoticeData();
  }, [noticeId]);

  async function loadNoticeData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/owner/notices/${noticeId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load notice");
      }

      setNotice(result.data.notice);
      setDocuments(result.data.documents || []);
    } catch (error) {
      console.error("Error loading notice:", error);
      setError(error instanceof Error ? error.message : "Failed to load notice");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitResponse() {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/owner/notices/${noticeId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseText }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to submit response");
      }

      setResponseText("");
      loadNoticeData();
    } catch (error) {
      console.error("Error submitting response:", error);
      setError(error instanceof Error ? error.message : "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRequestHearing() {
    try {
      setIsRequestingHearing(true);
      setError(null);

      const response = await fetch(`/api/owner/notices/${noticeId}/hearing`, {
        method: "POST",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to request hearing");
      }

      loadNoticeData();
    } catch (error) {
      console.error("Error requesting hearing:", error);
      setError(error instanceof Error ? error.message : "Failed to request hearing");
    } finally {
      setIsRequestingHearing(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "notice_sent":
        return <Badge className="bg-amber-100 text-amber-700">Notice Sent</Badge>;
      case "response_received":
        return <Badge className="bg-blue-100 text-blue-700">Response Received</Badge>;
      case "hearing_scheduled":
        return <Badge className="bg-purple-100 text-purple-700">Hearing Scheduled</Badge>;
      case "corrective_action":
        return <Badge className="bg-orange-100 text-orange-700">Corrective Action</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-700">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error && !notice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Link href="/owner/notices">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notices
          </Button>
        </Link>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-[var(--secondary-text)]">Notice not found</p>
        <Link href="/owner/notices">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notices
          </Button>
        </Link>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(notice.responseDeadline);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/owner/notices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">{notice.title}</h1>
            {getStatusBadge(notice.status)}
            {notice.isOverdue && (
              <Badge className="bg-red-100 text-red-700">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Overdue
              </Badge>
            )}
          </div>
          <p className="text-[var(--secondary-text)]">{notice.matterNumber}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Deadline Alert */}
      {notice.responseDeadline && notice.status === "notice_sent" && (
        <Card className={notice.isOverdue ? "border-red-300" : daysRemaining && daysRemaining <= 7 ? "border-amber-300" : "border-blue-200"}>
          <CardContent className={`p-4 ${notice.isOverdue ? 'bg-red-50' : daysRemaining && daysRemaining <= 7 ? 'bg-amber-50' : 'bg-blue-50'}`}>
            <div className="flex items-center gap-3">
              {notice.isOverdue ? (
                <XCircle className="h-6 w-6 text-red-600" />
              ) : daysRemaining && daysRemaining <= 7 ? (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              ) : (
                <Clock className="h-6 w-6 text-blue-600" />
              )}
              <div>
                <p className={`font-medium ${notice.isOverdue ? 'text-red-900' : daysRemaining && daysRemaining <= 7 ? 'text-amber-900' : 'text-blue-900'}`}>
                  Response Deadline: {new Date(notice.responseDeadline).toLocaleDateString()}
                </p>
                <p className={`text-sm ${notice.isOverdue ? 'text-red-700' : daysRemaining && daysRemaining <= 7 ? 'text-amber-700' : 'text-blue-700'}`}>
                  {daysRemaining !== null && (
                    daysRemaining > 0 
                      ? `${daysRemaining} days remaining to respond` 
                      : `${Math.abs(daysRemaining)} days overdue - immediate action required`
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="notice" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="notice">Notice</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="hearing">Hearing</TabsTrigger>
              <TabsTrigger value="resolution">Resolution</TabsTrigger>
            </TabsList>

            <TabsContent value="notice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notice Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">Date</p>
                        <p className="font-medium">{new Date(notice.date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <FileWarning className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">Type</p>
                        <p className="font-medium">{notice.type}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">Property</p>
                        <p className="font-medium">{notice.propertyName}</p>
                      </div>
                    </div>

                    {notice.unitNumber && (
                      <div className="flex items-start gap-3">
                        <Home className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                        <div>
                          <p className="text-sm text-[var(--secondary-text)]">Unit</p>
                          <p className="font-medium">{notice.unitNumber}</p>
                        </div>
                      </div>
                    )}

                    {notice.ruleReference && (
                      <div className="sm:col-span-2">
                        <p className="text-sm text-[var(--secondary-text)]">Rule or Policy Reference:</p>
                        <p className="font-medium">{notice.ruleReference}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-[var(--secondary-text)] mb-2">Factual Description:</p>
                    <p className="whitespace-pre-wrap">{notice.factualDescription}</p>
                  </div>

                  {notice.requiredAction && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-[var(--secondary-text)] mb-2">Required Action:</p>
                      <p className="font-medium text-amber-700">{notice.requiredAction}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  {notice.evidence ? (
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{notice.evidence}</p>
                    </div>
                  ) : (
                    <p className="text-[var(--secondary-text)]">No evidence details available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Supporting Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <p className="text-[var(--secondary-text)]">No supporting documents</p>
                  ) : (
                    <div className="space-y-3">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-[var(--page-background)] rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-[var(--teal)]" />
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-sm text-[var(--secondary-text)]">
                                {doc.documentType} • {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hearing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Hearing Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notice.hearingDate ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                        <div>
                          <p className="text-sm text-[var(--secondary-text)]">Hearing Date</p>
                          <p className="font-medium">{new Date(notice.hearingDate).toLocaleString()}</p>
                        </div>
                      </div>
                      {notice.hearingLocation && (
                        <div className="flex items-start gap-3">
                          <Building2 className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                          <div>
                            <p className="text-sm text-[var(--secondary-text)]">Location</p>
                            <p className="font-medium">{notice.hearingLocation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Gavel className="h-12 w-12 mx-auto mb-3 text-[var(--secondary-text)]" />
                      <p className="text-[var(--secondary-text)]">No hearing scheduled</p>
                      {notice.status === "notice_sent" && (
                        <Button
                          onClick={handleRequestHearing}
                          disabled={isRequestingHearing}
                          variant="outline"
                          className="mt-4"
                        >
                          {isRequestingHearing ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Gavel className="h-4 w-4 mr-2" />
                          )}
                          Request a Hearing
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resolution" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resolution</CardTitle>
                </CardHeader>
                <CardContent>
                  {notice.resolution ? (
                    <p className="whitespace-pre-wrap">{notice.resolution}</p>
                  ) : notice.correctiveAction ? (
                    <div>
                      <p className="text-sm text-[var(--secondary-text)] mb-2">Corrective Action Required:</p>
                      <p className="whitespace-pre-wrap">{notice.correctiveAction}</p>
                    </div>
                  ) : (
                    <p className="text-[var(--secondary-text)]">No resolution recorded yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Response Form */}
          {notice.status === "notice_sent" && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Response</CardTitle>
                <CardDescription>
                  Provide your response to this notice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your response..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={isSubmitting || !responseText.trim()}
                    className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Response
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--secondary-text)]">Current Status</span>
                  {getStatusBadge(notice.status)}
                </div>
                {notice.responseDeadline && (
                  <div className="flex justify-between">
                    <span className="text-[var(--secondary-text)]">Response Due</span>
                    <span className={notice.isOverdue ? 'text-red-600 font-medium' : ''}>
                      {new Date(notice.responseDeadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-800 mb-4">
                If you have questions about this notice or need assistance, please contact management.
              </p>
              <Link href="/owner/messages">
                <Button variant="outline" className="w-full border-blue-300 text-blue-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
