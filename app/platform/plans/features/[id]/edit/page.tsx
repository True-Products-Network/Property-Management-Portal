// PL-06: Edit Feature
// Edit an existing feature in the catalog

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditFeaturePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform-login");
  }

  // Check if user is platform admin or support
  const { data: platformRole } = await supabase
    .from("platform_user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .single();

  if (!platformRole) {
    redirect("/unauthorized");
  }

  // Fetch the feature
  const { data: feature, error } = await supabase
    .from("features")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !feature) {
    redirect("/platform/plans/features");
  }

  async function updateFeature(formData: FormData) {
    "use server";
    
    const supabase = await createClient();
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const default_limit = formData.get("default_limit") as string;
    const is_active = formData.get("is_active") === "on";
    
    const { error } = await supabase
      .from("features")
      .update({
        name,
        description,
        category,
        default_limit: default_limit ? parseInt(default_limit) : null,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    
    if (error) {
      console.error("Error updating feature:", error);
      throw new Error("Failed to update feature");
    }
    
    redirect("/platform/plans/features");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/platform/plans/features">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Features
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Feature</h1>
          <p className="text-gray-500">Update feature details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateFeature} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="code">Feature Code</Label>
              <Input
                id="code"
                name="code"
                defaultValue={feature.code}
                disabled
                className="bg-gray-100"
              />
              <p className="text-sm text-gray-500">Feature code cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Feature Name *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={feature.name}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                defaultValue={feature.description || ""}
                rows={3}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                name="category"
                defaultValue={feature.category}
                required
                className="w-full border rounded-md px-3 py-2"
              >
                <option value="core">Core</option>
                <option value="maintenance">Maintenance</option>
                <option value="operations">Operations</option>
                <option value="portals">Portals</option>
                <option value="financial">Financial</option>
                <option value="reports">Reports</option>
                <option value="integrations">Integrations</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_limit">Default Limit (leave empty for unlimited)</Label>
              <Input
                id="default_limit"
                name="default_limit"
                type="number"
                defaultValue={feature.default_limit || ""}
                placeholder="Unlimited"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                defaultChecked={feature.is_active}
                className="h-4 w-4"
              />
              <Label htmlFor="is_active" className="mb-0">Active</Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Link href="/platform/plans/features">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
