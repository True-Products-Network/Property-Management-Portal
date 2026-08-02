// Feature Flags System
// Centralized feature toggle management for the Property Management Portal

export type FeatureFlagEnvironment = 'development' | 'staging' | 'production' | 'all';
export type FeatureFlagUserRole = 'admin' | 'manager' | 'owner' | 'board' | 'vendor' | 'all';

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  environment: FeatureFlagEnvironment;
  allowedRoles: FeatureFlagUserRole[];
  userPercentage: number; // 0-100 for gradual rollout
  associations?: string[]; // Specific associations only
  properties?: string[]; // Specific properties only
  users?: string[]; // Specific users only
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string; // Optional expiration
}

export interface FeatureFlagOverride {
  id: string;
  featureFlagId: string;
  userId?: string;
  associationId?: string;
  propertyId?: string;
  enabled: boolean;
  reason?: string;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

// Feature flag keys - centralized to avoid typos
export const FEATURE_FLAGS = {
  // Owner Portal Features
  OWNER_HOUSEHOLD_MANAGEMENT: 'owner.household.management',
  OWNER_MAINTENANCE_CONFIRMATION: 'owner.maintenance.confirmation',
  OWNER_INSPECTIONS_VIEW: 'owner.inspections.view',
  OWNER_DOCUMENTS_ACKNOWLEDGMENT: 'owner.documents.acknowledgment',
  OWNER_NOTICES_RESPONSE: 'owner.notices.response',
  OWNER_PAYMENTS_ONLINE: 'owner.payments.online',
  OWNER_MESSAGES_CHAT: 'owner.messages.chat',
  OWNER_PREFERENCES_CONSENT: 'owner.preferences.consent',
  
  // Management Portal Features
  MANAGEMENT_BULK_ACTIONS: 'management.bulk.actions',
  MANAGEMENT_ADVANCED_REPORTING: 'management.advanced.reporting',
  MANAGEMENT_GHL_SYNC: 'management.ghl.sync',
  MANAGEMENT_WORKFLOW_AUTOMATION: 'management.workflow.automation',
  MANAGEMENT_VENDOR_CREDENTIALS: 'management.vendor.credentials',
  MANAGEMENT_COMPLIANCE_HEARINGS: 'management.compliance.hearings',
  
  // Board Portal Features
  BOARD_APPROVALS_VOTING: 'board.approvals.voting',
  BOARD_MEETINGS_VIRTUAL: 'board.meetings.virtual',
  BOARD_FINANCIAL_DASHBOARD: 'board.financial.dashboard',
  
  // Vendor Portal Features
  VENDOR_QUOTE_SUBMISSION: 'vendor.quote.submission',
  VENDOR_INVOICE_UPLOAD: 'vendor.invoice.upload',
  
  // System Features
  SYSTEM_FILE_UPLOAD: 'system.file.upload',
  SYSTEM_PAYMENT_PROCESSING: 'system.payment.processing',
  SYSTEM_NOTIFICATIONS_SMS: 'system.notifications.sms',
  SYSTEM_NOTIFICATIONS_EMAIL: 'system.notifications.email',
  SYSTEM_AUDIT_LOGGING: 'system.audit.logging',
  SYSTEM_MAINTENANCE_MODE: 'system.maintenance.mode',
} as const;

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

// Default feature flags for new installations
export const DEFAULT_FEATURE_FLAGS: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    key: FEATURE_FLAGS.OWNER_HOUSEHOLD_MANAGEMENT,
    name: 'Household Management',
    description: 'Allow owners to manage household occupancy information',
    enabled: true,
    environment: 'all',
    allowedRoles: ['owner', 'admin', 'manager'],
    userPercentage: 100,
  },
  {
    key: FEATURE_FLAGS.OWNER_MAINTENANCE_CONFIRMATION,
    name: 'Maintenance Completion Confirmation',
    description: 'Allow owners to confirm maintenance work completion',
    enabled: true,
    environment: 'all',
    allowedRoles: ['owner', 'admin', 'manager'],
    userPercentage: 100,
  },
  {
    key: FEATURE_FLAGS.OWNER_INSPECTIONS_VIEW,
    name: 'Inspections View',
    description: 'Allow owners to view inspection schedules and results',
    enabled: true,
    environment: 'all',
    allowedRoles: ['owner', 'admin', 'manager'],
    userPercentage: 100,
  },
  {
    key: FEATURE_FLAGS.OWNER_DOCUMENTS_ACKNOWLEDGMENT,
    name: 'Documents Acknowledgment',
    description: 'Allow owners to view and acknowledge documents',
    enabled: true,
    environment: 'all',
    allowedRoles: ['owner', 'admin', 'manager'],
    userPercentage: 100,
  },
  {
    key: FEATURE_FLAGS.OWNER_NOTICES_RESPONSE,
    name: 'Notices Response',
    description: 'Allow owners to respond to compliance notices',
    enabled: true,
    environment: 'all',
    allowedRoles: ['owner', 'admin', 'manager'],
    userPercentage: 100,
  },
  {
    key: FEATURE_FLAGS.OWNER_PAYMENTS_ONLINE,
    name: 'Online Payments',
    description: 'Allow owners to make payments online',
    enabled: false,
    environment: 'all',
    allowedRoles: ['owner', 'admin', 'manager'],
    userPercentage: 0,
  },
  {
    key: FEATURE_FLAGS.OWNER_MESSAGES_CHAT,
    name: 'Messages Chat',
    description: 'Allow owners to send and receive messages',
    enabled: true,
    environment: 'all',
    allowedRoles: ['owner', 'admin', 'manager'],
    userPercentage: 100,
  },
  {
    key: FEATURE_FLAGS.OWNER_PREFERENCES_CONSENT,
    name: 'Contact Preferences & Consent',
    description: 'Allow owners to manage contact preferences and consent',
    enabled: true,
    environment: 'all',
    allowedRoles: ['owner', 'admin', 'manager'],
    userPercentage: 100,
  },
  {
    key: FEATURE_FLAGS.MANAGEMENT_GHL_SYNC,
    name: 'GHL Integration',
    description: 'Enable GoHighLevel integration and sync',
    enabled: false,
    environment: 'all',
    allowedRoles: ['admin', 'manager'],
    userPercentage: 0,
  },
  {
    key: FEATURE_FLAGS.SYSTEM_FILE_UPLOAD,
    name: 'File Upload',
    description: 'Enable file upload functionality',
    enabled: false,
    environment: 'all',
    allowedRoles: ['all'],
    userPercentage: 0,
  },
  {
    key: FEATURE_FLAGS.SYSTEM_PAYMENT_PROCESSING,
    name: 'Payment Processing',
    description: 'Enable payment processing through Stripe/PayPal',
    enabled: false,
    environment: 'all',
    allowedRoles: ['all'],
    userPercentage: 0,
  },
  {
    key: FEATURE_FLAGS.SYSTEM_MAINTENANCE_MODE,
    name: 'Maintenance Mode',
    description: 'Put the portal in maintenance mode',
    enabled: false,
    environment: 'all',
    allowedRoles: ['admin'],
    userPercentage: 0,
  },
];

// Helper function to check if a feature is enabled for a user
export function isFeatureEnabled(
  flag: FeatureFlag,
  userId: string,
  userRole: FeatureFlagUserRole,
  environment: string,
  associationId?: string,
  propertyId?: string
): boolean {
  // Check environment
  if (flag.environment !== 'all' && flag.environment !== environment) {
    return false;
  }

  // Check role
  if (!flag.allowedRoles.includes('all') && !flag.allowedRoles.includes(userRole)) {
    return false;
  }

  // Check if globally enabled
  if (!flag.enabled) {
    return false;
  }

  // Check user percentage (gradual rollout)
  if (flag.userPercentage < 100) {
    const userHash = hashUserId(userId);
    if (userHash > flag.userPercentage) {
      return false;
    }
  }

  // Check specific associations
  if (flag.associations && flag.associations.length > 0) {
    if (!associationId || !flag.associations.includes(associationId)) {
      return false;
    }
  }

  // Check specific properties
  if (flag.properties && flag.properties.length > 0) {
    if (!propertyId || !flag.properties.includes(propertyId)) {
      return false;
    }
  }

  // Check specific users
  if (flag.users && flag.users.length > 0) {
    if (!flag.users.includes(userId)) {
      return false;
    }
  }

  return true;
}

// Simple hash function for consistent user percentage calculation
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 100;
}
