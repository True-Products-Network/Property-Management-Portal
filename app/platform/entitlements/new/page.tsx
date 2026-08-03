// PL-07: Add Entitlement
// Create a new tenant entitlement or add-on

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus, 
  Package, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface Tenant {
  id: string;
  name: string;
  code: string;
}

interface Feature {
  id: string;
  code: string;
  name: string;
  category: string;
}

const ENTITLEMENT_TYPES = [
  { value: "addon", label: "Add-on", description: "Additional feature beyond plan limits" },
  { value: "override", label: "Override", description: "Custom limit override for a feature" },
  { value: "trial", label: "Trial", description: "Temporary access to a feature" },
];

export default function AddEntitlementPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedFeatureId, setSelectedFeatureId] = useState("");
  const [entitlementType, setEntitlementType] = useState("addon");
  const [isEnabled, setIsEnabled] = useState(true);
  const [limitValue, setLimitValue] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [expirationDate, setExpirationDate] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Get tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from("tenants")
        .select("id, name, code")
        .order("name");

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);
      if (tenantsData && tenantsData.length > 0) {
        setSelectedTenantId(tenantsData[0].id);
      }

      // Get active features
      const { data: featuresData, error: featuresError } = await supabase
        .from("features")
        .select("id, code, name, category")
        .eq("is_active", true)
        .order("name");

      if (featuresError) throw featuresError;
      setFeatures(featuresData || []);
      if (featuresData && featuresData.length > 0) {
        setSelectedFeatureId(featuresData[0].id);
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
      const { error: insertError } = await supabase
        .from("tenant_entitlements")
        .insert({
          tenant_id: selectedTenantId,
          feature_id: selectedFeatureId,
          entitlement_type: entitlementType,
          is_enabled: isEnabled,
          limit_value: limitValue ? parseInt(limitValue) : null,
          effective_date: effectiveDate,
          expiration_date: expirationDate || null,
          reason: reason || null,
        });

      if (insertError) throw insertError;

      // Log to audit
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("platform_audit_events").insert({
        actor_id: user?.id,
        actor_type: "platform_admin",
        action: "entitlement_created",
        action_category: "entitlement",
        tenant_id: selectedTenantId,
        target_type: "entitlement",
        new_value: {
          feature_id: selectedFeatureId,
          entitlement_type: entitlementType,
          limit_value: limitValue,
        },
      });

      setSuccess("Entitlement created successfully");
      setTimeout(() => {
        router.push("/platform/entitlements");
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Error creating entitlement:", err);
      setError(err instanceof Error ? err.message : "Failed to create entitlement");
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      addon: "bg-blue-100 text-blue-800 border-blue-200",
      override: "bg-purple-100 text-purple-800 border-purple-200",
      trial: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/platform/entitlements">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Entitlements
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Entitlement</h1>
        <p className="text-gray-500">Create a new tenant entitlement, add-on, or trial</p>
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
        {/* Tenant & Feature Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Tenant & Feature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant *</Label>
                <select
                  id="tenant"
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feature">Feature *</Label>
                <select
                  id="feature"
                  value={selectedFeatureId}
                  onChange={(e) => setSelectedFeatureId(e.target.value)}
                  className="w-full border rounded-md px-3 py-2"
                  required
                >
                  <option value="">Select feature</option>
                  {features.map((feature) => (
                    <option key={feature.id} value={feature.id}>
                      {feature.name} ({feature.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entitlement Type */}
        <Card>
          <CardHeader>
            <CardTitle>Entitlement Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ENTITLEMENT_TYPES.map((type) => (
                <div
                  key={type.value}
                  onClick={() => setEntitlementType(type.value)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    entitlementType === type.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getTypeBadge(type.value)}>{type.label}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="limitValue">Limit Value (optional)</Label>
                <Input
                  id="limitValue"
                  type="number"
                  placeholder="e.g., 100 (leave empty for unlimited)"
                  value={limitValue}
                  onChange={(e) => setLimitValue(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Set a custom limit. Leave empty for unlimited.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => setIsEnabled(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span>Enabled</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">Effective Date *</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date (optional)</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  For trials or time-limited add-ons
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                placeholder="Why is this entitlement being granted?"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={isSaving || !selectedTenantId || !selectedFeatureId}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Entitlement
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/platform/entitlements")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
