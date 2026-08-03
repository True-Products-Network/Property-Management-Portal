// GHL Sync Engine
// Core orchestrator for all synchronization operations

import { createClient } from "@/lib/supabase/server";
import {
  EntityType,
  getGhlObjectKey,
  mapPortalContactToGhl,
  mapGhlContactToPortal,
  mapPortalAssociationToGhl,
  mapGhlCompanyToPortal,
  mapPortalPropertyToGhl,
  mapGhlPropertyToPortal,
  mapPortalUnitToGhl,
  mapGhlUnitToPortal,
  PortalContact,
  PortalAssociation,
  PortalProperty,
  PortalUnit,
} from "./field-mapper";
import {
  createSyncJob,
  markJobProcessing,
  markJobCompleted,
  markJobFailed,
  getNextJob,
  SyncJob,
} from "./queue";
import {
  detectConflict,
  resolveConflict,
  updateSyncState,
} from "./conflict-resolver";
import {
  createContact,
  updateContact,
  getContact,
  createCompany,
  updateCompany,
  getCompany,
  createCustomObject,
  updateCustomObject,
  getCustomObject,
} from "./api-client";

export interface SyncResult {
  success: boolean;
  ghlId?: string;
  error?: string;
  conflictResolved?: boolean;
}

export interface BatchSyncResult {
  total: number;
  successful: number;
  failed: number;
  conflicts: number;
  errors: Array<{ entityId: string; error: string }>;
}

// ============================================
// Main Sync Operations
// ============================================

/**
 * Push entity from Portal to GHL
 */
export async function pushToGHL(
  entityType: EntityType,
  entityId: string,
  tenantId?: string
): Promise<SyncResult> {
  console.log(`[SyncEngine] Pushing ${entityType}:${entityId} to GHL`);

  try {
    // Get entity data from Portal
    const portalData = await getPortalEntity(entityType, entityId);
    if (!portalData) {
      return { success: false, error: "Entity not found in Portal" };
    }

    // Map to GHL format
    const ghlData = mapToGhl(entityType, portalData);

    // Check for existing GHL ID
    const existingGhlId = await getExistingGhlId(entityType, entityId);

    let resultGhlId: string;

    if (existingGhlId) {
      // Update existing record in GHL
      await updateGhlEntity(entityType, existingGhlId, ghlData);
      resultGhlId = existingGhlId;
    } else {
      // Create new record in GHL
      const created = await createGhlEntity(entityType, ghlData);
      resultGhlId = created.id!;

      // Store GHL ID in Portal
      await storeGhlId(entityType, entityId, resultGhlId);
    }

    // Update sync state
    await updateSyncState(
      entityType,
      entityId,
      resultGhlId,
      await calculateHash(portalData),
      await calculateHash(ghlData),
      (portalData.updatedAt as string) || new Date().toISOString(),
      new Date().toISOString()
    );

    // Log success
    await logSyncOperation(
      entityType,
      entityId,
      resultGhlId,
      "to_ghl",
      existingGhlId ? "update" : "create",
      "success",
      tenantId
    );

    return { success: true, ghlId: resultGhlId };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[SyncEngine] Push failed: ${errorMessage}`);

    await logSyncOperation(
      entityType,
      entityId,
      undefined,
      "to_ghl",
      "push",
      "failed",
      tenantId,
      errorMessage
    );

    return { success: false, error: errorMessage };
  }
}

/**
 * Pull entity from GHL to Portal
 */
export async function pullFromGHL(
  entityType: EntityType,
  ghlId: string,
  tenantId?: string
): Promise<SyncResult> {
  console.log(`[SyncEngine] Pulling ${entityType}:${ghlId} from GHL`);

  try {
    // Get entity from GHL
    const ghlData = await getGhlEntity(entityType, ghlId);
    if (!ghlData) {
      return { success: false, error: "Entity not found in GHL" };
    }

    // Map to Portal format
    const portalData = mapFromGhl(entityType, ghlData);

    // Check for existing Portal entity
    const existingEntityId = await getExistingPortalId(entityType, ghlId);

    let resultEntityId: string;

    if (existingEntityId) {
      // Check for conflicts before updating
      const currentPortalData = await getPortalEntity(
        entityType,
        existingEntityId
      );

      if (currentPortalData) {
        const { hasConflict, portalHash, ghlHash } = await detectConflict(
          entityType,
          existingEntityId,
          currentPortalData,
          portalData as Record<string, unknown>
        );

        if (hasConflict) {
          console.log(
            `[SyncEngine] Conflict detected for ${entityType}:${existingEntityId}`
          );

          const resolution = await resolveConflict(
            entityType,
            existingEntityId,
            ghlId,
            currentPortalData,
            portalData as Record<string, unknown>,
            currentPortalData.updatedAt || new Date().toISOString(),
            new Date().toISOString()
          );

          // Apply resolved data
          const resolvedData = Object.entries(
            resolution.resolvedFields
          ).reduce(
            (acc, [key, field]) => ({
              ...acc,
              [key]: field.chosenValue,
            }),
            {}
          );

          await updatePortalEntity(entityType, existingEntityId, resolvedData);
        } else {
          // No conflict, update normally
          await updatePortalEntity(
            entityType,
            existingEntityId,
            portalData
          );
        }
      }

      resultEntityId = existingEntityId;
    } else {
      // Create new entity in Portal
      resultEntityId = await createPortalEntity(entityType, portalData, tenantId);

      // Store mapping
      await storeGhlId(entityType, resultEntityId, ghlId);
    }

    // Update sync state
    await updateSyncState(
      entityType,
      resultEntityId,
      ghlId,
      await calculateHash(portalData as Record<string, unknown>),
      await calculateHash(ghlData as Record<string, unknown>),
      new Date().toISOString(),
      new Date().toISOString()
    );

    // Log success
    await logSyncOperation(
      entityType,
      resultEntityId,
      ghlId,
      "from_ghl",
      existingEntityId ? "update" : "create",
      "success",
      tenantId
    );

    return { success: true, ghlId };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[SyncEngine] Pull failed: ${errorMessage}`);

    await logSyncOperation(
      entityType,
      ghlId,
      ghlId,
      "from_ghl",
      "pull",
      "failed",
      tenantId,
      errorMessage
    );

    return { success: false, error: errorMessage };
  }
}

/**
 * Process a sync job from the queue
 */
export async function processSyncJob(job: SyncJob): Promise<SyncResult> {
  console.log(
    `[SyncEngine] Processing job ${job.id}: ${job.operation} ${job.entityType}:${job.entityId}`
  );

  await markJobProcessing(job.id);

  let result: SyncResult;

  try {
    switch (job.operation) {
      case "push":
        result = await pushToGHL(job.entityType, job.entityId, job.tenantId);
        break;
      case "pull":
        if (!job.ghlId) {
          throw new Error("GHL ID required for pull operation");
        }
        result = await pullFromGHL(job.entityType, job.ghlId, job.tenantId);
        break;
      case "resolve":
        // Conflict resolution is handled within pull
        result = { success: true };
        break;
      default:
        throw new Error(`Unknown operation: ${job.operation}`);
    }

    if (result.success) {
      await markJobCompleted(job.id, result.ghlId);
    } else {
      const willRetry = await markJobFailed(job.id, result.error || "Unknown error");
      if (!willRetry) {
        console.error(
          `[SyncEngine] Job ${job.id} failed permanently: ${result.error}`
        );
      }
    }

    return result;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`[SyncEngine] Job processing error: ${errorMessage}`);

    const willRetry = await markJobFailed(job.id, errorMessage);
    if (!willRetry) {
      console.error(`[SyncEngine] Job ${job.id} failed permanently`);
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Process next job in queue
 */
export async function processNextJob(): Promise<SyncResult | null> {
  const job = await getNextJob();
  if (!job) {
    return null;
  }

  return processSyncJob(job);
}

/**
 * Queue a sync operation
 */
export async function queueSync(
  entityType: EntityType,
  entityId: string,
  operation: "push" | "pull" | "resolve",
  ghlId?: string,
  tenantId?: string,
  priority: number = 5
): Promise<SyncJob> {
  return createSyncJob({
    entityType,
    entityId,
    ghlId,
    operation,
    priority,
    tenantId,
  });
}

// ============================================
// Entity CRUD Operations
// ============================================

async function getPortalEntity(
  entityType: EntityType,
  entityId: string
): Promise<Record<string, unknown> | null> {
  const supabase = await createClient();

  let table: string;
  switch (entityType) {
    case "contact":
      table = "contacts";
      break;
    case "association":
      table = "associations";
      break;
    case "property":
      table = "properties";
      break;
    case "unit":
      table = "units";
      break;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", entityId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
}

async function createPortalEntity(
  entityType: EntityType,
  data: Record<string, unknown>,
  tenantId?: string
): Promise<string> {
  const supabase = await createClient();

  let table: string;
  switch (entityType) {
    case "contact":
      table = "contacts";
      break;
    case "association":
      table = "associations";
      break;
    case "property":
      table = "properties";
      break;
    case "unit":
      table = "units";
      break;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }

  const insertData = tenantId ? { ...data, tenant_id: tenantId } : data;

  const { data: result, error } = await supabase
    .from(table)
    .insert(insertData)
    .select("id")
    .single();

  if (error) throw error;
  return result.id;
}

async function updatePortalEntity(
  entityType: EntityType,
  entityId: string,
  data: Record<string, unknown>
): Promise<void> {
  const supabase = await createClient();

  let table: string;
  switch (entityType) {
    case "contact":
      table = "contacts";
      break;
    case "association":
      table = "associations";
      break;
    case "property":
      table = "properties";
      break;
    case "unit":
      table = "units";
      break;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }

  const { error } = await supabase
    .from(table)
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", entityId);

  if (error) throw error;
}

async function getGhlEntity(
  entityType: EntityType,
  ghlId: string
): Promise<Record<string, unknown> | null> {
  switch (entityType) {
    case "contact":
      return getContact(ghlId);
    case "association":
      return getCompany(ghlId);
    default: {
      const objectKey = getGhlObjectKey(entityType);
      if (!objectKey) throw new Error(`No object key for ${entityType}`);
      return getCustomObject(objectKey, ghlId);
    }
  }
}

async function createGhlEntity(
  entityType: EntityType,
  data: Record<string, unknown>
): Promise<{ id: string }> {
  switch (entityType) {
    case "contact":
      return createContact(data as Parameters<typeof createContact>[0]);
    case "association":
      return createCompany(data as Parameters<typeof createCompany>[0]);
    default: {
      const objectKey = getGhlObjectKey(entityType);
      if (!objectKey) throw new Error(`No object key for ${entityType}`);
      return createCustomObject(objectKey, data.properties as Record<string, unknown>);
    }
  }
}

async function updateGhlEntity(
  entityType: EntityType,
  ghlId: string,
  data: Record<string, unknown>
): Promise<void> {
  switch (entityType) {
    case "contact":
      await updateContact(ghlId, data as Parameters<typeof updateContact>[1]);
      break;
    case "association":
      await updateCompany(ghlId, data as Parameters<typeof updateCompany>[1]);
      break;
    default: {
      const objectKey = getGhlObjectKey(entityType);
      if (!objectKey) throw new Error(`No object key for ${entityType}`);
      await updateCustomObject(objectKey, ghlId, data.properties as Record<string, unknown>);
    }
  }
}

// ============================================
// Mapping Functions
// ============================================

function mapToGhl(
  entityType: EntityType,
  portalData: Record<string, unknown>
): Record<string, unknown> {
  switch (entityType) {
    case "contact":
      return mapPortalContactToGhl(portalData as unknown as PortalContact);
    case "association":
      return mapPortalAssociationToGhl(portalData as unknown as PortalAssociation);
    case "property":
      return mapPortalPropertyToGhl(portalData as unknown as PortalProperty);
    case "unit":
      return mapPortalUnitToGhl(portalData as unknown as PortalUnit);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

function mapFromGhl(
  entityType: EntityType,
  ghlData: Record<string, unknown>
): Record<string, unknown> {
  switch (entityType) {
    case "contact":
      return mapGhlContactToPortal(ghlData as Awaited<ReturnType<typeof getContact>>);
    case "association":
      return mapGhlCompanyToPortal(ghlData as Awaited<ReturnType<typeof getCompany>>);
    case "property": {
      const obj = ghlData as Awaited<ReturnType<typeof getCustomObject>>;
      return mapGhlPropertyToPortal(obj);
    }
    case "unit": {
      const obj = ghlData as Awaited<ReturnType<typeof getCustomObject>>;
      return mapGhlUnitToPortal(obj);
    }
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

// ============================================
// ID Mapping
// ============================================

async function getExistingGhlId(
  entityType: EntityType,
  entityId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sync_state")
    .select("ghl_id")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .single();

  if (error || !data) return null;
  return data.ghl_id;
}

async function getExistingPortalId(
  entityType: EntityType,
  ghlId: string
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sync_state")
    .select("entity_id")
    .eq("entity_type", entityType)
    .eq("ghl_id", ghlId)
    .single();

  if (error || !data) return null;
  return data.entity_id;
}

async function storeGhlId(
  entityType: EntityType,
  entityId: string,
  ghlId: string
): Promise<void> {
  const supabase = await createClient();

  // Also store in the entity table for quick lookup
  let table: string;
  let column: string;

  switch (entityType) {
    case "contact":
      table = "contacts";
      column = "ghl_contact_id";
      break;
    case "association":
      table = "associations";
      column = "ghl_company_id";
      break;
    case "property":
      table = "properties";
      column = "ghl_property_id";
      break;
    case "unit":
      table = "units";
      column = "ghl_unit_id";
      break;
    default:
      return;
  }

  await supabase.from(table).update({ [column]: ghlId }).eq("id", entityId);
}

// ============================================
// Logging
// ============================================

async function logSyncOperation(
  entityType: EntityType,
  entityId: string,
  ghlId: string | undefined,
  direction: "to_ghl" | "from_ghl",
  action: string,
  status: string,
  tenantId?: string,
  error?: string
): Promise<void> {
  const supabase = await createClient();

  await supabase.from("sync_log").insert({
    entity_type: entityType,
    entity_id: entityId,
    ghl_id: ghlId,
    tenant_id: tenantId,
    direction,
    action,
    status,
    error_details: error ? { message: error } : null,
  });
}

async function calculateHash(data: Record<string, unknown>): Promise<string> {
  const str = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}
