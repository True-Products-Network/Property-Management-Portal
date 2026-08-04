"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "core", label: "Core", color: "bg-blue-100 text-blue-700" },
  { value: "maintenance", label: "Maintenance", color: "bg-orange-100 text-orange-700" },
  { value: "operations", label: "Operations", color: "bg-green-100 text-green-700" },
  { value: "portals", label: "Portals", color: "bg-purple-100 text-purple-700" },
  { value: "financial", label: "Financial", color: "bg-emerald-100 text-emerald-700" },
  { value: "reports", label: "Reports", color: "bg-pink-100 text-pink-700" },
  { value: "integrations", label: "Integrations", color: "bg-cyan-100 text-cyan-700" },
];

export default function NewFeaturePage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("core");
  const [defaultLimit, setDefaultLimit] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/platform-login");
        return;
      }

      const { error: insertError } = await supabase
        .from("features")
        .insert({
          code: code.toLowerCase().replace(/\s+/g, '.'),
          name,
          description: description || null,
          category,
          default_limit: defaultLimit ? parseInt(defaultLimit) : null,
          display_order: displayOrder ? parseInt(displayOrder) : 0,
          is_active: isActive,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      router.push("/platform/plans/features");
      router.refresh();
    } catch (err) {
      console.error("Error creating feature:", err);
      setError(err instanceof Error ? err.message : "Failed to create feature");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/platform/plans/features">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Feature</h1>
          <p className="text-gray-500">Create a new platform feature</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Feature Details</CardTitle>
            <CardDescription>Define the basic feature information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Feature Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., core.associations"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">Unique identifier, lowercase with dots (e.g., core.associations)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Feature Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Associations Management"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                placeholder="Describe what this feature does..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      category === cat.value
                        ? cat.color + " ring-2 ring-offset-1 ring-gray-400"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultLimit">Default Limit</Label>
                <Input
                  id="defaultLimit"
                  type="number"
                  placeholder="e.g., 5 (leave empty for unlimited)"
                  value={defaultLimit}
                  onChange={(e) => setDefaultLimit(e.target.value)}
                />
                <p className="text-xs text-gray-500">Default usage limit for this feature (0 = unlimited)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  placeholder="e.g., 1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                />
                <p className="text-xs text-gray-500">Order in which this feature appears in lists</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="mb-0">Feature is active</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Feature
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/platform/plans/features")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
