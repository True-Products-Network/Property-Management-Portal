// Communications API
import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapCommunication } from "./mappers";

export interface Communication {
  id: string;
  communicationId: string;
  associationId: string;
  subject: string;
  content?: string;
  type?: string;
  sendToAll: boolean;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  createdBy: string;
  sentBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunicationInput {
  associationId: string;
  subject: string;
  content?: string;
  type?: string;
  sendToAll?: boolean;
  scheduledAt?: string;
  recipientIds?: string[];
}

export async function getCommunications(
  params: QueryParams & { associationId?: string; businessId?: string } = {}
): Promise<ApiResponse<PaginatedResponse<Communication>>> {
  try {
    const supabase = await createClient();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase.from("communications").select("*", { count: "exact" });
    
    // CRITICAL: Filter by business_id for tenant isolation
    if (params.businessId) {
      query = query.eq("business_id", params.businessId);
    }
    
    if (params.associationId) query = query.eq("association_id", params.associationId);
    if (params.filters?.status) query = query.eq("status", params.filters.status);
    if (params.filters?.type) query = query.eq("type", params.filters.type);
    
    query = query.order(params.sortBy || "created_at", { ascending: false });
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

export async function getCommunication(id: string): Promise<ApiResponse<Communication>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("communications").select("*").eq("id", id).single();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Communication not found" };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createCommunication(input: CreateCommunicationInput, userId: string): Promise<ApiResponse<Communication>> {
  try {
    const supabase = await createClient();
    const communicationId = `COMM-${Date.now()}`;
    
    const { data, error } = await supabase.from("communications").insert({
      communication_id: communicationId,
      association_id: input.associationId,
      subject: input.subject,
      content: input.content,
      type: input.type,
      send_to_all: input.sendToAll || false,
      scheduled_at: input.scheduledAt,
      status: input.scheduledAt ? "scheduled" : "draft",
      created_by: userId,
    }).select().single();
    
    if (error) return { success: false, error: error.message };
    
    // Add recipients if specified
    if (input.recipientIds && input.recipientIds.length > 0) {
      const recipients = input.recipientIds.map(contactId => ({
        communication_id: data.id,
        contact_id: contactId,
      }));
      await supabase.from("communication_recipients").insert(recipients);
    }
    
    return { success: true, data, message: "Communication created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function sendCommunication(id: string, userId: string): Promise<ApiResponse<Communication>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("communications").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_by: userId,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Communication sent successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteCommunication(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("communications").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true, message: "Communication deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
