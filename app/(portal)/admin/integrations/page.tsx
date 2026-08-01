"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Key,
  Lock,
  AlertTriangle,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  Clock,
  Calendar,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

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

interface CalendarSettings {
  ghl_inspection_calendar_id: string;
  ghl_inspection_calendar_url: string;
  ghl_inspection_calendar_embed: string;
  calendar_provider: string;
  enable_calendar_integration: string;
}

export default function AdminIntegrationsPage() {
  const [ghlStatus, setGhlStatus] = useState<GhlConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectForm, setShowConnectForm] = useState(false);
  
  // Form fields
  const [locationId, setLocationId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [showTokens, setShowTokens] = useState(false);
  
  // Calendar settings
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>({
    ghl_inspection_calendar_id: "",
    ghl_inspection_calendar_url: "",
    ghl_inspection_calendar_embed: "",
    calendar_provider: "ghl",
    enable_calendar_integration: "false",
  });
  const [isSavingCalendar, setIsSavingCalendar] = useState(false);

  // Fetch GHL connection status and calendar settings
  useEffect(() => {
    fetchGhlStatus();
    fetchCalendarSettings();
  }, []);

  async function fetchGhlStatus() {
    try {
      const response = await fetch("/api/admin/ghl/status");
      if (response.ok) {
        const data = await response.json();
        setGhlStatus(data);
      }
    } catch (error) {
      console.error("Error fetching GHL status:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchCalendarSettings() {
    try {
      const response = await fetch("/api/admin/settings?category=calendar");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const settings: Partial<CalendarSettings> = {};
          result.data.forEach((setting: { key: keyof CalendarSettings; value: string }) => {
            settings[setting.key] = setting.value;
          });
          setCalendarSettings(prev => ({ ...prev, ...settings }));
        }
      }
    } catch (error) {
      console.error("Error fetching calendar settings:", error);
    }
  }

  async function saveCalendarSettings() {
    setIsSavingCalendar(true);
    try {
      const settingsToSave = [
        { key: "ghl_inspection_calendar_id", value: calendarSettings.ghl_inspection_calendar_id },
        { key: "ghl_inspection_calendar_url", value: calendarSettings.ghl_inspection_calendar_url },
        { key: "ghl_inspection_calendar_embed", value: calendarSettings.ghl_inspection_calendar_embed },
        { key: "calendar_provider", value: calendarSettings.calendar_provider },
        { key: "enable_calendar_integration", value: calendarSettings.enable_calendar_integration },
      ];

      for (const setting of settingsToSave) {
        await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setting),
        });
      }

      alert("Calendar settings saved successfully!");
    } catch (error) {
      console.error("Error saving calendar settings:", error);
      alert("Failed to save calendar settings");
    } finally {
      setIsSavingCalendar(false);
    }
  }

  async function handleConnect() {
    if (!locationId || !accessToken || !refreshToken) {
      alert("Please fill in all fields: Location ID, Access Token, and Refresh Token");
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch("/api/admin/ghl/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "oauth",
          locationId,
          accessToken,
          refreshToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchGhlStatus();
        setShowConnectForm(false);
        setAccessToken("");
        setRefreshToken("");
        setLocationId("");
        
        if (data.testSuccess) {
          alert(`✅ Connected successfully to ${data.locationName || data.locationId}!`);
        } else {
          alert(`⚠️ Credentials saved but connection test failed.\n\nError: ${data.testError || "Unknown error"}\n\nYou may need to reconnect with fresh tokens.`);
        }
      } else {
        alert(data.error || "Failed to connect");
      }
    } catch (error) {
      alert("Connection failed. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect from GHL?\n\nThis will remove all stored credentials.")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/ghl/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        await fetchGhlStatus();
        setShowConnectForm(false);
        alert("Disconnected successfully");
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

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Connection test successful!\n\nLocation: ${data.locationName}\nType: ${data.connectionType}`);
        await fetchGhlStatus();
      } else {
        alert(`❌ Connection test failed:\n${data.error || "Unknown error"}`);
      }
    } catch (error) {
      alert("Test failed. Please check your network connection.");
    } finally {
      setIsConnecting(false);
    }
  }

  // Mask token for display
  function maskToken(token: string | undefined): string {
    if (!token) return "Not set";
    if (token.length <= 8) return "••••••••";
    return token.slice(0, 4) + "••••••••••••" + token.slice(-4);
  }

  // Calculate token expiry status
  function getTokenExpiryStatus(lastSync?: string): { status: "good" | "warning" | "expired"; message: string } {
    if (!lastSync) return { status: "expired", message: "Token status unknown" };
    
    const syncDate = new Date(lastSync);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceSync > 23) {
      return { status: "expired", message: "Token may be expired (24h+ old)" };
    } else if (hoursSinceSync > 20) {
      return { status: "warning", message: `Token expires in ${Math.round(24 - hoursSinceSync)} hours` };
    } else {
      return { status: "good", message: `Token valid (${Math.round(24 - hoursSinceSync)} hours remaining)` };
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  const tokenStatus = getTokenExpiryStatus(ghlStatus?.lastSync);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            Integrations
          </h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage connections to external services
          </p>
        </div>
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
            /* CONNECTED STATE */
            <div className="space-y-6">
              {/* Connection Details */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Connected to GHL</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  {ghlStatus.locationName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{ghlStatus.locationName}</span>
                    </div>
                  )}
                  {ghlStatus.locationId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location ID:</span>
                      <span className="font-mono text-xs">{ghlStatus.locationId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Connection Type:</span>
                    <span className="font-medium capitalize">{ghlStatus.connectionType}</span>
                  </div>
                  {ghlStatus.lastSync && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connected Since:</span>
                      <span>{new Date(ghlStatus.lastSync).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Token Status */}
              <div className={`p-4 rounded-lg border ${
                tokenStatus.status === "good" ? "bg-blue-50 border-blue-200" :
                tokenStatus.status === "warning" ? "bg-amber-50 border-amber-200" :
                "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className={`h-5 w-5 ${
                    tokenStatus.status === "good" ? "text-blue-600" :
                    tokenStatus.status === "warning" ? "text-amber-600" :
                    "text-red-600"
                  }`} />
                  <span className={`font-medium ${
                    tokenStatus.status === "good" ? "text-blue-800" :
                    tokenStatus.status === "warning" ? "text-amber-800" :
                    "text-red-800"
                  }`}>
                    {tokenStatus.status === "good" ? "Token Status: Good" :
                     tokenStatus.status === "warning" ? "Token Status: Expiring Soon" :
                     "Token Status: Expired"}
                  </span>
                </div>
                <p className={`text-sm ${
                  tokenStatus.status === "good" ? "text-blue-700" :
                  tokenStatus.status === "warning" ? "text-amber-700" :
                  "text-red-700"
                }`}>
                  {tokenStatus.message}
                </p>
                {tokenStatus.status !== "good" && (
                  <p className="text-sm mt-2">
                    <button 
                      onClick={() => setShowConnectForm(true)}
                      className="text-[var(--teal)] hover:underline"
                    >
                      Click here to update your tokens
                    </button>
                  </p>
                )}
              </div>

              {/* Stored Credentials (Masked) */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Stored Credentials</span>
                  </div>
                  <span className="text-xs text-gray-500">AES-256 Encrypted</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Access Token:</span>
                    <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                      {maskToken("configured")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Refresh Token:</span>
                    <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                      {maskToken("configured")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleTestConnection}
                  disabled={isConnecting}
                  variant="outline"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                
                <Button
                  onClick={() => setShowConnectForm(true)}
                  variant="outline"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Update Tokens
                </Button>
                
                <Button
                  onClick={handleDisconnect}
                  variant="destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            /* NOT CONNECTED STATE */
            <div className="space-y-6">
              {!showConnectForm ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Not Connected to GHL
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Connect your GoHighLevel account to enable data synchronization between your portal and GHL.
                  </p>
                  <Button
                    onClick={() => setShowConnectForm(true)}
                    className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Connect to GHL
                  </Button>
                </div>
              ) : (
                /* CONNECT FORM */
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium mb-1">Enter your GHL credentials</p>
                        <p>These will be encrypted and stored securely. Tokens expire after 24 hours and will be automatically refreshed.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Location ID <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value)}
                      placeholder="e.g., UCrGt3hb89xvDiJjYqmp"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Found in your GHL Location Settings
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Access Token <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showTokens ? "text" : "password"}
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="Enter your GHL Access Token"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTokens(!showTokens)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Short-lived token (expires in ~24 hours)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Refresh Token <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type={showTokens ? "text" : "password"}
                        value={refreshToken}
                        onChange={(e) => setRefreshToken(e.target.value)}
                        placeholder="Enter your GHL Refresh Token"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTokens(!showTokens)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Long-lived token used to refresh access token automatically
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleConnect}
                      disabled={isConnecting || !locationId || !accessToken || !refreshToken}
                      className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Shield className="h-4 w-4 mr-2" />
                      )}
                      Connect & Encrypt
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowConnectForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar Integration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[var(--teal)]" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Configure GHL Calendar for scheduling inspections and appointments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Calendar Integration */}
          <div className="flex items-center justify-between p-4 bg-[var(--page-background)] rounded-lg">
            <div>
              <p className="font-medium">Enable Calendar Integration</p>
              <p className="text-sm text-gray-500">
                Allow users to schedule inspections via integrated calendar
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={calendarSettings.enable_calendar_integration === "true"}
                onChange={(e) =>
                  setCalendarSettings((prev) => ({
                    ...prev,
                    enable_calendar_integration: e.target.checked ? "true" : "false",
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
            </label>
          </div>

          {calendarSettings.enable_calendar_integration === "true" && (
            <div className="space-y-4">
              {/* Calendar Provider */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Calendar Provider
                </label>
                <select
                  value={calendarSettings.calendar_provider}
                  onChange={(e) =>
                    setCalendarSettings((prev) => ({
                      ...prev,
                      calendar_provider: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-white"
                >
                  <option value="ghl">GoHighLevel (GHL)</option>
                  <option value="calendly">Calendly</option>
                  <option value="acuity">Acuity Scheduling</option>
                  <option value="custom">Custom/Other</option>
                </select>
              </div>

              {/* GHL Calendar ID */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  GHL Calendar ID
                </label>
                <Input
                  type="text"
                  value={calendarSettings.ghl_inspection_calendar_id}
                  onChange={(e) =>
                    setCalendarSettings((prev) => ({
                      ...prev,
                      ghl_inspection_calendar_id: e.target.value,
                    }))
                  }
                  placeholder="e.g., CAlxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Found in GHL → Scheduling → Calendar Settings → Calendar ID
                </p>
              </div>

              {/* Calendar Booking URL */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Calendar Booking URL
                </label>
                <Input
                  type="url"
                  value={calendarSettings.ghl_inspection_calendar_url}
                  onChange={(e) =>
                    setCalendarSettings((prev) => ({
                      ...prev,
                      ghl_inspection_calendar_url: e.target.value,
                    }))
                  }
                  placeholder="https://api.leadconnectorhq.com/widget/booking/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  The direct booking link or widget URL for your calendar
                </p>
              </div>

              {/* Embed Code (Optional) */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Embed Code (Optional)
                </label>
                <textarea
                  value={calendarSettings.ghl_inspection_calendar_embed}
                  onChange={(e) =>
                    setCalendarSettings((prev) => ({
                      ...prev,
                      ghl_inspection_calendar_embed: e.target.value,
                    }))
                  }
                  placeholder="<iframe src=... or <script..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-white font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  HTML embed code if you want to embed the calendar directly (instead of popup)
                </p>
              </div>

              {/* Webhook Info */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  Webhook Configuration
                </p>
                <p className="text-xs text-blue-700 mb-2">
                  To automatically sync bookings back to the portal, configure this webhook URL in your GHL Calendar:
                </p>
                <code className="block p-2 bg-white rounded text-xs font-mono break-all">
                  {typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/ghl/calendar` : "https://your-domain.com/api/webhooks/ghl/calendar"}
                </code>
                <p className="text-xs text-blue-600 mt-2">
                  GHL → Settings → Calendars → [Your Calendar] → Webhooks → Add Endpoint
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={saveCalendarSettings}
              disabled={isSavingCalendar}
              className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
            >
              {isSavingCalendar ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Calendar Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      {!ghlStatus?.connected && (
        <Card>
          <CardHeader>
            <CardTitle>How to Get Your GHL Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                  1
                </span>
                <span>
                  Go to your GHL Location Dashboard → Settings → Business Profile
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                  2
                </span>
                <span>
                  Copy your Location ID from the URL or settings page
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--teal)] text-white flex items-center justify-center text-xs flex-shrink-0">
                  3
                </span>
                <span>
                  Go to Settings → API → Generate Access Token & Refresh Token
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

          </CardContent>
        </Card>
      )}
    </div>
  );
}
