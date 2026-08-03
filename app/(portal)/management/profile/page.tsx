"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Mail, Phone, Save, Lock, CheckCircle2, XCircle } from "lucide-react";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
}

// Format phone number to (XXX) XXX-XXXX
function formatPhoneNumber(value: string): string {
  // Remove all non-numeric characters
  const cleaned = value.replace(/\D/g, "");
  
  // Limit to 10 digits
  const limited = cleaned.slice(0, 10);
  
  // Format based on length
  if (limited.length === 0) return "";
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

// Remove formatting for storage
function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, "");
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setProfile({
            id: result.data.id,
            firstName: result.data.firstName || "",
            lastName: result.data.lastName || "",
            email: result.data.email || "",
            phone: result.data.phone || "",
          });
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setError("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveProfile() {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: unformatPhoneNumber(profile.phone || ""),
        }),
      });

      if (response.ok) {
        alert("Profile updated successfully!");
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  async function updatePassword() {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "Please fill in all password fields" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters" });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMessage(null);

    try {
      const response = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage({ type: "success", text: "Password updated successfully!" });
        // Clear password fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ 
          type: "error", 
          text: data.error || "Failed to update password. Please check your current password." 
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordMessage({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhoneNumber(e.target.value);
    setProfile(prev => prev ? { ...prev, phone: formatted } : null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error || "Failed to load profile"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">My Profile</h1>
        <p className="text-[var(--secondary-text)] mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-[var(--teal)]" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <Input
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <Input
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                placeholder="Enter last name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              <Mail className="h-4 w-4 inline mr-1" />
              Email Address
            </label>
            <Input
              type="email"
              value={profile.email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              Phone Number
            </label>
            <Input
              type="tel"
              value={profile.phone || ""}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
            />
            <p className="text-xs text-gray-500 mt-1">Format: (XXX) XXX-XXXX</p>
          </div>

          {/* Save Changes Button - Moved under Personal Information */}
          <div className="pt-4 border-t">
            <Button
              onClick={saveProfile}
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
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[var(--teal)]" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Password Message */}
          {passwordMessage && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              passwordMessage.type === "success" 
                ? "bg-green-50 border border-green-200 text-green-800" 
                : "bg-red-50 border border-red-200 text-red-800"
            }`}>
              {passwordMessage.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="text-sm">{passwordMessage.text}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Current Password</label>
            <Input 
              type="password" 
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">New Password</label>
            <Input 
              type="password" 
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Confirm New Password</label>
            <Input 
              type="password" 
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={updatePassword}
            disabled={isUpdatingPassword}
          >
            {isUpdatingPassword ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
