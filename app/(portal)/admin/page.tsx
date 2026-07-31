import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  Users,
  Shield,
  Workflow,
  Settings,
  List,
  FileText,
  Activity,
  AlertTriangle,
} from "lucide-react";

export default async function AdminHomePage() {
  const user = await getSession();

  if (!user || !isAdmin(user.roles)) {
    redirect("/access-denied");
  }

  const adminCards = [
    {
      title: "User Maintenance",
      description: "Invite, manage, and suspend portal users",
      href: "/admin/users",
      icon: Users,
      count: "24 users",
    },
    {
      title: "Roles & Permissions",
      description: "Configure portal roles and access levels",
      href: "/admin/roles",
      icon: Shield,
      count: "6 roles",
    },
    {
      title: "GHL Role Mapping",
      description: "Map GHL Contact Roles to portal permissions",
      href: "/admin/ghl-mapping",
      icon: Workflow,
      count: "12 mappings",
    },
    {
      title: "Workflow Settings",
      description: "Configure workflow triggers and templates",
      href: "/admin/workflows",
      icon: Activity,
      count: "28 workflows",
    },
    {
      title: "Integrations",
      description: "Manage GHL and payment processor connections",
      href: "/admin/integrations",
      icon: Settings,
      count: "2 connected",
    },
    {
      title: "System Lists",
      description: "Manage dropdown values and categories",
      href: "/admin/lists",
      icon: List,
      count: "15 lists",
    },
    {
      title: "Audit Log",
      description: "View system activity and security events",
      href: "/admin/audit",
      icon: FileText,
      count: "1,247 events",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">
          Admin Home
        </h1>
        <p className="text-[var(--secondary-text)] mt-1">
          System administration and configuration
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Settings className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">GHL Connection</p>
                <p className="font-medium text-green-600">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Payment Processor</p>
                <p className="font-medium text-yellow-600">Not Configured</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">System Status</p>
                <p className="font-medium text-blue-600">Operational</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card) => (
          <a
            key={card.title}
            href={card.href}
            className="card p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center group-hover:bg-[var(--teal)] group-hover:text-white transition-colors">
                <card.icon className="h-6 w-6 text-[var(--teal)] group-hover:text-white" />
              </div>
              <span className="text-sm text-[var(--secondary-text)]">{card.count}</span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--main-text)] mt-4">
              {card.title}
            </h3>
            <p className="text-sm text-[var(--secondary-text)] mt-1">
              {card.description}
            </p>
          </a>
        ))}
      </div>

      {/* Recent Admin Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { action: "User invited", detail: "alex.morgan@example.com", time: "5 min ago", user: "Admin" },
              { action: "Role mapping updated", detail: "Board Member permissions", time: "1 hour ago", user: "Admin" },
              { action: "Workflow configured", detail: "MNT-01 New Maintenance Request", time: "2 hours ago", user: "Admin" },
              { action: "Integration tested", detail: "GHL connection verified", time: "3 hours ago", user: "Admin" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-3 border-b border-[var(--border-color)] last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--main-text)]">{item.action}</p>
                  <p className="text-xs text-[var(--secondary-text)]">{item.detail}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--secondary-text)]">{item.time}</p>
                  <p className="text-xs text-[var(--secondary-text)]">by {item.user}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
