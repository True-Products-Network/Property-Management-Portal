// Contacts API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getContacts, createContact } from "@/lib/api/contacts";
import { z } from "zod";

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
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

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      console.error("Contacts API: No user session found");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || "last_name",
      sortOrder: (searchParams.get("sortOrder") || "asc") as "asc" | "desc",
    };
    
    console.log("Contacts API: Fetching with params:", queryParams);
    const result = await getContacts(queryParams);

    if (!result.success) {
      console.error("Contacts API: getContacts failed:", result.error);
      return NextResponse.json(result, { status: 400 });
    }
    
    console.log("Contacts API: Success, returned", result.data?.data?.length || 0, "contacts");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Contacts API: Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const result = await createContact(validation.data, user.id);
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
