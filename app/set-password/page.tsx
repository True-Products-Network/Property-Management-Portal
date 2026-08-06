"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Lock, AlertCircle, CheckCircle2, Building2, Mail, Building } from "lucide-react";
import Link from "next/link";

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  // Get values from URL if provided
  const tenantSlugFromUrl = searchParams.get("tenant");
  const emailFromUrl = searchParams.get("email");
  
  // Form state
  const [email, setEmail] = useState(emailFromUrl || "");
  const [tenantSlug, setTenantSlug] = useState(tenantSlugFromUrl || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [tenantValidated, setTenantValidated] = useState(false);
  const [validatingTenant, setValidatingTenant] = useState(false);

  // Auto-validate tenant if provided in URL
  useEffect(() => {
    if (tenantSlugFromUrl) {
      validateTenant(tenantSlugFromUrl);
    }
  }, [tenantSlugFromUrl]);

  async function validateTenant(slug: string) {
    if (!slug) return;
    
    setValidatingTenant(true);
    setError("");
    
    console.log("[SetPassword] Validating tenant slug:", slug);
    
    try {
      // Use API endpoint to validate tenant (bypasses RLS)
      const response = await fetch(`/api/auth/validate-tenant?slug=${encodeURIComponent(slug)}`);
      const result = await response.json();
      
      console.log("[SetPassword] Tenant lookup result:", { result, status: response.status });
      
      if (response.ok && result.success) {
        setTenantName(result.tenant.name);
        setTenantValidated(true);
        console.log("[SetPassword] Tenant validated:", result.tenant.name);
      } else {
        setTenantName(null);
        setTenantValidated(false);
        console.error("[SetPassword] Tenant validation failed:", { slug, result });
        if (tenantSlugFromUrl) {
          setError(`Invalid tenant ID "${slug}". Please check your invitation email or contact support.`);
        }
      }
    } catch (err) {
      console.error("[SetPassword] Error validating tenant:", err);
      setTenantName(null);
      setTenantValidated(false);
      if (tenantSlugFromUrl) {
        setError("Error validating tenant. Please try again or contact support.");
      }
    } finally {
      setValidatingTenant(false);
    }
  }

  function handleTenantBlur() {
    if (tenantSlug && !tenantValidated) {
      validateTenant(tenantSlug);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (!email || !tenantSlug) {
      setError("Please enter both your email and tenant ID");
      setLoading(false);
      return;
    }

    // Validate tenant
    if (!tenantValidated) {
      await validateTenant(tenantSlug);
      if (!tenantValidated) {
        setError("Please enter a valid tenant ID");
        setLoading(false);
        return;
      }
    }

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
      // Call API to set password and activate user
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tenantSlug,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to set password");
      }

      // Password set successfully, now sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError || !signInData.session) {
        console.error("Auto sign-in failed:", signInError);
        // Show success but redirect to login
        setSuccess(true);
        setTimeout(() => {
          const loginUrl = tenantSlug 
            ? `/sign-in?tenant=${tenantSlug}`
            : "/sign-in";
          router.push(loginUrl);
        }, 2000);
        return;
      }

      // Successfully signed in - redirect based on user metadata or default to overview
      const redirectUrl = signInData.user?.user_metadata?.redirect_url || 
                          signInData.user?.user_metadata?.portal_role 
                            ? "/management/overview" 
                            : "/";
      console.log("[SetPassword] Sign-in successful, redirecting to:", redirectUrl);
      setSuccess(true);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1500);
    } catch (err) {
      console.error("Error setting password:", err);
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  const showPasswordForm = tenantValidated && email;

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
              <p className="text-sm text-gray-500">
                {tenantValidated ? "Set Your Password" : "Account Setup"}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">
              {tenantValidated ? "Create Your Password" : "Enter Your Details"}
            </CardTitle>
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
                  Your password has been set successfully!
                </p>
                <p className="text-sm text-gray-500">
                  Redirecting you to the portal...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    disabled={!!emailFromUrl}
                    className={emailFromUrl ? "bg-gray-50" : ""}
                  />
                  {emailFromUrl && (
                    <p className="text-xs text-gray-500">Prefilled from invitation link</p>
                  )}
                </div>

                {/* Tenant ID Field */}
                <div className="space-y-2">
                  <Label htmlFor="tenant" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Tenant ID
                  </Label>
                  <Input
                    id="tenant"
                    type="text"
                    value={tenantSlug}
                    onChange={(e) => {
                      setTenantSlug(e.target.value);
                      setTenantValidated(false);
                      setTenantName(null);
                    }}
                    onBlur={handleTenantBlur}
                    placeholder="Enter your tenant ID"
                    required
                    disabled={!!tenantSlugFromUrl || validatingTenant}
                    className={tenantSlugFromUrl ? "bg-gray-50" : ""}
                  />
                  {validatingTenant && (
                    <p className="text-xs text-gray-500">Validating tenant...</p>
                  )}
                  {tenantValidated && tenantName && (
                    <p className="text-xs text-green-600">✓ Valid: {tenantName}</p>
                  )}
                  {tenantSlugFromUrl && (
                    <p className="text-xs text-gray-500">Prefilled from invitation link</p>
                  )}
                  {!tenantSlugFromUrl && !tenantValidated && (
                    <p className="text-xs text-gray-500">
                      Find your Tenant ID in your invitation email
                    </p>
                  )}
                </div>

                {/* Password Fields - Only show when tenant is validated */}
                {showPasswordForm && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
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
                  </>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || Boolean(!showPasswordForm && tenantSlug && !tenantValidated)}
                >
                  {loading ? "Processing..." : !showPasswordForm ? "Continue" : "Set Password & Sign In"}
                </Button>
              </form>
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
