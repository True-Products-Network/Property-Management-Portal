// GHL Credentials Storage
// In production, these would be stored encrypted in the database
// For now, we use environment variables with in-memory fallback

export interface GhlCredentials {
  type: "oauth" | "api_key";
  // OAuth
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  // API Key
  apiKey?: string;
  // Common
  locationId?: string;
  locationName?: string;
  companyId?: string;
  scopes?: string[];
  connectedAt?: string;
}

// In-memory storage for runtime (resets on server restart)
let inMemoryCredentials: GhlCredentials | null = null;

/**
 * Get stored GHL credentials
 */
export async function getGhlCredentials(): Promise<GhlCredentials | null> {
  // First check environment variables (for production)
  const envType = process.env.GHL_CONNECTION_TYPE as "oauth" | "api_key" | undefined;
  
  if (envType === "oauth") {
    return {
      type: "oauth",
      accessToken: process.env.GHL_ACCESS_TOKEN,
      refreshToken: process.env.GHL_REFRESH_TOKEN,
      locationId: process.env.GHL_LOCATION_ID,
      locationName: process.env.GHL_LOCATION_NAME,
      companyId: process.env.GHL_COMPANY_ID,
      scopes: process.env.GHL_SCOPES?.split(",") || [],
    };
  }
  
  if (envType === "api_key") {
    return {
      type: "api_key",
      apiKey: process.env.GHL_API_KEY,
      locationId: process.env.GHL_LOCATION_ID,
      locationName: process.env.GHL_LOCATION_NAME,
    };
  }
  
  // Fall back to in-memory storage
  return inMemoryCredentials;
}

/**
 * Store GHL credentials
 */
export async function storeGhlCredentials(credentials: GhlCredentials): Promise<void> {
  // Store in memory for now
  inMemoryCredentials = {
    ...credentials,
    connectedAt: new Date().toISOString(),
  };
  
  // In production, this would:
  // 1. Encrypt the credentials
  // 2. Store in Supabase database
  // 3. Set up token refresh scheduler for OAuth
  
  console.log("[GHL] Credentials stored (type:", credentials.type, ")");
}

/**
 * Clear stored GHL credentials
 */
export async function clearGhlCredentials(): Promise<void> {
  inMemoryCredentials = null;
  console.log("[GHL] Credentials cleared");
}

/**
 * Check if GHL is connected
 */
export async function isGhlConnected(): Promise<boolean> {
  const creds = await getGhlCredentials();
  if (!creds) return false;
  
  if (creds.type === "oauth") {
    return !!(creds.accessToken && creds.refreshToken);
  }
  
  if (creds.type === "api_key") {
    return !!creds.apiKey;
  }
  
  return false;
}

/**
 * Get connection status for display
 */
export async function getGhlConnectionStatus(): Promise<{
  connected: boolean;
  connectionType: "oauth" | "api_key" | null;
  apiKeyConfigured: boolean;
  accessTokenConfigured: boolean;
  refreshTokenConfigured: boolean;
  webhooksConfigured: boolean;
  locationId?: string;
  locationName?: string;
  companyId?: string;
  scopes?: string[];
  lastSync?: string;
  error?: string;
}> {
  const creds = await getGhlCredentials();
  
  if (!creds) {
    return {
      connected: false,
      connectionType: null,
      apiKeyConfigured: false,
      accessTokenConfigured: false,
      refreshTokenConfigured: false,
      webhooksConfigured: !!process.env.GHL_WEBHOOK_SECRET,
    };
  }
  
  const isConnected = creds.type === "oauth" 
    ? !!(creds.accessToken && creds.refreshToken)
    : !!creds.apiKey;
  
  return {
    connected: isConnected,
    connectionType: creds.type,
    apiKeyConfigured: creds.type === "api_key" && !!creds.apiKey,
    accessTokenConfigured: creds.type === "oauth" && !!creds.accessToken,
    refreshTokenConfigured: creds.type === "oauth" && !!creds.refreshToken,
    webhooksConfigured: !!process.env.GHL_WEBHOOK_SECRET,
    locationId: creds.locationId,
    locationName: creds.locationName,
    companyId: creds.companyId,
    scopes: creds.scopes,
    lastSync: creds.connectedAt,
  };
}
