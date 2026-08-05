"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { signInSchema, type SignInInput } from "@/schemas/portal/auth";
import { createClient } from "@/lib/supabase/client";

interface TenantBranding {
  name: string;
  logo?: string;
  primaryColor?: string;
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  // Get tenant and invitation from URL
  const tenantId = searchParams.get("tenant");
  const invitationToken = searchParams.get("invitation");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenantBranding, setTenantBranding] = useState<TenantBranding | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState(false);
  const [formData, setFormData] = useState<SignInInput>({
    email: "",
    password: "",
    rememberMe: false,
  });

  // Fetch tenant branding if tenantId is provided
  useEffect(() => {
    if (tenantId) {
      fetchTenantBranding();
    }
  }, [tenantId]);

  async function fetchTenantBranding() {
    setIsLoadingTenant(true);
    try {
      const { data: tenant, error } = await supabase
        .from("tenants")
        .select("name, logo_url, primary_color")
        .eq("id", tenantId)
        .single();

      if (tenant && !error) {
        setTenantBranding({
          name: tenant.name,
          logo: tenant.logo_url,
          primaryColor: tenant.primary_color,
        });
      }
    } catch (err) {
      console.error("Error fetching tenant branding:", err);
    } finally {
      setIsLoadingTenant(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = signInSchema.safeParse(formData);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data.user) {
        // If there's an invitation token, redirect to accept-invitation
        if (invitationToken) {
          router.push(`/accept-invitation?token=${invitationToken}`);
          router.refresh();
          return;
        }
        
        // Get redirect URL from user metadata
        const redirectUrl = data.user.user_metadata?.redirect_url || "/management/overview";
        router.push(redirectUrl);
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--primary-navy)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo - Tenant branded or default Associos */}
        <div className="flex justify-center mb-8">
          {isLoadingTenant ? (
            <div className="flex items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : tenantBranding?.logo ? (
            <div className="flex flex-col items-center gap-2">
              <img 
                src={tenantBranding.logo} 
                alt={tenantBranding.name}
                className="h-16 w-auto object-contain"
              />
              <p className="text-sm text-white/60">Property Management Portal</p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: tenantBranding?.primaryColor || 'var(--teal)' }}
              >
                <Building2 className="h-7 w-7 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-xl font-semibold">
                  {tenantBranding?.name || "Associos"}
                </h1>
                <p className="text-sm text-white/60">Property Management</p>
              </div>
            </div>
          )}
        </div>

        {/* Sign In Card */}
        <div className="card p-8">
          <h2 className="text-2xl font-semibold text-[var(--main-text)] mb-2">
            {invitationToken ? "Sign in to accept invitation" : "Sign in to your account"}
          </h2>
          <p className="text-[var(--secondary-text)] mb-6">
            {tenantBranding?.name 
              ? `Enter your credentials to access ${tenantBranding.name}`
              : "Enter your credentials to access the portal"}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--main-text)] mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--main-text)] mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--secondary-text)] hover:text-[var(--main-text)]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) =>
                    setFormData({ ...formData, rememberMe: e.target.checked })
                  }
                  className="rounded border-[var(--border-color)] text-[var(--teal)] focus:ring-[var(--teal)]"
                />
                <span className="text-sm text-[var(--secondary-text)]">
                  Remember this device
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-[var(--teal)] hover:text-[var(--teal-hover)]"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-2.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-[var(--secondary-text)]">
              Need an account?{" "}
              <Link
                href="/sign-up"
                className="text-[var(--teal)] hover:text-[var(--teal-hover)] font-medium"
              >
                Create user
              </Link>
            </p>
            <p className="text-sm text-[var(--secondary-text)]">
              Need help?{" "}
              <Link
                href="/help"
                className="text-[var(--teal)] hover:text-[var(--teal-hover)]"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-white/60">
          <p>
            <Link href="/privacy" className="hover:text-white">
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/terms" className="hover:text-white">
              Terms of Service
            </Link>
          </p>
          {!tenantBranding?.name && (
            <p className="mt-2">Powered by Associos</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--primary-navy)] flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
