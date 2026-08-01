// API Route: Create GHL Payment Link
// Creates a one-time payment link via GHL

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createGhlPaymentLink } from "@/lib/api/payments";
import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().positive(),
  amount: z.number().positive(),
});

const createLinkSchema = z.object({
  associationId: z.string().uuid(),
  contactId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  paymentType: z.enum(["assessment", "special_assessment", "late_fee", "fine", "vendor_payment", "deposit", "other"]).optional(),
  amount: z.number().positive(),
  processor: z.enum(["stripe", "paypal"]),
  invoiceNumber: z.string().optional(),
  maintenanceRequestId: z.string().uuid().optional(),
  approvalId: z.string().uuid().optional(),
  lineItems: z.array(lineItemSchema).min(1),
  description: z.string().optional(),
  expiresInDays: z.number().min(1).max(30).default(7),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = createLinkSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const result = await createGhlPaymentLink(validation.data, user.id);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    // TODO: Integrate with actual GHL API to create payment link
    // For now, we store the record and return success
    // In production, this would call the GHL Payment Links API
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating GHL payment link:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
