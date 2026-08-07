// Properties API
// CRUD operations for properties

import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapProperty } from "./mappers";

export interface Property {
  id: string;
  propertyId: string;
  associationId: string;
  associationName?: string;
  name: string;
  addressStreet: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  type: string;
  status: string;
  yearBuilt?: number;
  totalUnits?: number;
  managementStartDate?: string;
  accessInstructions?: string;
  emergencyNotes?: string;
  assignedStaffId?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePropertyInput {
  associationId: string;
  name: string;
  addressStreet: string;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  type: string;
  status?: string | null;
  yearBuilt?: number | null;
  totalUnits?: number | null;
  managementStartDate?: string | null;
  accessInstructions?: string | null;
  emergencyNotes?: string | null;
  assignedStaffId?: string | null;
  photoUrl?: string | null;
}

export async function getProperties(
  params: QueryParams & { associationId?: string } = {}
): Promise<ApiResponse<PaginatedResponse<Property>>> {
  try {
    const supabase = await createClient();
    
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from("properties")
      .select(`*, associations!inner(name)`, { count: "exact" });
    
    if (params.associationId) {
      query = query.eq("association_id", params.associationId);
    }
    
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,address_street.ilike.%${params.search}%`);
    }
    
    if (params.filters?.status) {
      query = query.eq("status", params.filters.status);
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
        data: (data || []).map(mapProperty),
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

export async function getProperty(id: string): Promise<ApiResponse<Property>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    if (!data) {
      return { success: false, error: "Property not found" };
    }
    
    return { success: true, data: mapProperty(data) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createProperty(
  input: CreatePropertyInput,
  userId: string,
  tenantId?: string
): Promise<ApiResponse<Property>> {
  try {
    const supabase = await createClient();
    
    // Get tenant_id if not provided
    let effectiveTenantId = tenantId;
    if (!effectiveTenantId) {
      const { data: tenantUser } = await supabase
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", userId)
        .maybeSingle();
      effectiveTenantId = tenantUser?.tenant_id;
    }
    
    const propertyId = `PROP-${Date.now()}`;
    
    console.log("[createProperty] Creating property with tenant_id:", effectiveTenantId);
    
    const { data, error } = await supabase
      .from("properties")
      .insert({
        property_id: propertyId,
        tenant_id: effectiveTenantId,
        association_id: input.associationId,
        name: input.name,
        address_street: input.addressStreet,
        address_city: input.addressCity,
        address_state: input.addressState,
        address_zip: input.addressZip,
        type: input.type ? input.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : input.type,
        status: input.status || 'active',
        year_built: input.yearBuilt,
        total_units: input.totalUnits,
        management_start_date: input.managementStartDate,
        access_instructions: input.accessInstructions,
        emergency_notes: input.emergencyNotes,
        assigned_staff_id: input.assignedStaffId,
        photo_url: input.photoUrl,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data, message: "Property created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateProperty(
  id: string,
  input: Partial<CreatePropertyInput>,
  userId: string
): Promise<ApiResponse<Property>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("properties")
      .update({
        name: input.name,
        address_street: input.addressStreet,
        address_city: input.addressCity,
        address_state: input.addressState,
        address_zip: input.addressZip,
        type: input.type ? input.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : input.type,
        status: input.status,
        year_built: input.yearBuilt,
        total_units: input.totalUnits,
        management_start_date: input.managementStartDate,
        access_instructions: input.accessInstructions,
        emergency_notes: input.emergencyNotes,
        assigned_staff_id: input.assignedStaffId,
        photo_url: input.photoUrl,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data, message: "Property updated successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteProperty(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: "Property deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
