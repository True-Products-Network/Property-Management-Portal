"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Key,
  Webhook,
  Database,
  AlertTriangle,
  Loader2,
  Shield,
  Lock,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

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

export default function AdminIntegrationsPage() {
  const [ghlStatus, setGhlStatus] = useState<GhlConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Connection type toggle
  const [useOAuth, setUseOAuth] = useState(true);
  
  // API Key mode
  const [apiKey, setApiKey] = useState("");
  
  // OAuth mode
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [locationId, setLocationId] = useState("");
  
  const [showInput, setShowInput] = useState(false);

  // Fetch GHL connection status
  useEffect(() => {
    fetchGhlStatus();
  }, []);

  async function fetchGhlStatus() {
    try {
      const response = await fetch("/api/admin/ghl/status");
      if (response.ok) {
        const data = await response.json();
        setGhlStatus(data);
        // Set the toggle based on existing connection type
        if (data.connectionType) {
          setUseOAuth(data.connectionType === "oauth");
        }
      } else {
        setGhlStatus({
          connected: false,
          connectionType: null,
          apiKeyConfigured: false,
          accessTokenConfigured: false,
          refreshTokenConfigured: false,
          webhooksConfigured: false,
          error: "Failed to fetch status",
        });
      }
    } catch (error) {
      setGhlStatus({
        connected: false,
        connectionType: null,
        apiKeyConfigured: false,
        accessTokenConfigured: false,
        refreshTokenConfigured: false,
        webhooksConfigured: false,
        error: "Connection error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConnect() {
    setIsConnecting(true);
    try {
      const payload = useOAuth 
        ? { type: "oauth", accessToken, refreshToken, locationId }
        : { type: "api_key", apiKey, locationId };

      // Validate inputs
      if (useOAuth && (!accessToken || !refreshToken)) {
        alert("Both Access Token and Refresh Token are required for OAuth");
        setIsConnecting(false);
        return;
      }
      if (!useOAuth && !apiKey) {
        alert("API Key is required");
        setIsConnecting(false);
        return;
      }
      if (!locationId) {
        alert("Location ID is required");
        setIsConnecting(false);
        return;
      }

      const response = await fetch("/api/admin/ghl/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Force refresh the status
        await fetchGhlStatus();
        
        // Small delay to ensure state updates
        setTimeout(async () => {
          await fetchGhlStatus();
        }, 500);
        
        setShowInput(false);
        setApiKey("");
        setAccessToken("");
        setRefreshToken("");
        setLocationId("");
        
        // Show appropriate message based on test success
        if (data.testSuccess) {
          alert(`Connected successfully!\n\nLocation: ${data.locationName || data.locationId || "Unknown"}`);
        } else {
          let msg = "Credentials saved but connection test failed.";
          if (data.testError) {
            msg += `\n\nError: ${data.testError}`;
          }
          msg += "\n\nThe token may be expired or invalid. You can try testing again or reconnect with fresh tokens.";
          alert(msg);
        }
      } else {
        alert(data.error || "Failed to connect");
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("Connection failed. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect from GHL?")) return;

    try {
      const response = await fetch("/api/admin/ghl/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        await fetchGhlStatus();
        alert("Disconnected successfully");
      }
    } catch (error) {
      alert("Disconnect failed");
    }
  }

  // Helper to mask sensitive data
  function maskToken(token: string | undefined): string {
    if (!token) return "Not set";
    if (token.length <= 8) return "****";
    return token.slice(0, 4) + "..." + token.slice(-4);
  }

  async function handleTestConnection() {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/admin/ghl/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Connection test successful!\n\nLocation: ${data.locationName}\nType: ${data.connectionType}`);
        await fetchGhlStatus();
      } else {
        let errorMsg = data.error || "Connection test failed";
        if (data.status) {
          errorMsg += `\n\nStatus: ${data.status}`;
        }
        if (data.details) {
          errorMsg += `\nDetails: ${data.details}`;
        }
        if (data.suggestion) {
          errorMsg += `\n\n${data.suggestion}`;
        }
        alert(errorMsg);
      }
    } catch (error) {
      console.error("Test error:", error);
      alert("Test failed. Please check your network connection.");
    } finally {
      setIsConnecting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">
          Integrations
        </h1>
        <p className="text-[var(--secondary-text)] mt-1">
          Manage connections to external services
        </p>
      </div>

      {/* GHL Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--primary-navy)] rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>GoHighLevel (GHL)</CardTitle>
                <CardDescription>
                  Connect to your GHL location for data synchronization
                </CardDescription>
              </div>
            </div>
            <Badge
              className={
                ghlStatus?.connected
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }
            >
              {ghlStatus?.connected ? "Connected" : "Not Connected"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {ghlStatus?.connected ? (
            <>
              {/* Connected State */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-[var(--page-background)] rounded-lg">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      ghlStatus.apiKeyConfigured || ghlStatus.accessTokenConfigured
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {ghlStatus.apiKeyConfigured || ghlStatus.accessTokenConfigured ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {ghlStatus.connectionType === "oauth" ? "Access Token" : "API Key"}
                    </p>
                    <p className="text-xs text-[var(--secondary-text)]">
                      {ghlStatus.apiKeyConfigured || ghlStatus.accessTokenConfigured ? "Valid" : "Invalid"}
                    </p>
                  </div>
                </div>

                {ghlStatus.connectionType === "oauth" && (
                  <div className="flex items-center gap-3 p-4 bg-[var(--page-background)] rounded-lg">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        ghlStatus.refreshTokenConfigured
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {ghlStatus.refreshTokenConfigured ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Refresh Token</p>
                      <p className="text-xs text-[var(--secondary-text)]">
                        {ghlStatus.refreshTokenConfigured ? "Valid" : "Invalid"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-[var(--page-background)] rounded-lg">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      ghlStatus.webhooksConfigured
                        ? "bg-green-100 text-green-600"
                        : "bg-yellow-100 text-yellow-600"
                    }`}
                  >
                    {ghlStatus.webhooksConfigured ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Webhooks</p>
                    <p className="text-xs text-[var(--secondary-text)]">
                      {ghlStatus.webhooksConfigured ? "Active" : "Not configured"}
                    </p>
                  </div>
                </div>
              </div>

              {(ghlStatus.locationName || ghlStatus.companyId) && (
                <div className="p-4 bg-[var(--page-background)] rounded-lg">
                  <p className="text-sm text-[var(--secondary-text)]">Connected Location</p>
                  {ghlStatus.locationName && (
                    <p className="font-medium">{ghlStatus.locationName}</p>
                  )}
                  {ghlStatus.locationId && (
                    <p className="text-xs text-[var(--secondary-text)]">
                      Location ID: {ghlStatus.locationId}
                    </p>
                  )}
                  {ghlStatus.companyId && (
                    <p className="text-xs text-[var(--secondary-text)]">
                      Company ID: {ghlStatus.companyId}
                    </p>
                  )}
                  {ghlStatus.connectionType && (
                    <Badge className="mt-2" variant="secondary">
                      {ghlStatus.connectionType === "oauth" ? "OAuth" : "API Key"}
                    </Badge>
                  )}
                </div>
              )}

              {ghlStatus.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="text-sm font-medium">Connection Error</p>
                  </div>
                  <p className="text-sm text-red-600 mt-1">{ghlStatus.error}</p>
                </div>
              )}

              {/* Stored Credentials (masked) */}
              <div className="p-4 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm font-medium text-[var(--main-text)] mb-2">Stored Credentials</p>
                {ghlStatus.connectionType === "oauth" ? (
                  <div className="space-y-1 text-sm text-[var(--secondary-text)]">
                    <p>Access Token: {maskToken("configured")}</p>
                    <p>Refresh Token: {maskToken("configured")}</p>
                  </div>
                ) : (
                  <div className="space-y-1 text-sm text-[var(--secondary-text)]">
                    <p>API Key: {maskToken("configured")}</p>
                  </div>
                )}
                <p className="text-xs text-[var(--secondary-text)] mt-2">
                  Credentials are stored securely and masked for display.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button variant="outline" onClick={handleDisconnect} className="text-red-600">
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Not Connected State */}
              <div className="p-4 bg-[var(--page-background)] rounded-lg">
                <p className="text-sm text-[var(--secondary-text)]">
                  Connect your GoHighLevel account to enable data synchronization.
                  Choose your preferred connection method below.
                </p>
              </div>

              {/* Connection Type Toggle */}
              <div className="flex items-center justify-between p-4 bg-[var(--page-background)] rounded-lg">
                <div className="flex items-center gap-3">
                  {useOAuth ? <Lock className="h-5 w-5 text-[var(--teal)]" /> : <Key className="h-5 w-5 text-[var(--teal)]" />}
                  <div>
                    <p className="font-medium">{useOAuth ? "OAuth (Tokens)" : "API Key"}</p>
                    <p className="text-xs text-[var(--secondary-text)]">
                      {useOAuth 
                        ? "Use Access Token + Refresh Token (recommended for new accounts)" 
                        : "Use Legacy API Key (for older GHL accounts)"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUseOAuth(!useOAuth)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-[var(--teal)] transition-colors"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useOAuth ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {useOAuth ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">OAuth Required Scopes</p>
                      <p className="text-sm text-blue-800 mt-1">
                        Your token must include: contacts, locations, opportunities, 
                        conversations, calendars, users, workflows, and custom-objects (read/write).
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900">Legacy API Key</p>
                      <p className="text-sm text-amber-800 mt-1">
                        API Key authentication is for older GHL accounts. Newer accounts should use OAuth tokens.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {showInput ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Location ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      placeholder="e.g., UCrGt3hb89xvDiJjYqmp"
                      className="input w-full"
                    />
                    <p className="text-xs text-[var(--secondary-text)] mt-1">
                      Your GHL Location ID (required)
                    </p>
                  </div>
                  
                  {useOAuth ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Access Token <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={accessToken}
                          onChange={(e) => setAccessToken(e.target.value)}
                          placeholder="Enter your GHL Access Token"
                          className="input w-full"
                        />
                        <p className="text-xs text-[var(--secondary-text)] mt-1">
                          Short-lived token for API access (expires in ~24 hours)
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Refresh Token <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={refreshToken}
                          onChange={(e) => setRefreshToken(e.target.value)}
                          placeholder="Enter your GHL Refresh Token"
                          className="input w-full"
                        />
                        <p className="text-xs text-[var(--secondary-text)] mt-1">
                          Long-lived token to refresh the access token
                        </p>
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        API Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your GHL API Key"
                        className="input w-full"
                      />
                      <p className="text-xs text-[var(--secondary-text)] mt-1">
                        Your API key from GHL Location Settings
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting || !locationId || (useOAuth ? (!accessToken || !refreshToken) : !apiKey)}
                      className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Connect
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowInput(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowInput(true)}
                  className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                >
                  {useOAuth ? <Lock className="h-4 w-4 mr-2" /> : <Key className="h-4 w-4 mr-2" />}
                  Connect to GHL
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Integration Help */}
      <Card>
        <CardHeader>
          <CardTitle>How to Connect</CardTitle>
        </CardHeader>
        <CardContent>
          {useOAuth ? (
            <ol className="space-y-3 text-sm text-[var(--secondary-text)]">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                  1
                </span>
                <span>
                  Go to your GHL Agency Dashboard and navigate to Settings → API
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                  2
                </span>
                <span>
                  Create a Private Integration or use an existing one with the required scopes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                  3
                </span>
                <span>
                  Generate an Access Token (valid for ~24 hours) and Refresh Token
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                  4
                </span>
                <span>
                  Copy both tokens and paste them here to connect
                </span>
              </li>
            </ol>
          ) : (
            <ol className="space-y-3 text-sm text-[var(--secondary-text)]">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                  1
                </span>
                <span>
                  Log in to your GoHighLevel account and navigate to Settings → Business Profile
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                  2
                </span>
                <span>
                  Copy your API Key from the API section
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                  3
                </span>
                <span>
                  Return to this page and paste your API key
                </span>
              </li>
            </ol>
          )}
          <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
            <a
              href="https://highlevel.stoplight.io/docs/integrations/0443d7d1a4bd0-overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--teal)] hover:text-[var(--teal-hover)] flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              View GHL API Documentation
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
