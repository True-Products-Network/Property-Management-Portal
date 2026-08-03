"use client";

import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";

export interface EntitlementFormData {
  tenant_id: string;
  feature_id: string;
  entitlement_type: "addon" | "override" | "trial";
  limit_value: number | null;
  effective_date: string;
  expiration_date: string | null;
  reason: string;
}

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

interface EntitlementFormProps {
  initialData?: Partial<EntitlementFormData>;
  tenants: Tenant[];
  features: Feature[];
  onSubmit: (data: EntitlementFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function EntitlementForm({
  initialData,
  tenants,
  features,
  onSubmit,
  onCancel,
  isLoading = false,
}: EntitlementFormProps) {
  const [formData, setFormData] = useState<EntitlementFormData>({
    tenant_id: initialData?.tenant_id || "",
    feature_id: initialData?.feature_id || "",
    entitlement_type: initialData?.entitlement_type || "addon",
    limit_value: initialData?.limit_value ?? null,
    effective_date: initialData?.effective_date || new Date().toISOString().split("T")[0],
    expiration_date: initialData?.expiration_date || null,
    reason: initialData?.reason || "",
  });

  const handleChange = (field: keyof EntitlementFormData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLimitChange = (value: string) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    handleChange("limit_value", numValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectedTenant = tenants.find((t) => t.id === formData.tenant_id);
  const selectedFeature = features.find((f) => f.id === formData.feature_id);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Entitlement Details</CardTitle>
          <CardDescription>Grant or modify feature access for a tenant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenant_id">Tenant *</Label>
              <Select
                value={formData.tenant_id}
                onValueChange={(value) => handleChange("tenant_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTenant && (
                <p className="text-xs text-muted-foreground">
                  Code: {selectedTenant.code}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature_id">Feature *</Label>
              <Select
                value={formData.feature_id}
                onValueChange={(value) => handleChange("feature_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select feature" />
                </SelectTrigger>
                <SelectContent>
                  {features.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id}>
                      {feature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFeature && (
                <p className="text-xs text-muted-foreground">
                  Category: {selectedFeature.category} | Code: {selectedFeature.code}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entitlement_type">Entitlement Type *</Label>
              <Select
                value={formData.entitlement_type}
                onValueChange={(value) =>
                  handleChange("entitlement_type", value as EntitlementFormData["entitlement_type"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="addon">Add-on</SelectItem>
                  <SelectItem value="override">Override</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.entitlement_type === "addon" && "Additional feature beyond plan limits"}
                {formData.entitlement_type === "override" && "Override plan limits for this feature"}
                {formData.entitlement_type === "trial" && "Temporary access for evaluation"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit_value">Limit Override</Label>
              <Input
                id="limit_value"
                type="number"
                min={0}
                placeholder="Use plan default"
                value={formData.limit_value ?? ""}
                onChange={(e) => handleLimitChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use plan default limit
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effective_date">Effective Date *</Label>
              <Input
                id="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={(e) => handleChange("effective_date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration_date">Expiration Date</Label>
              <Input
                id="expiration_date"
                type="date"
                value={formData.expiration_date || ""}
                onChange={(e) =>
                  handleChange("expiration_date", e.target.value || null)
                }
              />
              <p className="text-xs text-muted-foreground">
                Optional - leave empty for no expiration
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleChange("reason", e.target.value)}
              placeholder="Explain why this entitlement is being granted..."
              rows={3}
              required
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData?.tenant_id ? "Update Entitlement" : "Create Entitlement"}
        </Button>
      </div>
    </form>
  );
}
