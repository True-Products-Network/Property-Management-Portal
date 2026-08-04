// PL-05: Plans Management
// List all plans with features, create/edit plan buttons

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Plus, 
  Settings, 
  Check, 
  X,
  Users,
  Building2,
  Puzzle
} from "lucide-react";
import Link from "next/link";

export default async function PlansPage() {
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

  // Fetch all plans with their features
  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select(`
      *,
      plan_features(
        is_enabled,
        limit_value,
        features(
          code,
          name,
          description,
          category
        )
      )
    `)
    .order("display_order", { ascending: true });

  if (plansError) {
    console.error("Error fetching plans:", plansError);
  }

  // Get tenant counts per plan
  const { data: planCounts } = await supabase
    .from("tenant_subscriptions")
    .select("plan_id, status")
    .eq("status", "active");

  const tenantCountByPlan = planCounts?.reduce((acc: Record<string, number>, sub: { plan_id: string }) => {
    acc[sub.plan_id] = (acc[sub.plan_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "core": return Building2;
      case "portals": return Users;
      default: return Puzzle;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "core": return "bg-blue-100 text-blue-700";
      case "maintenance": return "bg-orange-100 text-orange-700";
      case "operations": return "bg-green-100 text-green-700";
      case "portals": return "bg-purple-100 text-purple-700";
      case "financial": return "bg-emerald-100 text-emerald-700";
      case "reports": return "bg-pink-100 text-pink-700";
      case "integrations": return "bg-cyan-100 text-cyan-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plans & Features</h1>
          <p className="text-gray-500">Manage subscription tiers and feature configurations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/platform/plans/features">
              <Puzzle className="h-4 w-4 mr-2" />
              Feature Catalog
            </Link>
          </Button>
          <Button asChild>
            <Link href="/platform/plans/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Link>
          </Button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {plans?.map((plan: { 
          id: string; 
          name: string; 
          code: string;
          description?: string; 
          is_active: boolean; 
          is_public: boolean;
          plan_features?: Array<{
            is_enabled: boolean;
            limit_value: number | null;
            features: {
              code: string;
              name: string;
              category: string;
            };
          }>;
        }) => {
          const features = plan.plan_features || [];
          const enabledFeatures = features.filter((f: { is_enabled: boolean }) => f.is_enabled);
          const tenantCount = tenantCountByPlan[plan.id] || 0;

          return (
            <Card key={plan.id} className={`${!plan.is_active ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {plan.description || "No description"}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {plan.is_public ? (
                      <Badge variant="secondary">Public</Badge>
                    ) : (
                      <Badge variant="outline">Private</Badge>
                    )}
                    {!plan.is_active && (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">{enabledFeatures.length}</p>
                    <p className="text-xs text-gray-500">Features</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">{tenantCount}</p>
                    <p className="text-xs text-gray-500">Active Tenants</p>
                  </div>
                </div>

                {/* Features Preview - Show all active features */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Active Features ({enabledFeatures.length})</p>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {enabledFeatures.map((pf: {
                      is_enabled: boolean;
                      limit_value: number | null;
                      features: {
                        code: string;
                        name: string;
                        category: string;
                      }
                    }) => (
                      <div key={pf.features.code} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{pf.features.name}</span>
                        {pf.limit_value !== null && pf.limit_value !== undefined ? (
                          <Badge variant="outline" className="text-xs">
                            {pf.limit_value === 0 ? "Unlimited" : `Max ${pf.limit_value}`}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            ✓
                          </Badge>
                        )}
                      </div>
                    ))}
                    {enabledFeatures.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        No features enabled
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/platform/plans/${plan.id}/edit`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Plan
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {(!plans || plans.length === 0) && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No plans found</h3>
          <p className="text-gray-500 mt-1">Create your first subscription plan to get started</p>
          <Button className="mt-4" asChild>
            <Link href="/platform/plans/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Plan
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
