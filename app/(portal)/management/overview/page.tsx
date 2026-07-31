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
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  Activity,
} from "lucide-react";
import { mockGhlAdapter } from "@/lib/ghl/mock-adapter";

// Dashboard data fetch function - will be replaced with real GHL data
async function getDashboardData() {
  // In production, this would fetch from GHL via the adapter
  const associations = await mockGhlAdapter.getAllAssociations();
  const maintenanceRequests = await mockGhlAdapter.getMaintenanceRequestsByAssociation(
    associations[0]?.id || ""
  );

  return {
    stats: {
      associations: associations.length,
      properties: associations.reduce((sum, a) => sum + a.propertyCount, 0),
      units: associations.reduce((sum, a) => sum + a.unitCount, 0),
      openRequests: maintenanceRequests.filter((r) => r.status !== "Completed" && r.status !== "Closed").length,
      pendingApprovals: 3,
      overdueInspections: 1,
      expiringDocuments: 2,
      openCompliance: 0,
    },
    recentActivity: [
      {
        id: 1,
        text: "New maintenance request submitted for 6722 Ridgeland",
        time: "5 min ago",
        type: "request",
        icon: Wrench,
        color: "text-[var(--teal)]",
      },
      {
        id: 2,
        text: "Vendor ABC Plumbing accepted job MNT-2026-0047",
        time: "15 min ago",
        type: "vendor",
        icon: CheckCircle2,
        color: "text-green-600",
      },
      {
        id: 3,
        text: "Board approved work order for Oakwood Association",
        time: "1 hour ago",
        type: "approval",
        icon: CheckSquare,
        color: "text-[var(--gold)]",
      },
      {
        id: 4,
        text: "Inspection completed at 123 Main St",
        time: "2 hours ago",
        type: "inspection",
        icon: ClipboardCheck,
        color: "text-[var(--info)]",
      },
      {
        id: 5,
        text: "Document uploaded: Insurance Certificate 2026",
        time: "3 hours ago",
        type: "document",
        icon: FileText,
        color: "text-blue-600",
      },
    ],
    urgentItems: [
      {
        id: 1,
        title: "Emergency leak - Unit 3S",
        priority: "emergency",
        due: "Now",
        type: "maintenance",
      },
      {
        id: 2,
        title: "HVAC repair - Building B",
        priority: "high",
        due: "Today",
        type: "maintenance",
      },
      {
        id: 3,
        title: "Board approval needed - Landscaping contract",
        priority: "medium",
        due: "Tomorrow",
        type: "approval",
      },
    ],
    maintenanceRequests: maintenanceRequests.slice(0, 5),
  };
}

export default async function ManagementDashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            Dashboard
          </h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Welcome back. Here&apos;s what&apos;s happening across your properties.
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
                  {data.stats.associations}
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
                  {data.stats.properties}
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
                  {data.stats.units}
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
                  {data.stats.openRequests}
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
                  {data.stats.pendingApprovals}
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
                  {data.stats.overdueInspections}
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
                  {data.stats.expiringDocuments}
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
                  {data.stats.openCompliance}
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
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b border-[var(--border-color)] last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--page-background)] flex items-center justify-center flex-shrink-0">
                    <activity.icon className={`h-4 w-4 ${activity.color}`} />
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
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Urgent Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[var(--error)]" />
                Urgent Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.urgentItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[var(--page-background)] rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        className={
                          item.priority === "emergency"
                            ? "bg-red-100 text-red-700"
                            : item.priority === "high"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }
                      >
                        {item.priority}
                      </Badge>
                      <span className="text-xs text-[var(--secondary-text)] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.due}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[var(--main-text)] mt-2">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/management/maintenance"
                className="w-full mt-4 text-sm text-[var(--teal)] hover:text-[var(--teal-hover)] flex items-center justify-center gap-1"
              >
                View all urgent items
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/management/maintenance/new">
                  <Button className="w-full justify-start" variant="outline">
                    <Wrench className="h-4 w-4 mr-2" />
                    New Maintenance Request
                  </Button>
                </Link>
                <Link href="/management/people/new">
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Add Owner or Occupant
                  </Button>
                </Link>
                <Link href="/management/communications/announcement">
                  <Button className="w-full justify-start" variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Announcement
                  </Button>
                </Link>
                <Link href="/management/approvals/request">
                  <Button className="w-full justify-start" variant="outline">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Request Board Approval
                  </Button>
                </Link>
              </div>
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
                {data.maintenanceRequests.map((request) => (
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
                      {request.propertyId}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          request.status === "New"
                            ? "bg-blue-100 text-blue-700"
                            : request.status === "Vendor Assigned"
                            ? "bg-teal-100 text-teal-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {request.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          request.urgency === "emergency"
                            ? "bg-red-100 text-red-700"
                            : request.urgency === "high"
                            ? "bg-amber-100 text-amber-700"
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
        </CardContent>
      </Card>
    </div>
  );
}
