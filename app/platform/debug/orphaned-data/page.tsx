"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Building2,
  Home,
  Users,
  Wrench,
  Truck,
  ClipboardCheck,
  FileText,
  CheckSquare,
  Scale,
  CircleDollarSign,
  MessageSquare,
  RefreshCw,
  Search
} from "lucide-react";

interface OrphanedCounts {
  associations: number;
  properties: number;
  units: number;
  contacts: number;
  vendors: number;
  maintenance: number;
  inspections: number;
  documents: number;
  approvals: number;
  compliance: number;
  payments: number;
  communications: number;
}

export default function OrphanedDataPage() {
  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [orphaned, setOrphaned] = useState<OrphanedCounts | null>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [fixResult, setFixResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function scanOrphaned() {
    if (!tenantId) {
      setError("Please enter a tenant ID");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setOrphaned(null);
      setTenantInfo(null);

      // Get tenant info
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select("id, name, code")
        .eq("id", tenantId)
        .single();

      if (tenantError || !tenant) {
        setError("Tenant not found");
        return;
      }

      setTenantInfo(tenant);

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
        supabase.from("associations").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
        supabase.from("properties").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
        supabase.from("units").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
        supabase.from("contacts").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
        supabase.from("vendors").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
        supabase.from("maintenance_requests").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
        supabase.from("inspections").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
        supabase.from("documents").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
        supabase.from("approvals").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
        supabase.from("compliance_matters").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
        supabase.from("payment_records").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
        supabase.from("communications").select("id", { count: "exact" }).is("business_id", null).eq("tenant_id", tenantId),
      ]);

      setOrphaned({
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
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  async function fixOrphaned() {
    if (!tenantId || !tenantInfo) return;

    try {
      setFixing(true);
      setFixResult(null);
      setError(null);

      const response = await fetch("/api/platform/debug/business-fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, dryRun: false }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Fix failed");
        return;
      }

      setFixResult(data);
      
      // Re-scan to show updated counts
      await scanOrphaned();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fix failed");
    } finally {
      setFixing(false);
    }
  }

  const entityRows = [
    { key: "associations", label: "Associations", icon: Building2 },
    { key: "properties", label: "Properties", icon: Home },
    { key: "units", label: "Units", icon: Users },
    { key: "contacts", label: "Contacts", icon: Users },
    { key: "vendors", label: "Vendors", icon: Truck },
    { key: "maintenance", label: "Maintenance", icon: Wrench },
    { key: "inspections", label: "Inspections", icon: ClipboardCheck },
    { key: "documents", label: "Documents", icon: FileText },
    { key: "approvals", label: "Approvals", icon: CheckSquare },
    { key: "compliance", label: "Compliance", icon: Scale },
    { key: "payments", label: "Payments", icon: CircleDollarSign },
    { key: "communications", label: "Communications", icon: MessageSquare },
  ];

  const totalOrphaned = orphaned ? Object.values(orphaned).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Orphaned Data Scanner</h1>
        <p className="text-gray-600 mt-1">
          Find and fix entities missing business_id for a specific tenant
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Select Tenant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="tenant-id">Tenant ID</Label>
              <Input
                id="tenant-id"
                placeholder="e.g., 93f8cdcf-7dcd-4d83-8117-67d869eab88b"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={scanOrphaned} 
                disabled={loading || !tenantId}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Scan for Orphaned Data
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {tenantInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Tenant Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {tenantInfo.name}</p>
            <p><strong>Code:</strong> {tenantInfo.code}</p>
            <p><strong>ID:</strong> {tenantInfo.id}</p>
          </CardContent>
        </Card>
      )}

      {orphaned && (
        <>
          <Card className={totalOrphaned > 0 ? "border-amber-200" : "border-green-200"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {totalOrphaned > 0 ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <span className="text-amber-900">Orphaned Data Found</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-900">No Orphaned Data</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {entityRows.map((row) => {
                  const Icon = row.icon;
                  const count = (orphaned as any)[row.key];
                  return (
                    <div 
                      key={row.key}
                      className={`p-4 rounded-lg border ${count > 0 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-4 w-4 ${count > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium">{row.label}</span>
                      </div>
                      <p className={`text-2xl font-bold ${count > 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                        {count}
                      </p>
                    </div>
                  );
                })}
              </div>

              {totalOrphaned > 0 && (
                <div className="mt-6 p-4 bg-amber-50 rounded-lg">
                  <p className="text-amber-800 font-medium mb-2">
                    Total orphaned records: {totalOrphaned}
                  </p>
                  <p className="text-sm text-amber-700 mb-4">
                    These entities have no business_id and may not appear correctly in the portal.
                  </p>
                  <Button 
                    onClick={fixOrphaned}
                    disabled={fixing}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    {fixing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Create Business & Fix Orphaned Data
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {fixResult && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  Fix Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-800 mb-2">
                  Business record {fixResult.business?.status === "created" ? "created" : "found"}: {fixResult.business?.id}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                  {Object.entries(fixResult.migrations).map(([key, value]: [string, any]) => (
                    <p key={key}>
                      {key}: {value.migrated} migrated
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
