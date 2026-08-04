"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidLink, setIsValidLink] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session means the link might be invalid or expired
        // But we'll still show the form - Supabase will validate on update
      }
    };
    checkSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setSuccess(true);
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push("/sign-in");
      }, 3000);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isValidLink) {
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
                <h1 className="text-xl font-semibold">Associos</h1>
                <p className="text-sm text-white/60">Property Management</p>
              </div>
            </div>
          </div>

          <div className="card p-8 text-center">
            <h2 className="text-2xl font-semibold text-[var(--main-text)] mb-4">
              Invalid or Expired Link
            </h2>
            <p className="text-[var(--secondary-text)] mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link href="/forgot-password" className="btn btn-primary w-full block">
              Request new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-xl font-semibold">Associos</h1>
              <p className="text-sm text-white/60">Property Management</p>
            </div>
          </div>
        </div>

        {/* Reset Password Card */}
        <div className="card p-8">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--main-text)] mb-2">
                Password updated!
              </h2>
              <p className="text-[var(--secondary-text)] mb-6">
                Your password has been successfully reset. Redirecting you to sign in...
              </p>
              <Link
                href="/sign-in"
                className="btn btn-primary w-full block"
              >
                Sign in now
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex items-center text-sm text-[var(--secondary-text)] hover:text-[var(--teal)] mb-6"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to sign in
              </Link>

              <h2 className="text-2xl font-semibold text-[var(--main-text)] mb-2">
                Reset your password
              </h2>
              <p className="text-[var(--secondary-text)] mb-6">
                Enter your new password below.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-[var(--error)]">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[var(--main-text)] mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pr-10"
                      placeholder="Enter new password"
                      required
                      minLength={6}
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
                  <p className="text-xs text-[var(--secondary-text)] mt-1">
                    Must be at least 6 characters
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-[var(--main-text)] mb-1"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full py-2.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Reset password"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
