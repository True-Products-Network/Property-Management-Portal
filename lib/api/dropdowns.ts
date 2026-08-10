// Dropdown Settings API
// Manage configurable dropdown values for all record types

import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapDropdownSetting } from "./mappers";

export interface DropdownSetting {
  id: string;
  recordType: string;
  fieldName: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDropdownInput {
  recordType: string;
  fieldName: string;
  value: string;
  label: string;
  sortOrder?: number;
  isDefault?: boolean;
}

// Get dropdown values for a specific record type and field (legacy - no tenant filter)
// DEPRECATED: Use getDropdownValuesForTenant instead
export async function getDropdownValues(
  recordType: string,
  fieldName: string
): Promise<ApiResponse<DropdownSetting[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("dropdown_settings")
      .select("*")
      .eq("record_type", recordType)
      .eq("field_name", fieldName)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get dropdown values for a specific tenant
export async function getDropdownValuesForTenant(
  recordType: string,
  fieldName: string,
  tenantId: string
): Promise<ApiResponse<DropdownSetting[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("dropdown_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("record_type", recordType)
      .eq("field_name", fieldName)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get all dropdown settings (for admin)
export async function getAllDropdownSettings(
  params: QueryParams = {},
  tenantId?: string
): Promise<ApiResponse<DropdownSetting[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("dropdown_settings")
      .select("*");

    // Filter by tenant_id if provided
    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    if (params.filters?.recordType) {
      query = query.eq("record_type", params.filters.recordType);
    }

    if (params.filters?.fieldName) {
      query = query.eq("field_name", params.filters.fieldName);
    }

    query = query.order("record_type").order("field_name").order("sort_order");

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get dropdown settings grouped by record type and field (for admin UI)
export async function getDropdownSettingsGrouped(
  tenantId?: string
): Promise<
  ApiResponse<
    Record<
      string,
      Record<string, DropdownSetting[]>
    >
  >
> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("dropdown_settings")
      .select("*")
      .order("record_type")
      .order("field_name")
      .order("sort_order");

    // Filter by tenant_id if provided - include both tenant-specific and global (null tenant_id)
    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    // Group by record type, then by field name
    const grouped: Record<string, Record<string, DropdownSetting[]>> = {};

    (data || []).forEach((row: any) => {
      const setting = mapDropdownSetting(row);

      if (!grouped[setting.recordType]) {
        grouped[setting.recordType] = {};
      }
      if (!grouped[setting.recordType][setting.fieldName]) {
        grouped[setting.recordType][setting.fieldName] = [];
      }
      grouped[setting.recordType][setting.fieldName].push(setting);
    });

    return { success: true, data: grouped };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Create new dropdown value
export async function createDropdownSetting(
  input: CreateDropdownInput,
  userId: string,
  tenantId?: string
): Promise<ApiResponse<DropdownSetting>> {
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

    const { data, error } = await supabase
      .from("dropdown_settings")
      .insert({
        record_type: input.recordType,
        field_name: input.fieldName,
        value: input.value,
        label: input.label,
        sort_order: input.sortOrder || 0,
        is_default: input.isDefault || false,
        tenant_id: effectiveTenantId,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data,
      message: "Dropdown value created successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Update dropdown value
export async function updateDropdownSetting(
  id: string,
  input: Partial<CreateDropdownInput>,
  userId: string
): Promise<ApiResponse<DropdownSetting>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("dropdown_settings")
      .update({
        value: input.value,
        label: input.label,
        sort_order: input.sortOrder,
        is_default: input.isDefault,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data,
      message: "Dropdown value updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Toggle dropdown active status
export async function toggleDropdownStatus(
  id: string,
  isActive: boolean,
  userId: string
): Promise<ApiResponse<DropdownSetting>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("dropdown_settings")
      .update({
        is_active: isActive,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data,
      message: `Dropdown value ${isActive ? "activated" : "deactivated"} successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Delete dropdown value
export async function deleteDropdownSetting(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("dropdown_settings")
      .delete()
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      message: "Dropdown value deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Record types and their fields for the admin UI
export const RECORD_TYPES = [
  {
    id: "Association Company",
    label: "Association Company",
    fields: ["Association Status", "Association Type"],
  },
  {
    id: "People",
    label: "People",
    fields: ["Contact Role(s)", "Board Position", "Preferred Contact Method"],
  },
  {
    id: "Vendor Company",
    label: "Vendor Company",
    fields: ["Vendor Status", "Vendor Type"],
  },
  {
    id: "Property",
    label: "Property",
    fields: ["Property Status", "Property Type"],
  },
  {
    id: "Unit",
    label: "Unit",
    fields: ["Occupancy Status", "Rental Status"],
  },
  {
    id: "Maintenance Request",
    label: "Maintenance Request",
    fields: ["Category", "Urgency", "Current Status"],
  },
  {
    id: "Inspection",
    label: "Inspection",
    fields: ["Overall Result", "Inspection Status"],
  },
  {
    id: "Document Record",
    label: "Document Record",
    fields: ["Document Type"],
  },
  {
    id: "Compliance Matter",
    label: "Compliance Matter",
    fields: ["Compliance Status"],
  },
];
