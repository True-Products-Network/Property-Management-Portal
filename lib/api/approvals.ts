// Approvals API - Updated Aug 7, 2026
import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapApproval } from "./mappers";

export interface Approval {
  id: string;
  approvalId: string;
  associationId: string;
  title: string;
  description?: string;
  approvalType?: string;
  requestedAmount?: number;
  approvedAmount?: number;
  status: string;
  requestedBy: string;
  requestedByName?: string;
  requestedAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  denialReason?: string;
  deniedBy?: string;
  deniedByName?: string;
  deniedAt?: string;
  maintenanceRequestId?: string;
  vendorId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApprovalInput {
  associationId: string;
  title: string;
  description?: string;
  approvalType?: string;
  requestedAmount?: number;
  maintenanceRequestId?: string;
  vendorId?: string;
}

export async function getApprovals(
  params: QueryParams & { associationId?: string } = {}
): Promise<ApiResponse<PaginatedResponse<Approval>>> {
  try {
    const supabase = await createClient();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase.from("approvals").select("*", { count: "exact" });
    
    if (params.associationId) query = query.eq("association_id", params.associationId);
    if (params.filters?.status) query = query.eq("status", params.filters.status);
    if (params.filters?.approvalType) query = query.eq("approval_type", params.filters.approvalType);
    
    query = query.order(params.sortBy || "requested_at", { ascending: false });
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    if (error) return { success: false, error: error.message };
    
    return {
      success: true,
      data: { data: data || [], total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getApproval(id: string): Promise<ApiResponse<Approval>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("approvals").select("*").eq("id", id).single();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Approval not found" };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createApproval(input: CreateApprovalInput, authUserId: string): Promise<ApiResponse<Approval>> {
  try {
    const supabase = await createClient();
    
    console.log("[createApproval] Looking up contact for auth user:", authUserId);
    
    // FK constraints reference contacts(id), not portal_users(id)
    // Look up the contact by portal_user_id
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, first_name, last_name, email")
      .eq("portal_user_id", authUserId)
      .maybeSingle();
    
    console.log("[createApproval] Contact lookup result:", { contact, contactError });
    
    if (contactError) {
      console.error("[createApproval] Error looking up contact:", contactError);
      return { success: false, error: "Failed to verify user" };
    }
    
    if (!contact) {
      console.error("[createApproval] No contact found for auth user:", authUserId);
      return { success: false, error: "User not found in contacts" };
    }
    
    const contactId = contact.id;
    const requesterName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || "Unknown";
    
    console.log("[createApproval] Using contactId:", contactId, "name:", requesterName);
    
    const approvalId = `APPR-${Date.now()}`;
    
    const { data, error } = await supabase.from("approvals").insert({
      approval_id: approvalId,
      association_id: input.associationId,
      title: input.title,
      description: input.description,
      approval_type: input.approvalType,
      requested_amount: input.requestedAmount,
      maintenance_request_id: input.maintenanceRequestId,
      vendor_id: input.vendorId,
      requested_by: contactId,
      requested_by_name: requesterName,
      status: "pending",
    }).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Approval request created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function approveApproval(id: string, approvedAmount: number, authUserId: string): Promise<ApiResponse<Approval>> {
  try {
    const supabase = await createClient();
    
    // FK constraints reference contacts(id), not portal_users(id)
    // Look up the contact by portal_user_id
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("portal_user_id", authUserId)
      .maybeSingle();
    
    const contactId = contact?.id;
    const approverName = contact 
      ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || "Unknown"
      : "Unknown";
    
    const { data, error } = await supabase.from("approvals").update({
      status: "approved",
      approved_amount: approvedAmount,
      approved_by: contactId,
      approved_by_name: approverName,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Approval granted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function rejectApproval(id: string, reason: string, authUserId: string): Promise<ApiResponse<Approval>> {
  try {
    const supabase = await createClient();
    
    // FK constraints reference contacts(id), not portal_users(id)
    // Look up the contact by portal_user_id
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("portal_user_id", authUserId)
      .maybeSingle();
    
    const contactId = contact?.id;
    const denierName = contact
      ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || "Unknown"
      : "Unknown";
    
    const { data, error } = await supabase.from("approvals").update({
      status: "rejected",
      denial_reason: reason,
      denied_by: contactId,
      denied_by_name: denierName,
      denied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Approval rejected successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteApproval(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("approvals").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true, message: "Approval deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
