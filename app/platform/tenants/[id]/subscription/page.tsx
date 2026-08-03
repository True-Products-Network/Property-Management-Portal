// Tenant Subscription Management Page
// Add or update tenant subscription

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Plan {
  id: string;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
  is_public: boolean;
}

interface Tenant {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  effective_date: string;
  billing_reference: string | null;
  trial_ends_at: string | null;
  grace_period_ends_at: string | null;
  plans?: Plan;
}

export default function TenantSubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [status, setStatus] = useState("active");
  const [effectiveDate, setEffectiveDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [billingReference, setBillingReference] = useState("");
  const [trialEndsAt, setTrialEndsAt] = useState("");

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get tenant details
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name, code, status")
        .eq("id", tenantId)
        .single();

      if (tenantError || !tenantData) {
        setError("Tenant not found");
        setIsLoading(false);
        return;
      }

      setTenant(tenantData);

      // Get available plans
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Get existing subscription
      const { data: subscriptionData } = await supabase
        .from("tenant_subscriptions")
        .select("*, plans(*)")
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (subscriptionData) {
        setSubscription(subscriptionData);
        setSelectedPlanId(subscriptionData.plan_id);
        setStatus(subscriptionData.status);
        setEffectiveDate(subscriptionData.effective_date || format(new Date(), "yyyy-MM-dd"));
        setBillingReference(subscriptionData.billing_reference || "");
        setTrialEndsAt(subscriptionData.trial_ends_at ? subscriptionData.trial_ends_at.split("T")[0] : "");
      } else if (plansData && plansData.length > 0) {
        setSelectedPlanId(plansData[0].id);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/platform/tenants/${tenantId}/subscription`, {
        method: subscription ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          status,
          effectiveDate,
          billingReference: billingReference || undefined,
          trialEndsAt: trialEndsAt || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save subscription");
      }

      setSuccess(subscription ? "Subscription updated successfully" : "Subscription created successfully");
      
      setTimeout(() => {
        router.push(`/platform/tenants/${tenantId}`);
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Error saving subscription:", err);
      setError(err instanceof Error ? err.message : "Failed to save subscription");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (planStatus: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trialing: "secondary",
      past_due: "destructive",
      suspended: "destructive",
      cancelled: "outline",
    };
    return <Badge variant={variants[planStatus] || "default"}>{planStatus}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/platform/tenants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-500">Tenant not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/platform/tenants/${tenantId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenant
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {subscription ? "Edit Subscription" : "Add Subscription"}
        </h1>
        <p className="text-gray-500">{tenant.name}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plan Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Plan Selection
            </CardTitle>
            <CardDescription>Choose a plan for this tenant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedPlanId === plan.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{plan.name}</p>
                      <p className="text-sm text-gray-500">{plan.code}</p>
                    </div>
                    {plan.is_public ? (
                      <Badge variant="secondary">Public</Badge>
                    ) : (
                      <Badge variant="outline">Private</Badge>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscription Details */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="active">Active</option>
                  <option value="trialing">Trialing</option>
                  <option value="past_due">Past Due</option>
                  <option value="suspended">Suspended</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingReference">Billing Reference</Label>
                <Input
                  id="billingReference"
                  placeholder="e.g., STRIPE_SUB_123"
                  value={billingReference}
                  onChange={(e) => setBillingReference(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialEndsAt">Trial Ends At (optional)</Label>
                <Input
                  id="trialEndsAt"
                  type="date"
                  value={trialEndsAt}
                  onChange={(e) => setTrialEndsAt(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSaving || !selectedPlanId} className="flex-1">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {subscription ? "Update Subscription" : "Create Subscription"}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(`/platform/tenants/${tenantId}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
