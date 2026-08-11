"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Database, 
  Users, 
  Building2, 
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw
} from "lucide-react";

interface DebugResult {
  tool: string;
  data: any;
  error?: string;
  timestamp: string;
}

export default function PlatformDebugPage() {
  const [portalDomain, setPortalDomain] = useState("");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, DebugResult>>({});

  const runDiagnostic = async (tool: string, endpoint: string) => {
    if (!portalDomain) {
      setResults(prev => ({
        ...prev,
        [tool]: {
          tool,
          error: "Please enter a portal domain first",
          data: null,
          timestamp: new Date().toISOString()
        }
      }));
      return;
    }

    setLoading(prev => ({ ...prev, [tool]: true }));
    
    try {
      // For platform admin, we'll call internal APIs
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

  const tools = [
    {
      id: "session",
      name: "Session Diagnostics",
      description: "Check user session, tenant linkage, and auth status",
      icon: Users,
      endpoint: "session"
    },
    {
      id: "tenant-data",
      name: "Tenant Data Overview",
      description: "View all data counts for a specific tenant",
      icon: Building2,
      endpoint: "tenant-data"
    },
    {
      id: "cross-tenant",
      name: "Cross-Tenant Lookup",
      description: "Search for data across all tenants",
      icon: Database,
      endpoint: "cross-tenant"
    },
    {
      id: "orphaned",
      name: "Orphaned Data Scanner",
      description: "Find entities with missing business_id or tenant_id",
      icon: AlertCircle,
      endpoint: "orphaned"
    },
    {
      id: "business-fix",
      name: "Business Record Fix",
      description: "Create business records and link orphaned data",
      icon: RefreshCw,
      endpoint: "business-fix"
    }
  ];

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const result = results[tool.id];
          
          return (
            <Card key={tool.id} className={result?.error ? "border-red-200" : result?.data ? "border-green-200" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5" />
                  {tool.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{tool.description}</p>
                
                <Button
                  onClick={() => runDiagnostic(tool.id, tool.endpoint)}
                  disabled={loading[tool.id] || !portalDomain}
                  className="w-full"
                >
                  {loading[tool.id] ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4 mr-2" />
                      Run Diagnostic
                    </>
                  )}
                </Button>

                {result && (
                  <div className={`p-3 rounded-lg text-sm ${result.error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {result.error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      <span className="font-medium">
                        {result.error ? 'Error' : 'Success'}
                      </span>
                      <span className="text-xs opacity-70 ml-auto">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {result.error ? (
                      <p>{result.error}</p>
                    ) : (
                      <pre className="text-xs overflow-auto max-h-48 bg-white/50 p-2 rounded">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setResults({})}>
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
