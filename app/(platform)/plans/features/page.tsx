// PL-06: Feature Catalog
// List all available features, create new feature, edit existing features

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Puzzle, 
  Plus, 
  Edit2, 
  Check, 
  X,
  ArrowLeft,
  Building2,
  Users,
  Wrench,
  Settings,
  CreditCard,
  BarChart3,
  Plug
} from "lucide-react";
import Link from "next/link";

interface PlanFeature {
  plan_id: string;
  is_enabled: boolean;
  limit_value: number | null;
  plans: { name: string; code: string };
}

interface Feature {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  default_limit: number | null;
  plan_features: PlanFeature[];
}

export default async function FeaturesPage() {
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform/login");
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

  // Fetch all features
  const { data: features, error: featuresError } = await supabase
    .from("features")
    .select(`
      *,
      plan_features(
        plan_id,
        is_enabled,
        limit_value,
        plans(name, code)
      )
    `)
    .order("category", { ascending: true })
    .order("display_order", { ascending: true });

  if (featuresError) {
    console.error("Error fetching features:", featuresError);
  }

  // Group features by category
  const featuresByCategory = (features as Feature[] || []).reduce((acc: Record<string, Feature[]>, feature: Feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "core": return Building2;
      case "maintenance": return Wrench;
      case "operations": return Settings;
      case "portals": return Users;
      case "financial": return CreditCard;
      case "reports": return BarChart3;
      case "integrations": return Plug;
      default: return Puzzle;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "core": return "bg-blue-100 text-blue-700 border-blue-200";
      case "maintenance": return "bg-orange-100 text-orange-700 border-orange-200";
      case "operations": return "bg-green-100 text-green-700 border-green-200";
      case "portals": return "bg-purple-100 text-purple-700 border-purple-200";
      case "financial": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "reports": return "bg-pink-100 text-pink-700 border-pink-200";
      case "integrations": return "bg-cyan-100 text-cyan-700 border-cyan-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/platform/plans">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feature Catalog</h1>
            <p className="text-gray-500">Manage platform features and capabilities</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/platform/plans/features/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Feature
          </Link>
        </Button>
      </div>

      {/* Features by Category */}
      <div className="space-y-6">
        {Object.entries(featuresByCategory).map(([category, categoryFeatures]: [string, Feature[]]) => {
          const Icon = getCategoryIcon(category);
          const activeCount = categoryFeatures?.filter((f: Feature) => f.is_active).length || 0;

          return (
            <Card key={category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getCategoryColor(category)}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{getCategoryLabel(category)}</CardTitle>
                      <CardDescription>
                        {activeCount} of {categoryFeatures?.length} features active
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getCategoryColor(category)}>
                    {categoryFeatures?.length} features
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryFeatures?.map((feature: Feature) => {
                    const enabledInPlans = feature.plan_features?.filter((pf: PlanFeature) => pf.is_enabled) || [];

                    return (
                      <div 
                        key={feature.id} 
                        className={`p-4 rounded-lg border ${feature.is_active ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">{feature.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{feature.code}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {feature.is_active ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>

                        {feature.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {feature.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <div>
                            {feature.default_limit !== null && feature.default_limit !== undefined ? (
                              <Badge variant="outline" className="text-xs">
                                Default: {feature.default_limit === 0 ? "Unlimited" : feature.default_limit}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-xs">No limit</span>
                            )}
                          </div>
                          <span className="text-gray-500 text-xs">
                            {enabledInPlans.length} plans
                          </span>
                        </div>

                        {/* Plans using this feature */}
                        {enabledInPlans.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-gray-500 mb-1">Enabled in:</p>
                            <div className="flex flex-wrap gap-1">
                              {enabledInPlans.slice(0, 3).map((pf: PlanFeature) => (
                                <Badge key={pf.plan_id} variant="secondary" className="text-xs">
                                  {pf.plans.name}
                                </Badge>
                              ))}
                              {enabledInPlans.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{enabledInPlans.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 pt-3 border-t flex justify-end">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/platform/plans/features/${feature.id}/edit`}>
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {(!features || features.length === 0) && (
        <div className="text-center py-12">
          <Puzzle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No features found</h3>
          <p className="text-gray-500 mt-1">Create your first feature to get started</p>
          <Button className="mt-4" asChild>
            <Link href="/platform/plans/features/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Link>
          </Button>
        </div>
      )}

      {/* Summary Stats */}
      {features && features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{features.length}</p>
                <p className="text-sm text-gray-500">Total Features</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">
                  {(features as Feature[]).filter((f: Feature) => f.is_active).length}
                </p>
                <p className="text-sm text-gray-500">Active Features</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">
                  {Object.keys(featuresByCategory).length}
                </p>
                <p className="text-sm text-gray-500">Categories</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-700">
                  {(features as Feature[]).filter((f: Feature) => f.default_limit !== null).length}
                </p>
                <p className="text-sm text-gray-500">With Limits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
