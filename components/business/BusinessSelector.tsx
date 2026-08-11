"use client";

import { useState, useEffect, useRef } from "react";
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
  const hasAutoSelectedRef = useRef(false);

  // Single effect to load businesses and handle auto-selection
  useEffect(() => {
    let isMounted = true;
    
    async function init() {
      try {
        const response = await fetch("/api/businesses");
        const result = await response.json();
        
        if (!isMounted) return;
        
        if (result.success && result.data) {
          setBusinesses(result.data);
          
          // Auto-select if single business and not already selected
          if (result.data.length === 1 && !hasAutoSelectedRef.current && !selectedBusinessId) {
            hasAutoSelectedRef.current = true;
            const businessId = result.data[0].id;
            setSelectedId(businessId);
            
            // Set cookie
            try {
              await fetch("/api/auth/set-business", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessId }),
              });
            } catch (e) {
              console.error("Error setting business:", e);
            }
            
            // Notify parent
            if (onBusinessSelect) {
              onBusinessSelect(businessId);
            }
          }
        }
      } catch (error) {
        console.error("Error loading businesses:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    init();
    
    return () => {
      isMounted = false;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selectedId when prop changes (from parent)
  useEffect(() => {
    if (selectedBusinessId && selectedBusinessId !== selectedId) {
      setSelectedId(selectedBusinessId);
    }
  }, [selectedBusinessId]);

  async function handleBusinessChange(businessId: string) {
    setSelectedId(businessId);
    
    try {
      await fetch("/api/auth/set-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
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
