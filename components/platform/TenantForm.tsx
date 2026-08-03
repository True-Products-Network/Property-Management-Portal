"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Building2, Loader2, CreditCard } from "lucide-react";
import Link from "next/link";

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface TenantFormData {
  name: string;
  code: string;
  status: string;
  primaryEmail: string;
  primaryPhone: string;
  billingEmail: string;
  timezone: string;
  locale: string;
  planId: string;
  trialDays: string;
}

interface TenantFormProps {
  tenantId?: string;
  initialData?: Partial<TenantFormData>;
}

export function TenantForm({ tenantId, initialData }: TenantFormProps) {
  const router = useRouter();
  const isEditMode = !!tenantId;

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof TenantFormData, string>>>({});
  
  const [formData, setFormData] = useState<TenantFormData>({
    name: initialData?.name || "",
    code: initialData?.code || "",
    status: initialData?.status || "active",
    primaryEmail: initialData?.primaryEmail || "",
    primaryPhone: initialData?.primaryPhone || "",
    billingEmail: initialData?.billingEmail || "",
    timezone: initialData?.timezone || "America/Chicago",
    locale: initialData?.locale || "en-US",
    planId: initialData?.planId || "",
    trialDays: "14",
  });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const response = await fetch("/api/platform/plans");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPlans(result.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading plans:", error);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof TenantFormData, string>> = {};
    
    if (!formData.name?.trim()) newErrors.name = "Tenant name is required";
    if (!formData.code?.trim()) newErrors.code = "Tenant code is required";
    if (!formData.planId) newErrors.planId = "Plan is required";
    
    // Validate code format (alphanumeric, hyphens, underscores)
    if (formData.code && !/^[a-zA-Z0-9_-]+$/.test(formData.code)) {
      newErrors.code = "Code can only contain letters, numbers, hyphens, and underscores";
    }
    
    // Validate email if provided
    if (formData.primaryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primaryEmail)) {
      newErrors.primaryEmail = "Invalid email format";
    }
    if (formData.billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billingEmail)) {
      newErrors.billingEmail = "Invalid email format";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const url = isEditMode 
        ? `/api/platform/tenants/${tenantId}` 
        : "/api/platform/tenants";
      const method = isEditMode ? "PUT" : "POST";
      
      const payload = {
        name: formData.name,
        code: formData.code,
        status: formData.status,
        primaryEmail: formData.primaryEmail || undefined,
        primaryPhone: formData.primaryPhone || undefined,
        billingEmail: formData.billingEmail || undefined,
        timezone: formData.timezone,
        locale: formData.locale,
        planId: formData.planId,
        ...(isEditMode ? {} : { trialDays: parseInt(formData.trialDays) || 14 }),
      };
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const redirectId = isEditMode ? tenantId : result.data.id;
          router.push(`/platform/tenants/${redirectId}`);
        } else {
          alert(result.error || `Failed to ${isEditMode ? "update" : "create"} tenant`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || `Failed to ${isEditMode ? "update" : "create"} tenant`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} tenant:`, error);
      alert(`An error occurred while ${isEditMode ? "updating" : "creating"} the tenant`);
    } finally {
      setIsSaving(false);
    }
  }

  function handleChange(field: keyof TenantFormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  // Auto-generate code from name
  function handleNameChange(value: string) {
    setFormData(prev => ({ ...prev, name: value }));
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
    
    // Only auto-generate code if it's empty and we're not in edit mode
    if (!isEditMode && !formData.code) {
      const generatedCode = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData(prev => ({ ...prev, code: generatedCode }));
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Acme Property Management"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tenant Code <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="e.g., acme-pm"
                disabled={isEditMode}
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && <p className="text-sm text-red-500 mt-1">{errors.code}</p>}
              {!isEditMode && (
                <p className="text-xs text-gray-500 mt-1">
                  Unique identifier, cannot be changed later
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past Due</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.planId}
                onChange={(e) => handleChange("planId", e.target.value)}
                className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.planId ? "border-red-500" : ""}`}
              >
                <option value="">Select a plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
              {errors.planId && <p className="text-sm text-red-500 mt-1">{errors.planId}</p>}
            </div>
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trial Period (Days)
              </label>
              <Input
                type="number"
                value={formData.trialDays}
                onChange={(e) => handleChange("trialDays", e.target.value)}
                placeholder="14"
                min="0"
                max="90"
              />
              <p className="text-xs text-gray-500 mt-1">
                Number of days for the free trial (0 for no trial)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Email
              </label>
              <Input
                type="email"
                value={formData.primaryEmail}
                onChange={(e) => handleChange("primaryEmail", e.target.value)}
                placeholder="contact@company.com"
                className={errors.primaryEmail ? "border-red-500" : ""}
              />
              {errors.primaryEmail && (
                <p className="text-sm text-red-500 mt-1">{errors.primaryEmail}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Phone
              </label>
              <Input
                type="tel"
                value={formData.primaryPhone}
                onChange={(e) => handleChange("primaryPhone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Email
            </label>
            <Input
              type="email"
              value={formData.billingEmail}
              onChange={(e) => handleChange("billingEmail", e.target.value)}
              placeholder="billing@company.com"
              className={errors.billingEmail ? "border-red-500" : ""}
            />
            {errors.billingEmail && (
              <p className="text-sm text-red-500 mt-1">{errors.billingEmail}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Anchorage">Alaska Time (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Locale
              </label>
              <select
                value={formData.locale}
                onChange={(e) => handleChange("locale", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-US">Spanish (US)</option>
                <option value="fr-CA">French (Canada)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Link href={isEditMode ? `/platform/tenants/${tenantId}` : "/platform/tenants"}>
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditMode ? "Save Changes" : "Create Tenant"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
