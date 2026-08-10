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

      // Count entities in user's tenant
      const { count: assocCount } = await supabase
        .from("associations")
        .select("id", { count: "exact" })
        .eq("business_id", contact?.tenant_id || "no-tenant");

      const { count: propCount } = await supabase
        .from("properties")
        .select("id", { count: "exact" })
        .eq("business_id", contact?.tenant_id || "no-tenant");

      // Count entities with NULL business_id (orphaned)
      const { count: orphanedAssoc } = await supabase
        .from("associations")
        .select("id", { count: "exact" })
        .is("business_id", null);

      const { count: orphanedProp } = await supabase
        .from("properties")
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
        },
        orphaned: {
          associations: orphanedAssoc || 0,
          properties: orphanedProp || 0,
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not logged in");
        return;
      }

      // Get user's tenant
      const { data: contact } = await supabase
        .from("contacts")
        .select("tenant_id")
        .eq("portal_user_id", user.id)
        .maybeSingle();

      if (!contact?.tenant_id) {
        setError("No tenant found for user");
        return;
      }

      const targetTenantId = contact.tenant_id;
      const results: any = {};

      // Update associations
      const { data: assocData, error: assocError } = await supabase
        .from("associations")
        .update({ business_id: targetTenantId, tenant_id: targetTenantId })
        .is("business_id", null)
        .select("id, name");
      results.associations = { count: assocData?.length || 0, error: assocError?.message };

      // Update properties
      const { data: propData, error: propError } = await supabase
        .from("properties")
        .update({ business_id: targetTenantId })
        .is("business_id", null)
        .select("id, name");
      results.properties = { count: propData?.length || 0, error: propError?.message };

      // Update vendors
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .update({ business_id: targetTenantId })
        .is("business_id", null)
        .select("id, company_name");
      results.vendors = { count: vendorData?.length || 0, error: vendorError?.message };

      // Update units
      const { data: unitData, error: unitError } = await supabase
        .from("units")
        .update({ business_id: targetTenantId })
        .is("business_id", null)
        .select("id, unit_number");
      results.units = { count: unitData?.length || 0, error: unitError?.message };

      // Update maintenance requests
      const { data: maintData, error: maintError } = await supabase
        .from("maintenance_requests")
        .update({ business_id: targetTenantId })
        .is("business_id", null)
        .select("id, title");
      results.maintenance = { count: maintData?.length || 0, error: maintError?.message };

      setMigrationResult(results);
      
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
          <p>Associations: {userData?.inTenant?.associations}</p>
          <p>Properties: {userData?.inTenant?.properties}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orphaned Data (No Tenant)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Associations: {userData?.orphaned?.associations}</p>
          <p>Properties: {userData?.orphaned?.properties}</p>
          
          {(userData?.orphaned?.associations > 0 || userData?.orphaned?.properties > 0) && (
            <Button 
              onClick={migrateData} 
              disabled={migrating}
              className="w-full"
            >
              {migrating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                "Migrate Orphaned Data to Your Tenant"
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
            <ul className="space-y-1 text-green-800">
              <li>Associations updated: {migrationResult.associations?.count}</li>
              <li>Properties updated: {migrationResult.properties?.count}</li>
              <li>Vendors updated: {migrationResult.vendors?.count}</li>
              <li>Units updated: {migrationResult.units?.count}</li>
              <li>Maintenance requests updated: {migrationResult.maintenance?.count}</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
