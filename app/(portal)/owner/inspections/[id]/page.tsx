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
  ClipboardCheck,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  MessageSquare,
  Eye,
  Download,
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
  findings?: string;
  recommendations?: string;
  ownerInstructions?: string;
  requiresAction: boolean;
  ownerActionRequired?: string;
  ownerActionDeadline?: string;
}

interface Document {
  id: string;
  title: string;
  documentType: string;
  uploadedAt: string;
}

export default function OwnerInspectionDetailPage() {
  const params = useParams();
  const inspectionId = params.id as string;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  useEffect(() => {
    loadInspectionData();
  }, [inspectionId]);

  async function loadInspectionData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/owner/inspections/${inspectionId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load inspection");
      }

      setInspection(result.data.inspection);
      setDocuments(result.data.documents || []);
    } catch (error) {
      console.error("Error loading inspection:", error);
      setError(error instanceof Error ? error.message : "Failed to load inspection");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitResponse() {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/owner/inspections/${inspectionId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseText }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to submit response");
      }

      setResponseText("");
      loadInspectionData();
    } catch (error) {
      console.error("Error submitting response:", error);
      setError(error instanceof Error ? error.message : "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  }

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

  if (error && !inspection) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Link href="/owner/inspections">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inspections
          </Button>
        </Link>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-[var(--secondary-text)]">Inspection not found</p>
        <Link href="/owner/inspections">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inspections
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/owner/inspections">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {inspection.type}
            </h1>
            {getStatusBadge(inspection.status)}
            {getResultBadge(inspection.result)}
          </div>
          <p className="text-[var(--secondary-text)]">{inspection.inspectionNumber}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="findings">Findings</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inspection Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">
                          {inspection.status === "completed" ? "Completed Date" : "Scheduled Date"}
                        </p>
                        <p className="font-medium">
                          {new Date(
                            inspection.status === "completed"
                              ? inspection.completedDate || inspection.scheduledDate!
                              : inspection.scheduledDate!
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">Inspector</p>
                        <p className="font-medium">{inspection.inspectorName || "Not assigned"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <ClipboardCheck className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">Property</p>
                        <p className="font-medium">{inspection.propertyName}</p>
                        {inspection.unitNumber && (
                          <p className="text-sm text-[var(--secondary-text)]">
                            Unit {inspection.unitNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">Status</p>
                        <p className="font-medium capitalize">{inspection.status.replace("_", " ")}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {inspection.ownerInstructions && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <MessageSquare className="h-5 w-5" />
                      Instructions for You
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-800 whitespace-pre-wrap">{inspection.ownerInstructions}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="findings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inspection Findings</CardTitle>
                </CardHeader>
                <CardContent>
                  {inspection.findings ? (
                    <div className="prose max-w-none">
                      <p className="whitespace-pre-wrap">{inspection.findings}</p>
                    </div>
                  ) : (
                    <p className="text-[var(--secondary-text)]">No findings recorded yet</p>
                  )}
                </CardContent>
              </Card>

              {inspection.recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{inspection.recommendations}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Inspection Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-[var(--secondary-text)]" />
                      <p className="text-[var(--secondary-text)]">No documents available</p>
                    </div>
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
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Action Required */}
        <div className="space-y-6">
          {inspection.requiresAction && (
            <Card className="border-amber-300">
              <CardHeader className="bg-amber-50">
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <AlertTriangle className="h-5 w-5" />
                  Action Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspection.ownerActionRequired && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)] mb-1">Required Action:</p>
                    <p className="font-medium text-amber-900">{inspection.ownerActionRequired}</p>
                  </div>
                )}
                {inspection.ownerActionDeadline && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)] mb-1">Deadline:</p>
                    <p className="font-medium text-red-600">
                      {new Date(inspection.ownerActionDeadline).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Response Form */}
          {inspection.status === "completed" && inspection.requiresAction && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Response</CardTitle>
                <CardDescription>
                  Provide updates or evidence regarding required actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Describe the actions you've taken..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={handleSubmitResponse}
                  disabled={isSubmitting || !responseText.trim()}
                  className="w-full bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Response
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
