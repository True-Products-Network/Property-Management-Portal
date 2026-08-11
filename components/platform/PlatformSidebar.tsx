// Platform Console Sidebar
// Navigation for True Products Network Platform Admin

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Puzzle,
  Users,
  Link2,
  ClipboardList,
  Activity,
  Settings,
  Shield,
  Flag,
  Globe,
  Bug,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/platform", icon: LayoutDashboard },
  { name: "Business Accounts", href: "/platform/tenants", icon: Building2 },
  { name: "Plans & Features", href: "/platform/plans", icon: CreditCard },
  { name: "Entitlements", href: "/platform/entitlements", icon: Puzzle },
  { name: "Feature Flags", href: "/platform/features", icon: Flag },
  { name: "Platform Users", href: "/platform/users", icon: Users },
  { name: "Integrations", href: "/platform/integrations", icon: Link2 },
  { name: "Audit Log", href: "/platform/audit", icon: ClipboardList },
  { name: "Health & Status", href: "/platform/health", icon: Activity },
  { name: "Site Settings", href: "/platform/site-settings", icon: Globe },
  { name: "Debug Tools", href: "/platform/debug", icon: Bug },
];

export function PlatformSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r min-h-[calc(100vh-64px)]">
      <div className="p-4">
        <div className="flex items-center space-x-2 px-2 py-3 mb-4 bg-blue-50 rounded-lg">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-900">Platform Console</span>
        </div>
        
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-blue-600" : "text-gray-400"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 w-64 p-4 border-t bg-gray-50">
        <p className="text-xs text-gray-500">
          True Products Network Platform
        </p>
        <p className="text-xs text-gray-400">
          v1.0.0
        </p>
      </div>
    </div>
  );
}
