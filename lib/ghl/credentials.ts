// GHL Credentials Storage
// Reads from environment variables for persistence across deployments

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

/**
 * Get stored GHL credentials from environment variables
 */
export async function getGhlCredentials(): Promise<GhlCredentials | null> {
  const connectionType = process.env.GHL_CONNECTION_TYPE as "oauth" | "api_key" | undefined;
  
  if (!connectionType) {
    return null;
  }
  
  if (connectionType === "oauth") {
    const accessToken = process.env.GHL_ACCESS_TOKEN;
    const refreshToken = process.env.GHL_REFRESH_TOKEN;
    
    if (!accessToken || !refreshToken) {
      return null;
    }
    
    return {
      type: "oauth",
      accessToken,
      refreshToken,
      locationId: process.env.GHL_LOCATION_ID,
      locationName: process.env.GHL_LOCATION_NAME,
      companyId: process.env.GHL_COMPANY_ID,
      scopes: process.env.GHL_SCOPES?.split(",") || [],
    };
  }
  
  if (connectionType === "api_key") {
    const apiKey = process.env.GHL_API_KEY;
    
    if (!apiKey) {
      return null;
    }
    
    return {
      type: "api_key",
      apiKey,
      locationId: process.env.GHL_LOCATION_ID,
      locationName: process.env.GHL_LOCATION_NAME,
    };
  }
  
  return null;
}

/**
 * Store GHL credentials
 * Note: In production with env vars, this just validates. 
 * Use the setup script to actually store credentials.
 */
export async function storeGhlCredentials(credentials: GhlCredentials): Promise<void> {
  // Validate that the credentials match the environment
  const existingCreds = await getGhlCredentials();
  
  if (!existingCreds) {
    throw new Error(
      "No GHL credentials configured in environment. " +
      "Please run: npm run setup:ghl"
    );
  }
  
  // Validate OAuth credentials
  if (credentials.type === "oauth") {
    if (
      existingCreds.type !== "oauth" ||
      existingCreds.accessToken !== credentials.accessToken ||
      existingCreds.refreshToken !== credentials.refreshToken
    ) {
      throw new Error(
        "Provided credentials don't match environment configuration. " +
        "Please update credentials using: npm run setup:ghl"
      );
    }
  }
  
  // Validate API Key credentials
  if (credentials.type === "api_key") {
    if (
      existingCreds.type !== "api_key" ||
      existingCreds.apiKey !== credentials.apiKey
    ) {
      throw new Error(
        "Provided API key doesn't match environment configuration. " +
        "Please update credentials using: npm run setup:ghl"
      );
    }
  }
  
  console.log("[GHL] Credentials validated against environment");
}

/**
 * Clear stored GHL credentials
 * Note: This only clears runtime state, not env vars
 */
export async function clearGhlCredentials(): Promise<void> {
  console.log("[GHL] Note: Credentials are stored in environment variables.");
  console.log("[GHL] To fully disconnect, remove GHL_ variables from .env.local");
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
  };
}
