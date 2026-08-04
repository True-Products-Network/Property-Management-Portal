"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export default function SupportEntryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState("");

  useEffect(() => {
    validateAndEnter();
  }, []);

  const validateAndEnter = async () => {
    try {
      // Get support session from localStorage
      const supportSessionId = localStorage.getItem("support_session_id");
      const supportTenantId = localStorage.getItem("support_tenant_id");

      if (!supportSessionId || !supportTenantId) {
        setError("No active support session found");
        return;
      }

      // Validate the session is still active
      const { data: session, error: sessionError } = await supabase
        .from("support_access_sessions")
        .select("*")
        .eq("id", supportSessionId)
        .eq("tenant_id", supportTenantId)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (sessionError || !session) {
        setError("Support session has expired or is invalid");
        // Clear localStorage
        localStorage.removeItem("support_session_id");
        localStorage.removeItem("support_tenant_id");
        return;
      }

      // Set active association for the support session
      localStorage.setItem("active_association_id", supportTenantId);

      // Redirect to management dashboard
      router.push("/management");
    } catch (err) {
      console.error("Error entering support session:", err);
      setError("Failed to enter support session");
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button
              onClick={() => router.push("/platform/tenants")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Return to Tenants
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Entering Support Session...</h2>
        <p className="text-gray-500 mt-2">Validating your access</p>
      </div>
    </div>
  );
}
