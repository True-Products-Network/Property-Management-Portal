"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Wrench,
  ClipboardCheck,
  FileText,
  Bell,
  CreditCard,
  MessageSquare,
  Calendar,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface DashboardData {
  unit: {
    id: string;
    unitNumber: string;
    propertyName: string;
    associationName: string;
  } | null;
  openMaintenanceRequests: number;
  nextInspection: {
    id: string;
    type: string;
    scheduledDate: string;
  } | null;
  unreadNotices: number;
  documentsRequiringAction: number;
  recentRequests: MaintenanceRequest[];
  recentMessages: Message[];
  announcements: Announcement[];
  upcomingAppointments: Appointment[];
}

interface MaintenanceRequest {
  id: string;
  title: string;
  status: string;
  urgency: string;
  updatedAt: string;
}

interface Message {
  id: string;
  subject: string;
  preview: string;
  unread: boolean;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface Appointment {
  id: string;
  title: string;
  startTime: string;
  type: string;
}

export default function ResidentHomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const response = await fetch("/api/resident/dashboard");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setIsLoading(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">
          Welcome Home
        </h1>
        <p className="text-[var(--secondary-text)] mt-1">
          {data?.unit ? `${data.unit.propertyName} - Unit ${data.unit.unitNumber}` : "Loading..."}
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Open Requests</p>
                <p className="text-2xl font-semibold">{data?.openMaintenanceRequests || 0}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Next Inspection</p>
                <p className="text-lg font-semibold">
                  {data?.nextInspection 
                    ? new Date(data.nextInspection.scheduledDate).toLocaleDateString()
                    : "None scheduled"}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Unread Notices</p>
                <p className="text-2xl font-semibold">{data?.unreadNotices || 0}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Action Required</p>
                <p className="text-2xl font-semibold">{data?.documentsRequiringAction || 0}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/resident/maintenance/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Wrench className="h-4 w-4 mr-2" />
            Report Maintenance
          </Button>
        </Link>
        <Link href="/resident/maintenance">
          <Button variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            View Requests
          </Button>
        </Link>
        <Link href="/resident/documents">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            View Documents
          </Button>
        </Link>
        <Link href="/resident/payments">
          <Button variant="outline">
            <CreditCard className="h-4 w-4 mr-2" />
            Make Payment
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Maintenance Requests */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[var(--teal)]" />
                Recent Requests
              </CardTitle>
              <Link href="/resident/maintenance">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.recentRequests && data.recentRequests.length > 0 ? (
              <div className="space-y-3">
                {data.recentRequests.map((request) => (
                  <Link key={request.id} href={`/resident/maintenance/${request.id}`}>
                    <div className="p-3 bg-[var(--page-background)] rounded-lg hover:bg-[var(--hover-background)] transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{request.title}</span>
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-[var(--secondary-text)]">
                        <span className={getStatusColor(request.status)}>{request.status}</span>
                        <span>{new Date(request.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No recent maintenance requests</p>
                <Link href="/resident/maintenance/new">
                  <Button variant="outline" size="sm" className="mt-3">
                    Submit First Request
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[var(--teal)]" />
                Recent Messages
              </CardTitle>
              <Link href="/resident/messages">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.recentMessages && data.recentMessages.length > 0 ? (
              <div className="space-y-3">
                {data.recentMessages.map((message) => (
                  <div key={message.id} className="p-3 bg-[var(--page-background)] rounded-lg">
                    <div className="flex items-start gap-3">
                      {message.unread && (
                        <div className="w-2 h-2 bg-[var(--teal)] rounded-full mt-2 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{message.subject}</p>
                        <p className="text-sm text-[var(--secondary-text)] truncate">
                          {message.preview}
                        </p>
                        <p className="text-xs text-[var(--secondary-text)] mt-1">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No recent messages</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-[var(--teal)]" />
              Association Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.announcements && data.announcements.length > 0 ? (
              <div className="space-y-3">
                {data.announcements.map((announcement) => (
                  <div key={announcement.id} className="p-3 bg-[var(--page-background)] rounded-lg">
                    <p className="font-medium text-sm">{announcement.title}</p>
                    <p className="text-sm text-[var(--secondary-text)] line-clamp-2">
                      {announcement.content}
                    </p>
                    <p className="text-xs text-[var(--secondary-text)] mt-1">
                      {new Date(announcement.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No recent announcements</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[var(--teal)]" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {data.upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-3 bg-[var(--page-background)] rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{appointment.title}</p>
                        <p className="text-sm text-[var(--secondary-text)]">
                          {new Date(appointment.startTime).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{appointment.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No upcoming appointments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getUrgencyColor(urgency: string): string {
  switch (urgency.toLowerCase()) {
    case "emergency":
      return "bg-red-100 text-red-700";
    case "urgent":
      return "bg-orange-100 text-orange-700";
    case "high":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
    case "closed":
      return "text-green-600";
    case "in_progress":
      return "text-blue-600";
    case "pending":
      return "text-amber-600";
    default:
      return "text-gray-600";
  }
}
