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
} from "lucide-react";

interface GhlConnectionStatus {
  connected: boolean;
  locationId?: string;
  locationName?: string;
  apiKeyConfigured: boolean;
  webhooksConfigured: boolean;
  lastSync?: string;
  error?: string;
}

export default function AdminIntegrationsPage() {
  const [ghlStatus, setGhlStatus] = useState<GhlConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

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
      } else {
        setGhlStatus({
          connected: false,
          apiKeyConfigured: false,
          webhooksConfigured: false,
          error: "Failed to fetch status",
        });
      }
    } catch (error) {
      setGhlStatus({
        connected: false,
        apiKeyConfigured: false,
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
      const response = await fetch("/api/admin/ghl/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      if (response.ok) {
        await fetchGhlStatus();
        setShowApiKeyInput(false);
        setApiKey("");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to connect");
      }
    } catch (error) {
      alert("Connection failed");
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
      }
    } catch (error) {
      alert("Disconnect failed");
    }
  }

  async function handleTestConnection() {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/admin/ghl/test", {
        method: "POST",
      });

      if (response.ok) {
        alert("Connection test successful!");
        await fetchGhlStatus();
      } else {
        alert("Connection test failed");
      }
    } catch (error) {
      alert("Test failed");
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
                      ghlStatus.apiKeyConfigured
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {ghlStatus.apiKeyConfigured ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">API Key</p>
                    <p className="text-xs text-[var(--secondary-text)]">
                      {ghlStatus.apiKeyConfigured ? "Configured" : "Not configured"}
                    </p>
                  </div>
                </div>

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

                <div className="flex items-center gap-3 p-4 bg-[var(--page-background)] rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Sync</p>
                    <p className="text-xs text-[var(--secondary-text)]">
                      {ghlStatus.lastSync
                        ? new Date(ghlStatus.lastSync).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>

              {ghlStatus.locationName && (
                <div className="p-4 bg-[var(--page-background)] rounded-lg">
                  <p className="text-sm text-[var(--secondary-text)]">Connected Location</p>
                  <p className="font-medium">{ghlStatus.locationName}</p>
                  <p className="text-xs text-[var(--secondary-text)]">
                    ID: {ghlStatus.locationId}
                  </p>
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
                  You will need your GHL API key from your location settings.
                </p>
              </div>

              {showApiKeyInput ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      GHL API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your GHL API key"
                      className="input w-full"
                    />
                    <p className="text-xs text-[var(--secondary-text)] mt-1">
                      Your API key is stored securely and never shared.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleConnect}
                      disabled={!apiKey || isConnecting}
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
                      onClick={() => setShowApiKeyInput(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowApiKeyInput(true)}
                  className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                >
                  <Key className="h-4 w-4 mr-2" />
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
          <ol className="space-y-3 text-sm text-[var(--secondary-text)]">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                1
              </span>
              <span>
                Log in to your GoHighLevel account and navigate to Settings &gt; Business Profile
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                2
              </span>
              <span>Copy your API Key from the API section</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                3
              </span>
              <span>Return to this page and click "Connect to GHL"</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                4
              </span>
              <span>Paste your API key and click Connect</span>
            </li>
          </ol>
          <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
            <a
              href="https://help.gohighlevel.com/support/solutions/articles/48001164185-api-documentation"
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
