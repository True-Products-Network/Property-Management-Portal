// Approvals API
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
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  denialReason?: string;
  deniedBy?: string;
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
    
    console.log("[createApproval] Looking up portal user for auth user:", authUserId);
    
    // Look up the portal user ID from the auth user ID
    const { data: portalUser, error: portalUserError } = await supabase
      .from("portal_users")
      .select("id, email, first_name, last_name")
      .eq("id", authUserId)
      .maybeSingle();
    
    console.log("[createApproval] Portal user lookup result:", { portalUser, portalUserError });
    
    if (portalUserError) {
      console.error("[createApproval] Error looking up portal user:", portalUserError);
      return { success: false, error: "Failed to verify user" };
    }
    
    if (!portalUser) {
      console.error("[createApproval] No portal user found for auth user:", authUserId);
      
      // Try to find by email as fallback
      const { data: { user } } = await supabase.auth.getUser();
      console.log("[createApproval] Auth user email:", user?.email);
      
      if (user?.email) {
        const { data: portalUserByEmail } = await supabase
          .from("portal_users")
          .select("id, email")
          .eq("email", user.email)
          .maybeSingle();
        
        console.log("[createApproval] Portal user by email lookup:", portalUserByEmail);
        
        if (portalUserByEmail) {
          console.log("[createApproval] Found portal user by email, using ID:", portalUserByEmail.id);
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
            requested_by: portalUserByEmail.id,
            status: "pending",
          }).select().single();
          
          if (error) return { success: false, error: error.message };
          return { success: true, data, message: "Approval request created successfully" };
        }
      }
      
      return { success: false, error: "User not found in portal users" };
    }
    
    const portalUserId = portalUser.id;
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
      requested_by: portalUserId,
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
    
    // Look up the portal user ID from the auth user ID
    const { data: portalUser } = await supabase
      .from("portal_users")
      .select("id")
      .eq("id", authUserId)
      .maybeSingle();
    
    const portalUserId = portalUser?.id || authUserId;
    
    const { data, error } = await supabase.from("approvals").update({
      status: "approved",
      approved_amount: approvedAmount,
      approved_by: portalUserId,
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
    
    // Look up the portal user ID from the auth user ID
    const { data: portalUser } = await supabase
      .from("portal_users")
      .select("id")
      .eq("id", authUserId)
      .maybeSingle();
    
    const portalUserId = portalUser?.id || authUserId;
    
    const { data, error } = await supabase.from("approvals").update({
      status: "rejected",
      denial_reason: reason,
      denied_by: portalUserId,
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
