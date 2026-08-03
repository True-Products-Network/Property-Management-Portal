"use client";

import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";

export interface FeatureLimit {
  feature_id: string;
  feature_code: string;
  feature_name: string;
  limit: number | null;
}

export interface PlanFormData {
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  is_public: boolean;
  display_order: number;
  feature_limits: FeatureLimit[];
}

interface PlanFormProps {
  initialData?: Partial<PlanFormData>;
  availableFeatures: {
    id: string;
    code: string;
    name: string;
    description: string;
    default_limit: number | null;
  }[];
  onSubmit: (data: PlanFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function PlanForm({
  initialData,
  availableFeatures,
  onSubmit,
  onCancel,
  isLoading = false,
}: PlanFormProps) {
  const [formData, setFormData] = useState<PlanFormData>({
    code: initialData?.code || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    is_active: initialData?.is_active ?? true,
    is_public: initialData?.is_public ?? true,
    display_order: initialData?.display_order || 0,
    feature_limits: initialData?.feature_limits || [],
  });

  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(
    new Set(initialData?.feature_limits?.map((f) => f.feature_id) || [])
  );

  const [featureLimits, setFeatureLimits] = useState<Record<string, number | null>>(
    initialData?.feature_limits?.reduce((acc, f) => {
      acc[f.feature_id] = f.limit;
      return acc;
    }, {} as Record<string, number | null>) || {}
  );

  const handleChange = (field: keyof PlanFormData, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFeature = (featureId: string, defaultLimit: number | null) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(featureId)) {
        next.delete(featureId);
      } else {
        next.add(featureId);
        if (!(featureId in featureLimits)) {
          setFeatureLimits((fl) => ({ ...fl, [featureId]: defaultLimit }));
        }
      }
      return next;
    });
  };

  const updateFeatureLimit = (featureId: string, limit: string) => {
    const numLimit = limit === "" ? null : parseInt(limit, 10);
    setFeatureLimits((prev) => ({ ...prev, [featureId]: numLimit }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const feature_limits = Array.from(selectedFeatures).map((featureId) => {
      const feature = availableFeatures.find((f) => f.id === featureId);
      return {
        feature_id: featureId,
        feature_code: feature?.code || "",
        feature_name: feature?.name || "",
        limit: featureLimits[featureId] ?? null,
      };
    });
    onSubmit({ ...formData, feature_limits });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Plan Details</CardTitle>
          <CardDescription>Basic information about the subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Plan Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="pro-plan"
                required
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers, and hyphens only"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Pro Plan"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe what this plan includes..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) => handleChange("is_public", checked)}
              />
              <Label htmlFor="is_public" className="cursor-pointer">
                Public
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min={0}
                value={formData.display_order}
                onChange={(e) => handleChange("display_order", parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature Selection</CardTitle>
          <CardDescription>Select features and set their limits for this plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableFeatures.length === 0 ? (
              <p className="text-muted-foreground">No features available. Create features first.</p>
            ) : (
              availableFeatures.map((feature) => {
                const isSelected = selectedFeatures.has(feature.id);
                return (
                  <div
                    key={feature.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      isSelected ? "border-[var(--teal)] bg-[var(--teal)]/5" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`feature-${feature.id}`}
                        checked={isSelected}
                        onChange={() => toggleFeature(feature.id, feature.default_limit)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor={`feature-${feature.id}`}
                            className="font-medium cursor-pointer"
                          >
                            {feature.name}
                          </Label>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {feature.code}
                          </code>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                        {isSelected && (
                          <div className="mt-3 flex items-center space-x-2">
                            <Label htmlFor={`limit-${feature.id}`} className="text-sm">
                              Limit:
                            </Label>
                            <Input
                              id={`limit-${feature.id}`}
                              type="number"
                              min={0}
                              placeholder="Unlimited"
                              value={featureLimits[feature.id] ?? ""}
                              onChange={(e) => updateFeatureLimit(feature.id, e.target.value)}
                              className="w-32"
                            />
                            <span className="text-xs text-muted-foreground">
                              (leave empty for unlimited)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
          {isLoading ? "Saving..." : initialData?.code ? "Update Plan" : "Create Plan"}
        </Button>
      </div>
    </form>
  );
}
