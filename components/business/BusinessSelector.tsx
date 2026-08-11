"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";

interface Business {
  id: string;
  name: string;
  slug: string;
}

interface BusinessSelectorProps {
  selectedBusinessId?: string;
  onBusinessSelect?: (businessId: string) => void;
}

export function BusinessSelector({ selectedBusinessId, onBusinessSelect }: BusinessSelectorProps) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedId, setSelectedId] = useState<string>(selectedBusinessId || "");
  const [isLoading, setIsLoading] = useState(true);

  // Load businesses on mount
  useEffect(() => {
    async function loadBusinesses() {
      try {
        setIsLoading(true);
        // Add cache-busting timestamp
        const response = await fetch(`/api/businesses?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        const result = await response.json();
        console.log("[BusinessSelector] Loaded businesses:", result.data?.length, result.data);
        
        if (result.success && result.data && result.data.length > 0) {
          setBusinesses(result.data);
          // If only one business and none selected, auto-select it
          if (result.data.length === 1 && !selectedBusinessId) {
            const businessId = result.data[0].id;
            setSelectedId(businessId);
            // Don't call onBusinessSelect here - let parent handle it
            // This prevents the infinite loop
          }
        } else {
          // No businesses found - try loading associations as businesses
          console.log("[BusinessSelector] No businesses found, loading associations...");
          const assocResponse = await fetch(`/api/associations?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            }
          });
          const assocResult = await assocResponse.json();
          console.log("[BusinessSelector] Loaded associations:", assocResult.data?.data?.length, assocResult.data?.data);
          
          if (assocResult.success && assocResult.data?.data) {
            // Map associations to business format
            const assocAsBusinesses = assocResult.data.data.map((assoc: any) => ({
              id: assoc.id,
              name: assoc.name,
              slug: assoc.tenantId || '',
            }));
            setBusinesses(assocAsBusinesses);
          }
        }
      } catch (error) {
        console.error("Error loading businesses:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadBusinesses();
  }, [selectedBusinessId]);

  // Update selectedId when prop changes
  useEffect(() => {
    if (selectedBusinessId && selectedBusinessId !== selectedId) {
      setSelectedId(selectedBusinessId);
    }
  }, [selectedBusinessId, selectedId]);

  async function handleBusinessChange(businessId: string) {
    setSelectedId(businessId);
    
    try {
      const response = await fetch("/api/auth/set-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      if (response.ok) {
        // Reload page to get fresh session
        window.location.href = window.location.href;
        return;
      }
    } catch (e) {
      console.error("Error setting business:", e);
    }
    
    if (onBusinessSelect) {
      onBusinessSelect(businessId);
    } else {
      router.refresh();
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4" />
        No businesses
      </div>
    );
  }

  // For single business, just show the name without any auto-select behavior
  if (businesses.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700">
        <Building2 className="h-4 w-4 text-[var(--teal)]" />
        {businesses[0].name}
      </div>
    );
  }

  return (
    <Select value={selectedId} onValueChange={handleBusinessChange}>
      <SelectTrigger className="w-[200px] border-gray-200">
        <Building2 className="h-4 w-4 mr-2 text-[var(--teal)]" />
        <SelectValue placeholder="Select business..." />
      </SelectTrigger>
      <SelectContent>
        {businesses.map((business) => (
          <SelectItem key={business.id} value={business.id}>
            {business.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
