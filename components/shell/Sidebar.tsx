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
} from "lucide-react";
import { useState } from "react";

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
  MessageSquare,
  BarChart3,
  Activity,
  Settings,
  Shield,
  HelpCircle,
};

interface SidebarProps {
  role: PortalRole;
  userName: string;
  userEmail: string;
}

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
            "sidebar-item w-full justify-between",
            isActive && "active"
          )}
          style={{ paddingLeft: `${1 + depth * 0.5}rem` }}
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
      className={cn("sidebar-item", isActive && "active")}
      style={{ paddingLeft: `${1 + depth * 0.5}rem` }}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {item.label}
    </Link>
  );
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const menuItems = getMenuForRole(role);

  return (
    <aside className="sidebar flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--teal)] rounded-lg flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-white text-sm">Exemplary</span>
            <span className="text-xs text-white/60">Property Management</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuItems.map((item) => (
          <MenuItemComponent key={item.href} item={item} />
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
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span>GHL Connected</span>
        </div>
      </div>
    </aside>
  );
}
