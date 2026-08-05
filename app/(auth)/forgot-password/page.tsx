"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      console.log("[Forgot Password] Sending reset email to:", email);
      console.log("[Forgot Password] Redirect URL:", `${window.location.origin}/reset-password`);
      
      const { error: resetError, data } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      console.log("[Forgot Password] Supabase response:", { error: resetError, data });

      if (resetError) {
        console.error("[Forgot Password] Error:", resetError);
        setError(resetError.message);
        return;
      }

      console.log("[Forgot Password] Email sent successfully");
      setSuccess(true);
    } catch (err) {
      console.error("[Forgot Password] Exception:", err);
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
              <h1 className="text-xl font-semibold">Associos</h1>
              <p className="text-sm text-white/60">Property Management</p>
            </div>
          </div>
        </div>

        {/* Forgot Password Card */}
        <div className="card p-8">
          <Link
            href="/sign-in"
            className="inline-flex items-center text-sm text-[var(--secondary-text)] hover:text-[var(--teal)] mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to sign in
          </Link>

          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--main-text)] mb-2">
                Check your email
              </h2>
              <p className="text-[var(--secondary-text)] mb-6">
                We&apos;ve sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-[var(--secondary-text)] mb-6">
                Didn&apos;t receive the email? Check your spam folder or{" "}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-[var(--teal)] hover:text-[var(--teal-hover)] font-medium"
                >
                  try again
                </button>
              </p>
              <Link
                href="/sign-in"
                className="btn btn-secondary w-full block"
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-[var(--main-text)] mb-2">
                Forgot your password?
              </h2>
              <p className="text-[var(--secondary-text)] mb-6">
                Enter your email address and we&apos;ll send you a link to reset your password.
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
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--secondary-text)]" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full py-2.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-[var(--secondary-text)]">
                  Remember your password?{" "}
                  <Link
                    href="/sign-in"
                    className="text-[var(--teal)] hover:text-[var(--teal-hover)] font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
