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
import { ArrowLeft, Shield, UserPlus, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function AddPlatformUserPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<"PLATFORM_ADMIN" | "PLATFORM_SUPPORT">("PLATFORM_SUPPORT");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Get current admin user before any operations
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setError("You must be logged in to add platform users");
        setIsLoading(false);
        return;
      }

      // Step 1: Create the user via API route (server-side) to avoid session issues
      const response = await fetch("/api/platform/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      setSuccess(`Successfully ${result.isNewUser ? 'created' : 'added'} ${email} as ${role}`);
      
      // Clear form
      setEmail("");
      setPassword("");
      setFullName("");
      
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
        <p className="text-gray-500">Create a new platform admin or support user</p>
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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm text-gray-500">
                For new users: this will be their password. For existing users: enter their current password to verify.
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
                {isLoading ? "Creating User..." : "Create Platform User"}
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
          <h3 className="font-medium mb-2">How it works</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• If the email doesn't exist, a new user will be created with the password you provide.</p>
            <p>• If the email already exists, you must enter their correct password to verify ownership.</p>
            <p>• The user will be granted the selected platform role (Admin or Support).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
