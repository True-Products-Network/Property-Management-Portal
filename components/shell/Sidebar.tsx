"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useBranding } from "@/lib/contexts/BrandingContext";
import {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  Wrench,
  Truck,
  ClipboardCheck,
  FileText,
  Scale,
  CheckSquare,
  CreditCard,
  MessageSquare,
  BarChart3,
  Activity,
  Settings,
  Shield,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  DoorOpen,
  CircleDollarSign,
  Loader2,
  Plug,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Building2,
  Home,
  Users,
  Wrench,
  Truck,
  ClipboardCheck,
  FileText,
  Scale,
  CheckSquare,
  CreditCard,
  CircleDollarSign,
  MessageSquare,
  BarChart3,
  Activity,
  Settings,
  Shield,
  HelpCircle,
  DoorOpen,
  Plug,
  ClipboardList,
};

interface MenuItem {
  label: string;
  href: string;
  icon: string;
  permissions?: {
    read: boolean;
    write: boolean;
    delete: boolean;
    approve: boolean;
  };
}

interface MenuGroup {
  id: string;
  label?: string;
  items: MenuItem[];
}

interface SidebarProps {
  role: string;
  userName: string;
  userEmail: string;
}

interface GhlStatus {
  connected: boolean;
  locationName?: string;
}

function MenuItemComponent({
  item,
  depth = 0,
}: {
  item: MenuItem;
  depth?: number;
}) {
  const pathname = usePathname();
  const Icon = item.icon ? iconMap[item.icon] : null;
  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-[15px] font-medium text-white/80 hover:bg-[var(--crimson)] hover:text-white transition-colors rounded-lg mx-2",
        isActive && "bg-[var(--orange-gold)] text-white"
      )}
      style={{ width: "calc(100% - 16px)" }}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {item.label}
    </Link>
  );
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const [ghlStatus, setGhlStatus] = useState<GhlStatus>({ connected: false });
  const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { branding, isLoading: brandingLoading } = useBranding();

  useEffect(() => {
    // Fetch user permissions and build menu
    fetch("/api/user/permissions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.menu) {
          setMenuGroups(data.menu);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching permissions:", err);
        setLoading(false);
      });

    // Fetch GHL status
    fetch("/api/admin/ghl/status")
      .then((res) => res.json())
      .then((data) => setGhlStatus(data))
      .catch(() => setGhlStatus({ connected: false }));
  }, []);

  return (
    <aside className="sidebar flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          {brandingLoading ? (
            <div className="w-8 h-8 rounded-lg bg-gray-400 animate-pulse" />
          ) : branding.brand_logo_url ? (
            <img
              src={branding.brand_logo_url}
              alt="Logo"
              className="w-8 h-8 object-contain rounded"
            />
          ) : branding.brand_logo_svg ? (
            <div
              className="w-8 h-8 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: branding.brand_logo_svg }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: branding.brand_primary_color }}
            >
              {branding.brand_name.charAt(0)}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-white text-sm">{branding.brand_name}</span>
            {branding.brand_name_line2 && (
              <span className="text-xs text-white/60">{branding.brand_name_line2}</span>
            )}
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white/60" />
          </div>
        ) : menuGroups.length === 0 ? (
          <div className="px-4 py-8 text-center text-white/60 text-sm">
            No menu items available
          </div>
        ) : (
          menuGroups.map((group, index) => (
            <div key={group.id}>
              {index > 0 && group.items.length > 0 && (
                <div className="my-3 mx-4 border-t border-white/20" />
              )}
              {group.label && group.items.length > 0 && (
                <div className="px-4 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <MenuItemComponent key={item.href} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--teal)] flex items-center justify-center text-white font-medium text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-white/60 truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="px-4 py-2 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <div className={`w-2 h-2 rounded-full ${ghlStatus.connected ? "bg-green-400" : "bg-gray-400"}`} />
          <span className="truncate">
            {ghlStatus.connected
              ? ghlStatus.locationName || "GHL Connected"
              : "GHL Not Connected"}
          </span>
        </div>
      </div>
    </aside>
  );
}
