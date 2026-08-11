// GHL Association-Level Credentials with AES-256 encryption and automatic token refresh

import { createClient } from "@/lib/supabase/server";
import { encrypt, decrypt } from "./crypto";

export interface GhlAssociationCredentials {
  type: "oauth" | "api_key";
  associationId: string;
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
 * Get stored GHL credentials for a specific association
 * Automatically refreshes access token if expired
 */
export async function getAssociationGhlCredentials(
  associationId: string
): Promise<GhlAssociationCredentials | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("association_ghl_credentials")
      .select("*")
      .eq("association_id", associationId)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if OAuth token needs refresh
    if (data.type === "oauth" && data.token_expiry && data.refresh_token) {
      const expiryDate = new Date(data.token_expiry);
      const now = new Date();

      // Refresh if token expires within 5 minutes
      if (expiryDate.getTime() - now.getTime() < 5 * 60 * 1000) {
        console.log(`[GHL] Access token expired for association ${associationId}, refreshing...`);
        const refreshed = await refreshAssociationAccessToken(associationId, data);
        if (refreshed) {
          return refreshed;
        }
      }
    }

    if (data.type === "oauth") {
      return {
        type: "oauth",
        associationId: data.association_id,
        accessToken: decrypt(data.access_token),
        refreshToken: data.refresh_token ? decrypt(data.refresh_token) : undefined,
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
        associationId: data.association_id,
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
 * Refresh OAuth access token using refresh token for a specific association
 */
async function refreshAssociationAccessToken(
  associationId: string,
  data: any
): Promise<GhlAssociationCredentials | null> {
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
      const errorText = await response.text();
      console.error(`Token refresh failed for association ${associationId}:`, errorText);
      // Don't throw - return null so caller can handle gracefully
      return null;
    }

    const tokenData = await response.json();

    // Calculate new expiry (typically 24 hours)
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + tokenData.expires_in);

    // Update database with new tokens
    const supabase = await createClient();
    const { error: updateError } = await supabase
      .from("association_ghl_credentials")
      .update({
        access_token: encrypt(tokenData.access_token),
        refresh_token: encrypt(tokenData.refresh_token),
        token_expiry: expiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("association_id", associationId);

    if (updateError) {
      console.error(`Failed to update refreshed tokens for association ${associationId}:`, updateError);
      return null;
    }

    console.log(`[GHL] Token refreshed successfully for association ${associationId}`);

    return {
      type: "oauth",
      associationId: data.association_id,
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
    console.error(`Error refreshing token for association ${associationId}:`, error);
    return null;
  }
}

/**
 * Store GHL credentials for a specific association (encrypted with AES-256)
 */
export async function storeAssociationGhlCredentials(
  credentials: GhlAssociationCredentials
): Promise<void> {
  try {
    const supabase = await createClient();

    const data: any = {
      association_id: credentials.associationId,
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

    const { error } = await supabase
      .from("association_ghl_credentials")
      .upsert(data, {
        onConflict: "association_id",
      });

    if (error) {
      throw new Error(`Failed to store credentials: ${error.message}`);
    }

    console.log(`[GHL] Credentials stored for association ${credentials.associationId}`);
  } catch (error) {
    console.error("Error storing GHL credentials:", error);
    throw error;
  }
}

/**
 * Clear stored GHL credentials for a specific association
 */
export async function clearAssociationGhlCredentials(associationId: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from("association_ghl_credentials")
      .delete()
      .eq("association_id", associationId);
    console.log(`[GHL] Credentials cleared for association ${associationId}`);
  } catch (error) {
    console.error("Error clearing GHL credentials:", error);
    throw error;
  }
}

/**
 * Check if GHL is connected for a specific association
 */
export async function isAssociationGhlConnected(associationId: string): Promise<boolean> {
  const creds = await getAssociationGhlCredentials(associationId);
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
 * Get connection status for display for a specific association
 */
export async function getAssociationGhlConnectionStatus(associationId: string): Promise<{
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
  const creds = await getAssociationGhlCredentials(associationId);

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

  const isConnected =
    creds.type === "oauth"
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
