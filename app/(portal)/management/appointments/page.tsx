"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  CalendarClock,
  Video,
  MapPin,
  ArrowRight,
  Loader2,
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
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewFilter, setViewFilter] = useState<string>("upcoming");

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/appointments");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load appointments");
      }

      setAppointments(result.data.data || []);
    } catch (error) {
      console.error("Error loading appointments:", error);
      setError(error instanceof Error ? error.message : "Failed to load appointments");
    } finally {
      setIsLoading(false);
    }
  }

  const now = new Date();

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      apt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.appointmentId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;

    const aptDate = new Date(apt.startTime);
    const matchesView =
      viewFilter === "all"
        ? true
        : viewFilter === "upcoming"
        ? aptDate >= now
        : aptDate < now;

    return matchesSearch && matchesStatus && matchesView;
  });

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
      weekday: "short",
      month: "short",
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
    return new Date(dateString) >= now;
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
        <Button onClick={loadAppointments} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Appointments</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage meetings, inspections, and appointments
          </p>
        </div>
        <Link href="/management/appointments/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            New Appointment
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total</p>
                <p className="text-2xl font-semibold">{appointments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Upcoming</p>
                <p className="text-2xl font-semibold">
                  {appointments.filter((a) => isUpcoming(a.startTime)).length}
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
                  {appointments.filter((a) => a.status === "completed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">This Week</p>
                <p className="text-2xl font-semibold">
                  {
                    appointments.filter((a) => {
                      const aptDate = new Date(a.startTime);
                      const weekFromNow = new Date();
                      weekFromNow.setDate(weekFromNow.getDate() + 7);
                      return aptDate >= now && aptDate <= weekFromNow;
                    }).length
                  }
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
                placeholder="Search appointments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={viewFilter}
                onChange={(e) => setViewFilter(e.target.value)}
                className="input"
              >
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="all">All</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewFilter === "upcoming" ? "Upcoming Appointments" : viewFilter === "past" ? "Past Appointments" : "All Appointments"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Appointment
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Date & Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Location
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((apt) => (
                  <tr
                    key={apt.id}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/management/appointments/${apt.id}`}
                        className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                      >
                        {apt.title}
                      </Link>
                      {apt.description && (
                        <p className="text-sm text-[var(--secondary-text)] truncate max-w-xs">
                          {apt.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">
                        {getAppointmentTypeLabel(apt.appointmentType)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="font-medium">{formatDate(apt.startTime)}</div>
                        <div className="text-[var(--secondary-text)]">
                          {formatTime(apt.startTime)}
                          {apt.endTime && ` - ${formatTime(apt.endTime)}`}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm text-[var(--secondary-text)]">
                        {apt.isVirtual ? (
                          <>
                            <Video className="h-3 w-3" />
                            Virtual
                          </>
                        ) : (
                          <>
                            <MapPin className="h-3 w-3" />
                            {apt.location || "TBD"}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(apt.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/management/appointments/${apt.id}`}>
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
          {filteredAppointments.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              {searchQuery || statusFilter !== "all" || viewFilter !== "upcoming"
                ? "No appointments found matching your criteria."
                : "No appointments yet. Click 'New Appointment' to create one."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
