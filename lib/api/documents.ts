// Documents API
import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";

export interface Document {
  id: string;
  documentId: string;
  title: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  contentType?: string;
  documentType?: string;
  category?: string;
  status: string;
  issueDate?: string;
  expiryDate?: string;
  associationId?: string;
  propertyId?: string;
  unitId?: string;
  contactId?: string;
  maintenanceRequestId?: string;
  inspectionId?: string;
  isConfidential: boolean;
  requiresAcknowledgment: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentInput {
  title: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  contentType?: string;
  documentType?: string;
  category?: string;
  issueDate?: string;
  expiryDate?: string;
  associationId?: string;
  propertyId?: string;
  unitId?: string;
  contactId?: string;
  maintenanceRequestId?: string;
  inspectionId?: string;
  isConfidential?: boolean;
  requiresAcknowledgment?: boolean;
}

export async function getDocuments(
  params: QueryParams & { associationId?: string; propertyId?: string } = {}
): Promise<ApiResponse<PaginatedResponse<Document>>> {
  try {
    const supabase = await createClient();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase.from("documents").select("*", { count: "exact" });
    
    if (params.associationId) query = query.eq("association_id", params.associationId);
    if (params.propertyId) query = query.eq("property_id", params.propertyId);
    if (params.filters?.documentType) query = query.eq("document_type", params.filters.documentType);
    if (params.filters?.status) query = query.eq("status", params.filters.status);
    
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,file_name.ilike.%${params.search}%`);
    }
    
    query = query.order(params.sortBy || "created_at", { ascending: params.sortOrder === "asc" });
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

export async function getDocument(id: string): Promise<ApiResponse<Document>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Document not found" };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createDocument(input: CreateDocumentInput, userId: string): Promise<ApiResponse<Document>> {
  try {
    const supabase = await createClient();
    const documentId = `DOC-${Date.now()}`;
    
    const { data, error } = await supabase.from("documents").insert({
      document_id: documentId,
      title: input.title,
      file_name: input.fileName,
      file_path: input.filePath,
      file_size: input.fileSize,
      content_type: input.contentType,
      document_type: input.documentType,
      category: input.category,
      issue_date: input.issueDate,
      expiry_date: input.expiryDate,
      association_id: input.associationId,
      property_id: input.propertyId,
      unit_id: input.unitId,
      contact_id: input.contactId,
      maintenance_request_id: input.maintenanceRequestId,
      inspection_id: input.inspectionId,
      is_confidential: input.isConfidential || false,
      requires_acknowledgment: input.requiresAcknowledgment || false,
      uploaded_by: userId,
    }).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Document created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateDocument(id: string, input: Partial<CreateDocumentInput> & { status?: string }, userId: string): Promise<ApiResponse<Document>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("documents").update({
      title: input.title,
      document_type: input.documentType,
      category: input.category,
      status: input.status,
      issue_date: input.issueDate,
      expiry_date: input.expiryDate,
      is_confidential: input.isConfidential,
      requires_acknowledgment: input.requiresAcknowledgment,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Document updated successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteDocument(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true, message: "Document deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
