// Units API
// CRUD operations for units

import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapUnit } from "./mappers";

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
  status?: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string;
  parkingSpot?: string | null;
  storageUnit?: string | null;
  mailingAddress?: string | null;
  accessNotes?: string | null;
  occupancyStatus?: string;
  rentalStatus?: string;
  moveInDate?: string;
  moveOutDate?: string;
}

export async function getUnits(
  params: QueryParams & { propertyId?: string; businessId?: string; tenantId?: string } = {}
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
    
    // CRITICAL: Filter by business_id or tenant_id for tenant isolation
    if (params.businessId) {
      query = query.eq("business_id", params.businessId);
    } else if (params.tenantId) {
      query = query.eq("tenant_id", params.tenantId);
    } else {
      return { success: true, data: { data: [], total: 0, page, pageSize, totalPages: 0 } };
    }
    
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
        data: (data || []).map(mapUnit),
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
    
    return { success: true, data: mapUnit(data) };
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
    
    // Get the contact ID for this user (for FK constraints)
    const { data: userContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("portal_user_id", userId)
      .maybeSingle();
    
    const contactId = userContact?.id || userId;
    console.log("[createUnit] Using contactId:", contactId, "for userId:", userId);
    
    const unitId = `UNIT-${Date.now()}`;
    
    const { data, error } = await supabase
      .from("units")
      .insert({
        unit_id: unitId,
        property_id: input.propertyId,
        unit_number: input.unitNumber,
        display_name: input.displayName,
        type: input.type,
        status: input.status || 'active',
        square_feet: input.squareFeet,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        floor: input.floor,
        parking_spot: input.parkingSpot,
        storage_unit: input.storageUnit,
        mailing_address: input.mailingAddress,
        access_notes: input.accessNotes,
        occupancy_status: input.occupancyStatus,
        rental_status: input.rentalStatus,
        move_in_date: input.moveInDate,
        move_out_date: input.moveOutDate,
        created_by: contactId,
        updated_by: contactId,
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
    
    // Get the contact ID for this user (for FK constraints)
    const { data: userContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("portal_user_id", userId)
      .maybeSingle();
    
    const contactId = userContact?.id || userId;
    console.log("[updateUnit] Using contactId:", contactId, "for userId:", userId);
    
    const { data, error } = await supabase
      .from("units")
      .update({
        unit_number: input.unitNumber,
        display_name: input.displayName,
        type: input.type,
        status: input.status,
        square_feet: input.squareFeet,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        floor: input.floor,
        occupancy_status: input.occupancyStatus,
        rental_status: input.rentalStatus,
        parking_spot: input.parkingSpot,
        storage_unit: input.storageUnit,
        move_in_date: input.moveInDate,
        move_out_date: input.moveOutDate,
        mailing_address: input.mailingAddress,
        access_notes: input.accessNotes,
        updated_by: contactId,
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
