"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Wrench,
  Plus,
  Search,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Home,
  Building2,
} from "lucide-react";

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  description?: string;
  status: string;
  urgency?: string;
  category?: string;
  propertyId: string;
  propertyName?: string;
  unitId?: string;
  unitNumber?: string;
  assignedVendorName?: string;
  requestedDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OwnerMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadMaintenanceRequests();
  }, []);

  async function loadMaintenanceRequests() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/owner/maintenance");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load maintenance requests");
      }

      setRequests(result.data || []);
    } catch (error) {
      console.error("Error loading maintenance requests:", error);
      setError(error instanceof Error ? error.message : "Failed to load maintenance requests");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.propertyName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-700">New</Badge>;
      case "in_progress":
        return <Badge className="bg-teal-100 text-teal-700">In Progress</Badge>;
      case "waiting":
        return <Badge className="bg-amber-100 text-amber-700">Waiting</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-700">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case "emergency":
        return <Badge className="bg-red-100 text-red-700">Emergency</Badge>;
      case "urgent":
        return <Badge className="bg-amber-100 text-amber-700">Urgent</Badge>;
      case "normal":
        return <Badge className="bg-blue-100 text-blue-700">Normal</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-700">Low</Badge>;
      default:
        return null;
    }
  };

  const openRequests = requests.filter(r => r.status !== "completed" && r.status !== "closed");
  const completedRequests = requests.filter(r => r.status === "completed" || r.status === "closed");

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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">My Maintenance</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Track and manage your maintenance requests
          </p>
        </div>
        <Link href="/owner/maintenance/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Requests</p>
                <p className="text-2xl font-semibold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Open</p>
                <p className="text-2xl font-semibold">{openRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">In Progress</p>
                <p className="text-2xl font-semibold">
                  {requests.filter(r => r.status === "in_progress").length}
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
                <p className="text-sm text-[var(--secondary-text)]">Completed</p>
                <p className="text-2xl font-semibold">{completedRequests.length}</p>
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
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Requests ({filteredRequests.length})</CardTitle>
          <CardDescription>
            Click on a request to view details and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery || statusFilter !== "all" ? (
                <>
                  <Filter className="h-12 w-12 mx-auto mb-3 text-[var(--secondary-text)] opacity-50" />
                  <p className="text-[var(--secondary-text)]">No requests match your filters</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <Wrench className="h-12 w-12 mx-auto mb-3 text-[var(--secondary-text)] opacity-50" />
                  <p className="text-[var(--secondary-text)] mb-3">No maintenance requests yet</p>
                  <Link href="/owner/maintenance/new">
                    <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                      <Plus className="h-4 w-4 mr-2" />
                      Submit Your First Request
                    </Button>
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((request) => (
                <Link key={request.id} href={`/owner/maintenance/${request.id}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[var(--page-background)] rounded-lg hover:bg-[var(--border-color)] transition-colors gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{request.title}</p>
                        {getUrgencyBadge(request.urgency)}
                      </div>
                      <p className="text-sm text-[var(--secondary-text)] mt-1">
                        {request.requestNumber}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-[var(--secondary-text)]">
                        {request.propertyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {request.propertyName}
                          </span>
                        )}
                        {request.unitNumber && (
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            Unit {request.unitNumber}
                          </span>
                        )}
                        {request.category && (
                          <span>{request.category}</span>
                        )}
                      </div>
                      {request.assignedVendorName && (
                        <p className="text-sm text-[var(--secondary-text)] mt-1">
                          Assigned to: {request.assignedVendorName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {getStatusBadge(request.status)}
                        <p className="text-xs text-[var(--secondary-text)] mt-1">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[var(--secondary-text)]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
