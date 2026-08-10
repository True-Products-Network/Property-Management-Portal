"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Tenant {
  id: string;
  name: string;
  role: string;
}

interface TenantSwitcherProps {
  tenants: Tenant[];
  currentTenantId?: string;
}

export function TenantSwitcher({ tenants, currentTenantId }: TenantSwitcherProps) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);
  
  // Don't show if user only has one tenant
  if (tenants.length <= 1) {
    return null;
  }
  
  const currentTenant = tenants.find(t => t.id === currentTenantId) || tenants[0];
  
  async function switchTenant(tenantId: string) {
    if (tenantId === currentTenantId) return;
    
    setIsSwitching(true);
    try {
      const response = await fetch("/api/auth/switch-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh the page to load data for the new tenant
        router.refresh();
        // Optionally redirect to overview
        window.location.href = "/management/overview";
      } else {
        console.error("Failed to switch tenant:", result.error);
        alert("Failed to switch tenant: " + result.error);
      }
    } catch (error) {
      console.error("Error switching tenant:", error);
      alert("Error switching tenant");
    } finally {
      setIsSwitching(false);
    }
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-3 py-2 h-auto"
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4 text-[var(--teal)]" />
          )}
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-[var(--main-text)]">
              {currentTenant.name}
            </span>
            <span className="text-xs text-[var(--secondary-text)] capitalize">
              {currentTenant.role}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--secondary-text)]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => switchTenant(tenant.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{tenant.name}</span>
              <span className="text-xs text-[var(--secondary-text)] capitalize">
                {tenant.role}
              </span>
            </div>
            {tenant.id === currentTenantId && (
              <Check className="h-4 w-4 text-[var(--teal)]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
