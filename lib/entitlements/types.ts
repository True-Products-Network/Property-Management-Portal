// Entitlement types shared between client and server

export type FeatureKey = 
  | "maintenance_requests"
  | "inspections"
  | "payments"
  | "compliance"
  | "approvals"
  | "communications"
  | "documents"
  | "vendors"
  | "vendor_portals"
  | "workflows"
  | "advanced_reporting"
  | "api_access"
  | "bulk_operations";

export interface EntitlementCheck {
  enabled: boolean;
  isLoading: boolean;
  error: string | null;
  limit?: number;
  currentUsage?: number;
  hasReachedLimit: boolean;
}
