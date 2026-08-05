"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Globe, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SiteSettings {
  portal_url: string;
  app_name: string;
  support_email: string;
  company_name: string;
}

export default function SiteSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    portal_url: "https://portal.trueproductsnetwork.com",
    app_name: "Associos",
    support_email: "support@trueproductsnetwork.com",
    company_name: "True Products Network",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const response = await fetch("/api/platform/settings?category=site");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const settingsMap: Record<string, string> = {};
          result.data.forEach((s: { key: string; value: string }) => {
            settingsMap[s.key] = s.value;
          });
          setSettings({
            portal_url: settingsMap.portal_url || "https://portal.trueproductsnetwork.com",
            app_name: settingsMap.app_name || "Associos",
            support_email: settingsMap.support_email || "support@trueproductsnetwork.com",
            company_name: settingsMap.company_name || "True Products Network",
          });
        }
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/platform/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "site",
          settings: {
            portal_url: settings.portal_url,
            app_name: settings.app_name,
            support_email: settings.support_email,
            company_name: settings.company_name,
          },
        }),
      });

      if (response.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        const result = await response.json();
        setError(result.error || "Failed to save settings");
      }
    } catch (err) {
      setError("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Site Settings</h1>
        <p className="text-gray-500">Configure global platform settings</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">Settings saved successfully</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Portal Configuration
          </CardTitle>
          <CardDescription>
            These settings affect the portal URL and branding sent to GHL and emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="portal_url">Portal URL</Label>
            <Input
              id="portal_url"
              value={settings.portal_url}
              onChange={(e) => setSettings({ ...settings, portal_url: e.target.value })}
              placeholder="https://portal.associos.com"
            />
            <p className="text-sm text-gray-500">
              The main URL users access the portal from. Used in GHL integration and emails. Users will be directed to /sign-in with their tenant ID.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app_name">Application Name</Label>
            <Input
              id="app_name"
              value={settings.app_name}
              onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
              placeholder="Associos"
            />
            <p className="text-sm text-gray-500">
              The name displayed in emails and notifications
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              placeholder="True Products Network"
            />
            <p className="text-sm text-gray-500">
              Legal company name for contracts and legal documents
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support_email">Support Email</Label>
            <Input
              id="support_email"
              type="email"
              value={settings.support_email}
              onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
              placeholder="support@example.com"
            />
            <p className="text-sm text-gray-500">
              Email address shown to users for support requests
            </p>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variable</CardTitle>
          <CardDescription>
            For the changes to take full effect, update your environment variable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
            <p>NEXT_PUBLIC_APP_URL={settings.portal_url}</p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Update this in your Vercel/ hosting environment settings for the URL to work in server-side code.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
