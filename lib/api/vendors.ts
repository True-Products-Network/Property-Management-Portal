// Vendors API
import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapVendor } from "./mappers";

export interface Vendor {
  id: string;
  vendorId: string;
  companyName: string;
  doingBusinessAs?: string;
  category?: string;
  status: string;
  primaryContactName?: string;
  email?: string;
  phone?: string;
  emergencyPhone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  licenseNumber?: string;
  insuranceExpiry?: string;
  workersCompExpiry?: string;
  rating?: number;
  totalJobs: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorInput {
  companyName: string;
  doingBusinessAs?: string;
  category?: string;
  status?: string;
  primaryContactName?: string;
  email?: string;
  phone?: string;
  emergencyPhone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  licenseNumber?: string;
  insuranceExpiry?: string;
  workersCompExpiry?: string;
}

export async function getVendors(params: QueryParams = {}): Promise<ApiResponse<PaginatedResponse<Vendor>>> {
  try {
    const supabase = await createClient();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase.from("vendors").select("*", { count: "exact" });
    
    if (params.search) {
      query = query.or(`company_name.ilike.%${params.search}%,category.ilike.%${params.search}%`);
    }
    if (params.filters?.status) query = query.eq("status", params.filters.status);
    if (params.filters?.category) query = query.eq("category", params.filters.category);
    
    query = query.order(params.sortBy || "company_name", { ascending: params.sortOrder === "asc" });
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    if (error) return { success: false, error: error.message };
    
    return {
      success: true,
      data: { data: (data || []).map(mapVendor), total: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getVendor(id: string): Promise<ApiResponse<Vendor>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("vendors").select("*").eq("id", id).single();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Vendor not found" };
    return { success: true, data: mapVendor(data) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createVendor(input: CreateVendorInput, authUserId: string): Promise<ApiResponse<Vendor>> {
  try {
    const supabase = await createClient();
    
    // Look up contact ID from portal user - vendors.created_by references contacts(id)
    console.log("[createVendor] Looking up contact for authUserId:", authUserId);
    const { data: portalUser, error: portalError } = await supabase
      .from("portal_users")
      .select("id, ghl_contact_id")
      .eq("id", authUserId)
      .maybeSingle();
    
    console.log("[createVendor] Portal user lookup result:", { portalUser, portalError });
    
    if (portalError) {
      console.error("[createVendor] Portal user lookup error:", portalError);
      return { success: false, error: `Portal user lookup failed: ${portalError.message}` };
    }
    
    if (!portalUser) {
      console.error("[createVendor] Portal user not found for id:", authUserId);
      return { success: false, error: "User not found in portal users" };
    }
    
    // Get the contact ID from portal user's ghl_contact_id
    // vendors.created_by references contacts(id), not portal_users(id)
    const contactId = portalUser.ghl_contact_id;
    if (!contactId) {
      console.error("[createVendor] Portal user has no ghl_contact_id:", portalUser);
      return { success: false, error: "User contact not found" };
    }
    
    console.log("[createVendor] Using contact ID for created_by:", contactId);
    
    const userId = contactId;
    const vendorId = `VEND-${Date.now()}`;
    
    // Normalize category to proper case for CHECK constraint
    const normalizedCategory = input.category 
      ? input.category.charAt(0).toUpperCase() + input.category.slice(1).toLowerCase()
      : undefined;
    
    const { data, error } = await supabase.from("vendors").insert({
      vendor_id: vendorId,
      company_name: input.companyName,
      doing_business_as: input.doingBusinessAs,
      category: normalizedCategory,
      primary_contact_name: input.primaryContactName,
      email: input.email,
      phone: input.phone,
      emergency_phone: input.emergencyPhone,
      address_street: input.addressStreet,
      address_city: input.addressCity,
      address_state: input.addressState,
      address_zip: input.addressZip,
      license_number: input.licenseNumber,
      insurance_expiry: input.insuranceExpiry,
      workers_comp_expiry: input.workersCompExpiry,
      created_by: userId,
      updated_by: userId,
    }).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Vendor created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateVendor(id: string, input: Partial<CreateVendorInput>, userId: string): Promise<ApiResponse<Vendor>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("vendors").update({
      company_name: input.companyName,
      doing_business_as: input.doingBusinessAs,
      category: input.category,
      status: input.status,
      primary_contact_name: input.primaryContactName,
      email: input.email,
      phone: input.phone,
      emergency_phone: input.emergencyPhone,
      address_street: input.addressStreet,
      address_city: input.addressCity,
      address_state: input.addressState,
      address_zip: input.addressZip,
      license_number: input.licenseNumber,
      insurance_expiry: input.insuranceExpiry,
      workers_comp_expiry: input.workersCompExpiry,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Vendor updated successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteVendor(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("vendors").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true, message: "Vendor deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
