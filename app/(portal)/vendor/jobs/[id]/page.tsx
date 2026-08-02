"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  DollarSign,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
} from "lucide-react";

interface JobDetail {
  id: string;
  jobNumber: string;
  title: string;
  description: string;
  status: string;
  urgency: string;
  category: string;
  propertyName: string;
  unitNumber?: string;
  address: string;
  contactName?: string;
  contactPhone?: string;
  requestedDate: string;
  scheduledDate?: string;
  preferredDate?: string;
  estimatedDuration?: string;
  accessInstructions?: string;
  photos?: string[];
  canAccept: boolean;
  canSubmitQuote: boolean;
  canUpdateProgress: boolean;
  canComplete: boolean;
}

export default function VendorJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Quote form state
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [estimatedStart, setEstimatedStart] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");

  useEffect(() => {
    loadJobDetail();
  }, [params.id]);

  async function loadJobDetail() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/vendor/jobs/${params.id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load job");
      }

      setJob(result.data);
    } catch (error) {
      console.error("Error loading job:", error);
      setError(error instanceof Error ? error.message : "Failed to load job");
    } finally {
      setIsLoading(false);
    }
  }

  async function acceptJob() {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/vendor/jobs/${params.id}/accept`, {
        method: "POST",
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      loadJobDetail();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to accept job");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function declineJob() {
    if (!confirm("Are you sure you want to decline this job?")) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/vendor/jobs/${params.id}/decline`, {
        method: "POST",
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      router.push("/vendor/jobs");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to decline job");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitQuote(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/vendor/jobs/${params.id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(quoteAmount),
          description: quoteDescription,
          estimatedStart,
          estimatedDuration,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      loadJobDetail();
      setQuoteAmount("");
      setQuoteDescription("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit quote");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function startWork() {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/vendor/jobs/${params.id}/start`, {
        method: "POST",
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      loadJobDetail();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to start work");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function completeWork() {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/vendor/jobs/${params.id}/complete`, {
        method: "POST",
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      loadJobDetail();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to complete work");
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
        <Button onClick={loadJobDetail} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-[var(--secondary-text)]">Job not found</p>
        <Link href="/vendor/jobs">
          <Button variant="outline">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return <Badge className="bg-blue-100 text-blue-700">Assigned</Badge>;
      case "quote_needed":
        return <Badge className="bg-amber-100 text-amber-700">Quote Needed</Badge>;
      case "quote_submitted":
        return <Badge className="bg-purple-100 text-purple-700">Quote Submitted</Badge>;
      case "scheduled":
        return <Badge className="bg-green-100 text-green-700">Scheduled</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-700">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-teal-100 text-teal-700">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendor/jobs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">{job.title}</h1>
            {getStatusBadge(job.status)}
          </div>
          <p className="text-[var(--secondary-text)]">
            {job.jobNumber} • {job.category}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{job.description}</p>
              
              <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
                <MapPin className="h-4 w-4" />
                {job.propertyName}
                {job.unitNumber && ` - Unit ${job.unitNumber}`}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
                <Calendar className="h-4 w-4" />
                Requested: {new Date(job.requestedDate).toLocaleDateString()}
              </div>

              {job.scheduledDate && (
                <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
                  <Clock className="h-4 w-4" />
                  Scheduled: {new Date(job.scheduledDate).toLocaleDateString()}
                </div>
              )}

              {job.accessInstructions && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-800">Access Instructions</p>
                  <p className="text-sm text-amber-700">{job.accessInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quote Form */}
          {job.canSubmitQuote && (
            <Card>
              <CardHeader>
                <CardTitle>Submit Quote</CardTitle>
                <CardDescription>Provide your estimate for this job</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitQuote} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quoteAmount">Quote Amount ($)</Label>
                      <Input
                        id="quoteAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="estimatedStart">Estimated Start Date</Label>
                      <Input
                        id="estimatedStart"
                        type="date"
                        value={estimatedStart}
                        onChange={(e) => setEstimatedStart(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="estimatedDuration">Estimated Duration</Label>
                    <Input
                      id="estimatedDuration"
                      value={estimatedDuration}
                      onChange={(e) => setEstimatedDuration(e.target.value)}
                      placeholder="e.g., 2-3 hours, 1 day"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="quoteDescription">Quote Details</Label>
                    <Textarea
                      id="quoteDescription"
                      value={quoteDescription}
                      onChange={(e) => setQuoteDescription(e.target.value)}
                      placeholder="Breakdown of costs, materials, labor..."
                      rows={4}
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <DollarSign className="h-4 w-4 mr-2" />
                    )}
                    Submit Quote
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {job.canAccept && (
                  <>
                    <Button
                      onClick={acceptJob}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Accept Job
                    </Button>
                    <Button
                      onClick={declineJob}
                      disabled={isSubmitting}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </>
                )}
                
                {job.canUpdateProgress && job.status === "scheduled" && (
                  <Button
                    onClick={startWork}
                    disabled={isSubmitting}
                    className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                  >
                    <Wrench className="h-4 w-4 mr-2" />
                    Start Work
                  </Button>
                )}
                
                {job.canComplete && job.status === "in_progress" && (
                  <Button
                    onClick={completeWork}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete Work
                  </Button>
                )}
                
                <Link href={`/vendor/messages?job=${job.id}`}>
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.contactName && (
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Contact</p>
                  <p className="font-medium">{job.contactName}</p>
                </div>
              )}
              {job.contactPhone && (
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Phone</p>
                  <a href={`tel:${job.contactPhone}`} className="text-[var(--teal)] hover:underline">
                    {job.contactPhone}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Photos */}
          {job.photos && job.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {job.photos.map((photo, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
