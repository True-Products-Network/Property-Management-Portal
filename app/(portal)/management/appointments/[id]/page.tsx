"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  Loader2,
  Video,
  MapPin,
  User,
  Building2,
  Home,
  AlertCircle,
} from "lucide-react";

interface Appointment {
  id: string;
  appointmentId: string;
  associationId: string;
  title: string;
  description?: string;
  appointmentType?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isVirtual: boolean;
  virtualLink?: string;
  propertyId?: string;
  unitId?: string;
  organizerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
}

interface Association {
  id: string;
  name: string;
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [association, setAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId]);

  async function loadAppointment() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/appointments/${appointmentId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load appointment");
      }

      setAppointment(result.data);

      // Load related data
      if (result.data.propertyId) {
        const propRes = await fetch(`/api/properties/${result.data.propertyId}`);
        if (propRes.ok) {
          const propData = await propRes.json();
          if (propData.success) setProperty(propData.data);
        }
      }

      if (result.data.unitId) {
        const unitRes = await fetch(`/api/units/${result.data.unitId}`);
        if (unitRes.ok) {
          const unitData = await unitRes.json();
          if (unitData.success) setUnit(unitData.data);
        }
      }

      if (result.data.associationId) {
        const assocRes = await fetch(`/api/associations/${result.data.associationId}`);
        if (assocRes.ok) {
          const assocData = await assocRes.json();
          if (assocData.success) setAssociation(assocData.data);
        }
      }
    } catch (error) {
      console.error("Error loading appointment:", error);
      setError(error instanceof Error ? error.message : "Failed to load appointment");
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case "confirmed":
        return <Badge className="bg-green-100 text-green-700">Confirmed</Badge>;
      case "completed":
        return <Badge className="bg-teal-100 text-teal-700">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getAppointmentTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      maintenance: "Maintenance",
      inspection: "Inspection",
      meeting: "Meeting",
      showing: "Unit Showing",
      vendor_visit: "Vendor Visit",
      consultation: "Consultation",
      walkthrough: "Walkthrough",
      other: "Other",
    };
    return types[type || ""] || type || "-";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
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
        <div className="flex gap-2">
          <Button onClick={loadAppointment} variant="outline">
            Retry
          </Button>
          <Link href="/management/appointments">
            <Button variant="outline">Back to Appointments</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">Appointment not found</p>
        <Link href="/management/appointments">
          <Button variant="outline" className="mt-4">
            Back to Appointments
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
            <Link
              href="/management/appointments"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Appointments
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {appointment.title}
            </h1>
            {getStatusBadge(appointment.status)}
          </div>
          <p className="text-[var(--secondary-text)]">{appointment.appointmentId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/management/appointments/${appointmentId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Date</p>
                <p className="text-lg font-semibold">{formatDate(appointment.startTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Time</p>
                <p className="text-lg font-semibold">
                  {formatTime(appointment.startTime)}
                  {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                {appointment.isVirtual ? (
                  <Video className="h-5 w-5 text-[var(--teal)]" />
                ) : (
                  <MapPin className="h-5 w-5 text-[var(--teal)]" />
                )}
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Type</p>
                <p className="text-lg font-semibold">
                  {appointment.isVirtual ? "Virtual" : "In-Person"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Appointment Type</p>
                <p className="text-lg font-semibold">{getAppointmentTypeLabel(appointment.appointmentType)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {appointment.description && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Description</p>
                <p className="mt-1">{appointment.description}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Location</p>
              <div className="flex items-center gap-2 mt-1">
                {appointment.isVirtual ? (
                  <>
                    <Video className="h-4 w-4 text-[var(--teal)]" />
                    {appointment.virtualLink ? (
                      <a
                        href={appointment.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--teal)] hover:underline"
                      >
                        Join Virtual Meeting
                      </a>
                    ) : (
                      <span>Virtual (link TBD)</span>
                    )}
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 text-[var(--secondary-text)]" />
                    <span>{appointment.location || "Location TBD"}</span>
                  </>
                )}
              </div>
            </div>

            {association && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Association</p>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                  <Link
                    href={`/management/associations/${association.id}`}
                    className="text-[var(--teal)] hover:underline"
                  >
                    {association.name}
                  </Link>
                </div>
              </div>
            )}

            {property && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Property</p>
                <div className="flex items-center gap-2 mt-1">
                  <Home className="h-4 w-4 text-[var(--secondary-text)]" />
                  <Link
                    href={`/management/properties/${property.id}`}
                    className="text-[var(--teal)] hover:underline"
                  >
                    {property.name}
                  </Link>
                </div>
              </div>
            )}

            {unit && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Unit</p>
                <div className="flex items-center gap-2 mt-1">
                  <Home className="h-4 w-4 text-[var(--secondary-text)]" />
                  <Link
                    href={`/management/units/${unit.id}`}
                    className="text-[var(--teal)] hover:underline"
                  >
                    Unit {unit.unitNumber}
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Current Status</p>
              <div className="mt-1">{getStatusBadge(appointment.status)}</div>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Created</p>
              <p className="mt-1">{new Date(appointment.createdAt).toLocaleString()}</p>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Last Updated</p>
              <p className="mt-1">{new Date(appointment.updatedAt).toLocaleString()}</p>
            </div>

            {isUpcoming(appointment.startTime) && appointment.status !== "cancelled" && (
              <div className="pt-4 border-t border-[var(--border-color)]">
                <p className="text-sm font-medium mb-2">Quick Actions</p>
                <div className="flex flex-wrap gap-2">
                  {appointment.status === "scheduled" && (
                    <Button size="sm" variant="outline">
                      Confirm
                    </Button>
                  )}
                  {appointment.status !== "completed" && (
                    <Button size="sm" variant="outline">
                      Mark Completed
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
