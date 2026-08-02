"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  Wrench,
  Clock,
  CheckCircle2,
  DollarSign,
  FileText,
  ArrowRight,
  Bell,
  Calendar,
  TrendingUp,
  Star,
} from "lucide-react";

interface VendorDashboardData {
  assignedJobs: number;
  pendingQuotes: number;
  scheduledJobs: number;
  completedJobs: number;
  pendingInvoices: number;
  averageRating: number;
  recentJobs: Job[];
  upcomingSchedule: ScheduleItem[];
  notifications: Notification[];
}

interface Job {
  id: string;
  jobNumber: string;
  title: string;
  status: string;
  urgency: string;
  propertyName: string;
  requestedDate: string;
  estimatedValue?: number;
}

interface ScheduleItem {
  id: string;
  jobTitle: string;
  scheduledDate: string;
  propertyName: string;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export default function VendorDashboardPage() {
  const [data, setData] = useState<VendorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/vendor/dashboard");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load dashboard");
      }

      setData(result.data);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setError(error instanceof Error ? error.message : "Failed to load dashboard");
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={loadDashboardData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const stats = [
    {
      title: "Assigned Jobs",
      value: data?.assignedJobs || 0,
      icon: Wrench,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/vendor/jobs",
    },
    {
      title: "Pending Quotes",
      value: data?.pendingQuotes || 0,
      icon: FileText,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      href: "/vendor/jobs?filter=quote_needed",
    },
    {
      title: "Scheduled",
      value: data?.scheduledJobs || 0,
      icon: Calendar,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/vendor/jobs?filter=scheduled",
    },
    {
      title: "Completed",
      value: data?.completedJobs || 0,
      icon: CheckCircle2,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      href: "/vendor/jobs?filter=completed",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Vendor Dashboard</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage your work orders and business
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Link href="/vendor/jobs">
            <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
              View Jobs
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">{stat.title}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-[var(--teal)]" />
                  Recent Job Assignments
                </CardTitle>
                <Link href="/vendor/jobs">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data?.recentJobs?.length === 0 ? (
                <p className="text-[var(--secondary-text)] text-center py-4">
                  No recent job assignments
                </p>
              ) : (
                <div className="space-y-3">
                  {data?.recentJobs?.slice(0, 5).map((job) => (
                    <Link key={job.id} href={`/vendor/jobs/${job.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium">{job.title}</p>
                          <p className="text-sm text-[var(--secondary-text)]">
                            {job.jobNumber} • {job.propertyName}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              job.status === "quote_needed"
                                ? "bg-amber-100 text-amber-700"
                                : job.status === "scheduled"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }
                          >
                            {job.status}
                          </Badge>
                          {job.estimatedValue && (
                            <p className="text-sm font-medium mt-1">
                              ${job.estimatedValue.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Schedule */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[var(--teal)]" />
                  Upcoming Schedule
                </CardTitle>
                <Link href="/vendor/jobs?filter=scheduled">
                  <Button variant="ghost" size="sm">
                    View Calendar
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data?.upcomingSchedule?.length === 0 ? (
                <p className="text-[var(--secondary-text)] text-center py-4">
                  No upcoming scheduled work
                </p>
              ) : (
                <div className="space-y-3">
                  {data?.upcomingSchedule?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="w-12 h-12 bg-[var(--teal)]/10 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-[var(--teal)]">
                          {new Date(item.scheduledDate).toLocaleDateString("en-US", {
                            month: "short",
                          })}
                        </span>
                        <span className="text-lg font-bold text-[var(--teal)]">
                          {new Date(item.scheduledDate).getDate()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.jobTitle}</p>
                        <p className="text-sm text-[var(--secondary-text)]">
                          {item.propertyName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Performance Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-3xl font-bold text-[var(--teal)]">
                    <Star className="h-8 w-8 fill-current" />
                    {data?.averageRating?.toFixed(1) || "0.0"}
                  </div>
                  <p className="text-sm text-[var(--secondary-text)] mt-1">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pending Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-3xl font-bold">{data?.pendingInvoices || 0}</p>
                <p className="text-sm text-[var(--secondary-text)]">Awaiting payment</p>
              </div>
              <Link href="/vendor/invoices">
                <Button variant="outline" className="w-full">
                  Manage Invoices
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/vendor/jobs?filter=quote_needed">
                <Button variant="ghost" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Submit Quote
                </Button>
              </Link>
              <Link href="/vendor/invoices/new">
                <Button variant="ghost" className="w-full justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Submit Invoice
                </Button>
              </Link>
              <Link href="/vendor/profile">
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
