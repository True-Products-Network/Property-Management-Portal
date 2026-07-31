// Payments API
import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";

export interface PaymentRecord {
  id: string;
  paymentId: string;
  associationId: string;
  contactId: string;
  unitId?: string;
  paymentType?: string;
  amount: number;
  processor: string;
  processorTransactionId?: string;
  processorCustomerId?: string;
  status: string;
  initiatedAt: string;
  completedAt?: string;
  paymentMethodType?: string;
  paymentMethodLast4?: string;
  invoiceNumber?: string;
  maintenanceRequestId?: string;
  approvalId?: string;
  createdAt: string;
}

export interface CreatePaymentInput {
  associationId: string;
  contactId: string;
  unitId?: string;
  paymentType?: string;
  amount: number;
  processor: string;
  paymentMethodType?: string;
  invoiceNumber?: string;
  maintenanceRequestId?: string;
  approvalId?: string;
}

export async function getPayments(
  params: QueryParams & { associationId?: string; contactId?: string } = {}
): Promise<ApiResponse<PaginatedResponse<PaymentRecord>>> {
  try {
    const supabase = await createClient();
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    let query = supabase.from("payment_records").select("*", { count: "exact" });
    
    if (params.associationId) query = query.eq("association_id", params.associationId);
    if (params.contactId) query = query.eq("contact_id", params.contactId);
    if (params.filters?.status) query = query.eq("status", params.filters.status);
    if (params.filters?.paymentType) query = query.eq("payment_type", params.filters.paymentType);
    
    query = query.order(params.sortBy || "initiated_at", { ascending: false });
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

export async function getPayment(id: string): Promise<ApiResponse<PaymentRecord>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("payment_records").select("*").eq("id", id).single();
    if (error) return { success: false, error: error.message };
    if (!data) return { success: false, error: "Payment not found" };
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createPayment(input: CreatePaymentInput, userId: string): Promise<ApiResponse<PaymentRecord>> {
  try {
    const supabase = await createClient();
    const paymentId = `PAY-${Date.now()}`;
    
    const { data, error } = await supabase.from("payment_records").insert({
      payment_id: paymentId,
      association_id: input.associationId,
      contact_id: input.contactId,
      unit_id: input.unitId,
      payment_type: input.paymentType,
      amount: input.amount,
      processor: input.processor,
      payment_method_type: input.paymentMethodType,
      invoice_number: input.invoiceNumber,
      maintenance_request_id: input.maintenanceRequestId,
      approval_id: input.approvalId,
      status: "pending",
      created_by: userId,
    }).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Payment record created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updatePaymentStatus(
  id: string,
  status: string,
  processorTransactionId?: string,
  completedAt?: string
): Promise<ApiResponse<PaymentRecord>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("payment_records").update({
      status,
      processor_transaction_id: processorTransactionId,
      completed_at: completedAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", id).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "Payment status updated successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deletePayment(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("payment_records").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true, message: "Payment deleted successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
