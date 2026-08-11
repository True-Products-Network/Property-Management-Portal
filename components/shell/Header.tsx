"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  HelpCircle,
  User,
  Users,
  Wrench,
  UserPlus,
  Megaphone,
  ClipboardCheck,
  LogOut,
  Settings,
  Shield,
  FileText,
  ChevronDown,
  CheckSquare,
  Palette,
} from "lucide-react";
import { AssociationSelector } from "./AssociationSelector";
import { TenantSwitcher } from "@/components/TenantSwitcher";

interface Tenant {
  id: string;
  name: string;
  role: string;
}

interface HeaderProps {
  userName: string;
  userEmail?: string;
  notificationCount?: number;
  isAdmin?: boolean;
  tenants?: Tenant[];
  currentTenantId?: string;
}

export function Header({
  userName,
  userEmail,
  notificationCount = 0,
  isAdmin = false,
  tenants = [],
  currentTenantId,
}: HeaderProps) {
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }

  return (
    <header className="h-16 bg-white border-b border-[var(--border-color)] flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Association Selector - Left Side */}
      <div className="flex items-center">
        <AssociationSelector />
      </div>

      {/* Actions - Right Side */}
      <div className="flex items-center gap-3">
        {/* Tenant Switcher - only show if user has multiple tenants */}
        {tenants.length > 1 && (
          <TenantSwitcher tenants={tenants} currentTenantId={currentTenantId} />
        )}
        {/* Quick Action Buttons */}
        <div className="hidden lg:flex items-center gap-2 pr-4 border-r border-[var(--border-color)]">
          <Link
            href="/management/maintenance/new"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[var(--teal)] hover:bg-[var(--teal-hover)] rounded-lg border-2 border-transparent transition-colors"
          >
            <Wrench className="h-4 w-4" />
            <span>New Maintenance Request</span>
          </Link>
          <Link
            href="/management/people/new"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--main-text)] bg-white border-2 border-[var(--border-color)] hover:border-[var(--primary-navy)] hover:bg-[var(--primary-navy)]/5 rounded-lg transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Owner or Resident</span>
          </Link>
          <Link
            href="/management/communications/announcement"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--main-text)] bg-white border-2 border-[var(--border-color)] hover:border-[var(--primary-navy)] hover:bg-[var(--primary-navy)]/5 rounded-lg transition-colors"
          >
            <Megaphone className="h-4 w-4" />
            <span>Send Announcement</span>
          </Link>
          <Link
            href="/management/approvals/new"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--main-text)] bg-white border-2 border-[var(--border-color)] hover:border-[var(--primary-navy)] hover:bg-[var(--primary-navy)]/5 rounded-lg transition-colors"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Request Board Approval</span>
          </Link>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button 
            className="relative p-2 text-[var(--secondary-text)] hover:text-[var(--main-text)] transition-colors"
            onClick={() => alert("Notifications feature coming soon!")}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--error)] text-white text-xs rounded-full flex items-center justify-center">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>
        </div>

        {/* Help */}
        <Link
          href="/management/help"
          className="p-2 text-[var(--secondary-text)] hover:text-[var(--main-text)] transition-colors"
        >
          <HelpCircle className="h-5 w-5" />
        </Link>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 pl-4 border-l border-[var(--border-color)] hover:bg-[var(--page-background)] rounded-lg p-2 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--primary-navy)] flex items-center justify-center text-white">
              <User className="h-4 w-4" />
            </div>
            <ChevronDown className="h-4 w-4 text-[var(--secondary-text)]" />
          </button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[var(--border-color)] py-2 z-50">
              <div className="px-4 py-2 border-b border-[var(--border-color)]">
                <p className="font-medium text-[var(--main-text)]">{userName}</p>
                {userEmail && (
                  <p className="text-xs text-[var(--secondary-text)]">{userEmail}</p>
                )}
              </div>

              <Link
                href="/management/profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--main-text)] hover:bg-[var(--page-background)] transition-colors"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <User className="h-4 w-4 text-[var(--secondary-text)]" />
                Profile
              </Link>

              <Link
                href="/management/settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--main-text)] hover:bg-[var(--page-background)] transition-colors"
                onClick={() => setIsUserMenuOpen(false)}
              >
                <Settings className="h-4 w-4 text-[var(--secondary-text)]" />
                Settings
              </Link>

              {isAdmin && (
                <>
                  <div className="border-t border-[var(--border-color)] my-2" />
                  <p className="px-4 py-1 text-xs font-medium text-[var(--secondary-text)] uppercase">
                    Admin
                  </p>
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--main-text)] hover:bg-[var(--page-background)] transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Shield className="h-4 w-4 text-[var(--secondary-text)]" />
                    Admin Home
                  </Link>
                  <Link
                    href="/admin/branding"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--main-text)] hover:bg-[var(--page-background)] transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Palette className="h-4 w-4 text-[var(--secondary-text)]" />
                    Brand Customization
                  </Link>
                  <Link
                    href="/admin/dropdowns"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--main-text)] hover:bg-[var(--page-background)] transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 text-[var(--secondary-text)]" />
                    Dropdown Settings
                  </Link>
                  <Link
                    href="/admin/users"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--main-text)] hover:bg-[var(--page-background)] transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Users className="h-4 w-4 text-[var(--secondary-text)]" />
                    User Maintenance
                  </Link>
                  <Link
                    href="/admin/roles"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--main-text)] hover:bg-[var(--page-background)] transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <CheckSquare className="h-4 w-4 text-[var(--secondary-text)]" />
                    Roles & Permissions
                  </Link>
                  <Link
                    href="/admin/audit"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--main-text)] hover:bg-[var(--page-background)] transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4 text-[var(--secondary-text)]" />
                    Audit Log
                  </Link>
                </>
              )}

              <div className="border-t border-[var(--border-color)] my-2" />

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
