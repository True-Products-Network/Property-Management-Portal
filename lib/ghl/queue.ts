// GHL Sync Queue Manager
// Manages sync jobs using Supabase as the queue backend

import { createClient } from "@/lib/supabase/server";
import { EntityType } from "./field-mapper";

export interface SyncJob {
  id: string;
  entityType: EntityType;
  entityId: string;
  ghlId?: string;
  operation: "push" | "pull" | "resolve";
  priority: number;
  status: "pending" | "processing" | "completed" | "failed";
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  correlationId: string;
  tenantId?: string;
  createdAt: string;
  scheduledFor: string;
  processedAt?: string;
  completedAt?: string;
}

export interface CreateSyncJobInput {
  entityType: EntityType;
  entityId: string;
  ghlId?: string;
  operation: "push" | "pull" | "resolve";
  priority?: number;
  tenantId?: string;
  correlationId?: string;
  scheduledFor?: Date;
}

// Retry delays in milliseconds
const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m

function getRetryDelay(attempt: number): number {
  return RETRY_DELAYS[Math.min(attempt, RETRY_DELAYS.length - 1)];
}

/**
 * Create a new sync job
 */
export async function createSyncJob(
  input: CreateSyncJobInput
): Promise<SyncJob> {
  const supabase = await createClient();

  const correlationId = input.correlationId || generateCorrelationId();
  const scheduledFor = input.scheduledFor || new Date();

  const { data, error } = await supabase
    .from("sync_jobs")
    .insert({
      entity_type: input.entityType,
      entity_id: input.entityId,
      ghl_id: input.ghlId,
      operation: input.operation,
      priority: input.priority || 5,
      status: "pending",
      retry_count: 0,
      max_retries: 3,
      correlation_id: correlationId,
      tenant_id: input.tenantId,
      scheduled_for: scheduledFor.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[SyncQueue] Error creating job:", error);
    throw new Error(`Failed to create sync job: ${error.message}`);
  }

  return mapDbJobToSyncJob(data);
}

/**
 * Get next pending job from queue
 */
export async function getNextJob(): Promise<SyncJob | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sync_jobs")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    console.error("[SyncQueue] Error getting next job:", error);
    throw error;
  }

  return mapDbJobToSyncJob(data);
}

/**
 * Mark job as processing
 */
export async function markJobProcessing(jobId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("sync_jobs")
    .update({
      status: "processing",
      processed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    console.error("[SyncQueue] Error marking job processing:", error);
    throw error;
  }
}

/**
 * Mark job as completed
 */
export async function markJobCompleted(
  jobId: string,
  ghlId?: string
): Promise<void> {
  const supabase = await createClient();

  const update: Record<string, unknown> = {
    status: "completed",
    completed_at: new Date().toISOString(),
  };

  if (ghlId) {
    update.ghl_id = ghlId;
  }

  const { error } = await supabase
    .from("sync_jobs")
    .update(update)
    .eq("id", jobId);

  if (error) {
    console.error("[SyncQueue] Error marking job completed:", error);
    throw error;
  }
}

/**
 * Mark job as failed with retry logic
 */
export async function markJobFailed(
  jobId: string,
  errorMessage: string
): Promise<boolean> {
  const supabase = await createClient();

  // Get current job state
  const { data: job, error: fetchError } = await supabase
    .from("sync_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (fetchError) {
    console.error("[SyncQueue] Error fetching job for retry:", fetchError);
    throw fetchError;
  }

  const retryCount = job.retry_count + 1;

  if (retryCount >= job.max_retries) {
    // Max retries reached, mark as failed
    const { error } = await supabase
      .from("sync_jobs")
      .update({
        status: "failed",
        error_message: errorMessage,
        retry_count: retryCount,
      })
      .eq("id", jobId);

    if (error) {
      console.error("[SyncQueue] Error marking job failed:", error);
      throw error;
    }

    return false; // No more retries
  }

  // Schedule retry
  const retryDelay = getRetryDelay(retryCount);
  const scheduledFor = new Date(Date.now() + retryDelay);

  const { error } = await supabase
    .from("sync_jobs")
    .update({
      status: "pending",
      retry_count: retryCount,
      error_message: errorMessage,
      scheduled_for: scheduledFor.toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    console.error("[SyncQueue] Error scheduling retry:", error);
    throw error;
  }

  console.log(
    `[SyncQueue] Job ${jobId} scheduled for retry ${retryCount}/${job.max_retries} at ${scheduledFor.toISOString()}`
  );
  return true; // Will retry
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<SyncJob | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sync_jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  return mapDbJobToSyncJob(data);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sync_jobs")
    .select("status");

  if (error) {
    throw error;
  }

  const stats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: data.length,
  };

  for (const job of data) {
    stats[job.status as keyof typeof stats]++;
  }

  return stats;
}

/**
 * Retry all failed jobs
 */
export async function retryFailedJobs(): Promise<number> {
  const supabase = await createClient();

  const { data: failedJobs, error: fetchError } = await supabase
    .from("sync_jobs")
    .select("id")
    .eq("status", "failed");

  if (fetchError) {
    throw fetchError;
  }

  let retriedCount = 0;

  for (const job of failedJobs) {
    const { error } = await supabase
      .from("sync_jobs")
      .update({
        status: "pending",
        retry_count: 0,
        error_message: null,
        scheduled_for: new Date().toISOString(),
      })
      .eq("id", job.id);

    if (!error) {
      retriedCount++;
    }
  }

  return retriedCount;
}

/**
 * Clean up old completed jobs
 */
export async function cleanupOldJobs(olderThanDays: number = 7): Promise<number> {
  const supabase = await createClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const { error, count } = await supabase
    .from("sync_jobs")
    .delete()
    .eq("status", "completed")
    .lt("completed_at", cutoffDate.toISOString());

  if (error) {
    throw error;
  }

  return count || 0;
}

// ============================================
// Helpers
// ============================================

function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function mapDbJobToSyncJob(data: Record<string, unknown>): SyncJob {
  return {
    id: data.id as string,
    entityType: data.entity_type as EntityType,
    entityId: data.entity_id as string,
    ghlId: data.ghl_id as string | undefined,
    operation: data.operation as "push" | "pull" | "resolve",
    priority: data.priority as number,
    status: data.status as "pending" | "processing" | "completed" | "failed",
    retryCount: data.retry_count as number,
    maxRetries: data.max_retries as number,
    errorMessage: data.error_message as string | undefined,
    correlationId: data.correlation_id as string,
    tenantId: data.tenant_id as string | undefined,
    createdAt: data.created_at as string,
    scheduledFor: data.scheduled_for as string,
    processedAt: data.processed_at as string | undefined,
    completedAt: data.completed_at as string | undefined,
  };
}
