// Contacts API
// CRUD operations for contacts

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";
import { mapContact } from "./mappers";

// Re-export mapContact for use in API routes
export { mapContact };

export interface Contact {
  id: string;
  contactId: string;
  portalUserId?: string;
  associationId?: string;
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
  allowLogin?: boolean;
  roles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email: string;
  associationId?: string;
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
  roles?: string[];
}

export async function getContacts(
  params: QueryParams = {},
  tenantId?: string
): Promise<ApiResponse<PaginatedResponse<Contact>>> {
  try {
    const supabase = await createClient();
    
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // First, fetch contacts
    let contactsQuery = supabase
      .from("contacts")
      .select("*", { count: "exact" });
    
    // Filter by tenant_id if provided
    if (tenantId) {
      contactsQuery = contactsQuery.eq("tenant_id", tenantId);
    }

    // Filter by association_id if provided (for association isolation)
    if (params.associationId) {
      contactsQuery = contactsQuery.eq("association_id", params.associationId);
    }

    // Filter by portal_user_id if provided
    if (params.portalUserId) {
      contactsQuery = contactsQuery.eq("portal_user_id", params.portalUserId);
    }

    if (params.search) {
      contactsQuery = contactsQuery.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }

    if (params.sortBy) {
      contactsQuery = contactsQuery.order(params.sortBy, { ascending: params.sortOrder === "asc" });
    } else {
      contactsQuery = contactsQuery.order("last_name", { ascending: true });
    }

    contactsQuery = contactsQuery.range(from, to);

    const { data: contactsData, error: contactsError, count } = await contactsQuery;

    if (contactsError) {
      return { success: false, error: contactsError.message };
    }

    // Fetch roles for all contacts
    const contactIds = (contactsData || []).map((c: any) => c.id);
    let rolesMap: Record<string, string[]> = {};

    console.log("[Contacts API] Fetching roles for contacts:", contactIds);

    if (contactIds.length > 0) {
      const { data: rolesData, error: rolesError } = await supabase
        .from("contact_roles")
        .select("contact_id, role_type")
        .in("contact_id", contactIds)
        .eq("is_active", true);

      console.log("[Contacts API] Roles data:", rolesData, "Error:", rolesError);

      if (!rolesError && rolesData) {
        rolesMap = rolesData.reduce((acc: Record<string, string[]>, role: any) => {
          if (!acc[role.contact_id]) {
            acc[role.contact_id] = [];
          }
          acc[role.contact_id].push(role.role_type);
          return acc;
        }, {});
      }
    }

    console.log("[Contacts API] Roles map:", rolesMap);

    // Merge contacts with their roles
    const contactsWithRoles = (contactsData || []).map((contact: any) => ({
      ...contact,
      contact_roles: rolesMap[contact.id]?.map((role_type: string) => ({ role_type })) || [],
    }));

    // Map the database rows to Contact interface with camelCase properties
    const mappedContacts = contactsWithRoles.map(mapContact);
    
    return {
      success: true,
      data: {
        data: mappedContacts,
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
    
    return { success: true, data: mapContact(data) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createContact(
  input: CreateContactInput,
  userId: string,
  tenantId?: string
): Promise<ApiResponse<Contact>> {
  try {
    // Use service client to bypass RLS for admin operations
    const supabase = createServiceClient();
    
    const contactId = `CONT-${Date.now()}`;
    
    // Look up the current user's contact record for created_by
    // The created_by field references contacts(id), not auth.users
    const { data: creatorContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("portal_user_id", userId)
      .maybeSingle();
    
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
      .from("contacts")
      .insert({
        contact_id: contactId,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        association_id: input.associationId,
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
        tenant_id: effectiveTenantId,
        allow_login: false,
        created_by: creatorContact?.id || null,
        updated_by: creatorContact?.id || null,
      })
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }

    // Insert roles if provided
    if (input.roles && input.roles.length > 0 && data?.id) {
      const rolesToInsert = input.roles.map((role: string) => ({
        contact_id: data.id,
        role_type: role,
        is_active: true,
      }));

      const { error: rolesError } = await supabase
        .from("contact_roles")
        .insert(rolesToInsert);

      if (rolesError) {
        console.error("[createContact] Error inserting roles:", rolesError);
      }
    }

    // Fetch the contact with roles to return
    const { data: contactWithRoles } = await supabase
      .from("contacts")
      .select("*, contact_roles(role_type, is_active)")
      .eq("id", data.id)
      .single();
    
    return { success: true, data: contactWithRoles || data, message: "Contact created successfully" };
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
    // Use service client for roles operations to bypass RLS
    const serviceSupabase = createServiceClient();
    
    // Get the contact ID for this user (for FK constraints)
    const { data: userContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("portal_user_id", userId)
      .maybeSingle();
    
    const contactId = userContact?.id || userId;
    console.log("[updateContact] Using contactId:", contactId, "for userId:", userId);
    
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
        updated_by: contactId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }

    // Update roles if provided
    if (input.roles !== undefined && data?.id) {
      // First, delete existing roles (clean slate approach)
      await serviceSupabase
        .from("contact_roles")
        .delete()
        .eq("contact_id", data.id);

      // Insert new roles
      if (input.roles.length > 0) {
        const rolesToInsert = input.roles.map((role: string) => ({
          contact_id: data.id,
          role_type: role,
          is_active: true,
        }));

        const { error: rolesError } = await serviceSupabase
          .from("contact_roles")
          .insert(rolesToInsert);

        if (rolesError) {
          console.error("[updateContact] Error inserting roles:", rolesError);
        }
      }
    }

    // Fetch the contact with roles to return
    const { data: contactWithRoles } = await supabase
      .from("contacts")
      .select("*, contact_roles(role_type, is_active)")
      .eq("id", data.id)
      .single();
    
    return { success: true, data: contactWithRoles || data, message: "Contact updated successfully" };
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

// Enable portal login for a contact
export async function enableContactLogin(
  contactId: string,
  userId: string
): Promise<ApiResponse<Contact>> {
  try {
    const supabase = createServiceClient();
    
    // Get contact details
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single();
    
    if (contactError || !contact) {
      return { success: false, error: "Contact not found" };
    }
    
    // Check if already has portal access
    if (contact.portal_user_id) {
      // Just update allow_login flag
      const { data, error } = await supabase
        .from("contacts")
        .update({ allow_login: true })
        .eq("id", contactId)
        .select()
        .single();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data, message: "Login access enabled" };
    }
    
    // Create portal_user record
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase();
    
    const { data: portalUser, error: portalError } = await supabase.auth.admin.createUser({
      email: contact.email,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        first_name: contact.first_name,
        last_name: contact.last_name,
        full_name: `${contact.first_name} ${contact.last_name}`,
        contact_id: contactId,
      },
    });
    
    if (portalError || !portalUser.user) {
      return { success: false, error: `Failed to create portal user: ${portalError?.message}` };
    }
    
    // Update contact with portal_user_id and allow_login
    const { data, error } = await supabase
      .from("contacts")
      .update({
        portal_user_id: portalUser.user.id,
        allow_login: true,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contactId)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      data, 
      message: "Login access enabled. Invitation email sent." 
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Disable portal login for a contact
export async function disableContactLogin(
  contactId: string
): Promise<ApiResponse<Contact>> {
  try {
    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from("contacts")
      .update({ allow_login: false })
      .eq("id", contactId)
      .select()
      .single();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, data, message: "Login access disabled" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
