"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Palette, Image, Type, Save, Building2 } from "lucide-react";

interface BrandSettings {
  brand_logo_url: string;
  brand_logo_svg: string;
  brand_name_line1: string;
  brand_name_line2: string;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_favicon_url: string;
}

export default function BrandingPage() {
  const [settings, setSettings] = useState<BrandSettings>({
    brand_logo_url: "",
    brand_logo_svg: "",
    brand_name_line1: "Exemplary",
    brand_name_line2: "Property Management",
    brand_primary_color: "#0d3b66",
    brand_secondary_color: "#f4d35e",
    brand_favicon_url: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch("/api/admin/settings?category=branding");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const loadedSettings: Partial<BrandSettings> = {};
          result.data.forEach((setting: { key: keyof BrandSettings; value: string }) => {
            loadedSettings[setting.key] = setting.value;
          });
          setSettings(prev => ({ ...prev, ...loadedSettings }));
          if (loadedSettings.brand_logo_url) {
            setPreviewLogo(loadedSettings.brand_logo_url);
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
      const settingsToSave = [
        { key: "brand_logo_url", value: settings.brand_logo_url },
        { key: "brand_logo_svg", value: settings.brand_logo_svg },
        { key: "brand_name_line1", value: settings.brand_name_line1 },
        { key: "brand_name_line2", value: settings.brand_name_line2 },
        { key: "brand_primary_color", value: settings.brand_primary_color },
        { key: "brand_secondary_color", value: settings.brand_secondary_color },
        { key: "brand_favicon_url", value: settings.brand_favicon_url },
      ];

      for (const setting of settingsToSave) {
        await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(setting),
        });
      }

      alert("Brand settings saved successfully! Changes will take effect on next page load.");
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
      // In a real implementation, upload to storage and get URL
      // For now, we'll use a data URL for preview
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">Brand Customization</h1>
        <p className="text-[var(--secondary-text)] mt-1">
          Customize the appearance of your property management portal
        </p>
      </div>

      {/* Preview Card */}
      <Card className="bg-gradient-to-br from-[var(--primary-navy)] to-[var(--primary-navy)]/90">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <CardDescription className="text-white/70">
            This is how your brand will appear in the sidebar
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                {settings.brand_name_line1.charAt(0)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-semibold text-white text-sm">
                {settings.brand_name_line1}
              </span>
              <span className="text-xs text-white/60">
                {settings.brand_name_line2}
              </span>
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
                Primary Name (Line 1)
              </label>
              <Input
                value={settings.brand_name_line1}
                onChange={(e) => setSettings(prev => ({ ...prev, brand_name_line1: e.target.value }))}
                placeholder="e.g., Exemplary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Secondary Name / Tagline (Line 2)
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
                accept="image/*,.svg"
                onChange={handleLogoUpload}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                SVG Logo Code (Optional)
              </label>
              <textarea
                value={settings.brand_logo_svg}
                onChange={(e) => setSettings(prev => ({ ...prev, brand_logo_svg: e.target.value }))}
                placeholder="<svg>...</svg>"
                rows={3}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-white font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste SVG code for crisp rendering at any size
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
              Customize the primary and secondary colors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.brand_primary_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, brand_primary_color: e.target.value }))}
                    className="h-10 w-20 rounded border border-[var(--border-color)]"
                  />
                  <Input
                    value={settings.brand_primary_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, brand_primary_color: e.target.value }))}
                    placeholder="#0d3b66"
                    className="flex-1"
                  />
                </div>
              </div>
              <div 
                className="w-16 h-16 rounded-lg shadow-inner"
                style={{ backgroundColor: settings.brand_primary_color }}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.brand_secondary_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, brand_secondary_color: e.target.value }))}
                    className="h-10 w-20 rounded border border-[var(--border-color)]"
                  />
                  <Input
                    value={settings.brand_secondary_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, brand_secondary_color: e.target.value }))}
                    placeholder="#f4d35e"
                    className="flex-1"
                  />
                </div>
              </div>
              <div 
                className="w-16 h-16 rounded-lg shadow-inner"
                style={{ backgroundColor: settings.brand_secondary_color }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Favicon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--teal)]" />
              Favicon
            </CardTitle>
            <CardDescription>
              Browser tab icon (recommended: 32x32px)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium mb-2">
                Favicon URL
              </label>
              <Input
                value={settings.brand_favicon_url}
                onChange={(e) => setSettings(prev => ({ ...prev, brand_favicon_url: e.target.value }))}
                placeholder="https://your-cdn.com/favicon.ico"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
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
              Save Brand Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
