// Inspections API
import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapInspection } from "./mappers";

export interface Inspection {
  id: string;
  inspectionId: string;
  propertyId: string;
  unitId?: string;
  inspectionType: string;
  status: string;
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  inspectorId?: string;
  inspectorVendorId?: string;
  findings?: string;
  recommendations?: string;
  overallRating?: string;
  followUpRequired: boolean;
  followUpMaintenanceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInspectionInput {
  propertyId: string;
  unitId?: string;
  inspectionType: string;
  scheduledDate?: string;
  scheduledTime?: string;
  inspectorId?: string;
  inspectorVendorId?: string;
}

export async function getInspections(
  params: QueryParams & { propertyId?: string; businessId?: string; tenantId?: string } = {}
): Promise<ApiResponse<PaginatedResponse<Inspection>>> {
  try {
    const supabase = await createClient();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase.from("inspections").select("*, properties!inner(association_id)", { count: "exact" });
    
    // CRITICAL: Filter by business_id or tenant_id for tenant isolation
    if (params.businessId) {
      query = query.eq("business_id", params.businessId);
    } else if (params.tenantId) {
      query = query.eq("tenant_id", params.tenantId);
    } else {
      return { success: true, data: { data: [], total: 0, page, pageSize, totalPages: 0 } };
    }
    
    if (params.associationId) query = query.eq("properties.association_id", params.associationId);
    if (params.propertyId) query = query.eq("property_id", params.propertyId);
    if (params.filters?.status) query = query.eq("status", params.filters.status);
    if (params.filters?.inspectionType) query = query.eq("inspection_type", params.filters.inspectionType);
    
    query = query.order(params.sortBy || "scheduled_date", { ascending: params.sortOrder === "asc" });
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

export async function getInspection(id: string): Promise<ApiResponse<Inspection>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("inspections").select("*").eq("id", id).single();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Inspection not found" };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createInspection(input: CreateInspectionInput, userId: string): Promise<ApiResponse<Inspection>> {
  try {
    const supabase = await createClient();
    const inspectionId = `INSP-${Date.now()}`;
    
    const { data, error } = await supabase.from("inspections").insert({
      inspection_id: inspectionId,
      property_id: input.propertyId,
      unit_id: input.unitId,
      inspection_type: input.inspectionType,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime,
      inspector_id: input.inspectorId,
      inspector_vendor_id: input.inspectorVendorId,
      status: "scheduled",
      follow_up_required: false,
      created_by: userId,
      updated_by: userId,
    }).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Inspection created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateInspection(
  id: string,
  input: Partial<CreateInspectionInput> & {
    status?: string;
    completedDate?: string;
    findings?: string;
    recommendations?: string;
    overallRating?: string;
    followUpRequired?: boolean;
    followUpMaintenanceId?: string;
  },
  userId: string
): Promise<ApiResponse<Inspection>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("inspections").update({
      inspection_type: input.inspectionType,
      scheduled_date: input.scheduledDate,
      scheduled_time: input.scheduledTime,
      status: input.status,
      completed_date: input.completedDate,
      findings: input.findings,
      recommendations: input.recommendations,
      overall_rating: input.overallRating,
      follow_up_required: input.followUpRequired,
      follow_up_maintenance_id: input.followUpMaintenanceId,
      inspector_id: input.inspectorId,
      inspector_vendor_id: input.inspectorVendorId,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Inspection updated successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteInspection(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("inspections").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true, message: "Inspection deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
