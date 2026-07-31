"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Processing authentication...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();
      
      // Check for error parameters
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      
      if (error) {
        setStatus("error");
        setMessage(errorDescription || "Authentication failed");
        return;
      }

      // Exchange the code for a session
      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(
        window.location.hash
      );

      if (sessionError) {
        setStatus("error");
        setMessage(sessionError.message);
        return;
      }

      // Get user to determine redirect
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setStatus("success");
        setMessage("Authentication successful! Redirecting...");
        
        const redirectUrl = user.user_metadata?.redirect_url || "/management/overview";
        
        setTimeout(() => {
          router.push(redirectUrl);
        }, 1500);
      } else {
        setStatus("error");
        setMessage("User not found");
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[var(--primary-navy)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 text-[var(--teal)] animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[var(--main-text)] mb-2">
                Processing...
              </h2>
              <p className="text-[var(--secondary-text)]">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--main-text)] mb-2">
                Success!
              </h2>
              <p className="text-[var(--secondary-text)]">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-[var(--main-text)] mb-2">
                Authentication Error
              </h2>
              <p className="text-[var(--secondary-text)] mb-4">{message}</p>
              <a
                href="/sign-in"
                className="btn btn-primary inline-block"
              >
                Go to Sign In
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--primary-navy)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <Loader2 className="h-12 w-12 text-[var(--teal)] animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[var(--main-text)] mb-2">
              Loading...
            </h2>
            <p className="text-[var(--secondary-text)]">Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
