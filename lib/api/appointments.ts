// Appointments API
import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";

export interface Appointment {
  id: string;
  appointmentId: string;
  associationId: string;
  title: string;
  description?: string;
  appointmentType?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isVirtual: boolean;
  virtualLink?: string;
  propertyId?: string;
  unitId?: string;
  maintenanceRequestId?: string;
  inspectionId?: string;
  organizerId: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  associationId: string;
  title: string;
  description?: string;
  appointmentType?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  propertyId?: string;
  unitId?: string;
  maintenanceRequestId?: string;
  inspectionId?: string;
  participantIds?: string[];
}

export async function getAppointments(
  params: QueryParams & { associationId?: string; startDate?: string; endDate?: string } = {}
): Promise<ApiResponse<PaginatedResponse<Appointment>>> {
  try {
    const supabase = await createClient();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase.from("appointments").select("*", { count: "exact" });
    
    if (params.associationId) query = query.eq("association_id", params.associationId);
    if (params.startDate) query = query.gte("start_time", params.startDate);
    if (params.endDate) query = query.lte("start_time", params.endDate);
    if (params.filters?.status) query = query.eq("status", params.filters.status);
    
    query = query.order(params.sortBy || "start_time", { ascending: true });
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

export async function getAppointment(id: string): Promise<ApiResponse<Appointment>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("appointments").select("*").eq("id", id).single();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Appointment not found" };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createAppointment(input: CreateAppointmentInput, userId: string): Promise<ApiResponse<Appointment>> {
  try {
    const supabase = await createClient();
    const appointmentId = `APT-${Date.now()}`;
    
    const { data, error } = await supabase.from("appointments").insert({
      appointment_id: appointmentId,
      association_id: input.associationId,
      title: input.title,
      description: input.description,
      appointment_type: input.appointmentType,
      start_time: input.startTime,
      end_time: input.endTime,
      location: input.location,
      is_virtual: input.isVirtual || false,
      virtual_link: input.virtualLink,
      property_id: input.propertyId,
      unit_id: input.unitId,
      maintenance_request_id: input.maintenanceRequestId,
      inspection_id: input.inspectionId,
      organizer_id: userId,
      status: "scheduled",
    }).select().single();
    
    if (error) return { success: false, error: error.message };
    
    // Add participants if specified
    if (input.participantIds && input.participantIds.length > 0) {
      const participants = input.participantIds.map(contactId => ({
        appointment_id: data.id,
        contact_id: contactId,
        role: "attendee",
      }));
      await supabase.from("appointment_participants").insert(participants);
    }
    
    return { success: true, data, message: "Appointment created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateAppointment(
  id: string,
  input: Partial<CreateAppointmentInput>,
  userId: string
): Promise<ApiResponse<Appointment>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("appointments").update({
      title: input.title,
      description: input.description,
      appointment_type: input.appointmentType,
      start_time: input.startTime,
      end_time: input.endTime,
      location: input.location,
      is_virtual: input.isVirtual,
      virtual_link: input.virtualLink,
      status: input.status,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Appointment updated successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function cancelAppointment(id: string): Promise<ApiResponse<Appointment>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("appointments").update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Appointment cancelled successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteAppointment(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true, message: "Appointment deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
