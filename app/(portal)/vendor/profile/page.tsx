"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  FileText,
  Shield,
  CheckCircle2,
  ArrowLeft,
  Upload,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface VendorProfile {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  insuranceExpiry?: string;
  services: string[];
  isActive: boolean;
  rating: number;
  totalJobs: number;
}

export default function VendorProfilePage() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/vendor/profile");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load profile");
      }

      setProfile(result.data);
    } catch (error) {
      console.error("Error loading profile:", error);
      setError(error instanceof Error ? error.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to save profile");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setError(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={loadProfile} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vendor">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Company Profile</h1>
          <p className="text-[var(--secondary-text)]">Manage your business information</p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          Profile saved successfully!
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <form onSubmit={saveProfile} className="space-y-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--teal)]" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={profile?.companyName || ""}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, companyName: e.target.value } : null))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={profile?.contactName || ""}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, contactName: e.target.value } : null))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, email: e.target.value } : null))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile?.phone || ""}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, phone: e.target.value } : null))
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profile?.address || ""}
                onChange={(e) =>
                  setProfile((prev) => (prev ? { ...prev, address: e.target.value } : null))
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile?.city || ""}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, city: e.target.value } : null))
                  }
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profile?.state || ""}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, state: e.target.value } : null))
                  }
                />
              </div>
              <div>
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={profile?.zip || ""}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, zip: e.target.value } : null))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                type="url"
                value={profile?.website || ""}
                onChange={(e) =>
                  setProfile((prev) => (prev ? { ...prev, website: e.target.value } : null))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[var(--teal)]" />
              Credentials & Insurance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  value={profile?.licenseNumber || ""}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, licenseNumber: e.target.value } : null))
                  }
                />
              </div>
              <div>
                <Label htmlFor="licenseExpiry">License Expiry</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={profile?.licenseExpiry || ""}
                  onChange={(e) =>
                    setProfile((prev) => (prev ? { ...prev, licenseExpiry: e.target.value } : null))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
              <Input
                id="insuranceExpiry"
                type="date"
                value={profile?.insuranceExpiry || ""}
                onChange={(e) =>
                  setProfile((prev) => (prev ? { ...prev, insuranceExpiry: e.target.value } : null))
                }
              />
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-[var(--secondary-text)]" />
              <p className="text-sm text-[var(--secondary-text)]">
                Upload insurance certificate
              </p>
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                PDF up to 10MB
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--teal)]" />
              Performance Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-[var(--teal)]">{profile?.rating?.toFixed(1) || "0.0"}</p>
                <p className="text-sm text-[var(--secondary-text)]">Average Rating</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-[var(--teal)]">{profile?.totalJobs || 0}</p>
                <p className="text-sm text-[var(--secondary-text)]">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
          <Link href="/vendor">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
