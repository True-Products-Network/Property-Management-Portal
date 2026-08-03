// PL-09: Add Platform User
// Create a new platform admin or support user

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, UserPlus } from "lucide-react";
import Link from "next/link";

export default function AddPlatformUserPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"PLATFORM_ADMIN" | "PLATFORM_SUPPORT">("PLATFORM_SUPPORT");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // First, check if user exists in auth.users
      const { data: existingUsers, error: searchError } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email)
        .single();

      if (searchError || !existingUsers) {
        setError("User not found. They must sign up first before being added as a platform user.");
        setIsLoading(false);
        return;
      }

      const userId = existingUsers.id;

      // Check if user already has a platform role
      const { data: existingRole } = await supabase
        .from("platform_user_roles")
        .select("id, role, revoked_at")
        .eq("user_id", userId)
        .single();

      if (existingRole && !existingRole.revoked_at) {
        setError(`User already has an active ${existingRole.role} role.`);
        setIsLoading(false);
        return;
      }

      // If role was revoked, reactivate it
      if (existingRole?.revoked_at) {
        const { error: updateError } = await supabase
          .from("platform_user_roles")
          .update({
            role,
            revoked_at: null,
            granted_at: new Date().toISOString(),
          })
          .eq("id", existingRole.id);

        if (updateError) throw updateError;
      } else {
        // Create new platform user role
        const { error: insertError } = await supabase
          .from("platform_user_roles")
          .insert({
            user_id: userId,
            role,
            granted_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      // Log the action
      await supabase.from("platform_audit_events").insert({
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        actor_type: "platform_admin",
        action: "platform_role_granted",
        action_category: "security",
        target_type: "user",
        target_id: userId,
        new_value: { role },
      });

      setSuccess(`Successfully added ${email} as ${role}`);
      setTimeout(() => {
        router.push("/platform/users");
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Error adding platform user:", err);
      setError(err instanceof Error ? err.message : "Failed to add platform user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/platform/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add Platform User</h1>
        <p className="text-gray-500">Grant platform admin or support access to a user</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            User Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">User Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                The user must already have an account in the system.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRole("PLATFORM_ADMIN")}
                  className={`flex-1 p-4 border rounded-lg text-left transition-colors ${
                    role === "PLATFORM_ADMIN"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Platform Admin</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Full access to all platform features and settings
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("PLATFORM_SUPPORT")}
                  className={`flex-1 p-4 border rounded-lg text-left transition-colors ${
                    role === "PLATFORM_SUPPORT"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Platform Support</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Read-only access for customer support and diagnostics
                  </p>
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Adding User..." : "Add Platform User"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/platform/users")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="max-w-2xl bg-gray-50">
        <CardContent className="pt-6">
          <h3 className="font-medium mb-2">Role Permissions</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <Badge className="bg-red-600 shrink-0">Admin</Badge>
              <span>Can create/edit tenants, plans, features, and manage all platform settings</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="shrink-0">Support</Badge>
              <span>Can view tenant data, access support sessions, and view audit logs</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
