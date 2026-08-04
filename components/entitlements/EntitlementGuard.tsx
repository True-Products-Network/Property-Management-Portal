// Entitlement Guard Component
// Wraps forms/features to check if user has access

import { ReactNode } from "react";
import { useEntitlement, FeatureKey } from "@/lib/entitlements/use-entitlements";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface EntitlementGuardProps {
  featureKey: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function EntitlementGuard({
  featureKey,
  children,
  fallback,
  showUpgradePrompt = true,
}: EntitlementGuardProps) {
  const { enabled, isLoading, error, hasReachedLimit, limit, currentUsage } = useEntitlement(featureKey);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <p>Error checking access: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!enabled) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showUpgradePrompt) {
      return null;
    }

    return <UpgradePrompt featureKey={featureKey} />;
  }

  if (hasReachedLimit) {
    return (
      <LimitReachedPrompt
        featureKey={featureKey}
        limit={limit!}
        currentUsage={currentUsage!}
      />
    );
  }

  return (
    <div className="relative">
      {limit !== undefined && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              Usage: {currentUsage} / {limit}
            </span>
            <span className="text-xs text-blue-600">
              {limit - (currentUsage || 0)} remaining
            </span>
          </div>
          <div className="mt-2 h-2 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${((currentUsage || 0) / limit) * 100}%` }}
            />
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

function UpgradePrompt({ featureKey }: { featureKey: FeatureKey }) {
  const featureNames: Record<FeatureKey, string> = {
    maintenance_requests: "Maintenance Requests",
    inspections: "Inspections",
    payments: "Payments",
    compliance: "Compliance Tracking",
    approvals: "Approval Workflows",
    communications: "Communications",
    documents: "Document Management",
    vendors: "Vendor Management",
    workflows: "Custom Workflows",
    advanced_reporting: "Advanced Reporting",
    api_access: "API Access",
    bulk_operations: "Bulk Operations",
  };

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <CardTitle>Feature Not Available</CardTitle>
            <CardDescription>
              {featureNames[featureKey]} is not included in your current plan
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Upgrade your plan to access {featureNames[featureKey].toLowerCase()} and unlock more features for your property management needs.
        </p>
        <div className="flex gap-3">
          <Link href="/admin/integrations">
            <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
              View Plans
            </Button>
          </Link>
          <Link href="/management/help">
            <Button variant="outline">
              Contact Support
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LimitReachedPrompt({
  featureKey,
  limit,
  currentUsage,
}: {
  featureKey: FeatureKey;
  limit: number;
  currentUsage: number;
}) {
  const featureNames: Record<FeatureKey, string> = {
    maintenance_requests: "Maintenance Requests",
    inspections: "Inspections",
    payments: "Payments",
    compliance: "Compliance Tracking",
    approvals: "Approval Workflows",
    communications: "Communications",
    documents: "Document Management",
    vendors: "Vendor Management",
    workflows: "Custom Workflows",
    advanced_reporting: "Advanced Reporting",
    api_access: "API Access",
    bulk_operations: "Bulk Operations",
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <CardTitle>Limit Reached</CardTitle>
            <CardDescription>
              You&apos;ve reached your monthly limit for {featureNames[featureKey]}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-red-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-700">Usage</span>
            <span className="text-sm text-red-600">
              {currentUsage} / {limit}
            </span>
          </div>
          <div className="h-2 bg-red-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-500 w-full" />
          </div>
        </div>
        <p className="text-sm text-gray-600">
          You&apos;ve used all {limit} {featureNames[featureKey].toLowerCase()} included in your plan. Upgrade to continue using this feature.
        </p>
        <div className="flex gap-3">
          <Link href="/admin/integrations">
            <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
              Upgrade Plan
            </Button>
          </Link>
          <Link href="/management/help">
            <Button variant="outline">
              Contact Support
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Higher-order component for wrapping entire pages
export function withEntitlement<P extends object>(
  Component: React.ComponentType<P>,
  featureKey: FeatureKey
) {
  return function WrappedComponent(props: P) {
    return (
      <EntitlementGuard featureKey={featureKey}>
        <Component {...props} />
      </EntitlementGuard>
    );
  };
}
