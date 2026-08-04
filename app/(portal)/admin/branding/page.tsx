"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Palette, Image, Type, Save, Building2, MessageSquare, ArrowLeft, Code, Globe } from "lucide-react";
import Link from "next/link";

interface BrandSettings {
  brand_name: string;
  brand_name_line2: string;
  brand_logo_url: string;
  brand_logo_svg: string;
  brand_favicon_url: string;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_accent_color: string;
  support_email: string;
  support_phone: string;
  website_url: string;
  ghl_chat_widget_code: string;
  enable_live_chat: boolean;
}

export default function BrandingPage() {
  const [settings, setSettings] = useState<BrandSettings>({
    brand_name: "Associos",
    brand_name_line2: "Property Management",
    brand_logo_url: "",
    brand_logo_svg: "",
    brand_favicon_url: "",
    brand_primary_color: "#0d3b66",
    brand_secondary_color: "#f4d35e",
    brand_accent_color: "#f4d35e",
    support_email: "",
    support_phone: "",
    website_url: "",
    ghl_chat_widget_code: "",
    enable_live_chat: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch("/api/admin/branding");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.branding) {
          setSettings(prev => ({ ...prev, ...result.branding }));
          if (result.branding.brand_logo_url) {
            setPreviewLogo(result.branding.brand_logo_url);
          }
        }
      }
    } catch (error) {
      console.error("Error loading brand settings:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSettings() {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Brand settings saved successfully! Changes will take effect immediately.");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save brand settings");
      }
    } catch (error) {
      console.error("Error saving brand settings:", error);
      alert("Failed to save brand settings");
    } finally {
      setIsSaving(false);
    }
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // For now, create a data URL for preview
      // In production, upload to storage and get URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewLogo(result);
        setSettings(prev => ({ ...prev, brand_logo_url: result }));
      };
      reader.readAsDataURL(file);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Brand Customization</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Customization</h1>
          <p className="text-gray-500">Customize the look and feel of your portal</p>
        </div>
      </div>

      {/* Preview Card */}
      <Card className="bg-gradient-to-br from-[var(--primary-navy)] to-[var(--primary-navy)]/90 border-0">
        <CardContent className="py-6">
          <p className="text-sm text-white/60 mb-4">Live Preview</p>
          <div className="flex items-center gap-3 p-4 bg-white/10 rounded-lg">
            {previewLogo ? (
              <img 
                src={previewLogo} 
                alt="Logo" 
                className="w-10 h-10 object-contain rounded"
              />
            ) : settings.brand_logo_svg ? (
              <div 
                className="w-10 h-10 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: settings.brand_logo_svg }}
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: settings.brand_primary_color }}
              >
                {settings.brand_name.charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-semibold text-white text-sm">{settings.brand_name}</span>
              <span className="text-xs text-white/60">{settings.brand_name_line2}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Name */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-[var(--teal)]" />
              Company Name
            </CardTitle>
            <CardDescription>
              Displayed in the sidebar and throughout the application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Primary Name
              </label>
              <Input
                value={settings.brand_name}
                onChange={(e) => setSettings(prev => ({ ...prev, brand_name: e.target.value }))}
                placeholder="e.g., Associos"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Secondary Name / Tagline
              </label>
              <Input
                value={settings.brand_name_line2}
                onChange={(e) => setSettings(prev => ({ ...prev, brand_name_line2: e.target.value }))}
                placeholder="e.g., Property Management"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logo Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-[var(--teal)]" />
              Logo
            </CardTitle>
            <CardDescription>
              Upload your company logo (recommended: 64x64px PNG/SVG)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Logo Image URL
              </label>
              <Input
                value={settings.brand_logo_url}
                onChange={(e) => {
                  setSettings(prev => ({ ...prev, brand_logo_url: e.target.value }));
                  setPreviewLogo(e.target.value);
                }}
                placeholder="https://your-cdn.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Or upload a file below
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload Logo
              </label>
              <Input
                type="file"
                accept="image/png,image/svg+xml,image/jpeg"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-gray-500 mt-1">
                PNG, SVG, or JPEG (max 2MB)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <Code className="h-4 w-4 inline mr-1" />
                Logo SVG Code (Optional)
              </label>
              <textarea
                value={settings.brand_logo_svg}
                onChange={(e) => setSettings(prev => ({ ...prev, brand_logo_svg: e.target.value }))}
                placeholder="<svg>...</svg>"
                className="w-full min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)] font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste SVG code for vector logo (overrides image URL)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <Globe className="h-4 w-4 inline mr-1" />
                Favicon URL
              </label>
              <Input
                value={settings.brand_favicon_url}
                onChange={(e) => setSettings(prev => ({ ...prev, brand_favicon_url: e.target.value }))}
                placeholder="https://your-cdn.com/favicon.ico"
              />
              <p className="text-xs text-gray-500 mt-1">
                Browser tab icon (recommended: 32x32px .ico or .png)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-[var(--teal)]" />
              Brand Colors
            </CardTitle>
            <CardDescription>
              Customize the primary colors used throughout the portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Primary Color
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.brand_primary_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, brand_primary_color: e.target.value }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.brand_primary_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, brand_primary_color: e.target.value }))}
                  placeholder="#0d3b66"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Secondary Color
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.brand_secondary_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, brand_secondary_color: e.target.value }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.brand_secondary_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, brand_secondary_color: e.target.value }))}
                  placeholder="#f4d35e"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Accent Color
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.brand_accent_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, brand_accent_color: e.target.value }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={settings.brand_accent_color}
                  onChange={(e) => setSettings(prev => ({ ...prev, brand_accent_color: e.target.value }))}
                  placeholder="#f4d35e"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--teal)]" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Displayed in emails and support materials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Support Email
              </label>
              <Input
                type="email"
                value={settings.support_email}
                onChange={(e) => setSettings(prev => ({ ...prev, support_email: e.target.value }))}
                placeholder="support@yourcompany.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Support Phone
              </label>
              <Input
                type="tel"
                value={settings.support_phone}
                onChange={(e) => setSettings(prev => ({ ...prev, support_phone: e.target.value }))}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Website URL
              </label>
              <Input
                type="url"
                value={settings.website_url}
                onChange={(e) => setSettings(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://www.yourcompany.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Live Chat Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[var(--teal)]" />
              Live Chat Widget
            </CardTitle>
            <CardDescription>
              Enable live chat support on your portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="enable_live_chat" className="text-sm font-medium text-gray-900">
                  Enable Live Chat Widget
                </label>
                <p className="text-xs text-gray-500">
                  Show chat widget on all portal pages
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, enable_live_chat: !prev.enable_live_chat }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--teal)] focus:ring-offset-2 ${
                  settings.enable_live_chat ? 'bg-[var(--teal)]' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enable_live_chat ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Chat Widget Code - Only show when enabled */}
            {settings.enable_live_chat && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>GHL Instructions:</strong> Go to GHL → Sites → Chat Widget → Copy the embed code and paste it below.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chat Widget Embed Code
                  </label>
                  <textarea
                    value={settings.ghl_chat_widget_code}
                    onChange={(e) => setSettings(prev => ({ ...prev, ghl_chat_widget_code: e.target.value }))}
                    placeholder="<!-- Paste your chat widget code here -->"
                    className="w-full min-h-[150px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--teal)] font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supports GHL, Intercom, Zendesk, or any other chat widget code
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
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
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
