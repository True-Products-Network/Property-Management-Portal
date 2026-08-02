"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  DollarSign,
  FileText,
  Upload,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

interface CompletedJob {
  id: string;
  jobNumber: string;
  title: string;
  propertyName: string;
  completedDate: string;
  agreedPrice?: number;
}

export default function VendorInvoiceSubmissionPage() {
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadCompletedJobs();
  }, []);

  async function loadCompletedJobs() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/vendor/jobs?status=completed&invoiced=false");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load jobs");
      }

      setCompletedJobs(result.data || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
      setError(error instanceof Error ? error.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }

  async function submitInvoice(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJob || !invoiceAmount || !invoiceNumber) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/vendor/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob,
          invoiceNumber,
          amount: parseFloat(invoiceAmount),
          description,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to submit invoice");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
      // Reset form
      setSelectedJob("");
      setInvoiceAmount("");
      setInvoiceNumber("");
      setDescription("");
      
      // Refresh jobs list
      loadCompletedJobs();
    } catch (error) {
      console.error("Error submitting invoice:", error);
      setError(error instanceof Error ? error.message : "Failed to submit invoice");
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

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendor">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Submit Invoice</h1>
          <p className="text-[var(--secondary-text)]">Submit invoice for completed work</p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          Invoice submitted successfully!
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--teal)]" />
            Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitInvoice} className="space-y-4">
            <div>
              <Label htmlFor="job">Select Completed Job</Label>
              <select
                id="job"
                value={selectedJob}
                onChange={(e) => {
                  setSelectedJob(e.target.value);
                  const job = completedJobs.find((j) => j.id === e.target.value);
                  if (job?.agreedPrice) {
                    setInvoiceAmount(job.agreedPrice.toString());
                  }
                }}
                className="w-full h-10 px-3 border rounded-md mt-1"
                required
              >
                <option value="">Select a job...</option>
                {completedJobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.jobNumber} - {job.title} ({job.propertyName})
                  </option>
                ))}
              </select>
              {completedJobs.length === 0 && (
                <p className="text-sm text-[var(--secondary-text)] mt-2">
                  No completed jobs awaiting invoice
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g., INV-001"
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Invoice Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details about this invoice..."
                className="w-full min-h-[100px] p-3 border rounded-md"
              />
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-[var(--secondary-text)]" />
              <p className="text-sm text-[var(--secondary-text)]">
                Drag and drop invoice file here, or click to browse
              </p>
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                PDF, JPG, or PNG up to 10MB
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting || completedJobs.length === 0}
                className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <DollarSign className="h-4 w-4 mr-2" />
                )}
                Submit Invoice
              </Button>
              <Link href="/vendor">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
