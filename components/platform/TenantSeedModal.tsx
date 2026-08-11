"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TenantSeedModalProps {
  tenantId: string;
  tenantName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SEED_CATEGORIES = [
  { id: "dropdowns", label: "Dropdown Settings", description: "Vendor types, unit types, property types, roles, etc." },
  { id: "roles", label: "Roles & Permissions", description: "Default roles (Admin, Manager, Board Member, Resident)" },
  { id: "ghl_mappings", label: "GHL Role Mappings", description: "GoHighLevel to portal role mappings" },
  { id: "workflows", label: "Workflow Settings", description: "Maintenance and vendor onboarding workflows" },
  { id: "integrations", label: "Integration Defaults", description: "GHL and Stripe integration templates" },
  { id: "branding", label: "Brand Management", description: "Default colors, logo placeholders, company name" },
  { id: "categories", label: "Category Management", description: "Document types, expense categories, etc." },
];

export function TenantSeedModal({
  tenantId,
  tenantName,
  isOpen,
  onClose,
  onSuccess,
}: TenantSeedModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: Record<string, { created: number; skipped: number; errors: string[] }>;
  } | null>(null);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCategories(SEED_CATEGORIES.map((c) => c.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleCategoryChange = (categoryId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCategories((prev) => [...prev, categoryId]);
    } else {
      setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
    }
  };

  const handleSubmit = async () => {
    if (selectedCategories.length === 0) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`/api/platform/tenants/${tenantId}/seed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: selectedCategories }),
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: "Tenant data seeded successfully!",
          details: data.results,
        });
        onSuccess();
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to seed tenant data",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "An error occurred while seeding tenant data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedCategories([]);
    setResult(null);
    onClose();
  };

  const allSelected = selectedCategories.length === SEED_CATEGORIES.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Setup Tenant Data</DialogTitle>
          <DialogDescription>
            Seed core default data for <strong>{tenantName}</strong>. Select the categories
            you want to initialize. Existing data will be skipped.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>

            {result.details && (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-4">
                {Object.entries(result.details).map(([category, stats]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="capitalize">{category.replace("_", " ")}</span>
                      <div className="flex gap-4">
                        <span className="text-green-600">Created: {stats.created}</span>
                        <span className="text-amber-600">Skipped: {stats.skipped}</span>
                        {stats.errors.length > 0 && (
                          <span className="text-red-600">Errors: {stats.errors.length}</span>
                        )}
                      </div>
                    </div>
                    {stats.errors.length > 0 && (
                      <div className="pl-4 text-xs text-red-600 space-y-1">
                        {stats.errors.map((error: string, idx: number) => (
                          <p key={idx} className="truncate" title={error}>{error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b pb-4">
                <Checkbox
                  id="select-all"
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="font-medium">
                  Select All Categories
                </Label>
              </div>

              <div className="space-y-3">
                {SEED_CATEGORIES.map((category) => (
                  <div key={category.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onChange={(e) =>
                        handleCategoryChange(category.id, e)
                      }
                    />
                    <div className="space-y-1">
                      <Label htmlFor={category.id} className="font-medium">
                        {category.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={selectedCategories.length === 0 || isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Seed Tenant Data
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
