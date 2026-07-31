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
  Filter,
  Home,
  Building2,
  Truck,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  status: "new" | "in_progress" | "waiting" | "completed" | "closed";
  priority: "low" | "medium" | "high" | "emergency";
  category: string;
  propertyId: string;
  propertyName: string;
  unitId?: string;
  unitNumber?: string;
  reportedBy: string;
  assignedVendor?: string;
  reportedDate: string;
  scheduledDate?: string;
  completionDate?: string;
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      const mockRequests: MaintenanceRequest[] = [
        {
          id: "MNT-001",
          requestNumber: "MNT-2026-0047",
          title: "HVAC Repair - Building B",
          description: "Air conditioning unit not cooling properly",
          status: "in_progress",
          priority: "high",
          category: "HVAC",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          unitId: "UNIT-1",
          unitNumber: "1N",
          reportedBy: "Sarah Johnson",
          assignedVendor: "ABC Heating & Cooling",
          reportedDate: "2026-07-28T10:00:00Z",
          scheduledDate: "2026-08-01T14:00:00Z",
        },
        {
          id: "MNT-002",
          requestNumber: "MNT-2026-0048",
          title: "Water leak under kitchen sink",
          description: "There is a water leak under the kitchen sink that needs immediate attention.",
          status: "new",
          priority: "emergency",
          category: "Plumbing",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          unitId: "UNIT-3",
          unitNumber: "2N",
          reportedBy: "Mary Jones",
          reportedDate: "2026-07-30T09:30:00Z",
        },
        {
          id: "MNT-003",
          requestNumber: "MNT-2026-0049",
          title: "Light fixture replacement",
          description: "Hallway light fixture needs to be replaced",
          status: "waiting",
          priority: "low",
          category: "Electrical",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          reportedBy: "John Smith",
          assignedVendor: "XYZ Electric",
          reportedDate: "2026-07-29T15:00:00Z",
        },
        {
          id: "MNT-004",
          requestNumber: "MNT-2026-0050",
          title: "Window repair",
          description: "Broken window in living room",
          status: "completed",
          priority: "medium",
          category: "General",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          unitId: "UNIT-2",
          unitNumber: "1S",
          reportedBy: "Bob Wilson",
          assignedVendor: "Quick Fix Glass",
          reportedDate: "2026-07-25T11:00:00Z",
          completionDate: "2026-07-27T16:00:00Z",
        },
        {
          id: "MNT-005",
          requestNumber: "MNT-2026-0051",
          title: "Carpet cleaning",
          description: "Common area carpet needs deep cleaning",
          status: "new",
          priority: "low",
          category: "Cleaning",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          reportedBy: "Karen Lee",
          reportedDate: "2026-07-31T08:00:00Z",
        },
      ];
      
      setRequests(mockRequests);
    } catch (error) {
      console.error("Error loading maintenance requests:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.assignedVendor?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "low":
        return <Badge className="bg-gray-100 text-gray-700">Low</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-700">Medium</Badge>;
      case "high":
        return <Badge className="bg-amber-100 text-amber-700">High</Badge>;
      case "emergency":
        return <Badge className="bg-red-100 text-red-700">Emergency</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Maintenance</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage maintenance requests and work orders
          </p>
        </div>
        <Link href="/management/maintenance/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total</p>
                <p className="text-2xl font-semibold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">New</p>
                <p className="text-2xl font-semibold">
                  {requests.filter((r) => r.status === "new").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">In Progress</p>
                <p className="text-2xl font-semibold">
                  {requests.filter((r) => r.status === "in_progress").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Emergency</p>
                <p className="text-2xl font-semibold">
                  {requests.filter((r) => r.priority === "emergency" && r.status !== "completed" && r.status !== "closed").length}
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
                <p className="text-2xl font-semibold">
                  {requests.filter((r) => r.status === "completed" || r.status === "closed").length}
                </p>
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
                className="input"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Request
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Location
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Priority
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Vendor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/management/maintenance/${request.id}`}
                        className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                      >
                        {request.title}
                      </Link>
                      <p className="text-xs text-[var(--secondary-text)]">{request.requestNumber}</p>
                      <p className="text-xs text-[var(--secondary-text)]">{request.category}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                          <Link
                            href={`/management/properties/${request.propertyId}`}
                            className="text-[var(--teal)] hover:underline"
                          >
                            {request.propertyName}
                          </Link>
                        </div>
                        {request.unitNumber && (
                          <div className="flex items-center gap-2 mt-1">
                            <Home className="h-3 w-3 text-[var(--secondary-text)]" />
                            <Link
                              href={`/management/units/${request.unitId}`}
                              className="text-xs text-[var(--secondary-text)] hover:text-[var(--main-text)]"
                            >
                              Unit {request.unitNumber}
                            </Link>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                    <td className="py-3 px-4">{getPriorityBadge(request.priority)}</td>
                    <td className="py-3 px-4">
                      {request.assignedVendor ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4 text-[var(--secondary-text)]" />
                          <span>{request.assignedVendor}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--secondary-text)]">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-[var(--secondary-text)]">
                        <p>Reported:</p>
                        <p>{new Date(request.reportedDate).toLocaleDateString()}</p>
                        {request.scheduledDate && (
                          <p className="mt-1">
                            Scheduled: {new Date(request.scheduledDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/management/maintenance/${request.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              No maintenance requests found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
