"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, UserPlus, Save, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: { id: string };
}

export default function EditPlatformUserPage({ params }: PageProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"PLATFORM_ADMIN" | "PLATFORM_SUPPORT">("PLATFORM_SUPPORT");
  const [status, setStatus] = useState<"active" | "revoked">("active");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    loadUser();
  }, [params.id]);

  const loadUser = async () => {
    try {
      const response = await fetch(`/api/platform/users/${params.id}`);
      if (!response.ok) {
        throw new Error("Failed to load user");
      }
      
      const data = await response.json();
      setEmail(data.user.email || "");
      setFullName(data.user.full_name || "");
      setRole(data.platformUser.role);
      setStatus(data.platformUser.revoked_at ? "revoked" : "active");
      setUserId(data.platformUser.user_id);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to load user details");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/platform/users/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName,
          role,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update user");
      }

      router.push(`/platform/users/${params.id}`);
      router.refresh();
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    } finally {
      setIsSaving(false);
    }
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
      <div className="flex items-center gap-4">
        <Link href={`/platform/users/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to User
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Platform User</h1>
        <p className="text-gray-500">Update user information and access</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            User Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
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

            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStatus("active")}
                  className={`flex-1 p-4 border rounded-lg text-left transition-colors ${
                    status === "active"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Badge className="bg-green-600 mb-2">Active</Badge>
                  <p className="text-sm text-gray-500">
                    User has full access to platform features based on their role
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus("revoked")}
                  className={`flex-1 p-4 border rounded-lg text-left transition-colors ${
                    status === "revoked"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Badge variant="outline" className="text-red-600 mb-2">Revoked</Badge>
                  <p className="text-sm text-gray-500">
                    User access is disabled and they cannot log in
                  </p>
                </button>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSaving} className="flex-1">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/platform/users/${params.id}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
