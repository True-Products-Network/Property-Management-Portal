// Payments API
import { createClient } from "@/lib/supabase/server";
import { ApiResponse, PaginatedResponse, QueryParams } from "./types";

export interface PaymentLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentRecord {
  id: string;
  paymentId: string;
  associationId: string;
  contactId: string;
  unitId?: string;
  paymentType?: string;
  paymentMode?: 'manual' | 'ghl_invoice' | 'ghl_payment_link';
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
  // GHL Invoice fields
  ghlInvoiceId?: string;
  ghlPaymentLinkId?: string;
  ghlPaymentLinkUrl?: string;
  ghlInvoiceNumber?: string;
  ghlInvoiceStatus?: string;
  lineItems?: PaymentLineItem[];
  dueDate?: string;
  sentAt?: string;
  viewedAt?: string;
  reminderSentAt?: string;
  // Accounting sync
  accountingSynced?: boolean;
  accountingSyncedAt?: string;
  accountingError?: string;
  createdAt: string;
}

export interface CreatePaymentInput {
  associationId: string;
  contactId: string;
  unitId?: string;
  paymentType?: string;
  paymentMode?: 'manual' | 'ghl_invoice' | 'ghl_payment_link';
  amount: number;
  processor: string;
  paymentMethodType?: string;
  invoiceNumber?: string;
  maintenanceRequestId?: string;
  approvalId?: string;
  lineItems?: PaymentLineItem[];
  dueDate?: string;
  description?: string;
}

export interface CreateGhlInvoiceInput {
  associationId: string;
  contactId: string;
  unitId?: string;
  paymentType?: string;
  amount: number;
  processor: string;
  invoiceNumber?: string;
  maintenanceRequestId?: string;
  approvalId?: string;
  lineItems: PaymentLineItem[];
  dueDate?: string;
  description?: string;
  sendEmail?: boolean;
}

export interface CreateGhlPaymentLinkInput {
  associationId: string;
  contactId: string;
  unitId?: string;
  paymentType?: string;
  amount: number;
  processor: string;
  invoiceNumber?: string;
  maintenanceRequestId?: string;
  approvalId?: string;
  lineItems: PaymentLineItem[];
  description?: string;
  expiresInDays?: number;
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

// Create GHL Invoice
export async function createGhlInvoice(
  input: CreateGhlInvoiceInput,
  userId: string
): Promise<ApiResponse<PaymentRecord>> {
  try {
    const supabase = await createClient();
    const paymentId = `INV-${Date.now()}`;
    
    // Create the payment record with GHL invoice mode
    const { data, error } = await supabase.from("payment_records").insert({
      payment_id: paymentId,
      association_id: input.associationId,
      contact_id: input.contactId,
      unit_id: input.unitId,
      payment_type: input.paymentType,
      payment_mode: 'ghl_invoice',
      amount: input.amount,
      processor: input.processor,
      invoice_number: input.invoiceNumber,
      maintenance_request_id: input.maintenanceRequestId,
      approval_id: input.approvalId,
      line_items: input.lineItems,
      due_date: input.dueDate,
      status: "pending",
      created_by: userId,
    }).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "GHL Invoice created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Create GHL Payment Link
export async function createGhlPaymentLink(
  input: CreateGhlPaymentLinkInput,
  userId: string
): Promise<ApiResponse<PaymentRecord>> {
  try {
    const supabase = await createClient();
    const paymentId = `LNK-${Date.now()}`;
    
    // Create the payment record with GHL payment link mode
    const { data, error } = await supabase.from("payment_records").insert({
      payment_id: paymentId,
      association_id: input.associationId,
      contact_id: input.contactId,
      unit_id: input.unitId,
      payment_type: input.paymentType,
      payment_mode: 'ghl_payment_link',
      amount: input.amount,
      processor: input.processor,
      invoice_number: input.invoiceNumber,
      maintenance_request_id: input.maintenanceRequestId,
      approval_id: input.approvalId,
      line_items: input.lineItems,
      status: "pending",
      created_by: userId,
    }).select().single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "GHL Payment Link created successfully" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Update GHL Invoice details from webhook
export async function updateGhlInvoiceDetails(
  id: string,
  updates: {
    ghlInvoiceId?: string;
    ghlInvoiceNumber?: string;
    ghlInvoiceStatus?: string;
    ghlPaymentLinkId?: string;
    ghlPaymentLinkUrl?: string;
    status?: string;
    sentAt?: string;
    viewedAt?: string;
    completedAt?: string;
    processorTransactionId?: string;
  }
): Promise<ApiResponse<PaymentRecord>> {
  try {
    const supabase = await createClient();
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (updates.ghlInvoiceId) updateData.ghl_invoice_id = updates.ghlInvoiceId;
    if (updates.ghlInvoiceNumber) updateData.ghl_invoice_number = updates.ghlInvoiceNumber;
    if (updates.ghlInvoiceStatus) updateData.ghl_invoice_status = updates.ghlInvoiceStatus;
    if (updates.ghlPaymentLinkId) updateData.ghl_payment_link_id = updates.ghlPaymentLinkId;
    if (updates.ghlPaymentLinkUrl) updateData.ghl_payment_link_url = updates.ghlPaymentLinkUrl;
    if (updates.status) updateData.status = updates.status;
    if (updates.sentAt) updateData.sent_at = updates.sentAt;
    if (updates.viewedAt) updateData.viewed_at = updates.viewedAt;
    if (updates.completedAt) updateData.completed_at = updates.completedAt;
    if (updates.processorTransactionId) updateData.processor_transaction_id = updates.processorTransactionId;
    
    const { data, error } = await supabase
      .from("payment_records")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, data, message: "GHL invoice details updated" };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Mark payment as synced to accounting
export async function markAccountingSynced(
  id: string,
  synced: boolean = true,
  error?: string
): Promise<ApiResponse<PaymentRecord>> {
  try {
    const supabase = await createClient();
    
    const { data, error: dbError } = await supabase
      .from("payment_records")
      .update({
        accounting_synced: synced,
        accounting_synced_at: synced ? new Date().toISOString() : null,
        accounting_error: error || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    
    if (dbError) return { success: false, error: dbError.message };
    return { success: true, data, message: "Accounting sync status updated" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
