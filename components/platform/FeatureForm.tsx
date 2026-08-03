"use client";

import * as React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

export interface FeatureFormData {
  code: string;
  name: string;
  description: string;
  category: string;
  default_limit: number | null;
  is_active: boolean;
  display_order: number;
}

interface FeatureFormProps {
  initialData?: Partial<FeatureFormData>;
  onSubmit: (data: FeatureFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const CATEGORIES = [
  "Core",
  "Management",
  "Operations",
  "Reporting",
  "Integrations",
  "Communication",
  "Billing",
  "Security",
  "Customization",
  "Other",
];

export function FeatureForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: FeatureFormProps) {
  const [formData, setFormData] = useState<FeatureFormData>({
    code: initialData?.code || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "Core",
    default_limit: initialData?.default_limit ?? null,
    is_active: initialData?.is_active ?? true,
    display_order: initialData?.display_order || 0,
  });

  const handleChange = (field: keyof FeatureFormData, value: string | boolean | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLimitChange = (value: string) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    handleChange("default_limit", numValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Details</CardTitle>
          <CardDescription>Define a feature that can be included in plans</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Feature Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="maintenance-requests"
                required
                pattern="[a-z0-9-]+"
                title="Lowercase letters, numbers, and hyphens only"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier used in code and API calls
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Feature Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Maintenance Requests"
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
              placeholder="Describe what this feature enables..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_limit">Default Limit</Label>
              <Input
                id="default_limit"
                type="number"
                min={0}
                placeholder="Unlimited"
                value={formData.default_limit ?? ""}
                onChange={(e) => handleLimitChange(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                min={0}
                value={formData.display_order}
                onChange={(e) =>
                  handleChange("display_order", parseInt(e.target.value, 10) || 0)
                }
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange("is_active", checked)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Feature is active and available for use
            </Label>
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
          {isLoading ? "Saving..." : initialData?.code ? "Update Feature" : "Create Feature"}
        </Button>
      </div>
    </form>
  );
}
