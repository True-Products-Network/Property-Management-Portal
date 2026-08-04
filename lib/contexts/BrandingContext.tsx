"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface BrandingConfig {
  brand_name: string;
  brand_name_line2: string;
  brand_logo_url: string | null;
  brand_logo_svg: string | null;
  brand_favicon_url: string | null;
  brand_primary_color: string;
  brand_secondary_color: string;
  brand_accent_color: string;
}

const DEFAULT_BRANDING: BrandingConfig = {
  brand_name: "Associos Property Management",
  brand_name_line2: "",
  brand_logo_url: null,
  brand_logo_svg: null,
  brand_favicon_url: null,
  brand_primary_color: "#0d3b66",
  brand_secondary_color: "#f4d35e",
  brand_accent_color: "#f4d35e",
};

interface BrandingContextType {
  branding: BrandingConfig;
  isLoading: boolean;
  error: string | null;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  isLoading: true,
  error: null,
  refreshBranding: async () => {},
});

export function BrandingProvider({ 
  children,
  tenantId 
}: { 
  children: ReactNode;
  tenantId?: string;
}) {
  const [branding, setBranding] = useState<BrandingConfig>(DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = async () => {
    if (!tenantId) {
      setBranding(DEFAULT_BRANDING);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/branding?tenantId=${tenantId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch branding");
      }

      const data = await response.json();
      
      if (data.success && data.branding) {
        setBranding({
          ...DEFAULT_BRANDING,
          ...data.branding,
        });
      } else {
        setBranding(DEFAULT_BRANDING);
      }
    } catch (err) {
      console.error("Error fetching branding:", err);
      setError("Failed to load branding");
      setBranding(DEFAULT_BRANDING);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, [tenantId]);

  // Apply CSS variables for branding
  useEffect(() => {
    if (branding) {
      document.documentElement.style.setProperty('--brand-primary', branding.brand_primary_color);
      document.documentElement.style.setProperty('--brand-secondary', branding.brand_secondary_color);
      document.documentElement.style.setProperty('--brand-accent', branding.brand_accent_color);
    }
  }, [branding]);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        isLoading,
        error,
        refreshBranding: fetchBranding,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
}
