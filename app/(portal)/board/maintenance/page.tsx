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
  AlertTriangle,
  ArrowRight,
  Search,
  Filter,
  DollarSign,
} from "lucide-react";

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  status: string;
  urgency: string;
  category: string;
  submittedDate: string;
  scheduledDate?: string;
  completedDate?: string;
  vendorName?: string;
  estimatedCost?: number;
  actualCost?: number;
  requiresApproval: boolean;
  approvalStatus?: string;
}

export default function BoardMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  useEffect(() => {
    loadMaintenanceRequests();
  }, []);

  async function loadMaintenanceRequests() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/board/maintenance");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load maintenance requests");
      }

      setRequests(result.data || []);
    } catch (error) {
      console.error("Error loading maintenance:", error);
      setError(error instanceof Error ? error.message : "Failed to load maintenance requests");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || request.urgency === urgencyFilter;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return <Badge className="bg-red-100 text-red-700">Emergency</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-700">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-700">Medium</Badge>;
      case "low":
        return <Badge className="bg-green-100 text-green-700">Low</Badge>;
      default:
        return <Badge>{urgency}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-700">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-700">In Progress</Badge>;
      case "pending_approval":
        return <Badge className="bg-amber-100 text-amber-700">Pending Approval</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
        <Button onClick={loadMaintenanceRequests} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Maintenance Overview</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Track maintenance requests and work orders
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
                placeholder="Search maintenance requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="h-10 px-3 border rounded-md"
              >
                <option value="all">All Urgency</option>
                <option value="emergency">Emergency</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Wrench className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-text)]" />
              <p className="text-[var(--secondary-text)]">No maintenance requests found</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Link key={request.id} href={`/board/maintenance/${request.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{request.title}</p>
                        {getUrgencyBadge(request.urgency)}
                        {getStatusBadge(request.status)}
                        {request.requiresApproval && (
                          <Badge className="bg-purple-100 text-purple-700">Needs Approval</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {request.requestNumber} • {request.category}
                      </p>
                      <p className="text-sm text-[var(--secondary-text)] mt-2">
                        {request.description}
                      </p>
                      {request.vendorName && (
                        <p className="text-sm mt-2">
                          <span className="text-[var(--secondary-text)]">Assigned to:</span>{" "}
                          {request.vendorName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {(request.estimatedCost || request.actualCost) && (
                        <div className="flex items-center gap-1 text-lg font-semibold">
                          <DollarSign className="h-5 w-5" />
                          {request.actualCost?.toLocaleString() || request.estimatedCost?.toLocaleString()}
                        </div>
                      )}
                      <div className="text-sm text-[var(--secondary-text)]">
                        Submitted {new Date(request.submittedDate).toLocaleDateString()}
                      </div>
                      <Button variant="ghost" size="sm">
                        View Details
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
