"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Shield,
  Workflow,
  Settings,
  List,
  FileText,
  Activity,
  AlertTriangle,
  Palette,
  CheckSquare,
  Database,
  Loader2,
} from "lucide-react";

interface AdminStats {
  userCount: number;
  roleCount: number;
  dropdownCount: number;
  listCount: number;
  workflowCount: number;
  activeWorkflowCount: number;
  auditCount: number;
  ghlConnected: boolean;
  portalRoleCount: number;
  ghlMappingCount: number;
}

interface MigrationResult {
  success: boolean;
  data?: {
    totalTenantUsers: number;
    existingContacts: number;
    needingContacts: number;
    created: number;
    failed: number;
  };
  error?: string;
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }

  async function runMigration() {
    setMigrating(true);
    setMigrationResult(null);
    try {
      const response = await fetch("/api/admin/migrate-contacts", {
        method: "POST",
      });
      const result = await response.json();
      setMigrationResult(result);
      // Refresh stats after migration
      fetchStats();
    } catch (error) {
      setMigrationResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setMigrating(false);
    }
  }

  const adminCards = [
    {
      title: "User Maintenance",
      description: "Invite, manage, and suspend portal users",
      href: "/admin/users",
      icon: Users,
      count: `${stats?.userCount || 0} users`,
    },
    {
      title: "Roles & Permissions",
      description: "Configure portal roles and access levels",
      href: "/admin/roles",
      icon: Shield,
      count: `${stats?.portalRoleCount || 0} roles`,
    },
    {
      title: "GHL Role Mapping",
      description: "Map GHL Contact Roles to portal permissions",
      href: "/admin/ghl-mapping",
      icon: Workflow,
      count: `${stats?.ghlMappingCount || 0} mappings`,
    },
    {
      title: "Workflow Settings",
      description: "Configure workflow triggers and templates",
      href: "/admin/workflows",
      icon: Activity,
      count: `${stats?.activeWorkflowCount || 0}/${stats?.workflowCount || 0} active`,
    },
    {
      title: "Integrations",
      description: "Manage GHL and payment processor connections",
      href: "/admin/integrations",
      icon: Settings,
      count: stats?.ghlConnected ? "GHL Connected" : "Not Connected",
    },
    {
      title: "Category Management",
      description: "Manage dropdown categories and values",
      href: "/admin/lists",
      icon: List,
      count: `${stats?.listCount || 0} categories`,
    },
    {
      title: "Dropdown Settings",
      description: "Configure dropdown values and options",
      href: "/admin/dropdowns",
      icon: CheckSquare,
      count: `${stats?.dropdownCount || 0} options`,
    },
    {
      title: "Brand Customization",
      description: "Customize logo, colors, and white-label settings",
      href: "/admin/branding",
      icon: Palette,
      count: "Customize",
    },
    {
      title: "Audit Log",
      description: "View system activity and security events",
      href: "/admin/audit",
      icon: FileText,
      count: `${stats?.auditCount || 0} events`,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">
          Admin Home
        </h1>
        <p className="text-[var(--secondary-text)] mt-1">
          System administration and configuration
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/integrations">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats?.ghlConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Settings className={`h-5 w-5 ${stats?.ghlConnected ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">GHL Connection</p>
                  <p className={`font-medium ${stats?.ghlConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {stats?.ghlConnected ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/integrations?tab=payment">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Payment Processor</p>
                  <p className="font-medium text-yellow-600">Not Configured</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">System Status</p>
                <p className="font-medium text-blue-600">Operational</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Migration Card */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Database className="h-5 w-5" />
            Data Migration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-amber-800">
            Create missing contact records for existing users. This ensures all tenant users appear in the contact list.
          </p>
          <Button
            onClick={runMigration}
            disabled={migrating}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {migrating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Migrate User Contacts
              </>
            )}
          </Button>

          {migrationResult && (
            <div className={`p-4 rounded-lg ${migrationResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {migrationResult.success ? (
                <div className="space-y-1">
                  <p className="font-medium">Migration Complete!</p>
                  <p className="text-sm">
                    Total tenant users: {migrationResult.data?.totalTenantUsers}<br />
                    Existing contacts: {migrationResult.data?.existingContacts}<br />
                    Missing contacts: {migrationResult.data?.needingContacts}<br />
                    <span className="font-semibold">Created: {migrationResult.data?.created}</span><br />
                    Failed: {migrationResult.data?.failed}
                  </p>
                </div>
              ) : (
                <p>Error: {migrationResult.error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card) => (
          <a
            key={card.title}
            href={card.href}
            className="card p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 bg-[var(--page-background)] rounded-lg flex items-center justify-center group-hover:bg-[var(--teal)] group-hover:text-white transition-colors">
                <card.icon className="h-6 w-6 text-[var(--teal)] group-hover:text-white" />
              </div>
              <span className="text-sm text-[var(--secondary-text)]">{card.count}</span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--main-text)] mt-4">
              {card.title}
            </h3>
            <p className="text-sm text-[var(--secondary-text)] mt-1">
              {card.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
