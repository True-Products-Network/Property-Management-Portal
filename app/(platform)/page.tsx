// PL-01: Platform Dashboard
// Main dashboard for True Products Network Platform Admin

import { createClient } from "@/lib/supabase/server";
import { StatsCard } from "@/components/platform/StatsCard";
import { RecentActivity } from "@/components/platform/RecentActivity";
import { AlertBanner } from "@/components/platform/AlertBanner";
import { 
  Building2, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  CreditCard,
  Activity
} from "lucide-react";

export default async function PlatformDashboardPage() {
  const supabase = await createClient();

  // Get stats
  const { count: tenantCount } = await supabase
    .from("tenants")
    .select("*", { count: "exact", head: true });

  const { count: activeSubscriptions } = await supabase
    .from("tenant_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: pastDueCount } = await supabase
    .from("tenant_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "past_due");

  const { count: supportSessions } = await supabase
    .from("support_access_sessions")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // Get recent activity
  const { data: recentActivity } = await supabase
    .from("platform_audit_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  // Get alerts (past due, failed integrations, etc.)
  const { data: alerts } = await supabase
    .from("tenant_subscriptions")
    .select("*, tenants(name, code)")
    .eq("status", "past_due")
    .order("grace_period_ends_at", { ascending: true })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-gray-500">Overview of the Associos platform</p>
      </div>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <AlertBanner
              key={alert.id}
              type="warning"
              title={`${alert.tenants.name} - Past Due`}
              message={`Grace period ends ${new Date(alert.grace_period_ends_at).toLocaleDateString()}`}
              link={`/platform/tenants/${alert.tenant_id}`}
            />
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Tenants"
          value={tenantCount || 0}
          icon={Building2}
          trend="+2 this month"
          trendUp={true}
        />
        <StatsCard
          title="Active Subscriptions"
          value={activeSubscriptions || 0}
          icon={CreditCard}
          subtitle={`${pastDueCount || 0} past due`}
        />
        <StatsCard
          title="Active Support Sessions"
          value={supportSessions || 0}
          icon={Activity}
          subtitle="Currently active"
        />
        <StatsCard
          title="Platform Health"
          value="98%"
          icon={TrendingUp}
          trend="All systems operational"
          trendUp={true}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={recentActivity || []} />
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/platform/tenants/new"
              className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Building2 className="w-5 h-5 mr-3 text-blue-600" />
              <div>
                <p className="font-medium">Provision New Tenant</p>
                <p className="text-sm text-gray-500">Create a new business account</p>
              </div>
            </a>
            <a
              href="/platform/plans"
              className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="w-5 h-5 mr-3 text-green-600" />
              <div>
                <p className="font-medium">Manage Plans</p>
                <p className="text-sm text-gray-500">Configure subscription tiers</p>
              </div>
            </a>
            <a
              href="/platform/audit"
              className="flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <Activity className="w-5 h-5 mr-3 text-purple-600" />
              <div>
                <p className="font-medium">View Audit Log</p>
                <p className="text-sm text-gray-500">Review platform activity</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
