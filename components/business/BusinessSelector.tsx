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

// Global to track across component instances
let globalInitCount = 0;

export function BusinessSelector({ selectedBusinessId, onBusinessSelect }: BusinessSelectorProps) {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedId, setSelectedId] = useState<string>(selectedBusinessId || "");
  const [isLoading, setIsLoading] = useState(true);
  const hasAutoSelectedRef = useRef(false);
  const componentId = useRef(++globalInitCount);

  console.log(`[BusinessSelector ${componentId.current}] Render - selectedBusinessId: ${selectedBusinessId}, selectedId: ${selectedId}, hasAutoSelected: ${hasAutoSelectedRef.current}`);

  // Single effect to load businesses and handle auto-selection
  useEffect(() => {
    console.log(`[BusinessSelector ${componentId.current}] useEffect running`);
    let isMounted = true;
    
    async function init() {
      console.log(`[BusinessSelector ${componentId.current}] init() started`);
      try {
        const response = await fetch("/api/businesses");
        const result = await response.json();
        
        console.log(`[BusinessSelector ${componentId.current}] API response:`, result.success, result.data?.length);
        
        if (!isMounted) {
          console.log(`[BusinessSelector ${componentId.current}] Component unmounted, aborting`);
          return;
        }
        
        if (result.success && result.data) {
          setBusinesses(result.data);
          
          // Auto-select if single business and not already selected
          console.log(`[BusinessSelector ${componentId.current}] Checking auto-select: businesses=${result.data.length}, hasAutoSelected=${hasAutoSelectedRef.current}, selectedBusinessId=${selectedBusinessId}`);
          
          if (result.data.length === 1 && !hasAutoSelectedRef.current && !selectedBusinessId) {
            hasAutoSelectedRef.current = true;
            const businessId = result.data[0].id;
            console.log(`[BusinessSelector ${componentId.current}] Auto-selecting business: ${businessId}`);
            setSelectedId(businessId);
            
            // Set cookie
            try {
              console.log(`[BusinessSelector ${componentId.current}] Calling set-business API`);
              await fetch("/api/auth/set-business", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessId }),
              });
              console.log(`[BusinessSelector ${componentId.current}] set-business API success`);
            } catch (e) {
              console.error(`[BusinessSelector ${componentId.current}] Error setting business:`, e);
            }
            
            // Notify parent
            if (onBusinessSelect) {
              console.log(`[BusinessSelector ${componentId.current}] Calling onBusinessSelect callback`);
              onBusinessSelect(businessId);
            }
          } else {
            console.log(`[BusinessSelector ${componentId.current}] Skipping auto-select`);
          }
        }
      } catch (error) {
        console.error(`[BusinessSelector ${componentId.current}] Error loading businesses:`, error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    init();
    
    return () => {
      console.log(`[BusinessSelector ${componentId.current}] Cleanup (unmount)`);
      isMounted = false;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update selectedId when prop changes (from parent)
  useEffect(() => {
    console.log(`[BusinessSelector ${componentId.current}] selectedBusinessId prop changed: ${selectedBusinessId}`);
    if (selectedBusinessId && selectedBusinessId !== selectedId) {
      console.log(`[BusinessSelector ${componentId.current}] Updating selectedId from prop`);
      setSelectedId(selectedBusinessId);
    }
  }, [selectedBusinessId, selectedId]);

  async function handleBusinessChange(businessId: string) {
    console.log(`[BusinessSelector ${componentId.current}] handleBusinessChange: ${businessId}`);
    setSelectedId(businessId);
    
    try {
      await fetch("/api/auth/set-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
    } catch (e) {
      console.error(`[BusinessSelector ${componentId.current}] Error setting business:`, e);
    }
    
    if (onBusinessSelect) {
      console.log(`[BusinessSelector ${componentId.current}] Calling onBusinessSelect from handleBusinessChange`);
      onBusinessSelect(businessId);
    } else {
      router.refresh();
    }
  }

  console.log(`[BusinessSelector ${componentId.current}] Rendering UI - isLoading: ${isLoading}, businesses: ${businesses.length}`);

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
