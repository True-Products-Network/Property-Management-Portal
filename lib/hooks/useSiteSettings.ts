"use client";

import { useEffect, useState } from "react";

interface SiteSettings {
  portalUrl: string;
  appName: string;
  supportEmail: string;
  companyName: string;
}

const DEFAULT_SETTINGS: SiteSettings = {
  portalUrl: "https://portal.trueproductsnetwork.com",
  appName: "Associos",
  supportEmail: "support@trueproductsnetwork.com",
  companyName: "True Products Network",
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/platform/settings?category=site");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.settings) {
            const s = result.settings;
            setSettings({
              portalUrl: s.site_portal_url || DEFAULT_SETTINGS.portalUrl,
              appName: s.site_app_name || DEFAULT_SETTINGS.appName,
              supportEmail: s.site_support_email || DEFAULT_SETTINGS.supportEmail,
              companyName: s.site_company_name || DEFAULT_SETTINGS.companyName,
            });
          }
        }
      } catch (err) {
        console.error("Error fetching site settings:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  return { settings, loading };
}
