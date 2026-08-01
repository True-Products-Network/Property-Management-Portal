// Compliance Matters API
import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapComplianceMatter } from "./mappers";

export interface ComplianceMatter {
  id: string;
  matterId: string;
  associationId: string;
  propertyId?: string;
  unitId?: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status: string;
  identifiedDate?: string;
  dueDate?: string;
  resolvedDate?: string;
  assignedTo?: string;
  resolutionNotes?: string;
  fineAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplianceInput {
  associationId: string;
  propertyId?: string;
  unitId?: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  identifiedDate?: string;
  dueDate?: string;
  assignedTo?: string;
}

export async function getComplianceMatters(
  params: QueryParams & { associationId?: string } = {}
): Promise<ApiResponse<PaginatedResponse<ComplianceMatter>>> {
  try {
    const supabase = await createClient();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase.from("compliance_matters").select("*", { count: "exact" });
    
    if (params.associationId) query = query.eq("association_id", params.associationId);
    if (params.filters?.status) query = query.eq("status", params.filters.status);
    if (params.filters?.priority) query = query.eq("priority", params.filters.priority);
    if (params.filters?.category) query = query.eq("category", params.filters.category);
    
    query = query.order(params.sortBy || "due_date", { ascending: true });
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

export async function getComplianceMatter(id: string): Promise<ApiResponse<ComplianceMatter>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("compliance_matters").select("*").eq("id", id).single();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Compliance matter not found" };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createComplianceMatter(input: CreateComplianceInput, userId: string): Promise<ApiResponse<ComplianceMatter>> {
  try {
    const supabase = await createClient();
    const matterId = `COMP-${Date.now()}`;
    
    const { data, error } = await supabase.from("compliance_matters").insert({
      matter_id: matterId,
      association_id: input.associationId,
      property_id: input.propertyId,
      unit_id: input.unitId,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      identified_date: input.identifiedDate,
      due_date: input.dueDate,
      assigned_to: input.assignedTo,
      status: "open",
      created_by: userId,
      updated_by: userId,
    }).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Compliance matter created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateComplianceMatter(
  id: string,
  input: Partial<CreateComplianceInput> & {
    status?: string;
    resolvedDate?: string;
    resolutionNotes?: string;
    fineAmount?: number;
  },
  userId: string
): Promise<ApiResponse<ComplianceMatter>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("compliance_matters").update({
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: input.status,
      due_date: input.dueDate,
      resolved_date: input.resolvedDate,
      assigned_to: input.assignedTo,
      resolution_notes: input.resolutionNotes,
      fine_amount: input.fineAmount,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Compliance matter updated successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteComplianceMatter(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("compliance_matters").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true, message: "Compliance matter deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
