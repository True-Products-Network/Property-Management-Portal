"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getMenuForRole, type MenuItem } from "@/lib/permissions/roles";
import { PortalRole } from "@/schemas/portal/auth";
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
};

interface SidebarProps {
  role: PortalRole;
  userName: string;
  userEmail: string;
}

interface GhlStatus {
  connected: boolean;
  locationName?: string;
}

interface BrandSettings {
  brand_logo_url: string;
  brand_logo_svg: string;
  brand_name_line1: string;
  brand_name_line2: string;
  brand_primary_color: string;
}

// Owner portal menu groups
const OWNER_MENU_GROUPS = [
  {
    id: "dashboard",
    items: [{ label: "Home", href: "/owner", icon: "LayoutDashboard" }],
  },
  {
    id: "my-property",
    items: [
      { label: "My Properties", href: "/owner/properties", icon: "Home" },
      { label: "Maintenance", href: "/owner/maintenance", icon: "Wrench" },
      { label: "Documents", href: "/owner/documents", icon: "FileText" },
    ],
  },
  {
    id: "financial",
    items: [
      { label: "Payments", href: "/owner/payments", icon: "CircleDollarSign" },
    ],
  },
];

// Management menu groups
const MANAGEMENT_MENU_GROUPS = [
  {
    id: "dashboard",
    items: [{ label: "Dashboard", href: "/management/overview", icon: "LayoutDashboard" }],
  },
  {
    id: "entities",
    items: [
      { label: "Associations", href: "/management/associations", icon: "Building2" },
      { label: "Properties", href: "/management/properties", icon: "Home" },
      { label: "Units", href: "/management/units", icon: "DoorOpen" },
      { label: "People", href: "/management/people", icon: "Users" },
      { label: "Vendors", href: "/management/vendors", icon: "Truck" },
    ],
  },
  {
    id: "operations",
    items: [
      { label: "Maintenance", href: "/management/maintenance", icon: "Wrench" },
      { label: "Inspections", href: "/management/inspections", icon: "ClipboardCheck" },
      { label: "Documents", href: "/management/documents", icon: "FileText" },
      { label: "Approvals", href: "/management/approvals", icon: "CheckSquare" },
      { label: "Compliance", href: "/management/compliance", icon: "Scale" },
    ],
  },
  {
    id: "financial",
    items: [
      { label: "Payments", href: "/management/payments", icon: "CircleDollarSign" },
    ],
  },
  {
    id: "communications",
    items: [
      { label: "Communications", href: "/management/communications", icon: "MessageSquare" },
      { label: "Reports", href: "/management/reports", icon: "BarChart3" },
      { label: "Settings", href: "/management/settings", icon: "Settings" },
    ],
  },
];

function MenuItemComponent({
  item,
  depth = 0,
}: {
  item: MenuItem;
  depth?: number;
}) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  const Icon = item.icon ? iconMap[item.icon] : null;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 text-[15px] font-medium text-white/80 hover:bg-[var(--crimson)] hover:text-white transition-colors rounded-lg mx-2",
            isActive && "bg-[var(--orange-gold)] text-white"
          )}
          style={{ width: "calc(100% - 16px)" }}
        >
          <span className="flex items-center gap-3">
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {isExpanded && (
          <div className="ml-4 border-l border-white/10">
            {item.children?.map((child) => (
              <MenuItemComponent key={child.href} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

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
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    brand_logo_url: "",
    brand_logo_svg: "",
    brand_name_line1: "Exemplary",
    brand_name_line2: "Property Management",
    brand_primary_color: "#0d3b66",
  });

  // Determine which menu groups to show based on role
  const isOwner = role === "OWNER" || role === "RESIDENT";
  const menuGroups = isOwner ? OWNER_MENU_GROUPS : MANAGEMENT_MENU_GROUPS;

  useEffect(() => {
    // Fetch GHL status
    fetch("/api/admin/ghl/status")
      .then(res => res.json())
      .then(data => setGhlStatus(data))
      .catch(() => setGhlStatus({ connected: false }));
    
    // Fetch brand settings
    fetch("/api/settings?category=branding")
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          setBrandSettings(prev => ({
            ...prev,
            ...result.data,
          }));
        }
      })
      .catch(() => {
        // Use defaults on error
      });
  }, []);

  return (
    <aside className="sidebar flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          {brandSettings.brand_logo_url ? (
            <img 
              src={brandSettings.brand_logo_url} 
              alt="Logo" 
              className="w-8 h-8 object-contain rounded"
            />
          ) : brandSettings.brand_logo_svg ? (
            <div 
              className="w-8 h-8 flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: brandSettings.brand_logo_svg }}
            />
          ) : (
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: brandSettings.brand_primary_color }}
            >
              {brandSettings.brand_name_line1.charAt(0)}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-white text-sm">{brandSettings.brand_name_line1}</span>
            <span className="text-xs text-white/60">{brandSettings.brand_name_line2}</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuGroups.map((group, index) => (
          <div key={group.id}>
            {index > 0 && (
              <div className="my-3 mx-4 border-t border-white/20" />
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <MenuItemComponent key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}
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
          <div className={`w-2 h-2 rounded-full ${ghlStatus.connected ? 'bg-green-400' : 'bg-gray-400'}`} />
          <span className="truncate">
            {ghlStatus.connected 
              ? (ghlStatus.locationName || 'GHL Connected')
              : 'GHL Not Connected'}
          </span>
        </div>
      </div>
    </aside>
  );
}
