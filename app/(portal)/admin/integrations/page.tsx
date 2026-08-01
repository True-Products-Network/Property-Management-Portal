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
  CreditCard,
  DollarSign,
  Building2,
  ToggleLeft,
  ToggleRight,
  Webhook,
  FileText,
  CheckSquare,
  XSquare,
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

interface PaymentProcessorSettings {
  processor: string;
  environment: "test" | "live";
  merchant_id: string;
  supported_methods: string[];
  currencies: string[];
  enable_recurring: boolean;
  fee_surcharge_enabled: boolean;
  fee_percentage: string;
  allow_refunds: boolean;
  allow_voids: boolean;
  webhook_url: string;
  webhook_secret: string;
  webhook_last_verified: string;
  accounting_handoff_enabled: boolean;
  reconciliation_owner: string;
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

  // Payment processor settings
  const [paymentSettings, setPaymentSettings] = useState<PaymentProcessorSettings>({
    processor: "stripe",
    environment: "test",
    merchant_id: "",
    supported_methods: ["card"],
    currencies: ["USD"],
    enable_recurring: false,
    fee_surcharge_enabled: false,
    fee_percentage: "2.9",
    allow_refunds: true,
    allow_voids: true,
    webhook_url: "",
    webhook_secret: "",
    webhook_last_verified: "",
    accounting_handoff_enabled: false,
    reconciliation_owner: "",
  });
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [activeTab, setActiveTab] = useState<"ghl" | "payment">("ghl");

  // Fetch GHL connection status and calendar settings
  useEffect(() => {
    fetchGhlStatus();
    fetchCalendarSettings();
    fetchPaymentSettings();
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

  async function fetchPaymentSettings() {
    try {
      const response = await fetch("/api/admin/settings?category=payment");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const settings: Partial<PaymentProcessorSettings> = {};
          result.data.forEach((setting: { key: keyof PaymentProcessorSettings; value: string }) => {
            const value = setting.value;
            if (setting.key === "supported_methods" || setting.key === "currencies") {
              (settings as Record<string, string[]>)[setting.key] = value ? value.split(",") : [];
            } else if (setting.key === "enable_recurring" || setting.key === "fee_surcharge_enabled" || 
                       setting.key === "allow_refunds" || setting.key === "allow_voids" || 
                       setting.key === "accounting_handoff_enabled") {
              (settings as Record<string, boolean>)[setting.key] = value === "true";
            } else {
              (settings as Record<string, string>)[setting.key] = value;
            }
          });
          setPaymentSettings(prev => ({ ...prev, ...settings }));
        }
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
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

  async function savePaymentSettings() {
    setIsSavingPayment(true);
    try {
      const settingsToSave = [
        { key: "payment_processor", value: paymentSettings.processor },
        { key: "payment_environment", value: paymentSettings.environment },
        { key: "payment_merchant_id", value: paymentSettings.merchant_id },
        { key: "payment_supported_methods", value: paymentSettings.supported_methods.join(",") },
        { key: "payment_currencies", value: paymentSettings.currencies.join(",") },
        { key: "payment_enable_recurring", value: paymentSettings.enable_recurring.toString() },
        { key: "payment_fee_surcharge_enabled", value: paymentSettings.fee_surcharge_enabled.toString() },
        { key: "payment_fee_percentage", value: paymentSettings.fee_percentage },
        { key: "payment_allow_refunds", value: paymentSettings.allow_refunds.toString() },
        { key: "payment_allow_voids", value: paymentSettings.allow_voids.toString() },
        { key: "payment_webhook_url", value: paymentSettings.webhook_url },
        { key: "payment_webhook_secret", value: paymentSettings.webhook_secret },
        { key: "payment_accounting_handoff_enabled", value: paymentSettings.accounting_handoff_enabled.toString() },
        { key: "payment_reconciliation_owner", value: paymentSettings.reconciliation_owner },
      ];

      for (const setting of settingsToSave) {
        await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...setting, category: "payment" }),
        });
      }

      alert("Payment processor settings saved successfully!");
    } catch (error) {
      console.error("Error saving payment settings:", error);
      alert("Failed to save payment settings");
    } finally {
      setIsSavingPayment(false);
    }
  }

  async function testPaymentWebhook() {
    setIsTestingWebhook(true);
    try {
      const response = await fetch("/api/admin/payments/test-webhook", {
        method: "POST",
      });

      if (response.ok) {
        alert("Webhook test successful! Check your endpoint for the test event.");
        setPaymentSettings(prev => ({
          ...prev,
          webhook_last_verified: new Date().toISOString(),
        }));
      } else {
        alert("Webhook test failed. Please check your webhook URL and try again.");
      }
    } catch (error) {
      alert("Webhook test failed. Please check your network connection.");
    } finally {
      setIsTestingWebhook(false);
    }
  }

  function togglePaymentMethod(method: string) {
    setPaymentSettings(prev => ({
      ...prev,
      supported_methods: prev.supported_methods.includes(method)
        ? prev.supported_methods.filter(m => m !== method)
        : [...prev.supported_methods, method],
    }));
  }

  function toggleCurrency(currency: string) {
    setPaymentSettings(prev => ({
      ...prev,
      currencies: prev.currencies.includes(currency)
        ? prev.currencies.filter(c => c !== currency)
        : [...prev.currencies, currency],
    }));
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab("ghl")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "ghl"
              ? "border-[var(--teal)] text-[var(--teal)]"
              : "border-transparent text-[var(--secondary-text)] hover:text-[var(--main-text)]"
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            GHL & Calendar
          </div>
        </button>
        <button
          onClick={() => setActiveTab("payment")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "payment"
              ? "border-[var(--teal)] text-[var(--teal)]"
              : "border-transparent text-[var(--secondary-text)] hover:text-[var(--main-text)]"
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Processor
          </div>
        </button>
      </div>

      {/* GHL & Calendar Tab */}
      {activeTab === "ghl" && (
        <>
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
                  Go to Settings → Private Integrations → Create New Integration → Generate Access Token & Refresh Token
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
        </>
      )}

      {/* Payment Processor Tab */}
      {activeTab === "payment" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--teal)] rounded-lg flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Payment Processor</CardTitle>
                  <CardDescription>
                    Configure payment processing and webhook settings
                  </CardDescription>
                </div>
              </div>
              <Badge
                className={
                  paymentSettings.environment === "live"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }
              >
                {paymentSettings.environment === "live" ? "Live Mode" : "Test Mode"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Environment Warning */}
            {paymentSettings.environment === "live" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Live Mode Active</p>
                    <p className="text-sm text-green-700">
                      Real payments will be processed. Make sure your processor account is properly configured.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {paymentSettings.environment === "test" && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">Test Mode</p>
                    <p className="text-sm text-amber-700">
                      No real payments will be processed. Use test card numbers for testing.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Processor Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Payment Processor</label>
                <select
                  value={paymentSettings.processor}
                  onChange={(e) => setPaymentSettings(prev => ({ ...prev, processor: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-white"
                >
                  <option value="stripe">Stripe</option>
                  <option value="paypal">PayPal</option>
                  <option value="square">Square</option>
                  <option value="authorize_net">Authorize.net</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Environment</label>
                <select
                  value={paymentSettings.environment}
                  onChange={(e) => setPaymentSettings(prev => ({ ...prev, environment: e.target.value as "test" | "live" }))}
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-white"
                >
                  <option value="test">Test/Sandbox</option>
                  <option value="live">Live/Production</option>
                </select>
              </div>
            </div>

            {/* Merchant ID */}
            <div>
              <label className="block text-sm font-medium mb-2">Merchant/Account ID</label>
              <Input
                type="text"
                value={paymentSettings.merchant_id}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, merchant_id: e.target.value }))}
                placeholder="e.g., acct_1234567890 or merchant_12345"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your processor account identifier (not secret keys)
              </p>
            </div>

            {/* Supported Payment Methods */}
            <div>
              <label className="block text-sm font-medium mb-2">Supported Payment Methods</label>
              <div className="flex flex-wrap gap-2">
                {["card", "ach", "paypal", "apple_pay", "google_pay"].map((method) => (
                  <button
                    key={method}
                    onClick={() => togglePaymentMethod(method)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      paymentSettings.supported_methods.includes(method)
                        ? "bg-[var(--teal)] text-white border-[var(--teal)]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-[var(--teal)]"
                    }`}
                  >
                    {method === "card" && "💳 Card"}
                    {method === "ach" && "🏦 ACH/Bank"}
                    {method === "paypal" && "🅿️ PayPal"}
                    {method === "apple_pay" && "🍎 Apple Pay"}
                    {method === "google_pay" && "🤖 Google Pay"}
                  </button>
                ))}
              </div>
            </div>

            {/* Currencies */}
            <div>
              <label className="block text-sm font-medium mb-2">Accepted Currencies</label>
              <div className="flex flex-wrap gap-2">
                {["USD", "CAD", "EUR", "GBP"].map((currency) => (
                  <button
                    key={currency}
                    onClick={() => toggleCurrency(currency)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      paymentSettings.currencies.includes(currency)
                        ? "bg-[var(--teal)] text-white border-[var(--teal)]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-[var(--teal)]"
                    }`}
                  >
                    {currency}
                  </button>
                ))}
              </div>
            </div>

            {/* Recurring Payments */}
            <div className="flex items-center justify-between p-4 bg-[var(--page-background)] rounded-lg">
              <div>
                <p className="font-medium">Enable Recurring Payments</p>
                <p className="text-sm text-gray-500">
                  Allow automatic recurring payments for assessments and fees
                </p>
              </div>
              <button
                onClick={() => setPaymentSettings(prev => ({ ...prev, enable_recurring: !prev.enable_recurring }))}
                className="relative inline-flex items-center cursor-pointer"
              >
                {paymentSettings.enable_recurring ? (
                  <ToggleRight className="h-8 w-8 text-[var(--teal)]" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-400" />
                )}
              </button>
            </div>

            {/* Fee Surcharge */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[var(--page-background)] rounded-lg">
                <div>
                  <p className="font-medium">Enable Fee Surcharge</p>
                  <p className="text-sm text-gray-500">
                    Pass processing fees to payers
                  </p>
                </div>
                <button
                  onClick={() => setPaymentSettings(prev => ({ ...prev, fee_surcharge_enabled: !prev.fee_surcharge_enabled }))}
                  className="relative inline-flex items-center cursor-pointer"
                >
                  {paymentSettings.fee_surcharge_enabled ? (
                    <ToggleRight className="h-8 w-8 text-[var(--teal)]" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                  )}
                </button>
              </div>

              {paymentSettings.fee_surcharge_enabled && (
                <div className="pl-4 border-l-2 border-[var(--teal)]">
                  <label className="block text-sm font-medium mb-2">Surcharge Percentage</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={paymentSettings.fee_percentage}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, fee_percentage: e.target.value }))}
                      className="w-24"
                    />
                    <span className="text-gray-600">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Typical processing fees are 2.9% + $0.30 per transaction
                  </p>
                </div>
              )}
            </div>

            {/* Refund & Void Permissions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-[var(--page-background)] rounded-lg">
                <div>
                  <p className="font-medium">Allow Refunds</p>
                  <p className="text-sm text-gray-500">
                    Enable partial and full refunds
                  </p>
                </div>
                <button
                  onClick={() => setPaymentSettings(prev => ({ ...prev, allow_refunds: !prev.allow_refunds }))}
                  className="relative inline-flex items-center cursor-pointer"
                >
                  {paymentSettings.allow_refunds ? (
                    <ToggleRight className="h-8 w-8 text-[var(--teal)]" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between p-4 bg-[var(--page-background)] rounded-lg">
                <div>
                  <p className="font-medium">Allow Voids</p>
                  <p className="text-sm text-gray-500">
                    Enable transaction voids (same day)
                  </p>
                </div>
                <button
                  onClick={() => setPaymentSettings(prev => ({ ...prev, allow_voids: !prev.allow_voids }))}
                  className="relative inline-flex items-center cursor-pointer"
                >
                  {paymentSettings.allow_voids ? (
                    <ToggleRight className="h-8 w-8 text-[var(--teal)]" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Webhook Configuration */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Webhook className="h-4 w-4 text-blue-600" />
                  Webhook Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Webhook URL</label>
                  <Input
                    type="url"
                    value={paymentSettings.webhook_url}
                    onChange={(e) => setPaymentSettings(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder="https://your-domain.com/api/webhooks/payments"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your endpoint URL for receiving payment events
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Webhook Secret</label>
                  <div className="relative">
                    <Input
                      type={showTokens ? "text" : "password"}
                      value={paymentSettings.webhook_secret}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, webhook_secret: e.target.value }))}
                      placeholder="whsec_..."
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
                    Secret key for verifying webhook signatures
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Webhook Status</p>
                    {paymentSettings.webhook_last_verified ? (
                      <p className="text-xs text-green-600">
                        Last verified: {new Date(paymentSettings.webhook_last_verified).toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">Not yet verified</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testPaymentWebhook}
                    disabled={isTestingWebhook || !paymentSettings.webhook_url}
                  >
                    {isTestingWebhook ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Test Webhook
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Accounting Handoff */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--teal)]" />
                  Accounting Handoff
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable Accounting Handoff</p>
                    <p className="text-sm text-gray-500">
                      Automatically sync payment data to accounting system
                    </p>
                  </div>
                  <button
                    onClick={() => setPaymentSettings(prev => ({ ...prev, accounting_handoff_enabled: !prev.accounting_handoff_enabled }))}
                    className="relative inline-flex items-center cursor-pointer"
                  >
                    {paymentSettings.accounting_handoff_enabled ? (
                      <ToggleRight className="h-8 w-8 text-[var(--teal)]" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-400" />
                    )}
                  </button>
                </div>

                {paymentSettings.accounting_handoff_enabled && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Reconciliation Owner</label>
                    <Input
                      type="text"
                      value={paymentSettings.reconciliation_owner}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, reconciliation_owner: e.target.value }))}
                      placeholder="e.g., Bookkeeper or Finance Manager"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Person responsible for reconciling payments
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Processor Dashboard Link */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <ExternalLink className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Processor Dashboard</p>
                  <p className="text-sm text-blue-700 mb-2">
                    Access your payment processor dashboard for detailed transaction management.
                  </p>
                  <a
                    href={paymentSettings.processor === "stripe" ? "https://dashboard.stripe.com" :
                          paymentSettings.processor === "paypal" ? "https://www.paypal.com/business" :
                          paymentSettings.processor === "square" ? "https://squareup.com/dashboard" :
                          "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Open {paymentSettings.processor === "stripe" ? "Stripe" :
                          paymentSettings.processor === "paypal" ? "PayPal" :
                          paymentSettings.processor === "square" ? "Square" :
                          "Processor"} Dashboard
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={savePaymentSettings}
                disabled={isSavingPayment}
                className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
              >
                {isSavingPayment ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Payment Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
