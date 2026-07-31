"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { signInSchema, type SignInInput } from "@/schemas/portal/auth";

export default function SignInPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SignInInput>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = signInSchema.safeParse(formData);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password");
        return;
      }

      // Redirect based on role
      router.push(data.redirectUrl || "/management/overview");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--primary-navy)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[var(--teal)] rounded-xl flex items-center justify-center">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-semibold">Exemplary</h1>
              <p className="text-sm text-white/60">Property Management</p>
            </div>
          </div>
        </div>

        {/* Sign In Card */}
        <div className="card p-8">
          <h2 className="text-2xl font-semibold text-[var(--main-text)] mb-2">
            Sign in to your account
          </h2>
          <p className="text-[var(--secondary-text)] mb-6">
            Enter your credentials to access the portal
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

          <div className="mt-6 text-center">
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
        </div>
      </div>
    </div>
  );
}
