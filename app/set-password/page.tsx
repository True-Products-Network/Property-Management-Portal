"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Lock, AlertCircle, CheckCircle2, Building2 } from "lucide-react";
import Link from "next/link";

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const tenantSlug = searchParams.get("tenant");
  const email = searchParams.get("email");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [validating, setValidating] = useState(true);

  // Validate the recovery token and get tenant info
  useEffect(() => {
    async function validateAndLoad() {
      if (!email || !tenantSlug) {
        setError("Invalid invitation link. Please request a new invitation.");
        setValidating(false);
        return;
      }

      // Get tenant info
      try {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("name, id, subdomain")
          .or(`subdomain.eq.${tenantSlug},id.eq.${tenantSlug}`)
          .single();
        
        if (tenant) {
          setTenantName(tenant.name);
        }
      } catch (err) {
        console.error("Error loading tenant:", err);
      }
      
      setValidating(false);
    }
    
    validateAndLoad();
  }, [email, tenantSlug, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      // Get the current session (should be set from the recovery link)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Your invitation link has expired. Please request a new one.");
        setLoading(false);
        return;
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        throw updateError;
      }

      // Activate the user for the tenant
      if (tenantSlug && email) {
        const response = await fetch("/api/invitations/activate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            tenantSlug,
          }),
        });

        if (!response.ok) {
          console.error("Error activating user for tenant");
        }
      }

      // Sign out the recovery session and sign in with new password
      await supabase.auth.signOut();
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email!,
        password: password,
      });

      if (signInError) {
        console.error("Auto sign-in failed:", signInError);
        // Still show success, but they'll need to manually log in
        setSuccess(true);
        setTimeout(() => {
          const loginUrl = tenantSlug 
            ? `/sign-in?tenant=${tenantSlug}`
            : "/sign-in";
          router.push(loginUrl);
        }, 3000);
        return;
      }

      // Successfully signed in, redirect to portal
      setSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error("Error setting password:", err);
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {tenantName || "Property Portal"}
              </h1>
              <p className="text-sm text-gray-500">Set Your Password</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Create Your Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-gray-600">
                  Your password has been set and you&apos;re now signed in!
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting you to the portal...
                </p>
              </div>
            ) : (
              <>
                <p className="text-center text-gray-600">
                  Welcome! Please create a password for your account.
                  {email && (
                    <span className="block mt-2 text-sm text-gray-500">
                      {email}
                    </span>
                  )}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      minLength={8}
                    />
                    <p className="text-xs text-gray-500">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Setting Password..." : "Set Password & Activate Account"}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help?{" "}
            <Link href="/support" className="text-blue-600 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}
