// PL-05: Edit Plan
// Edit an existing subscription plan

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PlanForm, PlanFormData } from "@/components/platform/PlanForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [features, setFeatures] = useState([]);

  const planId = params.id as string;

  // Fetch plan and features
  useEffect(() => {
    const fetchData = async () => {
      // Fetch plan with features
      const { data: planData } = await supabase
        .from("plans")
        .select(`
          *,
          plan_features(
            id,
            is_enabled,
            limit_value,
            features(
              id,
              code,
              name,
              description,
              category,
              default_limit
            )
          )
        `)
        .eq("id", planId)
        .single();

      setPlan(planData);

      // Fetch all features
      const { data: featuresData } = await supabase
        .from("features")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("display_order");

      setFeatures(featuresData || []);
    };

    fetchData();
  }, [planId]);

  const handleSubmit = async (data: PlanFormData) => {
    setIsLoading(true);
    try {
      // Update plan
      const { error: planError } = await supabase
        .from("plans")
        .update({
          code: data.code,
          name: data.name,
          description: data.description,
          is_active: data.is_active,
          is_public: data.is_public,
          display_order: data.display_order,
        })
        .eq("id", planId);

      if (planError) throw planError;

      // Delete existing plan features
      await supabase.from("plan_features").delete().eq("plan_id", planId);

      // Create new plan features
      const planFeatures = data.feature_limits.map((fl) => ({
        plan_id: planId,
        feature_id: fl.feature_id,
        is_enabled: true,
        limit_value: fl.limit,
      }));

      if (planFeatures.length > 0) {
        const { error: pfError } = await supabase
          .from("plan_features")
          .insert(planFeatures);
        if (pfError) throw pfError;
      }

      router.push("/platform/plans");
      router.refresh();
    } catch (error) {
      console.error("Error updating plan:", error);
      alert("Failed to update plan");
    } finally {
      setIsLoading(false);
    }
  };

  // Prepare initial data
  const initialData: Partial<PlanFormData> | undefined = plan
    ? {
        code: plan.code,
        name: plan.name,
        description: plan.description,
        is_active: plan.is_active,
        is_public: plan.is_public,
        display_order: plan.display_order,
        feature_limits:
          plan.plan_features?.map((pf: any) => ({
            feature_id: pf.features.id,
            feature_code: pf.features.code,
            feature_name: pf.features.name,
            limit: pf.limit_value,
          })) || [],
      }
    : undefined;

  if (!plan) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/platform/plans">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Plans
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Plan</h1>
        <p className="text-gray-500">Configure {plan.name} subscription tier</p>
      </div>

      <PlanForm
        initialData={initialData}
        availableFeatures={features}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/platform/plans")}
        isLoading={isLoading}
      />
    </div>
  );
}
