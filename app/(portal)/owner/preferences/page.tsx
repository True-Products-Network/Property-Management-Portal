"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  Mail,
  Phone,
  MessageSquare,
  Bell,
  User,
  Shield,
  Smartphone,
} from "lucide-react";

interface ContactPreferences {
  // Contact Methods
  email: string;
  phone: string;
  mobilePhone?: string;
  
  // Preferred Contact Method
  preferredContactMethod: string;
  mailingPreference: string;
  
  // Communication Permissions
  emailPermission: boolean;
  smsPermission: boolean;
  phonePermission: boolean;
  
  // Portal Notifications
  portalNotifications: boolean;
  maintenanceUpdates: boolean;
  inspectionNotices: boolean;
  documentAlerts: boolean;
  paymentReminders: boolean;
  generalAnnouncements: boolean;
  
  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  
  // Consent Tracking
  consentDate?: string;
  consentVersion: string;
}

export default function OwnerPreferencesPage() {
  const [preferences, setPreferences] = useState<ContactPreferences | null>(null);
  const [editedPreferences, setEditedPreferences] = useState<ContactPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    if (preferences && editedPreferences) {
      setHasChanges(JSON.stringify(preferences) !== JSON.stringify(editedPreferences));
    }
  }, [preferences, editedPreferences]);

  async function loadPreferences() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/owner/preferences");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load preferences");
      }

      setPreferences(result.data);
      setEditedPreferences(result.data);
    } catch (error) {
      console.error("Error loading preferences:", error);
      setError(error instanceof Error ? error.message : "Failed to load preferences");
    } finally {
      setIsLoading(false);
    }
  }

  async function savePreferences() {
    if (!editedPreferences) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/owner/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedPreferences),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to save preferences");
      }

      setPreferences(editedPreferences);
      setSuccessMessage("Preferences saved successfully");
      setHasChanges(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      setError(error instanceof Error ? error.message : "Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  }

  const handleChange = (field: keyof ContactPreferences, value: string | boolean) => {
    if (!editedPreferences) return;
    setEditedPreferences({ ...editedPreferences, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error && !preferences) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={loadPreferences} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!editedPreferences) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-[var(--secondary-text)]">No preferences available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Contact Preferences</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage your communication preferences and consent settings
          </p>
        </div>
        <Button
          onClick={savePreferences}
          disabled={isSaving || !hasChanges}
          className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
          <AlertCircle className="h-5 w-5" />
          You have unsaved changes. Don&apos;t forget to save!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-[var(--teal)]" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Your primary contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[var(--secondary-text)]" />
                <Input
                  id="email"
                  type="email"
                  value={editedPreferences.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[var(--secondary-text)]" />
                <Input
                  id="phone"
                  type="tel"
                  value={editedPreferences.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="mobilePhone">Mobile Phone (for SMS)</Label>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-[var(--secondary-text)]" />
                <Input
                  id="mobilePhone"
                  type="tel"
                  value={editedPreferences.mobilePhone || ""}
                  onChange={(e) => handleChange("mobilePhone", e.target.value)}
                  placeholder="Same as phone if not specified"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferred Contact Method */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[var(--teal)]" />
              Preferred Contact Method
            </CardTitle>
            <CardDescription>
              How would you like us to reach you?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="preferredContactMethod">Primary Contact Method</Label>
              <select
                id="preferredContactMethod"
                value={editedPreferences.preferredContactMethod}
                onChange={(e) => handleChange("preferredContactMethod", e.target.value)}
                className="w-full h-10 px-3 border rounded-md"
              >
                <option value="email">Email</option>
                <option value="phone">Phone Call</option>
                <option value="sms">Text Message (SMS)</option>
                <option value="portal">Portal Message</option>
                <option value="mail">Postal Mail</option>
              </select>
            </div>

            <div>
              <Label htmlFor="mailingPreference">Mailing Preference</Label>
              <select
                id="mailingPreference"
                value={editedPreferences.mailingPreference}
                onChange={(e) => handleChange("mailingPreference", e.target.value)}
                className="w-full h-10 px-3 border rounded-md"
              >
                <option value="email">Email Only</option>
                <option value="mail">Postal Mail Only</option>
                <option value="both">Both Email and Mail</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Communication Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--teal)]" />
              Communication Permissions
            </CardTitle>
            <CardDescription>
              Control how we can contact you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-[var(--page-background)] rounded-lg">
              <Checkbox
                id="emailPermission"
                checked={editedPreferences.emailPermission}
                onChange={(e) => handleChange("emailPermission", e.target.checked)}
              />
              <div className="flex-1">
                <Label htmlFor="emailPermission" className="font-medium">
                  Email Communications
                </Label>
                <p className="text-sm text-[var(--secondary-text)]">
                  Receive emails about your account, maintenance, and announcements
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[var(--page-background)] rounded-lg">
              <Checkbox
                id="smsPermission"
                checked={editedPreferences.smsPermission}
                onChange={(e) => handleChange("smsPermission", e.target.checked)}
              />
              <div className="flex-1">
                <Label htmlFor="smsPermission" className="font-medium">
                  SMS / Text Messages
                </Label>
                <p className="text-sm text-[var(--secondary-text)]">
                  Receive text messages for urgent matters and reminders
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[var(--page-background)] rounded-lg">
              <Checkbox
                id="phonePermission"
                checked={editedPreferences.phonePermission}
                onChange={(e) => handleChange("phonePermission", e.target.checked)}
              />
              <div className="flex-1">
                <Label htmlFor="phonePermission" className="font-medium">
                  Phone Calls
                </Label>
                <p className="text-sm text-[var(--secondary-text)]">
                  Allow phone calls for important matters
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portal Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-[var(--teal)]" />
              Portal Notifications
            </CardTitle>
            <CardDescription>
              Choose what notifications you receive in the portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-[var(--page-background)] rounded-lg">
              <Checkbox
                id="portalNotifications"
                checked={editedPreferences.portalNotifications}
                onChange={(e) => handleChange("portalNotifications", e.target.checked)}
              />
              <div className="flex-1">
                <Label htmlFor="portalNotifications" className="font-medium">
                  Enable Portal Notifications
                </Label>
                <p className="text-sm text-[var(--secondary-text)]">
                  Show notification badges and alerts in the portal
                </p>
              </div>
            </div>

            {editedPreferences.portalNotifications && (
              <div className="space-y-3 pl-6 border-l-2 border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="maintenanceUpdates"
                    checked={editedPreferences.maintenanceUpdates}
                    onChange={(e) => handleChange("maintenanceUpdates", e.target.checked)}
                  />
                  <Label htmlFor="maintenanceUpdates">Maintenance Updates</Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="inspectionNotices"
                    checked={editedPreferences.inspectionNotices}
                    onChange={(e) => handleChange("inspectionNotices", e.target.checked)}
                  />
                  <Label htmlFor="inspectionNotices">Inspection Notices</Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="documentAlerts"
                    checked={editedPreferences.documentAlerts}
                    onChange={(e) => handleChange("documentAlerts", e.target.checked)}
                  />
                  <Label htmlFor="documentAlerts">Document Alerts</Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="paymentReminders"
                    checked={editedPreferences.paymentReminders}
                    onChange={(e) => handleChange("paymentReminders", e.target.checked)}
                  />
                  <Label htmlFor="paymentReminders">Payment Reminders</Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    id="generalAnnouncements"
                    checked={editedPreferences.generalAnnouncements}
                    onChange={(e) => handleChange("generalAnnouncements", e.target.checked)}
                  />
                  <Label htmlFor="generalAnnouncements">General Announcements</Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Emergency Contact
            </CardTitle>
            <CardDescription>
              Who should we contact in case of emergency?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="emergencyContactName">Name</Label>
                <Input
                  id="emergencyContactName"
                  value={editedPreferences.emergencyContactName || ""}
                  onChange={(e) => handleChange("emergencyContactName", e.target.value)}
                  placeholder="Emergency contact name"
                />
              </div>

              <div>
                <Label htmlFor="emergencyContactPhone">Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  value={editedPreferences.emergencyContactPhone || ""}
                  onChange={(e) => handleChange("emergencyContactPhone", e.target.value)}
                  placeholder="Emergency contact phone"
                />
              </div>

              <div>
                <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                <Input
                  id="emergencyContactRelationship"
                  value={editedPreferences.emergencyContactRelationship || ""}
                  onChange={(e) => handleChange("emergencyContactRelationship", e.target.value)}
                  placeholder="e.g., Spouse, Parent, Friend"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consent Record */}
        {preferences?.consentDate && (
          <Card className="lg:col-span-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle2 className="h-5 w-5" />
                Consent Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-green-800">
                You provided consent for these communication preferences on{" "}
                <strong>{new Date(preferences.consentDate).toLocaleDateString()}</strong>
                {preferences.consentVersion && (
                  <span> (Version {preferences.consentVersion})</span>
                )}
                .
              </p>
              <p className="text-sm text-green-700 mt-2">
                You can update your preferences at any time. Changes will be recorded for compliance purposes.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
