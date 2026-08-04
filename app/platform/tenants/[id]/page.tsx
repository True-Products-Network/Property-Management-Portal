// PL-03: Business Account Detail
// Display tenant details, subscription info, usage statistics, users, portfolios

import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  CreditCard, 
  Settings, 
  ArrowLeft, 
  AlertTriangle,
  Activity,
  Shield,
  Calendar,
  Mail,
  Phone,
  Globe,
  Clock
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DeleteTenantButton } from "@/components/platform/DeleteTenantButton";

interface TenantDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TenantDetailPage({ params }: TenantDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform-login");
  }

  // Check if user is platform admin or support
  const { data: platformRole } = await supabase
    .from("platform_user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .single();

  if (!platformRole) {
    redirect("/unauthorized");
  }

  // Fetch tenant details
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select(`
      *,
      tenant_subscriptions(
        *,
        plans(*)
      )
    `)
    .eq("id", id)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  // Fetch tenant users
  const { data: tenantUsers } = await supabase
    .from("tenant_users")
    .select(`
      *,
      user:user_id(id, email, raw_user_meta_data)
    `)
    .eq("tenant_id", id)
    .order("joined_at", { ascending: false });

  // Fetch portfolios
  const { data: portfolios } = await supabase
    .from("portfolios")
    .select(`
      *,
      portfolio_user_assignments(
        user_id,
        role
      )
    `)
    .eq("tenant_id", id)
    .order("created_at", { ascending: false });

  // Fetch usage statistics
  const { data: usageStats } = await supabase
    .from("tenant_usage")
    .select("*")
    .eq("tenant_id", id);

  // Fetch recent audit events
  const { data: auditEvents } = await supabase
    .from("platform_audit_events")
    .select("*")
    .eq("tenant_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch active support sessions
  const { data: supportSessions } = await supabase
    .from("support_access_sessions")
    .select(`
      *,
      platform_user:platform_user_id(email, raw_user_meta_data)
    `)
    .eq("tenant_id", id)
    .eq("is_active", true)
    .order("started_at", { ascending: false });

  const subscription = tenant.tenant_subscriptions?.[0];
  const isPastDue = subscription?.status === "past_due";
  const isSuspended = tenant.status === "suspended";

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trialing: "secondary",
      past_due: "destructive",
      suspended: "destructive",
      cancelled: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/platform/tenants">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
              {getStatusBadge(tenant.status)}
            </div>
            <p className="text-gray-500">{tenant.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={`/platform/tenants/${id}/support`}>
              <Shield className="h-4 w-4 mr-2" />
              Support Access
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/platform/tenants/${id}/edit`}>
              <Settings className="h-4 w-4 mr-2" />
              Edit Settings
            </Link>
          </Button>
          <DeleteTenantButton tenantId={id} tenantName={tenant.name} />
        </div>
      </div>

      {/* Alerts */}
      {isPastDue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="font-medium text-red-900">Past Due Subscription</p>
            <p className="text-sm text-red-700">
              Grace period ends {subscription.grace_period_ends_at 
                ? format(new Date(subscription.grace_period_ends_at), "MMM d, yyyy") 
                : "soon"}
            </p>
          </div>
          <Button variant="destructive" size="sm">
            Resolve
          </Button>
        </div>
      )}

      {isSuspended && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <div>
            <p className="font-medium text-orange-900">Account Suspended</p>
            <p className="text-sm text-orange-700">
              This tenant account is currently suspended
            </p>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Plan</p>
                      <p className="font-medium">{subscription.plans?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="mt-1">{getStatusBadge(subscription.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Effective Date</p>
                      <p className="font-medium">
                        {subscription.effective_date 
                          ? format(new Date(subscription.effective_date), "MMM d, yyyy") 
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Billing Reference</p>
                      <p className="font-medium">{subscription.billing_reference || "N/A"}</p>
                    </div>
                  </div>
                  {subscription.trial_ends_at && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-sm text-blue-700">
                        Trial ends {format(new Date(subscription.trial_ends_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No active subscription</p>
                  <Button className="mt-3" size="sm" asChild>
                    <Link href={`/platform/tenants/${tenant.id}/subscription`}>
                      Add Subscription
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Usage Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usageStats && usageStats.length > 0 ? (
                <div className="space-y-3">
                  {usageStats.map((stat: { id: string; feature_code: string; period_start: string; period_end: string; current_count: number; limit_value: number | null }) => (
                    <div key={stat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{stat.feature_code.replace(/\./g, " ")}</p>
                        <p className="text-sm text-gray-500">
                          Period: {stat.period_start} to {stat.period_end}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {stat.current_count} / {stat.limit_value || "∞"}
                        </p>
                        {stat.limit_value && (
                          <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${Math.min((stat.current_count / stat.limit_value) * 100, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">No usage data available</p>
              )}
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Users ({tenantUsers?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tenantUsers && tenantUsers.length > 0 ? (
                <div className="space-y-3">
                  {tenantUsers.map((tu: { id: string; role: string; is_primary_admin: boolean; user?: { email?: string; raw_user_meta_data?: { full_name?: string } } }) => (
                    <div key={tu.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {tu.user?.raw_user_meta_data?.full_name || tu.user?.email}
                        </p>
                        <p className="text-sm text-gray-500">{tu.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={tu.role === "admin" ? "default" : "secondary"}>
                          {tu.role}
                        </Badge>
                        {tu.is_primary_admin && (
                          <Badge variant="outline" className="text-blue-600">Primary</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">No users assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Portfolios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-600" />
                Portfolios ({portfolios?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {portfolios && portfolios.length > 0 ? (
                <div className="space-y-3">
                  {portfolios.map((portfolio: { id: string; name: string; description?: string; is_default: boolean; portfolio_user_assignments?: unknown[] }) => (
                    <div key={portfolio.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{portfolio.name}</p>
                        {portfolio.description && (
                          <p className="text-sm text-gray-500">{portfolio.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {portfolio.is_default && (
                          <Badge variant="outline" className="text-green-600">Default</Badge>
                        )}
                        <Badge variant="secondary">
                          {portfolio.portfolio_user_assignments?.length || 0} users
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">No portfolios created</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant.primary_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Primary Email</p>
                    <p className="font-medium">{tenant.primary_email}</p>
                  </div>
                </div>
              )}
              {tenant.primary_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Primary Phone</p>
                    <p className="font-medium">{tenant.primary_phone}</p>
                  </div>
                </div>
              )}
              {tenant.billing_email && (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Billing Email</p>
                    <p className="font-medium">{tenant.billing_email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Locale / Timezone</p>
                  <p className="font-medium">{tenant.locale} / {tenant.timezone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Support Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Support Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {supportSessions && supportSessions.length > 0 ? (
                <div className="space-y-3">
                  {supportSessions.map((session: { id: string; started_at: string; expires_at: string; platform_user?: { email?: string } }) => (
                    <div key={session.id} className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <p className="font-medium text-sm">Active Session</p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {session.platform_user?.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Started {format(new Date(session.started_at), "MMM d, h:mm a")}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires {format(new Date(session.expires_at), "h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No active support sessions</p>
              )}
            </CardContent>
          </Card>

          {/* Audit Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {auditEvents && auditEvents.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {auditEvents.map((event: { id: string; action: string; action_category: string; created_at: string }) => (
                    <div key={event.id} className="text-sm border-l-2 border-gray-200 pl-3 py-1">
                      <p className="font-medium">{event.action}</p>
                      <p className="text-gray-500 text-xs">{event.action_category}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {format(new Date(event.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
