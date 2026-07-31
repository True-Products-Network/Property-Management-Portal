// GHL Credentials Storage with AES-256 encryption and automatic token refresh

import { createClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "./crypto";

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
 * Get stored GHL credentials from database
 * Automatically refreshes access token if expired
 */
export async function getGhlCredentials(): Promise<GhlCredentials | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("ghl_credentials")
      .select("*")
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Check if OAuth token needs refresh
    if (data.type === "oauth" && data.token_expiry) {
      const expiryDate = new Date(data.token_expiry);
      const now = new Date();
      
      // Refresh if token expires within 5 minutes
      if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
        console.log("[GHL] Access token expired, refreshing...");
        const refreshed = await refreshAccessToken(data);
        if (refreshed) {
          return refreshed;
        }
      }
    }
    
    if (data.type === "oauth") {
      return {
        type: "oauth",
        accessToken: decrypt(data.access_token),
        refreshToken: decrypt(data.refresh_token),
        tokenExpiry: data.token_expiry,
        locationId: data.location_id,
        locationName: data.location_name,
        companyId: data.company_id,
        scopes: data.scopes?.split(",") || [],
        connectedAt: data.created_at,
      };
    }
    
    if (data.type === "api_key") {
      return {
        type: "api_key",
        apiKey: decrypt(data.api_key),
        locationId: data.location_id,
        locationName: data.location_name,
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error getting GHL credentials:", error);
    return null;
  }
}

/**
 * Refresh OAuth access token using refresh token
 */
async function refreshAccessToken(data: any): Promise<GhlCredentials | null> {
  try {
    const refreshToken = decrypt(data.refresh_token);
    
    // Call GHL token refresh endpoint
    const response = await fetch("https://services.leadconnectorhq.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
      }),
    });
    
    if (!response.ok) {
      console.error("Token refresh failed:", await response.text());
      return null;
    }
    
    const tokenData = await response.json();
    
    // Calculate new expiry (typically 24 hours)
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokenData.expires_in);
    
    // Update database with new tokens
    const supabase = await createClient();
    await supabase
      .from("ghl_credentials")
      .update({
        access_token: encrypt(tokenData.access_token),
        refresh_token: encrypt(tokenData.refresh_token),
        token_expiry: expiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    
    console.log("[GHL] Token refreshed successfully");
    
    return {
      type: "oauth",
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      tokenExpiry: expiryDate.toISOString(),
      locationId: data.location_id,
      locationName: data.location_name,
      companyId: data.company_id,
      scopes: data.scopes?.split(",") || [],
      connectedAt: data.created_at,
    };
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

/**
 * Store GHL credentials in database (encrypted with AES-256)
 */
export async function storeGhlCredentials(credentials: GhlCredentials): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Delete any existing credentials first (only one location per portal)
    await supabase.from("ghl_credentials").delete().neq("id", 0);
    
    const data: any = {
      type: credentials.type,
      location_id: credentials.locationId,
      location_name: credentials.locationName,
    };
    
    if (credentials.type === "oauth") {
      data.access_token = encrypt(credentials.accessToken!);
      data.refresh_token = encrypt(credentials.refreshToken!);
      data.token_expiry = credentials.tokenExpiry;
      data.company_id = credentials.companyId;
      data.scopes = credentials.scopes?.join(",") || "";
    } else {
      data.api_key = encrypt(credentials.apiKey!);
    }
    
    const { error } = await supabase.from("ghl_credentials").insert(data);
    
    if (error) {
      throw new Error(`Failed to store credentials: ${error.message}`);
    }
    
    console.log("[GHL] Credentials stored in database (encrypted)");
  } catch (error) {
    console.error("Error storing GHL credentials:", error);
    throw error;
  }
}

/**
 * Clear stored GHL credentials
 */
export async function clearGhlCredentials(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("ghl_credentials").delete().neq("id", 0);
    console.log("[GHL] Credentials cleared from database");
  } catch (error) {
    console.error("Error clearing GHL credentials:", error);
    throw error;
  }
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
      webhooksConfigured: false,
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
