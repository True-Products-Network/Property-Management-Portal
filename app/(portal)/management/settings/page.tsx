"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Bell, 
  Mail, 
  Smartphone,
  Globe,
  Moon,
  Loader2,
  Save,
  CheckCircle2
} from "lucide-react";

interface NotificationSettings {
  emailAnnouncements: boolean;
  emailMaintenance: boolean;
  emailPayments: boolean;
  emailDocuments: boolean;
  smsMaintenance: boolean;
  smsUrgent: boolean;
}

interface CommunicationSettings {
  announcements: boolean;
  meetingNotices: boolean;
  documentUpdates: boolean;
  inspectionReminders: boolean;
  paymentReminders: boolean;
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "communication" | "preferences">("notifications");
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailAnnouncements: true,
    emailMaintenance: true,
    emailPayments: true,
    emailDocuments: true,
    smsMaintenance: false,
    smsUrgent: true,
  });

  const [communicationSettings, setCommunicationSettings] = useState<CommunicationSettings>({
    announcements: true,
    meetingNotices: true,
    documentUpdates: true,
    inspectionReminders: true,
    paymentReminders: true,
  });

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    darkMode: false,
  });

  useEffect(() => {
    // Simulate loading settings
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  async function saveSettings() {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert("Settings saved successfully!");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">Settings</h1>
        <p className="text-[var(--secondary-text)] mt-1">
          Manage your notification and communication preferences
        </p>
      </div>

      {/* Settings Navigation */}
      <div className="flex gap-2 border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "notifications"
              ? "border-[var(--teal)] text-[var(--teal)]"
              : "border-transparent text-[var(--secondary-text)] hover:text-[var(--main-text)]"
          }`}
        >
          <Bell className="h-4 w-4 inline mr-2" />
          Notifications
        </button>
        <button
          onClick={() => setActiveTab("communication")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "communication"
              ? "border-[var(--teal)] text-[var(--teal)]"
              : "border-transparent text-[var(--secondary-text)] hover:text-[var(--main-text)]"
          }`}
        >
          <Mail className="h-4 w-4 inline mr-2" />
          Communication
        </button>
        <button
          onClick={() => setActiveTab("preferences")}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "preferences"
              ? "border-[var(--teal)] text-[var(--teal)]"
              : "border-transparent text-[var(--secondary-text)] hover:text-[var(--main-text)]"
          }`}
        >
          <Settings className="h-4 w-4 inline mr-2" />
          Preferences
        </button>
      </div>

      {/* Notifications Tab */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[var(--teal)]" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
                <div>
                  <p className="font-medium text-[var(--main-text)]">Announcements</p>
                  <p className="text-sm text-[var(--secondary-text)]">Community announcements and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailAnnouncements}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailAnnouncements: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
                <div>
                  <p className="font-medium text-[var(--main-text)]">Maintenance Updates</p>
                  <p className="text-sm text-[var(--secondary-text)]">Status changes on your maintenance requests</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailMaintenance}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailMaintenance: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
                <div>
                  <p className="font-medium text-[var(--main-text)]">Payment Reminders</p>
                  <p className="text-sm text-[var(--secondary-text)]">Upcoming and overdue payment notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailPayments}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailPayments: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[var(--main-text)]">Document Updates</p>
                  <p className="text-sm text-[var(--secondary-text)]">New documents and document changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailDocuments}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailDocuments: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* SMS Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[var(--teal)]" />
                SMS Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
                <div>
                  <p className="font-medium text-[var(--main-text)]">Urgent Alerts</p>
                  <p className="text-sm text-[var(--secondary-text)]">Emergency maintenance and critical updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.smsUrgent}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsUrgent: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[var(--main-text)]">Maintenance Updates</p>
                  <p className="text-sm text-[var(--secondary-text)]">SMS updates on maintenance requests</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.smsMaintenance}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, smsMaintenance: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Communication Tab */}
      {activeTab === "communication" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-[var(--teal)]" />
              Communication Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
              <div>
                <p className="font-medium text-[var(--main-text)]">Announcements</p>
                <p className="text-sm text-[var(--secondary-text)]">Community-wide announcements and newsletters</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={communicationSettings.announcements}
                  onChange={(e) => setCommunicationSettings(prev => ({ ...prev, announcements: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
              <div>
                <p className="font-medium text-[var(--main-text)]">Meeting Notices</p>
                <p className="text-sm text-[var(--secondary-text)]">Board meetings, annual meetings, and special meetings</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={communicationSettings.meetingNotices}
                  onChange={(e) => setCommunicationSettings(prev => ({ ...prev, meetingNotices: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
              <div>
                <p className="font-medium text-[var(--main-text)]">Document Updates</p>
                <p className="text-sm text-[var(--secondary-text)]">New documents added and document revisions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={communicationSettings.documentUpdates}
                  onChange={(e) => setCommunicationSettings(prev => ({ ...prev, documentUpdates: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]">
              <div>
                <p className="font-medium text-[var(--main-text)]">Inspection Reminders</p>
                <p className="text-sm text-[var(--secondary-text)]">Upcoming inspections and access requests</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={communicationSettings.inspectionReminders}
                  onChange={(e) => setCommunicationSettings(prev => ({ ...prev, inspectionReminders: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-[var(--main-text)]">Payment Reminders</p>
                <p className="text-sm text-[var(--secondary-text)]">Upcoming assessments, dues, and payment confirmations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={communicationSettings.paymentReminders}
                  onChange={(e) => setCommunicationSettings(prev => ({ ...prev, paymentReminders: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-[var(--teal)]" />
                Regional Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                  className="input w-full"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                  className="input w-full"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date Format</label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => setPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
                  className="input w-full"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-[var(--teal)]" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-[var(--main-text)]">Dark Mode</p>
                  <p className="text-sm text-[var(--secondary-text)]">Enable dark theme for the portal</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.darkMode}
                    onChange={(e) => setPreferences(prev => ({ ...prev, darkMode: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--teal)]"></div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
        <Button
          onClick={saveSettings}
          disabled={isSaving}
          className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
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
    </div>
  );
}
