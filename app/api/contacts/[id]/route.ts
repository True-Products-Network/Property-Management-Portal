// Contact Detail API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getContact, updateContact, deleteContact } from "@/lib/api/contacts";
import { z } from "zod";

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  workPhone: z.string().optional(),
  preferredContactMethod: z.enum(["email", "phone", "sms", "mail"]).optional(),
  mailingPreference: z.enum(["email", "physical", "both"]).optional(),
  emailPermission: z.boolean().optional(),
  smsPermission: z.boolean().optional(),
  mailingAddressStreet: z.string().optional(),
  mailingAddressCity: z.string().optional(),
  mailingAddressState: z.string().optional(),
  mailingAddressZip: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await getContact(id);

    if (!result.success) return NextResponse.json(result, { status: 404 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    console.log("[Contacts PUT API] Received body:", JSON.stringify(body, null, 2));
    
    const validation = updateSchema.safeParse(body);

    if (!validation.success) {
      console.error("[Contacts PUT API] Validation failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    console.log("[Contacts PUT API] Updating contact:", id, "with data:", validation.data);
    const result = await updateContact(id, validation.data, user.id);
    console.log("[Contacts PUT API] Result:", result);
    
    if (!result.success) {
      console.error("[Contacts PUT API] Failed:", result.error);
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const result = await deleteContact(id);

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
