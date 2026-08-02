"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Wrench,
  Plus,
  Search,
  ArrowLeft,
  Loader2,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  urgency: string;
  category: string;
  unitNumber: string;
  createdAt: string;
  updatedAt: string;
  vendorName?: string;
  scheduledDate?: string;
}

export default function ResidentMaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMaintenanceRequests();
  }, []);

  async function loadMaintenanceRequests() {
    try {
      const response = await fetch("/api/resident/maintenance");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setRequests(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading maintenance requests:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredRequests = requests.filter(
    (request) =>
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openRequests = requests.filter(
    (r) => !["completed", "closed", "cancelled"].includes(r.status.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/resident">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              My Maintenance Requests
            </h1>
            <p className="text-[var(--secondary-text)]">
              {openRequests.length} open requests
            </p>
          </div>
        </div>
        <Link href="/resident/maintenance/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
        <Input
          placeholder="Search requests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{request.title}</h3>
                      <Badge className={getUrgencyColor(request.urgency)}>
                        {request.urgency}
                      </Badge>
                    </div>
                    <p className="text-[var(--secondary-text)] text-sm mb-2 line-clamp-2">
                      {request.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--secondary-text)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                      <span>Unit: {request.unitNumber}</span>
                      <span className={getStatusColor(request.status)}>
                        Status: {request.status}
                      </span>
                      {request.vendorName && (
                        <span>Vendor: {request.vendorName}</span>
                      )}
                      {request.scheduledDate && (
                        <span className="text-blue-600">
                          Scheduled: {new Date(request.scheduledDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/resident/maintenance/${request.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Wrench className="h-16 w-16 mx-auto mb-4 text-[var(--secondary-text)] opacity-30" />
            <h3 className="text-lg font-medium text-[var(--main-text)] mb-2">
              No maintenance requests
            </h3>
            <p className="text-[var(--secondary-text)] mb-4">
              {searchQuery
                ? "No requests match your search"
                : "You haven't submitted any maintenance requests yet"}
            </p>
            {!searchQuery && (
              <Link href="/resident/maintenance/new">
                <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                  <Plus className="h-4 w-4 mr-2" />
                  Submit First Request
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getUrgencyColor(urgency: string): string {
  switch (urgency.toLowerCase()) {
    case "emergency":
      return "bg-red-100 text-red-700 border-red-200";
    case "urgent":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "high":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:
      return "bg-blue-100 text-blue-700 border-blue-200";
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
    case "closed":
      return "text-green-600 font-medium";
    case "in_progress":
      return "text-blue-600 font-medium";
    case "pending":
      return "text-amber-600 font-medium";
    default:
      return "text-gray-600";
  }
}
