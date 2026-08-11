"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const hasLoaded = useRef(false);
  const hasAutoSelected = useRef(false);

  // Update selectedId when prop changes
  useEffect(() => {
    if (selectedBusinessId && selectedBusinessId !== selectedId) {
      setSelectedId(selectedBusinessId);
    }
  }, [selectedBusinessId]);

  // Load businesses only once on mount
  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    
    loadBusinesses();
  }, []);

  const setActiveBusiness = useCallback(async (businessId: string) => {
    try {
      await fetch("/api/auth/set-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
    } catch (error) {
      console.error("Error setting active business:", error);
    }
  }, []);

  const loadBusinesses = useCallback(async () => {
    try {
      const response = await fetch("/api/businesses");
      const result = await response.json();
      
      if (result.success && result.data) {
        setBusinesses(result.data);
        
        // If only one business and none selected, auto-select it (only once)
        if (result.data.length === 1 && !hasAutoSelected.current && !selectedBusinessId) {
          hasAutoSelected.current = true;
          const businessId = result.data[0].id;
          setSelectedId(businessId);
          await setActiveBusiness(businessId);
          if (onBusinessSelect) {
            onBusinessSelect(businessId);
          }
        }
      }
    } catch (error) {
      console.error("Error loading businesses:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onBusinessSelect, selectedBusinessId, setActiveBusiness]);

  const handleBusinessChange = useCallback(async (businessId: string) => {
    setSelectedId(businessId);
    await setActiveBusiness(businessId);
    
    if (onBusinessSelect) {
      onBusinessSelect(businessId);
    } else {
      router.refresh();
    }
  }, [onBusinessSelect, router, setActiveBusiness]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  // If no businesses, show nothing or a message
  if (businesses.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4" />
        No businesses
      </div>
    );
  }

  // If only one business, show it as read-only
  if (businesses.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700">
        <Building2 className="h-4 w-4 text-[var(--teal)]" />
        {businesses[0].name}
      </div>
    );
  }

  // Multiple businesses - show selector
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
