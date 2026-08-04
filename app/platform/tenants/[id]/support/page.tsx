// PL-03: Support Access Session
// Create a temporary support access session for a tenant

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Shield, 
  Clock, 
  Building2, 
  User,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { format, addHours } from "date-fns";

interface Tenant {
  id: string;
  name: string;
  code: string;
  status: string;
}

export default function SupportAccessPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [tenantId]);

  const loadData = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/platform-login");
        return;
      }
      setCurrentUser(user);

      // Check platform role
      const { data: platformRole } = await supabase
        .from("platform_user_roles")
        .select("role")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .single();

      if (!platformRole) {
        router.push("/unauthorized");
        return;
      }

      // Get tenant details
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name, code, status")
        .eq("id", tenantId)
        .single();

      if (tenantError || !tenantData) {
        setError("Tenant not found");
        setIsLoading(false);
        return;
      }

      setTenant(tenantData);

      // Check for existing active session
      const { data: sessions } = await supabase
        .from("support_access_sessions")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("platform_user_id", user.id)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("started_at", { ascending: false })
        .limit(1)
        .single();

      if (sessions) {
        setActiveSession(sessions);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load tenant data");
    } finally {
      setIsLoading(false);
    }
  };

  const createSupportSession = async () => {
    setIsCreating(true);
    setError("");
    setSuccess("");

    try {
      const now = new Date();
      const expiresAt = addHours(now, 4); // 4 hour session

      const { data: session, error: createError } = await supabase
        .from("support_access_sessions")
        .insert({
          tenant_id: tenantId,
          platform_user_id: currentUser.id,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          reason: "Platform support session",
        })
        .select()
        .single();

      if (createError) throw createError;

      // Log the action
      await supabase.from("platform_audit_events").insert({
        actor_id: currentUser.id,
        actor_type: "platform_support",
        tenant_id: tenantId,
        action: "support_session_created",
        action_category: "support",
        target_type: "tenant",
        target_id: tenantId,
        new_value: { 
          session_id: session.id,
          expires_at: expiresAt.toISOString(),
        },
      });

      setActiveSession(session);
      setSuccess("Support access session created successfully");
    } catch (err) {
      console.error("Error creating session:", err);
      setError("Failed to create support session");
    } finally {
      setIsCreating(false);
    }
  };

  const endSupportSession = async () => {
    if (!activeSession) return;

    setIsCreating(true);
    setError("");

    try {
      const { error: endError } = await supabase
        .from("support_access_sessions")
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
        })
        .eq("id", activeSession.id);

      if (endError) throw endError;

      // Log the action
      await supabase.from("platform_audit_events").insert({
        actor_id: currentUser.id,
        actor_type: "platform_support",
        tenant_id: tenantId,
        action: "support_session_ended",
        action_category: "support",
        target_type: "tenant",
        target_id: tenantId,
        new_value: { session_id: activeSession.id },
      });

      setActiveSession(null);
      setSuccess("Support session ended");
    } catch (err) {
      console.error("Error ending session:", err);
      setError("Failed to end support session");
    } finally {
      setIsCreating(false);
    }
  };

  const enterTenant = () => {
    // Store session info and redirect to tenant
    if (activeSession) {
      localStorage.setItem("support_session_id", activeSession.id);
      localStorage.setItem("support_tenant_id", tenantId);
      router.push(`/management?support_session=${activeSession.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/platform/tenants">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenants
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-500">Tenant not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/platform/tenants/${tenantId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenant
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Access</h1>
        <p className="text-gray-500">Create a temporary support session for {tenant.name}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Tenant Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Tenant Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{tenant.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Code</p>
              <p className="font-medium">{tenant.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={tenant.status === "active" ? "default" : "destructive"}>
                {tenant.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Session Duration</p>
              <p className="font-medium">4 hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Session or Create New */}
      {activeSession ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Shield className="h-5 w-5 text-green-600" />
              Active Support Session
            </CardTitle>
            <CardDescription className="text-green-700">
              You have an active support session for this tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-green-700">Session expires at</p>
                <p className="font-medium text-green-900">
                  {format(new Date(activeSession.expires_at), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button onClick={enterTenant} className="flex-1 bg-green-600 hover:bg-green-700">
                <Building2 className="h-4 w-4 mr-2" />
                Enter Tenant as Support
              </Button>
              <Button 
                variant="outline" 
                onClick={endSupportSession}
                disabled={isCreating}
              >
                <XCircle className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Create Support Session
            </CardTitle>
            <CardDescription>
              Create a temporary session to access this tenant's data for support purposes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Support Access Notice</p>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Session lasts 4 hours and will be logged</li>
                    <li>• All actions will be recorded in the audit log</li>
                    <li>• Tenant will be notified of support access</li>
                    <li>• Use only for legitimate support purposes</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button 
              onClick={createSupportSession} 
              disabled={isCreating}
              className="w-full"
            >
              <Shield className="h-4 w-4 mr-2" />
              {isCreating ? "Creating Session..." : "Create Support Session"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Session History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Recent support sessions will appear here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
