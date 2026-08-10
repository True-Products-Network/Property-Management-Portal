"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function BusinessFixPage() {
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Not logged in");
        return;
      }

      // Get contact record with tenant
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
          .select("name, slug")
          .eq("id", contact.tenant_id)
          .single();
        tenantName = tenant?.name;
      }

      // Check if a business exists for this tenant
      const { data: existingBusiness } = await supabase
        .from("businesses")
        .select("id, name, slug")
        .eq("slug", contact?.tenant_id || "no-tenant")
        .maybeSingle();

      // Count orphaned entities (no business_id)
      const [
        { count: orphanedAssoc },
        { count: orphanedProp },
        { count: orphanedUnits },
        { count: orphanedContacts },
        { count: orphanedVendors },
        { count: orphanedMaint },
        { count: orphanedInspect },
        { count: orphanedDocs },
        { count: orphanedApprovals },
        { count: orphanedCompliance },
        { count: orphanedPayments },
        { count: orphanedComm },
      ] = await Promise.all([
        supabase.from("associations").select("id", { count: "exact" }).is("business_id", null),
        supabase.from("properties").select("id", { count: "exact" }).is("business_id", null),
        supabase.from("units").select("id", { count: "exact" }).is("business_id", null),
        supabase.from("contacts").select("id", { count: "exact" }).is("business_id", null),
        supabase.from("vendors").select("id", { count: "exact" }).is("business_id", null),
        supabase.from("maintenance_requests").select("id", { count: "exact" }).is("business_id", null),
        supabase.from("inspections").select("id", { count: "exact" }).is("business_id", null),
        supabase.from("documents").select("id", { count: "exact" }).is("business_id", null),
        supabase.from("approvals").select("id", { count: "exact" }).is("business_id", null),
        supabase.from("compliance_matters").select("id", { count: "exact" }).is("business_id", null),
        supabase.from("payment_records").select("id", { count: "exact" }).is("business_id", null),
        supabase.from("communications").select("id", { count: "exact" }).is("business_id", null),
      ]);

      setData({
        userId: user.id,
        email: user.email,
        tenantId: contact?.tenant_id,
        tenantName,
        existingBusiness,
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

  async function createBusinessAndMigrate() {
    try {
      setFixing(true);
      setResult(null);
      setError(null);

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
        setError("No tenant found");
        return;
      }

      // Get tenant details
      const { data: tenant } = await supabase
        .from("tenants")
        .select("name, slug")
        .eq("id", contact.tenant_id)
        .single();

      // Create business record for this tenant
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert({
          name: tenant?.name || "Default Business",
          slug: contact.tenant_id, // Use tenant ID as slug for easy lookup
          status: "active",
        })
        .select()
        .single();

      if (businessError) {
        // Maybe business already exists
        const { data: existingBusiness } = await supabase
          .from("businesses")
          .select("id, name")
          .eq("slug", contact.tenant_id)
          .single();
        
        if (!existingBusiness) {
          setError("Failed to create business: " + businessError.message);
          return;
        }
        
        // Use existing business
        await migrateToBusiness(existingBusiness.id);
      } else {
        // Use new business
        await migrateToBusiness(business.id);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Fix failed");
    } finally {
      setFixing(false);
    }
  }

  async function migrateToBusiness(businessId: string) {
    const results: any = {};

    // Update associations
    const { data: assocData, error: assocError } = await supabase
      .from("associations")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.associations = { count: assocData?.length || 0, error: assocError?.message };

    // Update properties
    const { data: propData, error: propError } = await supabase
      .from("properties")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.properties = { count: propData?.length || 0, error: propError?.message };

    // Update vendors
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.vendors = { count: vendorData?.length || 0, error: vendorError?.message };

    // Update units
    const { data: unitData, error: unitError } = await supabase
      .from("units")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.units = { count: unitData?.length || 0, error: unitError?.message };

    // Update maintenance
    const { data: maintData, error: maintError } = await supabase
      .from("maintenance_requests")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.maintenance = { count: maintData?.length || 0, error: maintError?.message };

    // Update inspections
    const { data: inspectData, error: inspectError } = await supabase
      .from("inspections")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.inspections = { count: inspectData?.length || 0, error: inspectError?.message };

    // Update contacts
    const { data: contactData, error: contactError } = await supabase
      .from("contacts")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.contacts = { count: contactData?.length || 0, error: contactError?.message };

    // Update documents
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.documents = { count: docData?.length || 0, error: docError?.message };

    // Update approvals
    const { data: approvalData, error: approvalError } = await supabase
      .from("approvals")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.approvals = { count: approvalData?.length || 0, error: approvalError?.message };

    // Update compliance
    const { data: complianceData, error: complianceError } = await supabase
      .from("compliance_matters")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.compliance = { count: complianceData?.length || 0, error: complianceError?.message };

    // Update payments
    const { data: paymentData, error: paymentError } = await supabase
      .from("payment_records")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.payments = { count: paymentData?.length || 0, error: paymentError?.message };

    // Update communications
    const { data: commData, error: commError } = await supabase
      .from("communications")
      .update({ business_id: businessId })
      .is("business_id", null)
      .select("id");
    results.communications = { count: commData?.length || 0, error: commError?.message };

    setResult(results);
    await loadData();
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
      <h1 className="text-2xl font-semibold">Business Fix</h1>
      <p className="text-gray-600">
        The system uses a separate &quot;businesses&quot; table for entity isolation. 
        This fix creates a business record for your tenant and migrates orphaned data.
      </p>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Tenant:</strong> {data?.tenantName} ({data?.tenantId})</p>
          <p><strong>Business Record:</strong> {data?.existingBusiness ? `Exists (${data.existingBusiness.id})` : "Not found"}</p>
          <div className="mt-4">
            <p className="font-semibold">Orphaned Data (No Business ID):</p>
            <div className="grid grid-cols-2 gap-2 text-sm mt-2">
              <p>Associations: {data?.orphaned?.associations}</p>
              <p>Properties: {data?.orphaned?.properties}</p>
              <p>Units: {data?.orphaned?.units}</p>
              <p>Contacts: {data?.orphaned?.contacts}</p>
              <p>Vendors: {data?.orphaned?.vendors}</p>
              <p>Maintenance: {data?.orphaned?.maintenance}</p>
              <p>Inspections: {data?.orphaned?.inspections}</p>
              <p>Documents: {data?.orphaned?.documents}</p>
              <p>Approvals: {data?.orphaned?.approvals}</p>
              <p>Compliance: {data?.orphaned?.compliance}</p>
              <p>Payments: {data?.orphaned?.payments}</p>
              <p>Communications: {data?.orphaned?.communications}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!data?.existingBusiness && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">Action Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-amber-800">
              No business record exists for your tenant. You need to create one before you can add associations or other entities.
            </p>
            <Button 
              onClick={createBusinessAndMigrate} 
              disabled={fixing}
              className="w-full bg-amber-600 hover:bg-amber-700"
            >
              {fixing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Business & Migrating...
                </>
              ) : (
                "Create Business & Migrate Orphaned Data"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Migration Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
              <p>Associations: {result.associations?.count}</p>
              <p>Properties: {result.properties?.count}</p>
              <p>Units: {result.units?.count}</p>
              <p>Contacts: {result.contacts?.count}</p>
              <p>Vendors: {result.vendors?.count}</p>
              <p>Maintenance: {result.maintenance?.count}</p>
              <p>Inspections: {result.inspections?.count}</p>
              <p>Documents: {result.documents?.count}</p>
              <p>Approvals: {result.approvals?.count}</p>
              <p>Compliance: {result.compliance?.count}</p>
              <p>Payments: {result.payments?.count}</p>
              <p>Communications: {result.communications?.count}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
