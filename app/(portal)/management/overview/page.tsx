import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Building2,
  Home,
  Users,
  Wrench,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function ManagementOverviewPage() {
  // Mock data for demonstration
  const stats = [
    { label: "Associations", value: "12", change: "+2", icon: Building2 },
    { label: "Properties", value: "48", change: "+5", icon: Home },
    { label: "Units", value: "1,247", change: "+12", icon: Users },
    { label: "Open Requests", value: "23", change: "-3", icon: Wrench },
  ];

  const recentActivity = [
    { id: 1, text: "New maintenance request submitted for 6722 Ridgeland", time: "5 min ago", type: "request" },
    { id: 2, text: "Vendor ABC Plumbing accepted job MNT-2026-0047", time: "15 min ago", type: "vendor" },
    { id: 3, text: "Board approved work order for Oakwood Association", time: "1 hour ago", type: "approval" },
    { id: 4, text: "Inspection completed at 123 Main St", time: "2 hours ago", type: "inspection" },
  ];

  const urgentItems = [
    { id: 1, title: "Emergency leak - Unit 3S", priority: "emergency", due: "Now" },
    { id: 2, title: "HVAC repair - Building B", priority: "high", due: "Today" },
    { id: 3, title: "Board approval needed - Landscaping contract", priority: "medium", due: "Tomorrow" },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            Portfolio Overview
          </h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Welcome back. Here&apos;s what&apos;s happening across your properties.
          </p>
        </div>
        <button className="btn btn-primary">
          <TrendingUp className="h-4 w-4" />
          View Reports
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">{stat.label}</p>
                  <p className="text-3xl font-semibold text-[var(--main-text)] mt-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-600 mt-1">{stat.change} this month</p>
                </div>
                <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-[var(--teal)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b border-[var(--border-color)] last:border-0 last:pb-0"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--page-background)] flex items-center justify-center flex-shrink-0">
                    {activity.type === "request" && <Wrench className="h-4 w-4 text-[var(--teal)]" />}
                    {activity.type === "vendor" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {activity.type === "approval" && <Building2 className="h-4 w-4 text-[var(--gold)]" />}
                    {activity.type === "inspection" && <Home className="h-4 w-4 text-[var(--info)]" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[var(--main-text)]">{activity.text}</p>
                    <p className="text-xs text-[var(--secondary-text)] mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
              {urgentItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[var(--page-background)] rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`status-pill ${
                        item.priority === "emergency"
                          ? "status-urgent"
                          : item.priority === "high"
                          ? "status-pending"
                          : "status-scheduled"
                      }`}
                    >
                      {item.priority}
                    </span>
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
            <button className="w-full mt-4 text-sm text-[var(--teal)] hover:text-[var(--teal-hover)]">
              View all urgent items →
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-primary">
              <Wrench className="h-4 w-4" />
              New Maintenance Request
            </button>
            <button className="btn btn-secondary">
              <Building2 className="h-4 w-4" />
              Add Association
            </button>
            <button className="btn btn-secondary">
              <Home className="h-4 w-4" />
              Add Property
            </button>
            <button className="btn btn-secondary">
              <Users className="h-4 w-4" />
              Invite User
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
