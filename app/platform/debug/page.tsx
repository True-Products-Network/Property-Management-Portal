"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Activity, 
  Database, 
  Users, 
  Building2, 
  AlertCircle,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Trash2,
  Loader2
} from "lucide-react";

interface DebugResult {
  tool: string;
  data: any;
  error?: string;
  timestamp: string;
}

interface SessionData {
  user: {
    id: string;
    email: string;
    full_name?: string;
  } | null;
  tenant: {
    id: string;
    name: string;
    code: string;
  } | null;
  platformRole: {
    role: string;
    granted_at: string;
  } | null;
  session: {
    expires_at: string;
  } | null;
}

interface TenantDataOverview {
  tenant: {
    id: string;
    name: string;
    code: string;
    status: string;
    created_at: string;
  };
  counts: {
    associations: number;
    properties: number;
    units: number;
    contacts: number;
    vendors: number;
    maintenance_requests: number;
    inspections: number;
    documents: number;
  };
  subscription: {
    plan_name: string;
    status: string;
    effective_date: string;
  } | null;
}

interface CrossTenantResult {
  searchTerm: string;
  results: Array<{
    tenant_id: string;
    tenant_name: string;
    entity_type: string;
    entity_id: string;
    entity_name: string;
    match_field: string;
    match_value: string;
  }>;
  totalCount: number;
}

export default function PlatformDebugPage() {
  const [portalDomain, setPortalDomain] = useState("");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, DebugResult>>({});
  const [activeTab, setActiveTab] = useState("session");

  const runDiagnostic = async (tool: string, endpoint: string) => {
    if (!portalDomain) {
      setResults(prev => ({
        ...prev,
        [tool]: {
          tool,
          error: "Please enter a portal domain or tenant ID first",
          data: null,
          timestamp: new Date().toISOString()
        }
      }));
      return;
    }

    setLoading(prev => ({ ...prev, [tool]: true }));
    
    try {
      const response = await fetch(`/api/platform/debug/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portalDomain })
      });

      const data = await response.json();

      setResults(prev => ({
        ...prev,
        [tool]: {
          tool,
          data: data,
          error: data.error,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [tool]: {
          tool,
          error: err instanceof Error ? err.message : "Unknown error",
          data: null,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [tool]: false }));
    }
  };

  const runOrphanCleanup = async () => {
    if (!portalDomain) {
      setResults(prev => ({
        ...prev,
        orphanCleanup: {
          tool: "orphanCleanup",
          error: "Please enter a portal domain or tenant ID first",
          data: null,
          timestamp: new Date().toISOString()
        }
      }));
      return;
    }

    setLoading(prev => ({ ...prev, orphanCleanup: true }));
    
    try {
      const response = await fetch(`/api/platform/debug/orphan-cleanup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portalDomain, dryRun: false })
      });

      const data = await response.json();

      setResults(prev => ({
        ...prev,
        orphanCleanup: {
          tool: "orphanCleanup",
          data: data,
          error: data.error,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        orphanCleanup: {
          tool: "orphanCleanup",
          error: err instanceof Error ? err.message : "Unknown error",
          data: null,
          timestamp: new Date().toISOString()
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, orphanCleanup: false }));
    }
  };

  const renderSessionDiagnostics = (result: DebugResult) => {
    if (result.error) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span>{result.error}</span>
        </div>
      );
    }

    const data: SessionData = result.data;

    return (
      <div className="space-y-4">
        {/* User Info */}
        <div className="bg-white rounded-lg border p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            User Information
          </h4>
          {data.user ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium">{data.user.email}</p>
              </div>
              <div>
                <span className="text-gray-500">User ID:</span>
                <p className="font-mono text-xs">{data.user.id}</p>
              </div>
              {data.user.full_name && (
                <div className="col-span-2">
                  <span className="text-gray-500">Name:</span>
                  <p className="font-medium">{data.user.full_name}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">No user logged in</span>
            </div>
          )}
        </div>

        {/* Platform Role */}
        <div className="bg-white rounded-lg border p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Platform Role
          </h4>
          {data.platformRole ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={data.platformRole.role === "PLATFORM_ADMIN" ? "destructive" : "secondary"}>
                  {data.platformRole.role}
                </Badge>
                <span className="text-xs text-gray-500">
                  Granted: {new Date(data.platformRole.granted_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">No platform role assigned</span>
            </div>
          )}
        </div>

        {/* Tenant Info */}
        <div className="bg-white rounded-lg border p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Tenant Information
          </h4>
          {data.tenant ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <p className="font-medium">{data.tenant.name}</p>
              </div>
              <div>
                <span className="text-gray-500">Code:</span>
                <p className="font-mono text-xs">{data.tenant.code}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Tenant ID:</span>
                <p className="font-mono text-xs">{data.tenant.id}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">No tenant associated</span>
            </div>
          )}
        </div>

        {/* Session Info */}
        {data.session && (
          <div className="bg-white rounded-lg border p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Session
            </h4>
            <div className="text-sm">
              <span className="text-gray-500">Expires:</span>
              <p className="font-medium">
                {new Date(data.session.expires_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTenantDataOverview = (result: DebugResult) => {
    if (result.error) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span>{result.error}</span>
        </div>
      );
    }

    const data: TenantDataOverview = result.data;

    return (
      <div className="space-y-4">
        {/* Tenant Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{data.tenant.name}</h3>
              <p className="text-sm text-gray-500 font-mono">{data.tenant.code}</p>
            </div>
            <Badge variant={data.tenant.status === "active" ? "default" : "secondary"}>
              {data.tenant.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Created: {new Date(data.tenant.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Subscription Info */}
        {data.subscription ? (
          <div className="bg-white rounded-lg border p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Subscription</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Plan:</span>
                <p className="font-medium">{data.subscription.plan_name}</p>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <Badge variant={data.subscription.status === "active" ? "default" : "secondary"} className="mt-1">
                  {data.subscription.status}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Effective:</span>
                <p className="font-medium">
                  {new Date(data.subscription.effective_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">No active subscription found</span>
            </div>
          </div>
        )}

        {/* Data Counts */}
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h4 className="text-sm font-semibold text-gray-900">Data Overview</h4>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity Type</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data.counts).map(([key, count]) => (
                <TableRow key={key}>
                  <TableCell className="capitalize">{key.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-right font-mono">{count}</TableCell>
                  <TableCell>
                    {count === 0 ? (
                      <span className="text-xs text-gray-400">Empty</span>
                    ) : count > 100 ? (
                      <Badge variant="default" className="text-xs">High</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Normal</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderCrossTenantLookup = (result: DebugResult) => {
    if (result.error) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span>{result.error}</span>
        </div>
      );
    }

    const data: CrossTenantResult = result.data;

    if (!data.results || data.results.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No results found for &quot;{data.searchTerm || portalDomain}&quot;</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">
            Search Results for &quot;{data.searchTerm || portalDomain}&quot;
          </h4>
          <Badge>{data.totalCount} found</Badge>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Entity Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Match</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{item.tenant_name}</p>
                      <p className="text-xs text-gray-500 font-mono">{item.tenant_id.substring(0, 8)}...</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {item.entity_type.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{item.entity_name}</p>
                    <p className="text-xs text-gray-500 font-mono">{item.entity_id.substring(0, 8)}...</p>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <span className="text-gray-500">{item.match_field}:</span>
                      <span className="font-mono ml-1">{item.match_value}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  const renderOrphanCleanup = (result: DebugResult) => {
    if (result.error) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span>{result.error}</span>
        </div>
      );
    }

    const data = result.data;

    return (
      <div className="space-y-4">
        {data.dryRun && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Dry Run Mode</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              No changes were made. Review the results below and click &quot;Clean Orphan Data&quot; to execute.
            </p>
          </div>
        )}

        {data.deleted && data.deleted.length > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Cleanup Completed</span>
            </div>
            <p className="text-sm text-green-600">
              {data.deleted.length} orphaned records were removed.
            </p>
          </div>
        ) : data.orphans && data.orphans.length > 0 ? (
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <h4 className="text-sm font-semibold text-gray-900">
                Found {data.orphans.length} Orphaned Records
              </h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table</TableHead>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Issue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orphans.map((orphan: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono text-xs">{orphan.table}</TableCell>
                    <TableCell className="font-mono text-xs">{orphan.id}</TableCell>
                    <TableCell className="text-sm text-red-600">{orphan.issue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">No Orphaned Data Found</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              All records have valid tenant associations.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform Debug Tools</h1>
        <p className="text-gray-600 mt-1">
          Diagnostic and troubleshooting tools for platform administrators
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="portal-domain">Portal Domain or Tenant ID</Label>
              <Input
                id="portal-domain"
                placeholder="e.g., portal.example.com or tenant-uuid"
                value={portalDomain}
                onChange={(e) => setPortalDomain(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="session" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Session Diagnostics
          </TabsTrigger>
          <TabsTrigger value="tenant" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Tenant Data Overview
          </TabsTrigger>
          <TabsTrigger value="cross" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cross-Tenant Lookup
          </TabsTrigger>
          <TabsTrigger value="cleanup" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Orphan Data Cleanup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="session">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                Session Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Check user session, tenant linkage, platform role, and authentication status.
              </p>
              <Button
                onClick={() => runDiagnostic("session", "session")}
                disabled={loading.session || !portalDomain}
                className="w-full"
              >
                {loading.session ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Run Diagnostics
                  </>
                )}
              </Button>
              {results.session && renderSessionDiagnostics(results.session)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenant">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Tenant Data Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                View all data counts, subscription status, and entity statistics for a specific tenant.
              </p>
              <Button
                onClick={() => runDiagnostic("tenantData", "tenant-data")}
                disabled={loading.tenantData || !portalDomain}
                className="w-full"
              >
                {loading.tenantData ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Load Tenant Data
                  </>
                )}
              </Button>
              {results.tenantData && renderTenantDataOverview(results.tenantData)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cross">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5" />
                Cross-Tenant Lookup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Search for data across all tenants by email, name, or ID.
              </p>
              <Button
                onClick={() => runDiagnostic("crossTenant", "cross-tenant")}
                disabled={loading.crossTenant || !portalDomain}
                className="w-full"
              >
                {loading.crossTenant ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search Across Tenants
                  </>
                )}
              </Button>
              {results.crossTenant && renderCrossTenantLookup(results.crossTenant)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleanup">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trash2 className="h-5 w-5" />
                Orphan Data Cleanup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Find and clean up orphaned records that are missing tenant associations or have invalid foreign keys.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Warning</span>
                </div>
                <p className="text-sm text-amber-600 mt-1">
                  This will permanently delete orphaned records. Review carefully before proceeding.
                </p>
              </div>
              <Button
                onClick={runOrphanCleanup}
                disabled={loading.orphanCleanup || !portalDomain}
                variant="destructive"
                className="w-full"
              >
                {loading.orphanCleanup ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clean Orphan Data
                  </>
                )}
              </Button>
              {results.orphanCleanup && renderOrphanCleanup(results.orphanCleanup)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setResults({})}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear All Results
            </Button>
            <Button variant="outline" onClick={() => {
              setPortalDomain("");
              setResults({});
            }}>
              Reset Form
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
