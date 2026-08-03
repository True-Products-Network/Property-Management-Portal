// GHL Conflict Resolver
// Handles data conflicts when both systems have changes

import { createClient } from "@/lib/supabase/server";
import { EntityType } from "./field-mapper";

export interface ConflictResolution {
  entityType: EntityType;
  entityId: string;
  ghlId: string;
  resolution: "portal_wins" | "ghl_wins" | "merge" | "manual";
  resolvedFields: Record<
    string,
    {
      portalValue: unknown;
      ghlValue: unknown;
      chosenValue: unknown;
      reason: string;
    }
  >;
  resolvedAt: string;
}

export interface SyncState {
  entityType: EntityType;
  entityId: string;
  ghlId: string;
  portalHash: string;
  ghlHash?: string;
  portalModifiedAt?: string;
  ghlModifiedAt?: string;
  lastSyncAt: string;
  syncVersion: number;
}

/**
 * Check if there's a conflict between portal and GHL versions
 */
export async function detectConflict(
  entityType: EntityType,
  entityId: string,
  portalData: Record<string, unknown>,
  ghlData: Record<string, unknown>
): Promise<{
  hasConflict: boolean;
  conflictFields: string[];
  portalHash: string;
  ghlHash: string;
}> {
  const supabase = await createClient();

  // Calculate current hashes
  const portalHash = await calculateHash(portalData);
  const ghlHash = await calculateHash(ghlData);

  // Get stored sync state
  const { data: syncState, error } = await supabase
    .from("sync_state")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  // No previous sync state = no conflict (first sync)
  if (!syncState) {
    return {
      hasConflict: false,
      conflictFields: [],
      portalHash,
      ghlHash,
    };
  }

  // Check if portal data has changed since last sync
  const portalChanged = syncState.portal_hash !== portalHash;

  // Check if GHL data has changed since last sync
  const ghlChanged = syncState.ghl_hash !== ghlHash;

  // Conflict exists if both have changed
  const hasConflict = portalChanged && ghlChanged;

  let conflictFields: string[] = [];

  if (hasConflict) {
    conflictFields = findConflictingFields(portalData, ghlData);
  }

  return {
    hasConflict,
    conflictFields,
    portalHash,
    ghlHash,
  };
}

/**
 * Resolve a conflict using configured rules
 */
export async function resolveConflict(
  entityType: EntityType,
  entityId: string,
  ghlId: string,
  portalData: Record<string, unknown>,
  ghlData: Record<string, unknown>,
  portalModifiedAt: string,
  ghlModifiedAt: string
): Promise<ConflictResolution> {
  const resolution: ConflictResolution = {
    entityType,
    entityId,
    ghlId,
    resolution: "merge",
    resolvedFields: {},
    resolvedAt: new Date().toISOString(),
  };

  // Get all field keys
  const allKeys = new Set([
    ...Object.keys(portalData),
    ...Object.keys(ghlData),
  ]);

  for (const key of allKeys) {
    const portalValue = portalData[key];
    const ghlValue = ghlData[key];

    // Skip if values are the same
    if (JSON.stringify(portalValue) === JSON.stringify(ghlValue)) {
      continue;
    }

    // Apply resolution rules based on field and entity type
    const fieldResolution = resolveField(
      entityType,
      key,
      portalValue,
      ghlValue,
      portalModifiedAt,
      ghlModifiedAt
    );

    resolution.resolvedFields[key] = fieldResolution;
  }

  // Log the resolution
  await logConflictResolution(resolution);

  return resolution;
}

/**
 * Update sync state after successful sync
 */
export async function updateSyncState(
  entityType: EntityType,
  entityId: string,
  ghlId: string,
  portalHash: string,
  ghlHash: string,
  portalModifiedAt?: string,
  ghlModifiedAt?: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("sync_state").upsert(
    {
      entity_type: entityType,
      entity_id: entityId,
      ghl_id: ghlId,
      portal_hash: portalHash,
      ghl_hash: ghlHash,
      portal_modified_at: portalModifiedAt,
      ghl_modified_at: ghlModifiedAt,
      last_sync_at: new Date().toISOString(),
    },
    {
      onConflict: "entity_type,entity_id",
    }
  );

  if (error) {
    console.error("[ConflictResolver] Error updating sync state:", error);
    throw error;
  }
}

/**
 * Get sync state for an entity
 */
export async function getSyncState(
  entityType: EntityType,
  entityId: string
): Promise<SyncState | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sync_state")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return {
    entityType: data.entity_type as EntityType,
    entityId: data.entity_id as string,
    ghlId: data.ghl_id as string,
    portalHash: data.portal_hash as string,
    ghlHash: data.ghl_hash as string | undefined,
    portalModifiedAt: data.portal_modified_at as string | undefined,
    ghlModifiedAt: data.ghl_modified_at as string | undefined,
    lastSyncAt: data.last_sync_at as string,
    syncVersion: data.sync_version as number,
  };
}

// ============================================
// Resolution Rules
// ============================================

interface FieldResolution {
  portalValue: unknown;
  ghlValue: unknown;
  chosenValue: unknown;
  reason: string;
}

function resolveField(
  entityType: EntityType,
  fieldName: string,
  portalValue: unknown,
  ghlValue: unknown,
  portalModifiedAt: string,
  ghlModifiedAt: string
): FieldResolution {
  // Rule 1: Last Write Wins (default)
  const portalTime = new Date(portalModifiedAt).getTime();
  const ghlTime = new Date(ghlModifiedAt).getTime();

  // Rule 2: GHL wins for external data (contact info from forms)
  const ghlWinsFields = ["email", "phone", "firstName", "lastName"];
  if (entityType === "contact" && ghlWinsFields.includes(fieldName)) {
    return {
      portalValue,
      ghlValue,
      chosenValue: ghlValue,
      reason: "GHL wins for contact demographic data",
    };
  }

  // Rule 3: Portal wins for operational data
  const portalWinsFields = [
    "status",
    "maintenanceStatus",
    "inspectionStatus",
    "approvalStatus",
  ];
  if (portalWinsFields.some((f) => fieldName.toLowerCase().includes(f.toLowerCase()))) {
    return {
      portalValue,
      ghlValue,
      chosenValue: portalValue,
      reason: "Portal wins for operational status fields",
    };
  }

  // Rule 4: Merge arrays (documents, notes, tags)
  if (Array.isArray(portalValue) && Array.isArray(ghlValue)) {
    const merged = [...new Set([...portalValue, ...ghlValue])];
    return {
      portalValue,
      ghlValue,
      chosenValue: merged,
      reason: "Merged arrays (unique values only)",
    };
  }

  // Default: Last Write Wins
  if (portalTime > ghlTime) {
    return {
      portalValue,
      ghlValue,
      chosenValue: portalValue,
      reason: "Portal data is newer (last write wins)",
    };
  } else {
    return {
      portalValue,
      ghlValue,
      chosenValue: ghlValue,
      reason: "GHL data is newer (last write wins)",
    };
  }
}

// ============================================
// Helpers
// ============================================

async function calculateHash(data: Record<string, unknown>): Promise<string> {
  // Simple hash for conflict detection
  // In production, you might want a more robust hash
  const str = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function findConflictingFields(
  portalData: Record<string, unknown>,
  ghlData: Record<string, unknown>
): string[] {
  const conflicts: string[] = [];
  const allKeys = new Set([
    ...Object.keys(portalData),
    ...Object.keys(ghlData),
  ]);

  for (const key of allKeys) {
    if (JSON.stringify(portalData[key]) !== JSON.stringify(ghlData[key])) {
      conflicts.push(key);
    }
  }

  return conflicts;
}

async function logConflictResolution(
  resolution: ConflictResolution
): Promise<void> {
  const supabase = await createClient();

  // Store in sync_log for audit trail
  await supabase.from("sync_log").insert({
    entity_type: resolution.entityType,
    entity_id: resolution.entityId,
    ghl_id: resolution.ghlId,
    direction: "resolve",
    action: "conflict_resolution",
    status: "completed",
    response_payload: resolution,
    created_at: resolution.resolvedAt,
  });

  console.log(
    `[ConflictResolver] Resolved conflict for ${resolution.entityType}:${resolution.entityId} using ${resolution.resolution} strategy`
  );
}
