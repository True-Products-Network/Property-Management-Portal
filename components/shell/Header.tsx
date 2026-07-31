"use client";

import { Bell, Search, HelpCircle, User, Wrench, UserPlus, Megaphone, ClipboardCheck } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  userName: string;
  notificationCount?: number;
}

export function Header({ userName, notificationCount = 0 }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-[var(--border-color)] flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
          <input
            type="text"
            placeholder="Search..."
            className="input pl-10 w-full max-w-md"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Action Buttons */}
        <div className="hidden lg:flex items-center gap-2 pr-4 border-r border-[var(--border-color)]">
          <Link
            href="/management/maintenance/new"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[var(--teal)] hover:bg-[var(--teal-hover)] rounded-lg transition-colors"
          >
            <Wrench className="h-4 w-4" />
            <span>New Maintenance Request</span>
          </Link>
          <Link
            href="/management/people/new"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--main-text)] bg-white border border-[var(--border-color)] hover:bg-[var(--page-background)] rounded-lg transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Owner or Tenant</span>
          </Link>
          <Link
            href="/management/communications/announcement"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--main-text)] bg-white border border-[var(--border-color)] hover:bg-[var(--page-background)] rounded-lg transition-colors"
          >
            <Megaphone className="h-4 w-4" />
            <span>Send Announcement</span>
          </Link>
          <Link
            href="/management/approvals/request"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--main-text)] bg-white border border-[var(--border-color)] hover:bg-[var(--page-background)] rounded-lg transition-colors"
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Request Board Approval</span>
          </Link>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-[var(--secondary-text)] hover:text-[var(--main-text)] transition-colors">
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--error)] text-white text-xs rounded-full flex items-center justify-center">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* Help */}
        <Link
          href="/help"
          className="p-2 text-[var(--secondary-text)] hover:text-[var(--main-text)] transition-colors"
        >
          <HelpCircle className="h-5 w-5" />
        </Link>

        {/* User Menu */}
        <div className="flex items-center gap-3 pl-4 border-l border-[var(--border-color)]">
          <span className="text-sm text-[var(--main-text)] hidden sm:block">
            {userName}
          </span>
          <button className="w-8 h-8 rounded-full bg-[var(--primary-navy)] flex items-center justify-center text-white">
            <User className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
