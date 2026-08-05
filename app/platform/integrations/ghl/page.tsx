"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, TestTube, CheckCircle, XCircle, Mail, Key, Building } from "lucide-react";

interface GHLSettings {
  ghl_api_token: string;
  ghl_location_id: string;
  ghl_webhook_url: string;
}

export default function GHLIntegrationPage() {
  const [settings, setSettings] = useState<GHLSettings>({
    ghl_api_token: "",
    ghl_location_id: "",
    ghl_webhook_url: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch("/api/platform/settings?category=ghl");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.settings) {
          setSettings({
            ghl_api_token: result.settings.ghl_api_token || "",
            ghl_location_id: result.settings.ghl_location_id || "",
            ghl_webhook_url: result.settings.ghl_webhook_url || "",
          });
        }
      }
    } catch (error) {
      console.error("Error loading GHL settings:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSettings() {
    setIsSaving(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/platform/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "ghl",
          settings: settings,
        }),
      });

      if (response.ok) {
        alert("GHL settings saved successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving GHL settings:", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  async function testConnection() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/platform/integrations/ghl/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      setTestResult({
        success: result.success,
        message: result.message || (result.success ? "Connection successful!" : "Connection failed"),
      });
    } catch (error) {
      console.error("Error testing GHL connection:", error);
      setTestResult({
        success: false,
        message: "Failed to test connection",
      });
    } finally {
      setIsTesting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">GoHighLevel (GHL) Integration</h1>
        <p className="text-gray-500 mt-1">
          Configure GHL API credentials for email sending and CRM integration
        </p>
      </div>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            API Configuration
          </CardTitle>
          <CardDescription>
            Enter your GHL API credentials. These are required for sending invitation emails and syncing contacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Token */}
          <div>
            <label className="block text-sm font-medium mb-2">
              GHL API Token
            </label>
            <Input
              type="password"
              value={settings.ghl_api_token}
              onChange={(e) => setSettings({ ...settings, ghl_api_token: e.target.value })}
              placeholder="Enter your GHL API token"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get this from GHL → Settings → API Credentials
            </p>
          </div>

          {/* Location ID */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Building className="h-4 w-4 inline mr-1" />
              Location ID
            </label>
            <Input
              value={settings.ghl_location_id}
              onChange={(e) => setSettings({ ...settings, ghl_location_id: e.target.value })}
              placeholder="Enter your GHL Location ID"
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in GHL URL or Settings → Business Profile
            </p>
          </div>

          {/* Webhook URL (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Webhook URL (Optional)
            </label>
            <Input
              value={settings.ghl_webhook_url}
              onChange={(e) => setSettings({ ...settings, ghl_webhook_url: e.target.value })}
              placeholder="https://services.leadconnector.net/hooks/..."
            />
            <p className="text-xs text-gray-500 mt-1">
              For triggering GHL workflows when invitations are sent
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                </p>
                <p className={`text-sm ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              onClick={testConnection}
              disabled={isTesting || !settings.ghl_api_token || !settings.ghl_location_id}
              variant="outline"
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            <Button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <ol className="list-decimal list-inside space-y-2">
            <li>Log in to your GoHighLevel account</li>
            <li>Go to <strong>Settings → API Credentials</strong></li>
            <li>Generate a new API token (or use existing)</li>
            <li>Copy the <strong>API Token</strong> and paste above</li>
            <li>Find your <strong>Location ID</strong> in Settings → Business Profile or in the URL</li>
            <li>Click <strong>Test Connection</strong> to verify</li>
            <li>Click <strong>Save Settings</strong> to store credentials</li>
          </ol>
          <div className="p-3 bg-blue-50 rounded-lg mt-4">
            <p className="text-blue-800">
              <strong>Note:</strong> Once configured, invitation emails will be sent via GHL 
              and new users will be added to your GHL contacts automatically.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
