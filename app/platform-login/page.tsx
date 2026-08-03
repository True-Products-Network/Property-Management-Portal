// Platform Console Login - Simplified
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertCircle } from "lucide-react";

export default function PlatformLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned");

      // Check platform role
      const { data: platformRole } = await supabase
        .from("platform_user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .is("revoked_at", null)
        .single();

      if (!platformRole) {
        await supabase.auth.signOut();
        throw new Error("You do not have Platform Console access.");
      }

      // Log the login
      await supabase.from("platform_audit_events").insert({
        actor_id: authData.user.id,
        actor_type: platformRole.role === 'PLATFORM_ADMIN' ? 'platform_admin' : 'platform_support',
        action: "platform_login",
        action_category: "security",
        target_type: "user",
        target_id: authData.user.id,
      });

      // Redirect to platform dashboard
      router.push("/platform");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-600 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">True Products Network</h1>
          <p className="text-gray-500">Platform Console</p>
          <p className="text-sm text-gray-400">Authorized personnel only</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@trueproductsnetwork.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In to Platform Console"}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-400">
          <p>This is a secure system.</p>
          <p>All access is logged and monitored.</p>
        </div>
      </div>
    </div>
  );
}
