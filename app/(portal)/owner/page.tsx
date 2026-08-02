"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Wrench,
  FileText,
  CreditCard,
  Calendar,
  ArrowRight,
  Loader2,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  DoorOpen,
} from "lucide-react";

interface Property {
  id: string;
  name: string;
  addressStreet: string;
  addressCity?: string;
  addressState?: string;
  type: string;
  associationName?: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  displayName?: string;
  propertyId: string;
  propertyName?: string;
  occupancyStatus?: string;
}

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  urgency?: string;
  category?: string;
  createdAt: string;
  propertyName?: string;
  unitNumber?: string;
}

interface Document {
  id: string;
  title: string;
  documentType?: string;
  category?: string;
  createdAt: string;
  requiresAcknowledgment: boolean;
  acknowledged?: boolean;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentType?: string;
  initiatedAt: string;
  invoiceNumber?: string;
}

interface Appointment {
  id: string;
  title: string;
  startTime: string;
  appointmentType?: string;
  isVirtual: boolean;
}

interface OwnerData {
  contactId: string;
  firstName: string;
  lastName: string;
  properties: Property[];
  units: Unit[];
  maintenanceRequests: MaintenanceRequest[];
  documents: Document[];
  payments: Payment[];
  upcomingAppointments: Appointment[];
  outstandingBalance: number;
}

export default function OwnerDashboardPage() {
  const [data, setData] = useState<OwnerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOwnerData();
  }, []);

  async function loadOwnerData() {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch owner data from the API
      const response = await fetch("/api/owner/dashboard");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load dashboard data");
      }

      setData(result.data);
    } catch (error) {
      console.error("Error loading owner data:", error);
      setError(error instanceof Error ? error.message : "Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-700">New</Badge>;
      case "in_progress":
        return <Badge className="bg-teal-100 text-teal-700">In Progress</Badge>;
      case "waiting":
        return <Badge className="bg-amber-100 text-amber-700">Waiting</Badge>;
      case "completed":
      case "closed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
      case "paid":
        return <Badge className="bg-green-100 text-green-700">Paid</Badge>;
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
        <Button onClick={loadOwnerData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-[var(--secondary-text)]">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            Welcome, {data.firstName}!
          </h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Here&apos;s what&apos;s happening with your properties
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/owner/maintenance/new">
            <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
              <Plus className="h-4 w-4 mr-2" />
              Maintenance Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Properties</p>
                <p className="text-2xl font-semibold">{data.properties.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <DoorOpen className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Units</p>
                <p className="text-2xl font-semibold">{data.units.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Open Requests</p>
                <p className="text-2xl font-semibold">
                  {data.maintenanceRequests.filter(r => r.status !== "completed" && r.status !== "closed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.outstandingBalance > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <DollarSign className={`h-5 w-5 ${data.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Balance Due</p>
                <p className={`text-2xl font-semibold ${data.outstandingBalance > 0 ? 'text-red-600' : ''}`}>
                  ${data.outstandingBalance.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/owner/maintenance/new">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium text-sm">Submit Request</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/owner/documents">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <p className="font-medium text-sm">View Documents</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/owner/payments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-sm">Make Payment</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/owner/properties">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Home className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium text-sm">My Properties</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Properties */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Properties</CardTitle>
              <CardDescription>Properties and units you own or rent</CardDescription>
            </div>
            <Link href="/owner/properties">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.properties.length === 0 ? (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <Home className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No properties found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.properties.slice(0, 3).map((property) => (
                  <div key={property.id} className="flex items-start gap-3 p-3 bg-[var(--page-background)] rounded-lg">
                    <div className="w-10 h-10 bg-[var(--teal)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{property.name}</p>
                      <p className="text-sm text-[var(--secondary-text)] truncate">
                        {property.addressStreet}
                        {property.addressCity && `, ${property.addressCity}`}
                      </p>
                      {property.associationName && (
                        <p className="text-xs text-[var(--secondary-text)] mt-1">
                          {property.associationName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {data.properties.length > 3 && (
                  <p className="text-sm text-[var(--secondary-text)] text-center">
                    +{data.properties.length - 3} more properties
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Maintenance Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Maintenance</CardTitle>
              <CardDescription>Your recent maintenance requests</CardDescription>
            </div>
            <Link href="/owner/maintenance">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.maintenanceRequests.length === 0 ? (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No maintenance requests</p>
                <Link href="/owner/maintenance/new">
                  <Button variant="outline" size="sm" className="mt-3">
                    <Plus className="h-4 w-4 mr-1" />
                    Submit Request
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.maintenanceRequests.slice(0, 5).map((request) => (
                  <Link key={request.id} href={`/owner/maintenance/${request.id}`}>
                    <div className="flex items-center justify-between p-3 bg-[var(--page-background)] rounded-lg hover:bg-[var(--border-color)] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{request.title}</p>
                          {getUrgencyBadge(request.urgency)}
                        </div>
                        <p className="text-xs text-[var(--secondary-text)]">
                          {request.requestNumber} • {request.propertyName}
                          {request.unitNumber && ` • Unit ${request.unitNumber}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <ArrowRight className="h-4 w-4 text-[var(--secondary-text)]" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>Scheduled visits and meetings</CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-[var(--secondary-text)]" />
          </CardHeader>
          <CardContent>
            {data.upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="flex items-center gap-3 p-3 bg-[var(--page-background)] rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{appointment.title}</p>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {new Date(appointment.startTime).toLocaleDateString()} at{" "}
                        {new Date(appointment.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {appointment.isVirtual && (
                      <Badge className="bg-purple-100 text-purple-700">Virtual</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Documents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>Documents requiring your attention</CardDescription>
            </div>
            <Link href="/owner/documents">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.documents.length === 0 ? (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No documents available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.documents.slice(0, 5).map((doc) => (
                  <Link key={doc.id} href={`/owner/documents/${doc.id}`}>
                    <div className="flex items-center justify-between p-3 bg-[var(--page-background)] rounded-lg hover:bg-[var(--border-color)] transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 text-[var(--secondary-text)] flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{doc.title}</p>
                          <p className="text-xs text-[var(--secondary-text)]">
                            {doc.documentType || doc.category || "Document"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.requiresAcknowledgment && !doc.acknowledged && (
                          <Badge className="bg-amber-100 text-amber-700">Action Required</Badge>
                        )}
                        <ArrowRight className="h-4 w-4 text-[var(--secondary-text)]" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Summary */}
      {data.outstandingBalance > 0 && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">Outstanding Balance</p>
                  <p className="text-2xl font-bold text-red-700">
                    ${data.outstandingBalance.toFixed(2)}
                  </p>
                  <p className="text-sm text-red-600">
                    {data.payments.filter(p => p.status === "pending").length} pending payment(s)
                  </p>
                </div>
              </div>
              <Link href="/owner/payments">
                <Button className="bg-red-600 hover:bg-red-700">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Make Payment
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
