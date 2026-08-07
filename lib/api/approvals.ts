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
    
    console.log("[createApproval] Looking up portal user for auth user:", authUserId);
    
    // First check if auth user ID exists directly in portal_users
    const { data: directPortalUser, error: directError } = await supabase
      .from("portal_users")
      .select("id, email")
      .eq("id", authUserId)
      .maybeSingle();
    
    console.log("[createApproval] Direct lookup result:", { directPortalUser, directError });
    
    // Also try looking up by email via auth
    const { data: { user: authData } } = await supabase.auth.getUser();
    console.log("[createApproval] Auth user data:", { email: authData?.email, id: authData?.id });
    
    let portalUser = directPortalUser;
    
    // If not found by ID, try by email
    if (!portalUser && authData?.email) {
      const { data: emailUser, error: emailError } = await supabase
        .from("portal_users")
        .select("id, email")
        .eq("email", authData.email)
        .maybeSingle();
      
      console.log("[createApproval] Email lookup result:", { emailUser, emailError });
      
      if (emailUser) {
        portalUser = emailUser;
      }
    }
    
    const portalUserError = directError;
    
    console.log("[createApproval] Portal user lookup result:", { portalUser, portalUserError });
    
    if (portalUserError) {
      console.error("[createApproval] Error looking up portal user:", portalUserError);
      return { success: false, error: "Failed to verify user" };
    }
    
    // Get user's name from contacts table
    let requesterName = "Unknown";
    const { data: contact } = await supabase
      .from("contacts")
      .select("first_name, last_name")
      .eq("portal_user_id", portalUser?.id || authUserId)
      .maybeSingle();
    
    if (contact) {
      requesterName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || "Unknown";
    }
    
    console.log("[createApproval] Requester name:", requesterName);
    
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
            requested_by_name: requesterName,
            status: "pending",
          }).select().single();
          
          if (error) return { success: false, error: error.message };
          return { success: true, data, message: "Approval request created successfully" };
        }
      }
      
      return { success: false, error: "User not found in portal users" };
    }
    
    const portalUserId = portalUser.id;
    console.log("[createApproval] Using portalUserId:", portalUserId, "for insert");
    
    // Verify the portal user actually exists
    const { data: verifyUser, error: verifyError } = await supabase
      .from("portal_users")
      .select("id")
      .eq("id", portalUserId)
      .single();
    
    console.log("[createApproval] Verification result:", { verifyUser, verifyError });
    
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
    
    // Look up the portal user ID from the auth user ID
    const { data: portalUser } = await supabase
      .from("portal_users")
      .select("id")
      .eq("id", authUserId)
      .maybeSingle();
    
    const portalUserId = portalUser?.id || authUserId;
    
    // Get approver's name from contacts
    let approverName = "Unknown";
    const { data: contact } = await supabase
      .from("contacts")
      .select("first_name, last_name")
      .eq("portal_user_id", portalUserId)
      .maybeSingle();
    
    if (contact) {
      approverName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || "Unknown";
    }
    
    const { data, error } = await supabase.from("approvals").update({
      status: "approved",
      approved_amount: approvedAmount,
      approved_by: portalUserId,
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
    
    // Look up the portal user ID from the auth user ID
    const { data: portalUser } = await supabase
      .from("portal_users")
      .select("id")
      .eq("id", authUserId)
      .maybeSingle();
    
    const portalUserId = portalUser?.id || authUserId;
    
    // Get denier's name from contacts
    let denierName = "Unknown";
    const { data: contact } = await supabase
      .from("contacts")
      .select("first_name, last_name")
      .eq("portal_user_id", portalUserId)
      .maybeSingle();
    
    if (contact) {
      denierName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || "Unknown";
    }
    
    const { data, error } = await supabase.from("approvals").update({
      status: "rejected",
      denial_reason: reason,
      denied_by: portalUserId,
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
