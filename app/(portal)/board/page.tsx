"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Calendar,
  Users,
  Building2,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  ArrowRight,
  Bell,
  TrendingUp,
  DollarSign,
} from "lucide-react";

interface BoardDashboardData {
  pendingApprovals: number;
  urgentMaintenance: number;
  overdueMaintenance: number;
  upcomingInspections: number;
  openCompliance: number;
  documentsRequiringAction: number;
  upcomingMeetings: number;
  recentActivity: ActivityItem[];
  announcements: Announcement[];
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

interface Announcement {
  id: string;
  title: string;
  date: string;
  isNew: boolean;
}

export default function BoardDashboardPage() {
  const [data, setData] = useState<BoardDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/board/dashboard");
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
      title: "Pending Approvals",
      value: data?.pendingApprovals || 0,
      icon: CheckCircle2,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      href: "/board/approvals",
    },
    {
      title: "Urgent Maintenance",
      value: data?.urgentMaintenance || 0,
      icon: Wrench,
      color: "text-red-600",
      bgColor: "bg-red-50",
      href: "/board/maintenance",
    },
    {
      title: "Overdue Items",
      value: (data?.overdueMaintenance || 0) + (data?.openCompliance || 0),
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      href: "/board/compliance",
    },
    {
      title: "Upcoming Inspections",
      value: data?.upcomingInspections || 0,
      icon: ClipboardCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/board/inspections",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Board Dashboard</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Association overview and pending actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Link href="/board/approvals">
            <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
              View Approvals
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
        {/* Left Column - Action Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-[var(--teal)]" />
                  Pending Approvals
                </CardTitle>
                <Link href="/board/approvals">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data?.pendingApprovals === 0 ? (
                <p className="text-[var(--secondary-text)] text-center py-4">
                  No pending approvals
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium">Maintenance Quote Approval</p>
                        <p className="text-sm text-[var(--secondary-text)]">$2,500 - Roof Repair</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium">Vendor Contract Renewal</p>
                        <p className="text-sm text-[var(--secondary-text)]">Landscaping Services 2024</p>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Requiring Action */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[var(--teal)]" />
                  Documents Requiring Action
                </CardTitle>
                <Link href="/board/documents">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data?.documentsRequiringAction === 0 ? (
                <p className="text-[var(--secondary-text)] text-center py-4">
                  No documents requiring action
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[var(--secondary-text)]" />
                      <div>
                        <p className="font-medium">Q3 Financial Report</p>
                        <p className="text-sm text-[var(--secondary-text)]">Requires acknowledgment</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Review
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Meetings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[var(--teal)]" />
                  Upcoming Meetings
                </CardTitle>
                <Link href="/board/meetings">
                  <Button variant="ghost" size="sm">
                    View Calendar
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data?.upcomingMeetings === 0 ? (
                <p className="text-[var(--secondary-text)] text-center py-4">
                  No upcoming meetings
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[var(--teal)]/10 rounded-lg flex flex-col items-center justify-center">
                        <span className="text-xs font-medium text-[var(--teal)]">AUG</span>
                        <span className="text-lg font-bold text-[var(--teal)]">15</span>
                      </div>
                      <div>
                        <p className="font-medium">Monthly Board Meeting</p>
                        <p className="text-sm text-[var(--secondary-text)]">7:00 PM - Community Center</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Packet
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Announcements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Announcements</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.announcements?.length === 0 ? (
                <p className="text-sm text-[var(--secondary-text)]">No announcements</p>
              ) : (
                <div className="space-y-3">
                  {data?.announcements?.map((announcement) => (
                    <div key={announcement.id} className="border-b last:border-0 pb-3 last:pb-0">
                      <div className="flex items-start gap-2">
                        {announcement.isNew && (
                          <Badge className="bg-[var(--teal)] text-white text-xs">New</Badge>
                        )}
                        <p className="font-medium text-sm">{announcement.title}</p>
                      </div>
                      <p className="text-xs text-[var(--secondary-text)] mt-1">
                        {new Date(announcement.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.recentActivity?.length === 0 ? (
                <p className="text-sm text-[var(--secondary-text)]">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {data?.recentActivity?.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-[var(--teal)] mt-2" />
                      <div>
                        <p>{activity.description}</p>
                        <p className="text-xs text-[var(--secondary-text)]">
                          {activity.user} • {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/board/association">
                <Button variant="ghost" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  Association Summary
                </Button>
              </Link>
              <Link href="/board/directory">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Board Directory
                </Button>
              </Link>
              <Link href="/board/reports">
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Financial Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
