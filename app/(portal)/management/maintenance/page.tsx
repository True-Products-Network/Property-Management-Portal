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
  description?: string;
  status: string;
  urgency?: string;
  category?: string;
  propertyId: string;
  propertyName?: string;
  unitId?: string;
  reportedByContactId: string;
  assignedVendorId?: string;
  requestedDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
}

interface Vendor {
  id: string;
  companyName: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [units, setUnits] = useState<Record<string, Unit>>({});
  const [vendors, setVendors] = useState<Record<string, Vendor>>({});
  const [contacts, setContacts] = useState<Record<string, Contact>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  useEffect(() => {
    loadRequests();
    loadProperties();
    loadUnits();
    loadVendors();
    loadContacts();
  }, []);

  async function loadRequests() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/maintenance");
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load maintenance requests");
      }
      
      setRequests(result.data.data || []);
    } catch (error) {
      console.error("Error loading maintenance requests:", error);
      setError(error instanceof Error ? error.message : "Failed to load maintenance requests");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProperties() {
    try {
      const response = await fetch("/api/properties");
      const result = await response.json();
      
      if (result.success) {
        const propMap: Record<string, Property> = {};
        result.data.data.forEach((prop: Property) => {
          propMap[prop.id] = prop;
        });
        setProperties(propMap);
      }
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  async function loadUnits() {
    try {
      const response = await fetch("/api/units");
      const result = await response.json();
      
      if (result.success) {
        const unitMap: Record<string, Unit> = {};
        result.data.data.forEach((unit: Unit) => {
          unitMap[unit.id] = unit;
        });
        setUnits(unitMap);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  async function loadVendors() {
    try {
      const response = await fetch("/api/vendors");
      const result = await response.json();
      
      if (result.success) {
        const vendorMap: Record<string, Vendor> = {};
        result.data.data.forEach((vendor: Vendor) => {
          vendorMap[vendor.id] = vendor;
        });
        setVendors(vendorMap);
      }
    } catch (error) {
      console.error("Error loading vendors:", error);
    }
  }

  async function loadContacts() {
    try {
      const response = await fetch("/api/contacts");
      const result = await response.json();
      
      if (result.success) {
        const contactMap: Record<string, Contact> = {};
        result.data.data.forEach((contact: Contact) => {
          contactMap[contact.id] = contact;
        });
        setContacts(contactMap);
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
  }

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (properties[request.propertyId]?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendors[request.assignedVendorId || ""]?.companyName || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || request.urgency === priorityFilter;
    
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

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "low":
        return <Badge className="bg-gray-100 text-gray-700">Low</Badge>;
      case "normal":
        return <Badge className="bg-blue-100 text-blue-700">Normal</Badge>;
      case "urgent":
        return <Badge className="bg-amber-100 text-amber-700">Urgent</Badge>;
      case "emergency":
        return <Badge className="bg-red-100 text-red-700">Emergency</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">-</Badge>;
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
        <p className="text-red-500">{error}</p>
        <Button onClick={loadRequests} variant="outline">
          Retry
        </Button>
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
                  {requests.filter((r) => r.urgency === "emergency" && r.status !== "completed" && r.status !== "closed").length}
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
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
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
                {filteredRequests.map((request) => {
                  const unit = request.unitId ? units[request.unitId] : null;
                  const vendor = request.assignedVendorId ? vendors[request.assignedVendorId] : null;
                  const reporter = contacts[request.reportedByContactId];
                  const hasPropertyName = request.propertyName && request.propertyName !== "Unknown Property";

                  return (
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
                        {request.category && (
                          <p className="text-xs text-[var(--secondary-text)]">{request.category}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                            {hasPropertyName ? (
                              <Link
                                href={`/management/properties/${request.propertyId}`}
                                className="text-[var(--teal)] hover:underline"
                              >
                                {request.propertyName}
                              </Link>
                            ) : (
                              <span className="text-[var(--secondary-text)]">Unknown Property</span>
                            )}
                          </div>
                          {unit && (
                            <div className="flex items-center gap-2 mt-1">
                              <Home className="h-3 w-3 text-[var(--secondary-text)]" />
                              <Link
                                href={`/management/units/${unit.id}`}
                                className="text-xs text-[var(--secondary-text)] hover:text-[var(--main-text)]"
                              >
                                Unit {unit.unitNumber}
                              </Link>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                      <td className="py-3 px-4">{getPriorityBadge(request.urgency)}</td>
                      <td className="py-3 px-4">
                        {vendor ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Truck className="h-4 w-4 text-[var(--secondary-text)]" />
                            <span>{vendor.companyName}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-[var(--secondary-text)]">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-[var(--secondary-text)]">
                          <p>Reported:</p>
                          <p>{new Date(request.createdAt).toLocaleDateString()}</p>
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
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                ? "No maintenance requests found matching your criteria."
                : "No maintenance requests yet. Click 'New Request' to create one."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
