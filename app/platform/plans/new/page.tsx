// PL-05: Create New Plan
// Create a new subscription plan

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PlanForm, PlanFormData } from "@/components/platform/PlanForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewPlanPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [features, setFeatures] = useState([]);

  // Fetch features on mount
  React.useEffect(() => {
    const fetchFeatures = async () => {
      const { data } = await supabase
        .from("features")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("display_order");
      setFeatures(data || []);
    };
    fetchFeatures();
  }, []);

  const handleSubmit = async (data: PlanFormData) => {
    setIsLoading(true);
    try {
      // Create plan
      const { data: plan, error: planError } = await supabase
        .from("plans")
        .insert({
          code: data.code,
          name: data.name,
          description: data.description,
          is_active: data.is_active,
          is_public: data.is_public,
          display_order: data.display_order,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create plan features
      const planFeatures = data.feature_limits.map((fl) => ({
        plan_id: plan.id,
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
      console.error("Error creating plan:", error);
      alert("Failed to create plan");
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Create New Plan</h1>
        <p className="text-gray-500">Create a new subscription tier for tenants</p>
      </div>

      <PlanForm
        availableFeatures={features}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/platform/plans")}
        isLoading={isLoading}
      />
    </div>
  );
}
