// Maintenance Requests API
// CRUD operations for maintenance requests

import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapMaintenanceRequest } from "./mappers";

export interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  propertyId: string;
  propertyName?: string;
  property?: {
    name: string;
    association_id?: string;
  };
  unitId?: string;
  unitName?: string;
  unit?: {
    unit_number?: string;
  };
  reportedByContactId?: string;
  reportedByName?: string;
  submittedByName?: string;
  assignedVendorId?: string;
  assignedStaffId?: string;
  title: string;
  description?: string;
  category?: string;
  urgency?: string;
  status: string;
  estimatedCost?: number;
  actualCost?: number;
  approvedAmount?: number;
  requestedDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  vendorNotes?: string;
  resolutionNotes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceInput {
  propertyId: string;
  unitId?: string;
  reportedByContactId: string;
  title: string;
  description?: string;
  category?: string;
  urgency?: string;
  requestedDate?: string;
}

export async function getMaintenanceRequests(
  params: QueryParams & { propertyId?: string; unitId?: string; status?: string; vendorId?: string; reportedBy?: string } = {}
): Promise<ApiResponse<PaginatedResponse<MaintenanceRequest>>> {
  try {
    const supabase = await createClient();
    
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from("maintenance_requests")
      .select("*, properties!inner(association_id, name), units(unit_number)", { count: "exact" });
    
    // Filter by association_id via property join
    if (params.associationId) {
      query = query.eq("properties.association_id", params.associationId);
    }
    
    if (params.propertyId) {
      query = query.eq("property_id", params.propertyId);
    }
    
    if (params.unitId) {
      query = query.eq("unit_id", params.unitId);
    }
    
    if (params.status) {
      query = query.eq("status", params.status);
    }
    
    if (params.vendorId) {
      query = query.eq("assigned_vendor_id", params.vendorId);
    }
    
    if (params.reportedBy) {
      query = query.eq("reported_by_contact_id", params.reportedBy);
    }
    
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,request_number.ilike.%${params.search}%`);
    }
    
    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: params.sortOrder === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return {
      success: true,
      data: {
        data: (data || []).map(mapMaintenanceRequest),
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getMaintenanceRequest(id: string): Promise<ApiResponse<MaintenanceRequest>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("maintenance_requests")
      .select("*, properties(name, association_id), units(unit_number)")
      .eq("id", id)
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    if (!data) {
      return { success: false, error: "Maintenance request not found" };
    }
    
    return { success: true, data: mapMaintenanceRequest(data) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createMaintenanceRequest(
  input: CreateMaintenanceInput,
  userId: string
): Promise<ApiResponse<MaintenanceRequest>> {
  try {
    const supabase = await createClient();

    const requestNumber = `MNT-${Date.now()}`;
    
    // Get the reporter's name if reportedByContactId is provided
let reportedByName = null;
if (input.reportedByContactId) {
  const { data: reporter } = await supabase
    .from("contacts")
    .select("first_name, last_name")
    .eq("id", input.reportedByContactId)
    .single();
  if (reporter) {
    reportedByName = `${reporter.first_name} ${reporter.last_name}`;
  }
}

// Get the unit name if unitId is provided
let unitName = "Common Area";
if (input.unitId) {
  const { data: unit } = await supabase
    .from("units")
    .select("unit_number")
    .eq("id", input.unitId)
    .single();
  if (unit) {
    unitName = `Unit ${unit.unit_number}`;
  }
} else {
  unitName = "Common Area";
}

// Get the submitter's name (current user)
const { data: submitter } = await supabase
  .from("contacts")
  .select("first_name, last_name")
  .eq("portal_user_id", userId)
  .maybeSingle();

const submittedByName = submitter 
  ? `${submitter.first_name} ${submitter.last_name}`
  : "System";

const { data, error } = await supabase
  .from("maintenance_requests")
  .insert({
    request_number: requestNumber,
    property_id: input.propertyId,
    unit_id: input.unitId || null,
    reported_by_contact_id: input.reportedByContactId,
    reported_by_name: reportedByName,
    unit_name: unitName,
    submitted_by_name: submittedByName,
    title: input.title,
    description: input.description,
    category: input.category,
    urgency: input.urgency || "normal",
    status: "new",
    requested_date: input.requestedDate,
    created_by: userId,
    updated_by: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .select()
  .single();

if (error) {
  return { success: false, error: error.message };
}

return {
  success: true,
  data: mapMaintenanceRequest(data),
  message: "Maintenance request created successfully",
};
    
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateMaintenanceRequest(
  id: string,
  input: Partial<CreateMaintenanceInput> & { 
    status?: string;
    assignedVendorId?: string;
    assignedStaffId?: string;
    estimatedCost?: number;
    actualCost?: number;
    scheduledDate?: string;
    completedDate?: string;
    vendorNotes?: string;
    resolutionNotes?: string;
  },
  userId: string
): Promise<ApiResponse<MaintenanceRequest>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("maintenance_requests")
      .update({
        title: input.title,
        description: input.description,
        category: input.category,
        urgency: input.urgency,
        status: input.status,
        assigned_vendor_id: input.assignedVendorId,
        assigned_staff_id: input.assignedStaffId,
        estimated_cost: input.estimatedCost,
        actual_cost: input.actualCost,
        scheduled_date: input.scheduledDate,
        completed_date: input.completedDate,
        vendor_notes: input.vendorNotes,
        resolution_notes: input.resolutionNotes,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data: mapMaintenanceRequest(data), message: "Maintenance request updated successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteMaintenanceRequest(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("maintenance_requests")
      .delete()
      .eq("id", id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: "Maintenance request deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
