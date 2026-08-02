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
  Wrench,
  Clock,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  Search,
  Filter,
  Calendar,
  MapPin,
} from "lucide-react";

interface Job {
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
  requestedDate: string;
  scheduledDate?: string;
  estimatedValue?: number;
  quoteStatus?: string;
  canAccept: boolean;
}

export default function VendorJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/vendor/jobs");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load jobs");
      }

      setJobs(result.data || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
      setError(error instanceof Error ? error.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.propertyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return <Badge className="bg-red-100 text-red-700">Emergency</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-700">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={loadJobs} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Assigned Jobs</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            View and manage your work assignments
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
                placeholder="Search jobs..."
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
              <option value="assigned">Assigned</option>
              <option value="quote_needed">Quote Needed</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Wrench className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-text)]" />
              <p className="text-[var(--secondary-text)]">No jobs found</p>
            </CardContent>
          </Card>
        ) : (
          filteredJobs.map((job) => (
            <Link key={job.id} href={`/vendor/jobs/${job.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{job.title}</p>
                        {getStatusBadge(job.status)}
                        {getUrgencyBadge(job.urgency)}
                      </div>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {job.jobNumber} • {job.category}
                      </p>
                      <p className="text-sm text-[var(--secondary-text)] mt-2">
                        {job.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[var(--secondary-text)]">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.propertyName}
                          {job.unitNumber && ` - Unit ${job.unitNumber}`}
                        </span>
                        {job.scheduledDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(job.scheduledDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {job.estimatedValue && (
                        <div className="flex items-center gap-1 text-lg font-semibold">
                          <DollarSign className="h-5 w-5" />
                          {job.estimatedValue.toLocaleString()}
                        </div>
                      )}
                      <div className="text-sm text-[var(--secondary-text)]">
                        Requested {new Date(job.requestedDate).toLocaleDateString()}
                      </div>
                      <Button variant="ghost" size="sm">
                        {job.status === "quote_needed" ? "Submit Quote" : "View Details"}
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
