"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Building2,
  Home,
  Users,
  Wrench,
  CheckSquare,
  ClipboardCheck,
  FileText,
  Scale,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowRight,
  MessageSquare,
} from "lucide-react";

interface DashboardStats {
  associations: number;
  properties: number;
  units: number;
  openRequests: number;
  pendingApprovals: number;
  overdueInspections: number;
  expiringDocuments: number;
  openCompliance: number;
}

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  propertyId: string;
  status: string;
  urgency: string;
  reportedDate: string;
  propertyName?: string;
}

interface ActivityItem {
  id: number;
  text: string;
  time: string;
  type: string;
}

interface UrgentItem {
  id: string;
  title: string;
  type: "maintenance" | "inspection" | "approval" | "compliance" | "document";
  urgency: "emergency" | "urgent" | "overdue" | "expiring" | "high";
  date: string;
  link: string;
}

export default function ManagementDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    associations: 0,
    properties: 0,
    units: 0,
    openRequests: 0,
    pendingApprovals: 0,
    overdueInspections: 0,
    expiringDocuments: 0,
    openCompliance: 0,
  });
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [urgentItems, setUrgentItems] = useState<UrgentItem[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Fetch user info first
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.success && userData.data) {
            setUserName(userData.data.firstName || userData.data.email?.split("@")[0] || "");
          }
        }
        
        // Fetch all data in parallel
        const [
          associationsRes,
          propertiesRes,
          unitsRes,
          maintenanceRes,
          approvalsRes,
          inspectionsRes,
          documentsRes,
          complianceRes,
        ] = await Promise.all([
          fetch("/api/associations?pageSize=100"),
          fetch("/api/properties?pageSize=100"),
          fetch("/api/units?pageSize=100"),
          fetch("/api/maintenance?pageSize=100"),
          fetch("/api/approvals?pageSize=100"),
          fetch("/api/inspections?pageSize=100"),
          fetch("/api/documents?pageSize=100"),
          fetch("/api/compliance?pageSize=100"),
        ]);

        // Parse responses
        const associationsData = await associationsRes.json();
        const propertiesData = await propertiesRes.json();
        const unitsData = await unitsRes.json();
        const maintenanceData = await maintenanceRes.json();
        const approvalsData = await approvalsRes.json();
        const inspectionsData = await inspectionsRes.json();
        const documentsData = await documentsRes.json();
        const complianceData = await complianceRes.json();

        // Calculate stats - handle nested data structure { data: { data: [...], pagination: {...} } }
        const associations = associationsData.success ? associationsData.data?.data || [] : [];
        const properties = propertiesData.success ? propertiesData.data?.data || [] : [];
        const units = unitsData.success ? unitsData.data?.data || [] : [];
        const maintenanceRequests = maintenanceData.success ? maintenanceData.data?.data || [] : [];
        const approvals = approvalsData.success ? approvalsData.data?.data || [] : [];
        const inspections = inspectionsData.success ? inspectionsData.data?.data || [] : [];
        const documents = documentsData.success ? documentsData.data?.data || [] : [];
        const compliance = complianceData.success ? complianceData.data?.data || [] : [];

        // Count open maintenance requests (not completed or closed)
        const openRequests = maintenanceRequests.filter(
          (r: MaintenanceRequest) => r.status !== "completed" && r.status !== "closed"
        ).length;

        // Count pending approvals
        const pendingApprovals = approvals.filter(
          (a: { status: string }) => a.status === "pending"
        ).length;

        // Count overdue inspections
        const today = new Date().toISOString().split("T")[0];
        const overdueInspections = inspections.filter(
          (i: { status: string; scheduledDate: string }) => 
            i.status === "scheduled" && i.scheduledDate && i.scheduledDate < today
        ).length;

        // Count expiring documents (expiring within 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const expiringDocuments = documents.filter(
          (d: { expiryDate: string }) => {
            if (!d.expiryDate) return false;
            const expiry = new Date(d.expiryDate);
            return expiry <= thirtyDaysFromNow && expiry >= new Date();
          }
        ).length;

        // Count open compliance matters
        const openCompliance = compliance.filter(
          (c: { status: string }) => c.status === "open"
        ).length;

        // Build urgent items list
        const urgent: UrgentItem[] = [];
        
        // Emergency/Urgent Maintenance
        maintenanceRequests
          .filter((m: { urgency?: string; status: string }) => 
            (m.urgency === "emergency" || m.urgency === "urgent") && 
            m.status !== "completed" && 
            m.status !== "closed"
          )
          .slice(0, 3)
          .forEach((m: { id: string; title: string; urgency?: string; reportedDate?: string }) => {
            urgent.push({
              id: m.id,
              title: m.title,
              type: "maintenance",
              urgency: m.urgency === "emergency" ? "emergency" : "urgent",
              date: m.reportedDate || new Date().toISOString(),
              link: `/management/maintenance/${m.id}`,
            });
          });
        
        // Overdue Inspections
        inspections
          .filter((i: { status: string; scheduledDate?: string }) => 
            i.status === "overdue" || 
            (i.status === "scheduled" && i.scheduledDate && i.scheduledDate < today)
          )
          .slice(0, 2)
          .forEach((i: { id: string; inspectionType?: string; scheduledDate?: string }) => {
            urgent.push({
              id: i.id,
              title: i.inspectionType || "Inspection",
              type: "inspection",
              urgency: "overdue",
              date: i.scheduledDate || new Date().toISOString(),
              link: `/management/inspections/${i.id}`,
            });
          });
        
        // Pending Approvals
        approvals
          .filter((a: { status: string; priority?: string }) => 
            a.status === "pending"
          )
          .slice(0, 2)
          .forEach((a: { id: string; title: string; requestedAt?: string; priority?: string }) => {
            urgent.push({
              id: a.id,
              title: a.title,
              type: "approval",
              urgency: a.priority === "high" || a.priority === "critical" ? "high" : "urgent",
              date: a.requestedAt || new Date().toISOString(),
              link: `/management/approvals/${a.id}`,
            });
          });
        
        // Critical/Open Compliance
        compliance
          .filter((c: { status: string; priority?: string; dueDate?: string }) => 
            c.status === "open" && 
            (c.priority === "critical" || c.priority === "high")
          )
          .slice(0, 2)
          .forEach((c: { id: string; title: string; dueDate?: string; priority?: string }) => {
            const isOverdue = c.dueDate && c.dueDate < today;
            urgent.push({
              id: c.id,
              title: c.title,
              type: "compliance",
              urgency: isOverdue ? "overdue" : c.priority === "critical" ? "emergency" : "urgent",
              date: c.dueDate || new Date().toISOString(),
              link: `/management/compliance/${c.id}`,
            });
          });
        
        // Expiring Documents
        documents
          .filter((d: { expiryDate?: string; status: string }) => {
            if (!d.expiryDate || d.status === "expired") return false;
            const expiry = new Date(d.expiryDate);
            const sevenDays = new Date();
            sevenDays.setDate(sevenDays.getDate() + 7);
            return expiry <= sevenDays && expiry >= new Date();
          })
          .slice(0, 2)
          .forEach((d: { id: string; title: string; expiryDate?: string }) => {
            urgent.push({
              id: d.id,
              title: d.title,
              type: "document",
              urgency: "expiring",
              date: d.expiryDate || new Date().toISOString(),
              link: `/management/documents/${d.id}`,
            });
          });
        
        // Sort by urgency level
        const urgencyOrder = { emergency: 0, overdue: 1, expiring: 2, urgent: 3, high: 4 };
        urgent.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
        
        setUrgentItems(urgent.slice(0, 8));

        setStats({
          associations: associations.length,
          properties: properties.length,
          units: units.length,
          openRequests,
          pendingApprovals,
          overdueInspections,
          expiringDocuments,
          openCompliance,
        });

        // Set recent maintenance requests (last 5)
        const sortedRequests = maintenanceRequests
          .sort((a: MaintenanceRequest, b: MaintenanceRequest) => 
            new Date(b.reportedDate).getTime() - new Date(a.reportedDate).getTime()
          )
          .slice(0, 5);
        
        // Add property names to requests
        const requestsWithPropertyNames = sortedRequests.map((req: MaintenanceRequest) => ({
          ...req,
          propertyName: properties.find((p: { id: string; name: string }) => p.id === req.propertyId)?.name || req.propertyId,
        }));
        
        setMaintenanceRequests(requestsWithPropertyNames);

        // Generate recent activity from real data
        const activity: ActivityItem[] = [];
        
        // Add recent maintenance requests
        maintenanceRequests
          .slice(0, 3)
          .forEach((req: MaintenanceRequest, index: number) => {
            activity.push({
              id: index + 1,
              text: `Maintenance request "${req.title}" submitted`,
              time: formatTimeAgo(req.reportedDate),
              type: "request",
            });
          });

        // Add recent approvals
        approvals
          .filter((a: { status: string }) => a.status === "pending")
          .slice(0, 2)
          .forEach((appr: { title: string }, index: number) => {
            activity.push({
              id: activity.length + 1,
              text: `Approval requested: ${appr.title}`,
              time: "Recently",
              type: "approval",
            });
          });

        setRecentActivity(activity.length > 0 ? activity : []);
        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">Dashboard</h1>
            <p className="text-[var(--secondary-text)] mt-1">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">Dashboard</h1>
            <p className="text-[var(--error)] mt-1">{error}</p>
          </div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            Dashboard
          </h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Welcome back{userName ? `, ${userName}` : ""}. Here&apos;s what&apos;s happening across your properties.
          </p>
        </div>
        <Link href="/management/reports">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-white border-2 border-transparent">
            <TrendingUp className="h-4 w-4 mr-2" />
            View Reports
          </Button>
        </Link>
      </div>

      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Associations</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {stats.associations}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-[var(--teal)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Properties</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {stats.properties}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Home className="h-6 w-6 text-[var(--teal)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Units</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {stats.units}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-[var(--teal)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Open Requests</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {stats.openRequests}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Wrench className="h-6 w-6 text-[var(--teal)]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Pending Approvals</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {stats.pendingApprovals}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Overdue Inspections</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {stats.overdueInspections}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Expiring Documents</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {stats.expiringDocuments}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Compliance Matters</p>
                <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                  {stats.openCompliance}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Scale className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link
              href="/management/workflow-activity"
              className="text-sm text-[var(--teal)] hover:text-[var(--teal-hover)] flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-4 border-b border-[var(--border-color)] last:border-0 last:pb-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--page-background)] flex items-center justify-center flex-shrink-0">
                      {activity.type === "request" ? (
                        <Wrench className="h-4 w-4 text-[var(--teal)]" />
                      ) : activity.type === "approval" ? (
                        <CheckSquare className="h-4 w-4 text-[var(--gold)]" />
                      ) : (
                        <Clock className="h-4 w-4 text-[var(--secondary-text)]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[var(--main-text)]">{activity.text}</p>
                      <p className="text-xs text-[var(--secondary-text)] mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm mt-1">Activity will appear here as you use the system.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Urgent Items Only */}
        <div className="space-y-6">
          {/* Urgent Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[var(--error)]" />
                Urgent Items
                {urgentItems.length > 0 && (
                  <Badge className="bg-red-100 text-red-700 ml-2">{urgentItems.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {urgentItems.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {urgentItems.map((item) => (
                    <Link key={item.id} href={item.link} className="block">
                      <div className="p-3 bg-[var(--page-background)] rounded-lg hover:bg-[var(--border-color)] transition-colors">
                        <div className="flex items-center justify-between">
                          <Badge 
                            className={
                              item.urgency === "emergency" 
                                ? "bg-red-100 text-red-700" 
                                : item.urgency === "overdue"
                                ? "bg-red-100 text-red-700"
                                : item.urgency === "expiring"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-orange-100 text-orange-700"
                            }
                          >
                            {item.urgency === "emergency" && "Emergency"}
                            {item.urgency === "overdue" && "Overdue"}
                            {item.urgency === "expiring" && "Expiring"}
                            {item.urgency === "urgent" && "Urgent"}
                            {item.urgency === "high" && "High Priority"}
                          </Badge>
                          <span className="text-xs text-[var(--secondary-text)] capitalize">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-[var(--main-text)] mt-2 line-clamp-2">
                          {item.title}
                        </p>
                        <p className="text-xs text-[var(--secondary-text)] mt-1">
                          {formatTimeAgo(item.date)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--secondary-text)]">
                  <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No urgent items</p>
                  <p className="text-xs mt-1">Everything is up to date!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Maintenance Requests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Maintenance Requests</CardTitle>
          <Link
            href="/management/maintenance"
            className="text-sm text-[var(--teal)] hover:text-[var(--teal-hover)] flex items-center gap-1"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {maintenanceRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                      Request
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                      Property
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                      Priority
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/management/maintenance/${request.id}`}
                          className="text-sm font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                        >
                          {request.title}
                        </Link>
                        <p className="text-xs text-[var(--secondary-text)]">
                          {request.requestNumber}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--secondary-text)]">
                        {request.propertyName || request.propertyId}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            request.status === "new"
                              ? "bg-blue-100 text-blue-700"
                              : request.status === "vendor_assigned"
                              ? "bg-teal-100 text-teal-700"
                              : request.status === "in_progress"
                              ? "bg-amber-100 text-amber-700"
                              : request.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {request.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            request.urgency === "emergency"
                              ? "bg-red-100 text-red-700"
                              : request.urgency === "urgent"
                              ? "bg-amber-100 text-amber-700"
                              : request.urgency === "normal"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {request.urgency}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--secondary-text)]">
                        {new Date(request.reportedDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No maintenance requests yet</p>
              <p className="text-sm mt-1">Create your first request to see it here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
