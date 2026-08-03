"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Key,
  Lock,
  AlertTriangle,
  Loader2,
  Building2,
  Link2,
  Unlink,
  ArrowRight,
  Settings,
  Info,
} from "lucide-react";
import Link from "next/link";

interface Association {
  id: string;
  name: string;
  legalName?: string;
  ghlCompanyId?: string;
  ghlConnected: boolean;
  ghlLocationId?: string;
  ghlLocationName?: string;
}

interface GhlConnectionStatus {
  connected: boolean;
  locationId?: string;
  locationName?: string;
  companyId?: string;
  connectionType?: "api_key" | "oauth" | null;
  apiKeyConfigured?: boolean;
  accessTokenConfigured?: boolean;
  refreshTokenConfigured?: boolean;
  webhooksConfigured?: boolean;
  scopes?: string[];
  lastSync?: string;
  error?: string;
}

export default function AssociationGhlIntegrationPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [selectedAssociationId, setSelectedAssociationId] = useState<string>("");
  const [selectedAssociation, setSelectedAssociation] = useState<Association | null>(null);
  const [ghlStatus, setGhlStatus] = useState<GhlConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);

  // Form fields
  const [locationId, setLocationId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [showTokens, setShowTokens] = useState(false);
  const [connectionType, setConnectionType] = useState<"api_key" | "oauth">("api_key");

  // Fetch associations on load
  useEffect(() => {
    fetchAssociations();
  }, []);

  // Fetch GHL status when association changes
  useEffect(() => {
    if (selectedAssociationId) {
      const assoc = associations.find((a) => a.id === selectedAssociationId);
      setSelectedAssociation(assoc || null);
      fetchGhlStatus(selectedAssociationId);
    } else {
      setSelectedAssociation(null);
      setGhlStatus(null);
    }
  }, [selectedAssociationId, associations]);

  async function fetchAssociations() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/associations");
      if (response.ok) {
        const data = await response.json();
        // Map to include GHL connection status
        const associationsWithStatus = data.map((assoc: Association) => ({
          ...assoc,
          ghlConnected: !!assoc.ghlCompanyId,
        }));
        setAssociations(associationsWithStatus);
      }
    } catch (error) {
      console.error("Error fetching associations:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchGhlStatus(associationId: string) {
    try {
      const response = await fetch(`/api/admin/ghl/status?associationId=${associationId}`);
      if (response.ok) {
        const data = await response.json();
        setGhlStatus(data);
      } else {
        setGhlStatus(null);
      }
    } catch (error) {
      console.error("Error fetching GHL status:", error);
      setGhlStatus(null);
    }
  }

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAssociationId) return;

    setIsConnecting(true);
    try {
      const credentials: Record<string, string> = {
        type: connectionType,
        locationId,
      };

      if (connectionType === "api_key") {
        credentials.apiKey = apiKey;
      } else {
        credentials.accessToken = accessToken;
        credentials.refreshToken = refreshToken;
      }

      const response = await fetch("/api/admin/ghl/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          associationId: selectedAssociationId,
          credentials,
        }),
      });

      if (response.ok) {
        await fetchGhlStatus(selectedAssociationId);
        await fetchAssociations();
        setShowConnectForm(false);
        // Clear form
        setLocationId("");
        setApiKey("");
        setAccessToken("");
        setRefreshToken("");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to connect");
      }
    } catch (error) {
      console.error("Error connecting GHL:", error);
      alert("Failed to connect to GHL");
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!selectedAssociationId) return;
    if (!confirm("Are you sure you want to disconnect GHL for this association?")) return;

    try {
      const response = await fetch("/api/admin/ghl/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ associationId: selectedAssociationId }),
      });

      if (response.ok) {
        await fetchGhlStatus(selectedAssociationId);
        await fetchAssociations();
      } else {
        alert("Failed to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting GHL:", error);
    }
  }

  async function handleSyncToGhl() {
    if (!selectedAssociationId) return;

    try {
      const response = await fetch("/api/admin/sync/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: "association",
          entityId: selectedAssociationId,
          direction: "push",
        }),
      });

      if (response.ok) {
        alert("Association synced to GHL successfully");
        await fetchGhlStatus(selectedAssociationId);
      } else {
        const error = await response.json();
        alert(error.error || "Sync failed");
      }
    } catch (error) {
      console.error("Error syncing to GHL:", error);
      alert("Sync failed");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--c-deep-blue)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">
          GHL Integration
        </h1>
        <p className="text-[var(--secondary-text)] mt-1">
          Connect associations to GoHighLevel for bidirectional sync
        </p>
      </div>

      {/* Association Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Association
          </CardTitle>
          <CardDescription>
            Choose an association to manage its GHL connection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedAssociationId}
            onValueChange={setSelectedAssociationId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an association..." />
            </SelectTrigger>
            <SelectContent>
              {associations.map((assoc) => (
                <SelectItem key={assoc.id} value={assoc.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{assoc.name}</span>
                    {assoc.ghlConnected ? (
                      <Badge variant="success" className="ml-2">Connected</Badge>
                    ) : (
                      <Badge variant="secondary" className="ml-2">Not Connected</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {associations.length === 0 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    No Associations Found
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Create an association first before connecting to GHL.
                  </p>
                  <Link
                    href="/management/associations/new"
                    className="text-sm text-amber-800 underline mt-2 inline-block"
                  >
                    Create Association →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Status */}
      {selectedAssociation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                GHL Connection Status
              </span>
              {ghlStatus?.connected ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Badge variant="secondary">Not Connected</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {selectedAssociation.name} - {selectedAssociation.legalName || "No legal name"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ghlStatus?.connected ? (
              <div className="space-y-4">
                {/* Connected State */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[var(--secondary-text)] uppercase tracking-wide">
                      Location ID
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {ghlStatus.locationId || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[var(--secondary-text)] uppercase tracking-wide">
                      Location Name
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {ghlStatus.locationName || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[var(--secondary-text)] uppercase tracking-wide">
                      Company ID
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {ghlStatus.companyId || "N/A"}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[var(--secondary-text)] uppercase tracking-wide">
                      Connection Type
                    </p>
                    <p className="text-sm font-medium mt-1 capitalize">
                      {ghlStatus.connectionType || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Connection Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">API Key Configured</span>
                    {ghlStatus.apiKeyConfigured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Access Token Configured</span>
                    {ghlStatus.accessTokenConfigured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Refresh Token Configured</span>
                    {ghlStatus.refreshTokenConfigured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">Webhooks Configured</span>
                    {ghlStatus.webhooksConfigured ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => fetchGhlStatus(selectedAssociationId)}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSyncToGhl}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Sync to GHL
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    className="flex items-center gap-2 ml-auto"
                  >
                    <Unlink className="h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : showConnectForm ? (
              /* Connect Form */
              <form onSubmit={handleConnect} className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        How to get GHL Credentials
                      </p>
                      <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
                        <li>Go to GHL Agency Settings → Integrations</li>
                        <li>Find your Location ID in the URL or settings</li>
                        <li>For API Key: Generate an API key in GHL</li>
                        <li>For OAuth: Use the OAuth flow to get tokens</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Connection Type */}
                <div>
                  <Label>Connection Type</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="api_key"
                        checked={connectionType === "api_key"}
                        onChange={(e) => setConnectionType(e.target.value as "api_key")}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">API Key</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="oauth"
                        checked={connectionType === "oauth"}
                        onChange={(e) => setConnectionType(e.target.value as "oauth")}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">OAuth</span>
                    </label>
                  </div>
                </div>

                {/* Location ID */}
                <div>
                  <Label htmlFor="locationId">Location ID *</Label>
                  <Input
                    id="locationId"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    placeholder="e.g., 1234567890"
                    required
                    className="mt-1"
                  />
                </div>

                {connectionType === "api_key" ? (
                  /* API Key Form */
                  <div>
                    <Label htmlFor="apiKey">API Key *</Label>
                    <div className="relative mt-1">
                      <Input
                        id="apiKey"
                        type={showTokens ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your GHL API key"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowTokens(!showTokens)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showTokens ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Key className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* OAuth Form */
                  <>
                    <div>
                      <Label htmlFor="accessToken">Access Token *</Label>
                      <div className="relative mt-1">
                        <Input
                          id="accessToken"
                          type={showTokens ? "text" : "password"}
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          placeholder="Enter access token"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowTokens(!showTokens)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showTokens ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Key className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="refreshToken">Refresh Token *</Label>
                      <div className="relative mt-1">
                        <Input
                          id="refreshToken"
                          type={showTokens ? "text" : "password"}
                          value={refreshToken}
                          onChange={(e) => setRefreshToken(e.target.value)}
                          placeholder="Enter refresh token"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowConnectForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isConnecting}
                    className="flex items-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        Connect to GHL
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              /* Not Connected - Show Connect Button */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Unlink className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-[var(--main-text)] mb-2">
                  Not Connected to GHL
                </h3>
                <p className="text-[var(--secondary-text)] mb-6 max-w-md mx-auto">
                  Connect this association to GoHighLevel to enable bidirectional sync
                  of contacts, properties, and other data.
                </p>
                <Button
                  onClick={() => setShowConnectForm(true)}
                  className="flex items-center gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  Connect to GHL
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      {selectedAssociation?.ghlConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              GHL Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/ghl-mapping"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">GHL Role Mapping</p>
                  <p className="text-sm text-[var(--secondary-text)]">
                    Map GHL contact roles to portal permissions
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Link>

              <Link
                href="/admin/workflows"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Workflow Settings</p>
                  <p className="text-sm text-[var(--secondary-text)]">
                    Configure GHL workflow triggers
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
