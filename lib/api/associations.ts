// Associations API
// CRUD operations for associations with proper error handling

import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapAssociation } from "./mappers";

export interface Association {
  id: string;
  associationId: string;
  name: string;
  shortName?: string;
  legalName?: string;
  type: string;
  status: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  mailingAddress?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  fiscalYear?: string;
  fiscalYearEndMonth?: string;
  fiscalYearEndDay?: number;
  annualMeetingMonth?: string;
  managementStartDate?: string;
  assignedManagerId?: string;
  assignedManagerName?: string;
  financialPlatform?: string;
  financialPortalLink?: string;
  documentStorageLink?: string;
  emergencyInstructions?: string;
  generalNotes?: string;
  propertyCount?: number;
  unitCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssociationInput {
  name: string;
  shortName?: string | null;
  legalName?: string | null;
  type: string;
  status?: string;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  mailingAddress?: string | null;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null;
  fiscalYear?: string | null;
  fiscalYearEndMonth?: string | null;
  fiscalYearEndDay?: number | null;
  annualMeetingMonth?: string | null;
  managementStartDate?: string | null;
  assignedManagerId?: string | null;
  financialPlatform?: string | null;
  financialPortalLink?: string | null;
  documentStorageLink?: string | null;
  emergencyInstructions?: string | null;
  generalNotes?: string | null;
  propertyCount?: number | null;
  unitCount?: number | null;
}

export interface UpdateAssociationInput extends Partial<CreateAssociationInput> {
  id: string;
}

// Get all associations with pagination
export async function getAssociations(
  params: QueryParams = {},
  businessId?: string
): Promise<ApiResponse<PaginatedResponse<Association>>> {
  try {
    const supabase = await createClient();
    
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from("associations")
      .select("*", { count: "exact" });
    
    // Filter by business_id if provided
    if (businessId) {
      query = query.eq("business_id", businessId);
    }
    
    // Apply search
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,association_id.ilike.%${params.search}%`);
    }
    
    // Apply filters
    if (params.filters?.status) {
      query = query.eq("status", params.filters.status);
    }
    
    // Apply sorting
    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: params.sortOrder === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }
    
    // Apply pagination
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: true,
      data: {
        data: (data || []).map(mapAssociation),
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get single association by ID
export async function getAssociation(
  id: string
): Promise<ApiResponse<Association>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("associations")
      .select("*, contacts:assigned_manager_id(first_name, last_name)")
      .eq("id", id)
      .single();
    
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    if (!data) {
      return {
        success: false,
        error: "Association not found",
      };
    }
    
    return {
      success: true,
      data: mapAssociation(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Create new association
export async function createAssociation(
  input: CreateAssociationInput,
  userId: string,
  businessId?: string
): Promise<ApiResponse<Association>> {
  try {
    // Use service client to bypass RLS for creation
    const { createServiceClient } = await import("@/lib/supabase/service");
    const supabase = createServiceClient();

    // Look up the creator's contact record for created_by
    // The created_by field references contacts(id), not auth.users
    const { data: creatorContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("portal_user_id", userId)
      .maybeSingle();

    // Generate association_id
    const associationId = `ASSOC-${Date.now()}`;

    const { data, error } = await supabase
      .from("associations")
      .insert({
        association_id: associationId,
        name: input.name,
        short_name: input.shortName,
        legal_name: input.legalName,
        type: input.type,
        status: input.status || 'active',
        address_street: input.addressStreet,
        address_city: input.addressCity,
        address_state: input.addressState,
        address_zip: input.addressZip,
        mailing_address: input.mailingAddress,
        phone: input.phone,
        email: input.email,
        tax_id: input.taxId,
        fiscal_year: input.fiscalYear,
        fiscal_year_end_month: input.fiscalYearEndMonth,
        fiscal_year_end_day: input.fiscalYearEndDay,
        annual_meeting_month: input.annualMeetingMonth,
        management_start_date: input.managementStartDate,
        assigned_manager_id: input.assignedManagerId,
        financial_platform: input.financialPlatform,
        financial_portal_link: input.financialPortalLink,
        document_storage_link: input.documentStorageLink,
        emergency_instructions: input.emergencyInstructions,
        general_notes: input.generalNotes,
        property_count: input.propertyCount,
        unit_count: input.unitCount,
        business_id: businessId,
        created_by: creatorContact?.id || null,
        updated_by: creatorContact?.id || null,
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: mapAssociation(data),
      message: "Association created successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Update association
export async function updateAssociation(
  input: UpdateAssociationInput,
  userId: string
): Promise<ApiResponse<Association>> {
  try {
    const supabase = await createClient();
    
    // Look up the updater's contact record for updated_by
    // The updated_by field references contacts(id), not auth.users
    const { data: updaterContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("portal_user_id", userId)
      .maybeSingle();
    
    const { data, error } = await supabase
      .from("associations")
      .update({
        name: input.name,
        short_name: input.shortName,
        legal_name: input.legalName,
        type: input.type,
        status: input.status,
        address_street: input.addressStreet,
        address_city: input.addressCity,
        address_state: input.addressState,
        address_zip: input.addressZip,
        mailing_address: input.mailingAddress,
        phone: input.phone,
        email: input.email,
        tax_id: input.taxId,
        fiscal_year: input.fiscalYear,
        fiscal_year_end_month: input.fiscalYearEndMonth,
        fiscal_year_end_day: input.fiscalYearEndDay,
        annual_meeting_month: input.annualMeetingMonth,
        management_start_date: input.managementStartDate,
        assigned_manager_id: input.assignedManagerId,
        financial_platform: input.financialPlatform,
        financial_portal_link: input.financialPortalLink,
        document_storage_link: input.documentStorageLink,
        emergency_instructions: input.emergencyInstructions,
        general_notes: input.generalNotes,
        property_count: input.propertyCount,
        unit_count: input.unitCount,
        updated_by: updaterContact?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select()
      .single();
    
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: true,
      data: mapAssociation(data),
      message: "Association updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Delete association
export async function deleteAssociation(
  id: string
): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("associations")
      .delete()
      .eq("id", id);
    
    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: true,
      message: "Association deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
