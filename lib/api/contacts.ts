// Contacts API
// CRUD operations for contacts

import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapContact } from "./mappers";

export interface Contact {
  id: string;
  contactId: string;
  portalUserId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  preferredContactMethod?: string;
  mailingPreference?: string;
  emailPermission: boolean;
  smsPermission: boolean;
  mailingAddressStreet?: string;
  mailingAddressCity?: string;
  mailingAddressState?: string;
  mailingAddressZip?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  portalInvitationStatus: string;
  portalInvitedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  preferredContactMethod?: string;
  mailingPreference?: string;
  emailPermission?: boolean;
  smsPermission?: boolean;
  mailingAddressStreet?: string;
  mailingAddressCity?: string;
  mailingAddressState?: string;
  mailingAddressZip?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

export async function getContacts(
  params: QueryParams = {}
): Promise<ApiResponse<PaginatedResponse<Contact>>> {
  try {
    const supabase = await createClient();
    
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase
      .from("contacts")
      .select("*", { count: "exact" });
    
    if (params.search) {
      query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }
    
    if (params.sortBy) {
      query = query.order(params.sortBy, { ascending: params.sortOrder === "asc" });
    } else {
      query = query.order("last_name", { ascending: true });
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

export async function getContact(id: string): Promise<ApiResponse<Contact>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    if (!data) {
      return { success: false, error: "Contact not found" };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createContact(
  input: CreateContactInput,
  userId: string
): Promise<ApiResponse<Contact>> {
  try {
    const supabase = await createClient();
    
    const contactId = `CONT-${Date.now()}`;
    
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        contact_id: contactId,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        mobile_phone: input.mobilePhone,
        work_phone: input.workPhone,
        preferred_contact_method: input.preferredContactMethod,
        mailing_preference: input.mailingPreference,
        email_permission: input.emailPermission || false,
        sms_permission: input.smsPermission || false,
        mailing_address_street: input.mailingAddressStreet,
        mailing_address_city: input.mailingAddressCity,
        mailing_address_state: input.mailingAddressState,
        mailing_address_zip: input.mailingAddressZip,
        emergency_contact_name: input.emergencyContactName,
        emergency_contact_phone: input.emergencyContactPhone,
        emergency_contact_relationship: input.emergencyContactRelationship,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data, message: "Contact created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateContact(
  id: string,
  input: Partial<CreateContactInput>,
  userId: string
): Promise<ApiResponse<Contact>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("contacts")
      .update({
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone,
        mobile_phone: input.mobilePhone,
        work_phone: input.workPhone,
        preferred_contact_method: input.preferredContactMethod,
        mailing_preference: input.mailingPreference,
        email_permission: input.emailPermission,
        sms_permission: input.smsPermission,
        mailing_address_street: input.mailingAddressStreet,
        mailing_address_city: input.mailingAddressCity,
        mailing_address_state: input.mailingAddressState,
        mailing_address_zip: input.mailingAddressZip,
        emergency_contact_name: input.emergencyContactName,
        emergency_contact_phone: input.emergencyContactPhone,
        emergency_contact_relationship: input.emergencyContactRelationship,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data, message: "Contact updated successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteContact(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, message: "Contact deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
