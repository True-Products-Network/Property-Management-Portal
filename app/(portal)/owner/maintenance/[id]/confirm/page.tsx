"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Wrench,
  Star,
  Camera,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  urgency: string;
  description: string;
  propertyName: string;
  unitNumber?: string;
  vendorName?: string;
  completedAt?: string;
}

interface CompletionForm {
  isResolved: boolean;
  needsMoreWork: boolean;
  areaAcceptable: boolean;
  comments: string;
  canClose: boolean;
  rating: number;
  photos: File[];
}

export default function OwnerCompletionConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [form, setForm] = useState<CompletionForm>({
    isResolved: true,
    needsMoreWork: false,
    areaAcceptable: true,
    comments: "",
    canClose: true,
    rating: 0,
    photos: [],
  });

  useEffect(() => {
    loadRequestData();
  }, [requestId]);

  async function loadRequestData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/owner/maintenance/${requestId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load request");
      }

      setRequest(result.data);
    } catch (error) {
      console.error("Error loading request:", error);
      setError(error instanceof Error ? error.message : "Failed to load request");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch(`/api/owner/maintenance/${requestId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to submit confirmation");
      }

      setSuccessMessage("Thank you! Your feedback has been submitted.");
      setTimeout(() => {
        router.push("/owner/maintenance");
      }, 2000);
    } catch (error) {
      console.error("Error submitting confirmation:", error);
      setError(error instanceof Error ? error.message : "Failed to submit confirmation");
    } finally {
      setIsSubmitting(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "awaiting_confirmation":
        return <Badge className="bg-amber-100 text-amber-700">Awaiting Your Confirmation</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return <Badge className="bg-red-100 text-red-700">Emergency</Badge>;
      case "urgent":
        return <Badge className="bg-amber-100 text-amber-700">Urgent</Badge>;
      case "normal":
        return <Badge className="bg-blue-100 text-blue-700">Normal</Badge>;
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

  if (error && !request) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Link href="/owner/maintenance">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Maintenance
          </Button>
        </Link>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-[var(--secondary-text)]">Request not found</p>
        <Link href="/owner/maintenance">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Maintenance
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/owner/maintenance/${requestId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            Confirm Work Completion
          </h1>
          <p className="text-[var(--secondary-text)]">
            Request {request.requestNumber}
          </p>
        </div>
      </div>

      {/* Request Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[var(--teal)]" />
                {request.title}
              </CardTitle>
              <CardDescription className="mt-2">
                {request.propertyName}
                {request.unitNumber && ` • Unit ${request.unitNumber}`}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              {getStatusBadge(request.status)}
              {getUrgencyBadge(request.urgency)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--secondary-text)]">{request.description}</p>
          {request.vendorName && (
            <p className="text-sm mt-2">
              <span className="text-[var(--secondary-text)]">Completed by:</span>{" "}
              <span className="font-medium">{request.vendorName}</span>
            </p>
          )}
          {request.completedAt && (
            <p className="text-sm mt-1">
              <span className="text-[var(--secondary-text)]">Completed on:</span>{" "}
              <span className="font-medium">
                {new Date(request.completedAt).toLocaleDateString()}
              </span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Confirmation Form */}
      <Card>
        <CardHeader>
          <CardTitle>How did we do?</CardTitle>
          <CardDescription>
            Please let us know if the work was completed to your satisfaction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Is the problem resolved? */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Is the problem resolved?</Label>
            <div className="flex gap-4">
              <button
                onClick={() => setForm({ ...form, isResolved: true })}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  form.isResolved
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <ThumbsUp className={`h-6 w-6 mx-auto mb-2 ${form.isResolved ? "text-green-600" : "text-gray-400"}`} />
                <p className={`font-medium ${form.isResolved ? "text-green-700" : "text-gray-600"}`}>
                  Yes, resolved
                </p>
              </button>
              <button
                onClick={() => setForm({ ...form, isResolved: false })}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  !form.isResolved
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <ThumbsDown className={`h-6 w-6 mx-auto mb-2 ${!form.isResolved ? "text-red-600" : "text-gray-400"}`} />
                <p className={`font-medium ${!form.isResolved ? "text-red-700" : "text-gray-600"}`}>
                  No, still an issue
                </p>
              </button>
            </div>
          </div>

          {/* Was the area left acceptable? */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Was the work area left in acceptable condition?</Label>
            <div className="flex gap-4">
              <button
                onClick={() => setForm({ ...form, areaAcceptable: true })}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  form.areaAcceptable
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <CheckCircle2 className={`h-6 w-6 mx-auto mb-2 ${form.areaAcceptable ? "text-green-600" : "text-gray-400"}`} />
                <p className={`font-medium ${form.areaAcceptable ? "text-green-700" : "text-gray-600"}`}>
                  Yes, clean
                </p>
              </button>
              <button
                onClick={() => setForm({ ...form, areaAcceptable: false })}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  !form.areaAcceptable
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <AlertCircle className={`h-6 w-6 mx-auto mb-2 ${!form.areaAcceptable ? "text-red-600" : "text-gray-400"}`} />
                <p className={`font-medium ${!form.areaAcceptable ? "text-red-700" : "text-gray-600"}`}>
                  No, needs cleanup
                </p>
              </button>
            </div>
          </div>

          {/* Is further work needed? */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg">
            <Checkbox
              id="needsMoreWork"
              checked={form.needsMoreWork}
              onChange={(e) => setForm({ ...form, needsMoreWork: e.target.checked })}
            />
            <div>
              <Label htmlFor="needsMoreWork" className="font-medium text-amber-900">
                Further work is needed
              </Label>
              <p className="text-sm text-amber-700">
                Check this if the vendor needs to return to complete or fix the work
              </p>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-base font-medium">
              Additional Comments
            </Label>
            <Textarea
              id="comments"
              placeholder="Please share any feedback about the work performed..."
              value={form.comments}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
              rows={4}
            />
          </div>

          {/* Service Rating */}
          <div className="space-y-3">
            <Label className="text-base font-medium">How would you rate the service?</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setForm({ ...form, rating: star })}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= form.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-[var(--secondary-text)]">
              {form.rating === 0 && "Click to rate"}
              {form.rating === 1 && "Poor"}
              {form.rating === 2 && "Fair"}
              {form.rating === 3 && "Good"}
              {form.rating === 4 && "Very Good"}
              {form.rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Can close? */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <Checkbox
              id="canClose"
              checked={form.canClose}
              onChange={(e) => setForm({ ...form, canClose: e.target.checked })}
            />
            <div>
              <Label htmlFor="canClose" className="font-medium text-blue-900">
                This request can be closed
              </Label>
              <p className="text-sm text-blue-700">
                Uncheck if you want management to follow up with you before closing
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
