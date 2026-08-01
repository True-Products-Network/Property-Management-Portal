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
  Palette,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

async function getAdminStats() {
  try {
    const supabase = await createClient();
    
    // Get counts from various tables
    const [
      usersResult,
      rolesResult,
      dropdownsResult,
      listsResult,
      workflowsResult,
      auditResult,
      ghlStatusResult,
    ] = await Promise.all([
      supabase.from("contacts").select("id", { count: "exact" }),
      supabase.from("contact_roles").select("id", { count: "exact" }),
      supabase.from("dropdown_settings").select("id", { count: "exact" }),
      supabase.from("dropdown_settings").select("record_type", { count: "exact" }).limit(1000),
      supabase.from("workflows").select("id", { count: "exact" }),
      supabase.from("audit_logs").select("id", { count: "exact" }),
      supabase.from("app_settings").select("value").eq("key", "ghl_location_id").single(),
    ]);

    // Count unique list types
    const uniqueLists = new Set(listsResult.data?.map((d: { record_type: string }) => d.record_type) || []);

    return {
      userCount: usersResult.count || 0,
      roleCount: rolesResult.count || 0,
      dropdownCount: dropdownsResult.count || 0,
      listCount: uniqueLists.size,
      workflowCount: workflowsResult.count || 0,
      auditCount: auditResult.count || 0,
      ghlConnected: !!ghlStatusResult.data?.value,
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      userCount: 0,
      roleCount: 0,
      dropdownCount: 0,
      listCount: 0,
      workflowCount: 0,
      auditCount: 0,
      ghlConnected: false,
    };
  }
}

export default async function AdminHomePage() {
  const user = await getSession();

  if (!user || !isAdmin(user.roles)) {
    redirect("/access-denied");
  }

  const stats = await getAdminStats();

  const adminCards = [
    {
      title: "User Maintenance",
      description: "Invite, manage, and suspend portal users",
      href: "/admin/users",
      icon: Users,
      count: `${stats.userCount} users`,
    },
    {
      title: "Roles & Permissions",
      description: "Configure portal roles and access levels",
      href: "/admin/roles",
      icon: Shield,
      count: "Under Construction",
    },
    {
      title: "GHL Role Mapping",
      description: "Map GHL Contact Roles to portal permissions",
      href: "/admin/ghl-mapping",
      icon: Workflow,
      count: "Under Construction",
    },
    {
      title: "Workflow Settings",
      description: "Configure workflow triggers and templates",
      href: "/admin/workflows",
      icon: Activity,
      count: "Under Construction",
    },
    {
      title: "Integrations",
      description: "Manage GHL and payment processor connections",
      href: "/admin/integrations",
      icon: Settings,
      count: stats.ghlConnected ? "GHL Connected" : "Not Connected",
    },
    {
      title: "Category Management",
      description: "Manage Categories",
      href: "/admin/lists",
      icon: List,
      count: "Under Construction",
    },
    {
      title: "Brand Customization",
      description: "Customize logo, colors, and white-label settings",
      href: "/admin/branding",
      icon: Palette,
      count: "Customize",
    },
    {
      title: "Audit Log",
      description: "View system activity and security events",
      href: "/admin/audit",
      icon: FileText,
      count: "Under Construction",
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
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.ghlConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                <Settings className={`h-5 w-5 ${stats.ghlConnected ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">GHL Connection</p>
                <p className={`font-medium ${stats.ghlConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.ghlConnected ? 'Connected' : 'Not Connected'}
                </p>
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
    </div>
  );
}
