"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessSelector } from "@/components/business/BusinessSelector";
import {
  Building2,
  Home,
  Users,
  Wrench,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Clock,
  Calendar,
  ClipboardCheck,
  FileText,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  Eye,
} from "lucide-react";

interface Business {
  id: string;
  name: string;
  code: string;
}

interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  totalContacts: number;
  openMaintenanceRequests: number;
  urgentMaintenance: number;
  inspectionsDue: number;
  pendingApprovals: number;
  occupancyRate: number;
}

interface PriorityItem {
  id: string;
  type: "maintenance" | "inspection" | "approval" | "compliance";
  title: string;
  description: string;
  dueDate?: string;
  urgency: "low" | "medium" | "high" | "critical";
  status: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  userName?: string;
}

export default function DashboardPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setError(null);

      // Get current business from session
      const sessionResponse = await fetch("/api/auth/me");
      const sessionResult = await sessionResponse.json();
      
      if (!sessionResult.user?.businessId) {
        setError("No business selected. Please select a business first.");
        return;
      }

      const businessId = sessionResult.user.businessId;

      // Load business details
      const businessResponse = await fetch(`/api/businesses/${businessId}`);
      const businessResult = await businessResponse.json();
      if (businessResult.success) {
        setBusiness(businessResult.data);
      }

      // Load stats
      await loadStats(businessId);

      // Load priorities
      await loadPriorities(businessId);

      // Load recent activity
      await loadRecentActivity(businessId);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setError(error instanceof Error ? error.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStats(businessId: string) {
    try {
      // Load properties count
      const propResponse = await fetch(`/api/properties?businessId=${businessId}&limit=1`);
      const propResult = await propResponse.json();
      const totalProperties = propResult.data?.total || 0;

      // Load units count
      const unitsResponse = await fetch(`/api/units?businessId=${businessId}&limit=1`);
      const unitsResult = await unitsResponse.json();
      const totalUnits = unitsResult.data?.total || 0;

      // Load contacts count
      const contactsResponse = await fetch(`/api/contacts?businessId=${businessId}&limit=1`);
      const contactsResult = await contactsResponse.json();
      const totalContacts = contactsResult.data?.total || 0;

      // Load open maintenance
      const maintResponse = await fetch(`/api/maintenance?businessId=${businessId}&status=new,in_progress,scheduled&limit=1`);
      const maintResult = await maintResponse.json();
      const openMaintenanceRequests = maintResult.data?.total || 0;

      // Load urgent maintenance
      const urgentMaintResponse = await fetch(`/api/maintenance?businessId=${businessId}&urgency=high,emergency&status=new,in_progress&limit=1`);
      const urgentMaintResult = await urgentMaintResponse.json();
      const urgentMaintenance = urgentMaintResult.data?.total || 0;

      // Load inspections due
      const inspectionsResponse = await fetch(`/api/inspections?businessId=${businessId}&status=scheduled&limit=1`);
      const inspectionsResult = await inspectionsResponse.json();
      const inspectionsDue = inspectionsResult.data?.total || 0;

      // Load pending approvals
      const approvalsResponse = await fetch(`/api/approvals?businessId=${businessId}&status=pending&limit=1`);
      const approvalsResult = await approvalsResponse.json();
      const pendingApprovals = approvalsResult.data?.total || 0;

      setStats({
        totalProperties,
        totalUnits,
        totalContacts,
        openMaintenanceRequests,
        urgentMaintenance,
        inspectionsDue,
        pendingApprovals,
        occupancyRate: totalUnits > 0 ? 85 : 0, // Would calculate from actual occupancy data
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async function loadPriorities(businessId: string) {
    try {
      const priorities: PriorityItem[] = [];

      // Load urgent maintenance
      const maintResponse = await fetch(`/api/maintenance?businessId=${businessId}&urgency=high,emergency&status=new,in_progress&limit=3`);
      const maintResult = await maintResponse.json();
      if (maintResult.success) {
        maintResult.data.data.forEach((item: any) => {
          priorities.push({
            id: item.id,
            type: "maintenance",
            title: item.title,
            description: `Maintenance request - ${item.status}`,
            urgency: item.urgency,
            status: item.status,
          });
        });
      }

      // Load upcoming inspections
      const inspectionResponse = await fetch(`/api/inspections?businessId=${businessId}&status=scheduled&limit=3&sortBy=scheduled_date&sortOrder=asc`);
      const inspectionResult = await inspectionResponse.json();
      if (inspectionResult.success) {
        inspectionResult.data.data.forEach((item: any) => {
          priorities.push({
            id: item.id,
            type: "inspection",
            title: `Inspection: ${item.inspection_type}`,
            description: `Scheduled for ${new Date(item.scheduled_date).toLocaleDateString()}`,
            dueDate: item.scheduled_date,
            urgency: "medium",
            status: item.status,
          });
        });
      }

      // Load pending approvals
      const approvalResponse = await fetch(`/api/approvals?businessId=${businessId}&status=pending&limit=2`);
      const approvalResult = await approvalResponse.json();
      if (approvalResult.success) {
        approvalResult.data.data.forEach((item: any) => {
          priorities.push({
            id: item.id,
            type: "approval",
            title: item.title,
            description: `Approval request - ${item.approval_type}`,
            urgency: "medium",
            status: item.status,
          });
        });
      }

      // Sort by urgency
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      priorities.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

      setPriorities(priorities.slice(0, 5));
    } catch (error) {
      console.error("Error loading priorities:", error);
    }
  }

  async function loadRecentActivity(businessId: string) {
    try {
      const activities: RecentActivity[] = [];

      // Load recent maintenance
      const maintResponse = await fetch(`/api/maintenance?businessId=${businessId}&limit=3&sortBy=created_at&sortOrder=desc`);
      const maintResult = await maintResponse.json();
      if (maintResult.success) {
        maintResult.data.data.forEach((item: any) => {
          activities.push({
            id: `maint-${item.id}`,
            type: "maintenance",
            description: `New maintenance: ${item.title}`,
            createdAt: item.created_at,
          });
        });
      }

      // Sort by date
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error("Error loading recent activity:", error);
    }
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <Badge className="bg-red-100 text-red-700">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-100 text-orange-700">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-700">Medium</Badge>;
      case "low":
        return <Badge className="bg-blue-100 text-blue-700">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Normal</Badge>;
    }
  };

  const getPriorityIcon = (type: PriorityItem["type"]) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-5 w-5" />;
      case "inspection":
        return <ClipboardCheck className="h-5 w-5" />;
      case "approval":
        return <FileText className="h-5 w-5" />;
      case "compliance":
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getPriorityLink = (item: PriorityItem) => {
    switch (item.type) {
      case "maintenance":
        return `/management/maintenance/${item.id}`;
      case "inspection":
        return `/management/inspections/${item.id}`;
      case "approval":
        return `/management/approvals/${item.id}`;
      case "compliance":
        return `/management/compliance/${item.id}`;
      default:
        return `/management/maintenance/${item.id}`;
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
      <div className="space-y-6">
        {/* Header with Business Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">Dashboard</h1>
            <p className="text-[var(--secondary-text)] mt-1">
              What you need to focus on now
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BusinessSelector 
              onBusinessSelect={() => {
                setError(null);
                loadDashboardData();
              }}
            />
            <Link href="/management/portfolio">
              <Button variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                View Portfolio
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Message */}
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-red-500">{error}</p>
          <Button onClick={loadDashboardData} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            {business?.name || "Dashboard"}
          </h1>
          <p className="text-[var(--secondary-text)] mt-1">
            What you need to focus on now
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BusinessSelector 
            selectedBusinessId={business?.id} 
            onBusinessSelect={(id) => {
              setBusiness(null);
              loadDashboardData();
            }}
          />
          <Link href="/management/portfolio">
            <Button variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              View Portfolio
            </Button>
          </Link>
        </div>
      </div>

      {/* Today's Focus - Priority Items */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Today's Priorities
          </CardTitle>
          <span className="text-sm text-amber-700">
            {priorities.length} items need attention
          </span>
        </CardHeader>
        <CardContent>
          {priorities.length === 0 ? (
            <div className="text-center py-6 text-amber-800">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-600" />
              <p className="font-medium">All caught up!</p>
              <p className="text-sm">No urgent items requiring attention</p>
            </div>
          ) : (
            <div className="space-y-3">
              {priorities.map((item) => (
                <Link
                  key={item.id}
                  href={getPriorityLink(item) as any}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.urgency === "critical" ? "bg-red-100 text-red-600" :
                    item.urgency === "high" ? "bg-orange-100 text-orange-600" :
                    "bg-amber-100 text-amber-600"
                  }`}>
                    {getPriorityIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--main-text)] truncate">{item.title}</p>
                    <p className="text-sm text-[var(--secondary-text)]">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getUrgencyBadge(item.urgency)}
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Properties</p>
                <p className="text-2xl font-semibold">{stats?.totalProperties || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Units</p>
                <p className="text-2xl font-semibold">{stats?.totalUnits || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Open Requests</p>
                <p className="text-2xl font-semibold">{stats?.openMaintenanceRequests || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Inspections Due</p>
                <p className="text-2xl font-semibold">{stats?.inspectionsDue || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Link href="/management/maintenance/new">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Wrench className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="text-center">
                    <span className="font-medium block">New Maintenance</span>
                    <span className="text-xs text-gray-500">Create a request</span>
                  </div>
                </Button>
              </Link>

              <Link href="/management/inspections/new">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <ClipboardCheck className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <span className="font-medium block">Schedule Inspection</span>
                    <span className="text-xs text-gray-500">Book an inspection</span>
                  </div>
                </Button>
              </Link>

              <Link href="/management/people/new">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <span className="font-medium block">Add Contact</span>
                    <span className="text-xs text-gray-500">New resident/owner</span>
                  </div>
                </Button>
              </Link>

              <Link href="/management/properties/new">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <Home className="h-6 w-6 text-teal-600" />
                  </div>
                  <div className="text-center">
                    <span className="font-medium block">Add Property</span>
                    <span className="text-xs text-gray-500">New building</span>
                  </div>
                </Button>
              </Link>

              <Link href="/management/approvals/new">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <span className="font-medium block">New Approval</span>
                    <span className="text-xs text-gray-500">Request approval</span>
                  </div>
                </Button>
              </Link>

              <Link href="/management/documents/new">
                <Button variant="outline" className="w-full h-auto py-6 flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="text-center">
                    <span className="font-medium block">Add Document</span>
                    <span className="text-xs text-gray-500">Upload file</span>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--teal)]" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {activity.type === "maintenance" && <Wrench className="h-4 w-4 text-amber-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[var(--main-text)]">{activity.description}</p>
                      <p className="text-xs text-[var(--secondary-text)]">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Occupancy Rate</p>
              <p className="text-2xl font-semibold">{stats?.occupancyRate || 0}%</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Pending Approvals</p>
              <p className="text-2xl font-semibold">{stats?.pendingApprovals || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Total Contacts</p>
              <p className="text-2xl font-semibold">{stats?.totalContacts || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
