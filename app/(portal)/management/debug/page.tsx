"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function DebugPage() {
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not logged in");
        return;
      }

      // Get contact record
      const { data: contact } = await supabase
        .from("contacts")
        .select("tenant_id, first_name, last_name")
        .eq("portal_user_id", user.id)
        .maybeSingle();

      // Get tenant info
      let tenantName = null;
      if (contact?.tenant_id) {
        const { data: tenant } = await supabase
          .from("tenants")
          .select("name")
          .eq("id", contact.tenant_id)
          .single();
        tenantName = tenant?.name;
      }

      // Count entities in user's tenant (using tenant_id as proxy for business_id check)
      const [
        { count: assocCount },
        { count: propCount },
        { count: unitCount },
        { count: contactCount },
        { count: vendorCount },
        { count: maintCount },
        { count: inspectCount },
        { count: docCount },
        { count: approvalCount },
        { count: complianceCount },
        { count: paymentCount },
        { count: commCount },
      ] = await Promise.all([
        supabase.from("associations").select("id", { count: "exact" }).eq("business_id", contact?.tenant_id || "no-tenant"),
        supabase.from("properties").select("id", { count: "exact" }).eq("business_id", contact?.tenant_id || "no-tenant"),
        supabase.from("units").select("id", { count: "exact" }).eq("business_id", contact?.tenant_id || "no-tenant"),
        supabase.from("contacts").select("id", { count: "exact" }).eq("tenant_id", contact?.tenant_id || "no-tenant"),
        supabase.from("vendors").select("id", { count: "exact" }).eq("business_id", contact?.tenant_id || "no-tenant"),
        supabase.from("maintenance_requests").select("id", { count: "exact" }).eq("business_id", contact?.tenant_id || "no-tenant"),
        supabase.from("inspections").select("id", { count: "exact" }).eq("business_id", contact?.tenant_id || "no-tenant"),
        supabase.from("documents").select("id", { count: "exact" }).eq("business_id", contact?.tenant_id || "no-tenant"),
        supabase.from("approvals").select("id", { count: "exact" }).eq("business_id", contact?.tenant_id || "no-tenant"),
        supabase.from("compliance_matters").select("id", { count: "exact" }).eq("business_id", contact?.tenant_id || "no-tenant"),
        supabase.from("payment_records").select("id", { count: "exact" }).eq("business_id", contact?.tenant_id || "no-tenant"),
        supabase.from("communications").select("id", { count: "exact" }).eq("business_id", contact?.tenant_id || "no-tenant"),
      ]);

      // Count entities with NULL business_id (orphaned)
      const { count: orphanedAssoc } = await supabase
        .from("associations")
        .select("id", { count: "exact" })
        .is("business_id", null);

      const { count: orphanedProp } = await supabase
        .from("properties")
        .select("id", { count: "exact" })
        .is("business_id", null);

      const { count: orphanedUnits } = await supabase
        .from("units")
        .select("id", { count: "exact" })
        .is("business_id", null);

      const { count: orphanedContacts } = await supabase
        .from("contacts")
        .select("id", { count: "exact" })
        .is("tenant_id", null);

      const { count: orphanedVendors } = await supabase
        .from("vendors")
        .select("id", { count: "exact" })
        .is("business_id", null);

      const { count: orphanedMaint } = await supabase
        .from("maintenance_requests")
        .select("id", { count: "exact" })
        .is("business_id", null);

      const { count: orphanedInspect } = await supabase
        .from("inspections")
        .select("id", { count: "exact" })
        .is("business_id", null);

      const { count: orphanedDocs } = await supabase
        .from("documents")
        .select("id", { count: "exact" })
        .is("business_id", null);

      const { count: orphanedApprovals } = await supabase
        .from("approvals")
        .select("id", { count: "exact" })
        .is("business_id", null);

      const { count: orphanedCompliance } = await supabase
        .from("compliance_matters")
        .select("id", { count: "exact" })
        .is("business_id", null);

      const { count: orphanedPayments } = await supabase
        .from("payments")
        .select("id", { count: "exact" })
        .is("business_id", null);

      const { count: orphanedComm } = await supabase
        .from("communications")
        .select("id", { count: "exact" })
        .is("business_id", null);

      setUserData({
        userId: user.id,
        email: user.email,
        tenantId: contact?.tenant_id,
        tenantName,
        contactName: contact ? `${contact.first_name} ${contact.last_name}` : null,
        inTenant: {
          associations: assocCount || 0,
          properties: propCount || 0,
          units: unitCount || 0,
          contacts: contactCount || 0,
          vendors: vendorCount || 0,
          maintenance: maintCount || 0,
          inspections: inspectCount || 0,
          documents: docCount || 0,
          approvals: approvalCount || 0,
          compliance: complianceCount || 0,
          payments: paymentCount || 0,
          communications: commCount || 0,
        },
        orphaned: {
          associations: orphanedAssoc || 0,
          properties: orphanedProp || 0,
          units: orphanedUnits || 0,
          contacts: orphanedContacts || 0,
          vendors: orphanedVendors || 0,
          maintenance: orphanedMaint || 0,
          inspections: orphanedInspect || 0,
          documents: orphanedDocs || 0,
          approvals: orphanedApprovals || 0,
          compliance: orphanedCompliance || 0,
          payments: orphanedPayments || 0,
          communications: orphanedComm || 0,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function migrateData() {
    try {
      setMigrating(true);
      setMigrationResult(null);
      setError(null);

      // Call the server API that uses service role to bypass RLS
      const response = await fetch("/api/admin/migrate-orphaned-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Migration failed");
        return;
      }

      setMigrationResult(data.results);
      
      // Reload data
      await loadUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setMigrating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Data Debug & Migration</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>User ID:</strong> {userData?.userId}</p>
          <p><strong>Email:</strong> {userData?.email}</p>
          <p><strong>Tenant:</strong> {userData?.tenantName || "Unknown"} ({userData?.tenantId})</p>
          <p><strong>Contact:</strong> {userData?.contactName || "Not found"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data in Your Tenant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>Associations: {userData?.inTenant?.associations}</p>
            <p>Properties: {userData?.inTenant?.properties}</p>
            <p>Units: {userData?.inTenant?.units}</p>
            <p>Contacts: {userData?.inTenant?.contacts}</p>
            <p>Vendors: {userData?.inTenant?.vendors}</p>
            <p>Maintenance: {userData?.inTenant?.maintenance}</p>
            <p>Inspections: {userData?.inTenant?.inspections}</p>
            <p>Documents: {userData?.inTenant?.documents}</p>
            <p>Approvals: {userData?.inTenant?.approvals}</p>
            <p>Compliance: {userData?.inTenant?.compliance}</p>
            <p>Payments: {userData?.inTenant?.payments}</p>
            <p>Communications: {userData?.inTenant?.communications}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orphaned Data (No Tenant)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p>Associations: {userData?.orphaned?.associations}</p>
            <p>Properties: {userData?.orphaned?.properties}</p>
            <p>Units: {userData?.orphaned?.units}</p>
            <p>Contacts: {userData?.orphaned?.contacts}</p>
            <p>Vendors: {userData?.orphaned?.vendors}</p>
            <p>Maintenance: {userData?.orphaned?.maintenance}</p>
            <p>Inspections: {userData?.orphaned?.inspections}</p>
            <p>Documents: {userData?.orphaned?.documents}</p>
            <p>Approvals: {userData?.orphaned?.approvals}</p>
            <p>Compliance: {userData?.orphaned?.compliance}</p>
            <p>Payments: {userData?.orphaned?.payments}</p>
            <p>Communications: {userData?.orphaned?.communications}</p>
          </div>
          
          {(userData?.orphaned?.associations > 0 || userData?.orphaned?.properties > 0 || userData?.orphaned?.units > 0 || userData?.orphaned?.contacts > 0 || userData?.orphaned?.vendors > 0 || userData?.orphaned?.maintenance > 0 || userData?.orphaned?.inspections > 0 || userData?.orphaned?.documents > 0 || userData?.orphaned?.approvals > 0 || userData?.orphaned?.compliance > 0 || userData?.orphaned?.payments > 0 || userData?.orphaned?.communications > 0) && (
            <Button 
              onClick={migrateData} 
              disabled={migrating}
              className="w-full mt-4"
            >
              {migrating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                "Migrate All Orphaned Data to Your Tenant"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {migrationResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Migration Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>Associations: {migrationResult.associations?.updated}</p>
              <p>Properties: {migrationResult.properties?.updated}</p>
              <p>Units: {migrationResult.units?.updated}</p>
              <p>Contacts: {migrationResult.contacts?.updated}</p>
              <p>Vendors: {migrationResult.vendors?.updated}</p>
              <p>Maintenance: {migrationResult.maintenance?.updated}</p>
              <p>Inspections: {migrationResult.inspections?.updated}</p>
              <p>Documents: {migrationResult.documents?.updated}</p>
              <p>Approvals: {migrationResult.approvals?.updated}</p>
              <p>Compliance: {migrationResult.compliance?.updated}</p>
              <p>Payments: {migrationResult.payments?.updated}</p>
              <p>Communications: {migrationResult.communications?.updated}</p>
            </div>
            {Object.values(migrationResult).some((r: any) => r.error) && (
              <div className="mt-4 p-3 bg-red-100 rounded text-red-800 text-sm">
                <p className="font-semibold">Errors:</p>
                {Object.entries(migrationResult).filter(([_, r]: [string, any]) => r.error).map(([key, r]: [string, any]) => (
                  <p key={key}>{key}: {r.error}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
