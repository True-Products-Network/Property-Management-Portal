"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Wrench,
  Scale,
  FileText,
  DollarSign,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Home,
  Phone,
} from "lucide-react";

interface Association {
  id: string;
  associationName: string;
  shortName?: string;
  status: string;
  totalUnits: number;
  totalProperties: number;
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
}

interface ComplianceMatter {
  id: string;
  matterId: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string;
  category?: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
  userName?: string;
}

interface DashboardStats {
  totalContacts: number;
  totalProperties: number;
  totalUnits: number;
  openMaintenanceRequests: number;
  urgentComplianceItems: number;
  pendingPayments: number;
}

export default function AssociationDashboardPage({ params }: { params: { id: string } }) {
  const [association, setAssociation] = useState<Association | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentMaintenance, setRecentMaintenance] = useState<MaintenanceRequest[]>([]);
  const [urgentItems, setUrgentItems] = useState<(MaintenanceRequest | ComplianceMatter)[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const associationId = params.id;

  useEffect(() => {
    loadDashboardData();
  }, [associationId]);

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setError(null);

      // Load association details
      const assocResponse = await fetch(`/api/associations/${associationId}`);
      const assocResult = await assocResponse.json();
      if (assocResult.success) {
        setAssociation(assocResult.data);
      }

      // Load stats
      await loadStats();

      // Load recent maintenance
      await loadRecentMaintenance();

      // Load urgent items
      await loadUrgentItems();

      // Load recent activities
      await loadRecentActivities();
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setError(error instanceof Error ? error.message : "Failed to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStats() {
    try {
      // Load contacts count
      const contactsResponse = await fetch(`/api/contacts?associationId=${associationId}&limit=1`);
      const contactsResult = await contactsResponse.json();
      const totalContacts = contactsResult.data?.total || 0;

      // Load properties count
      const propertiesResponse = await fetch(`/api/properties?associationId=${associationId}&limit=1`);
      const propertiesResult = await propertiesResponse.json();
      const totalProperties = propertiesResult.data?.total || 0;

      // Load units count
      const unitsResponse = await fetch(`/api/units?associationId=${associationId}&limit=1`);
      const unitsResult = await unitsResponse.json();
      const totalUnits = unitsResult.data?.total || 0;

      // Load open maintenance
      const maintenanceResponse = await fetch(`/api/maintenance?associationId=${associationId}&status=new,in_progress,scheduled&limit=1`);
      const maintenanceResult = await maintenanceResponse.json();
      const openMaintenanceRequests = maintenanceResult.data?.total || 0;

      // Load urgent compliance
      const complianceResponse = await fetch(`/api/compliance?associationId=${associationId}&priority=high,critical&status=open&limit=1`);
      const complianceResult = await complianceResponse.json();
      const urgentComplianceItems = complianceResult.data?.total || 0;

      // Load pending payments
      const paymentsResponse = await fetch(`/api/payments?associationId=${associationId}&status=pending&limit=1`);
      const paymentsResult = await paymentsResponse.json();
      const pendingPayments = paymentsResult.data?.total || 0;

      setStats({
        totalContacts,
        totalProperties,
        totalUnits,
        openMaintenanceRequests,
        urgentComplianceItems,
        pendingPayments,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }

  async function loadRecentMaintenance() {
    try {
      const response = await fetch(`/api/maintenance?associationId=${associationId}&limit=5&sortBy=created_at&sortOrder=desc`);
      const result = await response.json();
      if (result.success) {
        setRecentMaintenance(result.data.data || []);
      }
    } catch (error) {
      console.error("Error loading recent maintenance:", error);
    }
  }

  async function loadUrgentItems() {
    try {
      // Load urgent maintenance
      const maintResponse = await fetch(`/api/maintenance?associationId=${associationId}&urgency=high,emergency&status=new,in_progress&limit=3`);
      const maintResult = await maintResponse.json();
      const urgentMaintenance = (maintResult.data?.data || []).map((item: MaintenanceRequest) => ({
        ...item,
        itemType: 'maintenance',
      }));

      // Load urgent compliance
      const complianceResponse = await fetch(`/api/compliance?associationId=${associationId}&priority=high,critical&status=open&limit=3`);
      const complianceResult = await complianceResponse.json();
      const urgentCompliance = (complianceResult.data?.data || []).map((item: ComplianceMatter) => ({
        ...item,
        itemType: 'compliance',
      }));

      setUrgentItems([...urgentMaintenance, ...urgentCompliance].slice(0, 5));
    } catch (error) {
      console.error("Error loading urgent items:", error);
    }
  }

  async function loadRecentActivities() {
    try {
      // This would ideally come from an activity log API
      // For now, we'll combine recent items from various sources
      const activities: RecentActivity[] = [];
      
      // Add recent maintenance as activities
      const maintResponse = await fetch(`/api/maintenance?associationId=${associationId}&limit=3&sortBy=created_at&sortOrder=desc`);
      const maintResult = await maintResponse.json();
      if (maintResult.success) {
        maintResult.data.data.forEach((item: MaintenanceRequest) => {
          activities.push({
            id: `maint-${item.id}`,
            type: 'maintenance',
            description: `Maintenance request created: ${item.title}`,
            createdAt: item.createdAt,
          });
        });
      }

      // Sort by date and take top 5
      activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error("Error loading recent activities:", error);
    }
  }

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case "emergency":
        return <Badge className="bg-red-100 text-red-700">Emergency</Badge>;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-700">New</Badge>;
      case "in_progress":
        return <Badge className="bg-amber-100 text-amber-700">In Progress</Badge>;
      case "scheduled":
        return <Badge className="bg-purple-100 text-purple-700">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            {association?.associationName || "Association Dashboard"}
          </h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Overview of your association's activity and status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/management/associations/${associationId}`}>
            <Button variant="outline">
              <Building2 className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Contacts</p>
                <p className="text-2xl font-semibold">{stats?.totalContacts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <Building2 className="h-5 w-5 text-purple-600" />
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
                <p className="text-sm text-[var(--secondary-text)]">Open Maintenance</p>
                <p className="text-2xl font-semibold">{stats?.openMaintenanceRequests || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Urgent Items</p>
                <p className="text-2xl font-semibold">{stats?.urgentComplianceItems || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Pending Payments</p>
                <p className="text-2xl font-semibold">{stats?.pendingPayments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Maintenance */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[var(--teal)]" />
              Recent Maintenance Requests
            </CardTitle>
            <Link href={`/management/maintenance?associationId=${associationId}`}>
              <Button variant="ghost" size="sm" className="text-[var(--teal)]">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentMaintenance.length === 0 ? (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent maintenance requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMaintenance.map((request) => (
                  <Link
                    key={request.id}
                    href={`/management/maintenance/${request.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--page-background)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-[var(--teal)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--main-text)]">{request.title}</p>
                        <p className="text-sm text-[var(--secondary-text)]">
                          {request.requestNumber} • {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getUrgencyBadge(request.urgency)}
                      {getStatusBadge(request.status)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Urgent Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Urgent Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentItems.length === 0 ? (
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>No urgent items</p>
                <p className="text-sm">Everything is on track!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentItems.map((item: any) => (
                  <Link
                    key={item.id}
                    href={item.itemType === 'maintenance' 
                      ? `/management/maintenance/${item.id}`
                      : `/management/compliance/${item.id}`
                    }
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--page-background)] transition-colors"
                  >
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.itemType === 'maintenance' ? (
                        <Wrench className="h-4 w-4 text-red-500" />
                      ) : (
                        <Scale className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--main-text)] truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.urgency && getUrgencyBadge(item.urgency)}
                        {item.priority && getPriorityBadge(item.priority)}
                        {item.dueDate && (
                          <span className="text-xs text-red-600">
                            Due {new Date(item.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--teal)]" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--page-background)] transition-colors"
                >
                  <div className="w-8 h-8 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                    {activity.type === 'maintenance' && <Wrench className="h-4 w-4 text-[var(--teal)]" />}
                    {activity.type === 'compliance' && <Scale className="h-4 w-4 text-blue-500" />}
                    {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-green-500" />}
                    {activity.type === 'document' && <FileText className="h-4 w-4 text-amber-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-[var(--main-text)]">{activity.description}</p>
                    <p className="text-sm text-[var(--secondary-text)]">
                      {new Date(activity.createdAt).toLocaleString()}
                      {activity.userName && ` • ${activity.userName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href={`/management/maintenance/new?associationId=${associationId}`}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
            <Wrench className="h-6 w-6 text-[var(--teal)]" />
            <span className="text-sm">New Maintenance</span>
          </Button>
        </Link>
        <Link href={`/management/compliance/new?associationId=${associationId}`}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
            <Scale className="h-6 w-6 text-blue-500" />
            <span className="text-sm">New Compliance</span>
          </Button>
        </Link>
        <Link href={`/management/people/new?associationId=${associationId}`}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
            <Users className="h-6 w-6 text-green-500" />
            <span className="text-sm">New Contact</span>
          </Button>
        </Link>
        <Link href={`/management/documents/new?associationId=${associationId}`}>
          <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2">
            <FileText className="h-6 w-6 text-amber-500" />
            <span className="text-sm">New Document</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
