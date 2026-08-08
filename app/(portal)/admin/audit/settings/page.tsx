"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  FileText, 
  Shield, 
  Database,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  User,
  Settings,
  Lock
} from "lucide-react";

interface AuditSettings {
  enabled: boolean;
  logSuccessfulReads: boolean;
  logFailedReads: boolean;
  logSuccessfulWrites: boolean;
  logFailedWrites: boolean;
  logAuthentication: boolean;
  logSecurityEvents: boolean;
  retentionDays: number;
}

const DEFAULT_SETTINGS: AuditSettings = {
  enabled: true,
  logSuccessfulReads: false,
  logFailedReads: true,
  logSuccessfulWrites: true,
  logFailedWrites: true,
  logAuthentication: true,
  logSecurityEvents: true,
  retentionDays: 90,
};

export default function AuditSettingsPage() {
  const [settings, setSettings] = useState<AuditSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [stats, setStats] = useState({ totalLogs: 0, storageSize: "0 MB" });

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch("/api/admin/audit/settings");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setSettings({ ...DEFAULT_SETTINGS, ...result.data });
        }
      }
    } catch (error) {
      console.error("Error loading audit settings:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStats() {
    try {
      const response = await fetch("/api/admin/audit/stats");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading audit stats:", error);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const response = await fetch("/api/admin/audit/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSaveMessage({ type: "success", text: "Settings saved successfully" });
      } else {
        setSaveMessage({ type: "error", text: result.error || "Failed to save settings" });
      }
    } catch (error) {
      setSaveMessage({ type: "error", text: "An error occurred while saving" });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  async function handleClearLogs() {
    if (!confirm("Are you sure you want to clear all audit logs? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/audit/clear", {
        method: "POST",
      });

      if (response.ok) {
        setSaveMessage({ type: "success", text: "All audit logs cleared" });
        loadStats();
      } else {
        setSaveMessage({ type: "error", text: "Failed to clear logs" });
      }
    } catch (error) {
      setSaveMessage({ type: "error", text: "An error occurred" });
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/audit">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Audit Log
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">Audit Log Settings</h1>
            <p className="text-[var(--secondary-text)] mt-1">Configure system activity logging</p>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-white"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg ${saveMessage.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          <div className="flex items-center gap-2">
            {saveMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            {saveMessage.text}
          </div>
        </div>
      )}

      {/* Main Toggle */}
      <Card className={settings.enabled ? "border-green-200" : "border-gray-200"}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${settings.enabled ? "bg-green-100" : "bg-gray-100"}`}>
                <Activity className={`h-6 w-6 ${settings.enabled ? "text-green-600" : "text-gray-500"}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--main-text)]">Audit Logging</h3>
                <p className="text-sm text-[var(--secondary-text)]">
                  {settings.enabled 
                    ? "System activity is being logged" 
                    : "Audit logging is currently disabled"}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logging Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Read Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Read Operations
            </CardTitle>
            <CardDescription>Log viewing and listing operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--main-text)]">Successful Reads</p>
                <p className="text-sm text-[var(--secondary-text)]">Log when data is successfully retrieved</p>
              </div>
              <Switch
                checked={settings.logSuccessfulReads}
                onCheckedChange={(checked) => setSettings({ ...settings, logSuccessfulReads: checked })}
                disabled={!settings.enabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--main-text)]">Failed Reads</p>
                <p className="text-sm text-[var(--secondary-text)]">Log when data retrieval fails</p>
              </div>
              <Switch
                checked={settings.logFailedReads}
                onCheckedChange={(checked) => setSettings({ ...settings, logFailedReads: checked })}
                disabled={!settings.enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Write Operations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              Write Operations
            </CardTitle>
            <CardDescription>Log create, update, and delete operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--main-text)]">Successful Writes</p>
                <p className="text-sm text-[var(--secondary-text)]">Log when data is successfully saved</p>
              </div>
              <Switch
                checked={settings.logSuccessfulWrites}
                onCheckedChange={(checked) => setSettings({ ...settings, logSuccessfulWrites: checked })}
                disabled={!settings.enabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--main-text)]">Failed Writes</p>
                <p className="text-sm text-[var(--secondary-text)]">Log when save operations fail</p>
              </div>
              <Switch
                checked={settings.logFailedWrites}
                onCheckedChange={(checked) => setSettings({ ...settings, logFailedWrites: checked })}
                disabled={!settings.enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Authentication
            </CardTitle>
            <CardDescription>Log login and logout events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--main-text)]">Log Authentication Events</p>
                <p className="text-sm text-[var(--secondary-text)]">Track sign-ins, sign-outs, and failures</p>
              </div>
              <Switch
                checked={settings.logAuthentication}
                onCheckedChange={(checked) => setSettings({ ...settings, logAuthentication: checked })}
                disabled={!settings.enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Security Events
            </CardTitle>
            <CardDescription>Log security-related activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--main-text)]">Log Security Events</p>
                <p className="text-sm text-[var(--secondary-text)]">Track permission changes and unauthorized access</p>
              </div>
              <Switch
                checked={settings.logSecurityEvents}
                onCheckedChange={(checked) => setSettings({ ...settings, logSecurityEvents: checked })}
                disabled={!settings.enabled}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Retention Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Data Retention
          </CardTitle>
          <CardDescription>Configure how long audit logs are kept</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="font-medium text-[var(--main-text)]">Retention Period:</label>
            <select
              value={settings.retentionDays}
              onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) })}
              disabled={!settings.enabled}
              className="input"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
          </div>
          <p className="text-sm text-[var(--secondary-text)]">
            Audit logs older than {settings.retentionDays} days will be automatically deleted.
          </p>
        </CardContent>
      </Card>

      {/* Storage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Total Log Entries</p>
              <p className="text-2xl font-semibold">{stats.totalLogs.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Estimated Storage</p>
              <p className="text-2xl font-semibold">{stats.storageSize}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Destructive actions for audit logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--main-text)]">Clear All Audit Logs</p>
              <p className="text-sm text-[var(--secondary-text)]">
                Permanently delete all audit log entries. This action cannot be undone.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleClearLogs}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
