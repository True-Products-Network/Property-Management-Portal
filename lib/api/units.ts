// Units API
// CRUD operations for units

import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";

export interface Unit {
  id: string;
  unitId: string;
  propertyId: string;
  unitNumber: string;
  displayName?: string;
  type?: string;
  status: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string;
  occupancyStatus?: string;
  rentalStatus?: string;
  parkingSpot?: string;
  storageUnit?: string;
  moveInDate?: string;
  moveOutDate?: string;
  mailingAddress?: string;
  accessNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitInput {
  propertyId: string;
  unitNumber: string;
  displayName?: string;
  type?: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string;
  parkingSpot?: string;
  storageUnit?: string;
  mailingAddress?: string;
  accessNotes?: string;
}

export async function getUnits(
  params: QueryParams & { propertyId?: string } = {}
): Promise<ApiResponse<PaginatedResponse<Unit>>> {
  try {
    const supabase = await createClient();
    
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from("units")
      .select("*", { count: "exact" });
    
    if (params.propertyId) {
      query = query.eq("property_id", params.propertyId);
    }
    
    if (params.search) {
      query = query.or(`unit_number.ilike.%${params.search}%,display_name.ilike.%${params.search}%`);
    }
    
    if (params.filters?.status) {
      query = query.eq("status", params.filters.status);
    }
    
    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: params.sortOrder === "asc" });
    } else {
      query = query.order("unit_number", { ascending: true });
    }
    
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return {
      success: true,
      data: {
        data: data || [],
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

export async function getUnit(id: string): Promise<ApiResponse<Unit>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("units")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    if (!data) {
      return { success: false, error: "Unit not found" };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createUnit(
  input: CreateUnitInput,
  userId: string
): Promise<ApiResponse<Unit>> {
  try {
    const supabase = await createClient();
    
    const unitId = `UNIT-${Date.now()}`;
    
    const { data, error } = await supabase
      .from("units")
      .insert({
        unit_id: unitId,
        property_id: input.propertyId,
        unit_number: input.unitNumber,
        display_name: input.displayName,
        type: input.type,
        square_feet: input.squareFeet,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        floor: input.floor,
        parking_spot: input.parkingSpot,
        storage_unit: input.storageUnit,
        mailing_address: input.mailingAddress,
        access_notes: input.accessNotes,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data, message: "Unit created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateUnit(
  id: string,
  input: Partial<CreateUnitInput>,
  userId: string
): Promise<ApiResponse<Unit>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("units")
      .update({
        unit_number: input.unitNumber,
        display_name: input.displayName,
        type: input.type,
        square_feet: input.squareFeet,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        floor: input.floor,
        parking_spot: input.parkingSpot,
        storage_unit: input.storageUnit,
        mailing_address: input.mailingAddress,
        access_notes: input.accessNotes,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data, message: "Unit updated successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteUnit(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("units")
      .delete()
      .eq("id", id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: "Unit deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
