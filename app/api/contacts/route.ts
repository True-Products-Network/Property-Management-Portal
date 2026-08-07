// Contacts API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getContacts, createContact } from "@/lib/api/contacts";
import { isGhlConnected } from "@/lib/ghl/credentials";
import { pushToGHL } from "@/lib/ghl/sync-engine";
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
  // Extended fields for people form
  roles: z.array(z.string()).optional(),
  boardPosition: z.string().optional(),
  status: z.string().optional(),
  associationId: z.string().optional(),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  isPrimaryContact: z.boolean().optional(),
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
      portalUserId: searchParams.get("portalUserId") || undefined,
    };
    
    // Get tenant_id for filtering
    const supabaseClient = await createClient();
    const { data: { user: authUser } } = await supabaseClient.auth.getUser();
    let tenantId = authUser?.user_metadata?.tenant_id;
    if (!tenantId) {
      const { data: tenantUser } = await supabaseClient
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();
      tenantId = tenantUser?.tenant_id;
    }
    
    console.log("Contacts API: Fetching with params:", queryParams, "tenant:", tenantId);
    const result = await getContacts(queryParams, tenantId);

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
    console.log("[Contacts API] Received body:", JSON.stringify(body, null, 2));
    
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      console.error("[Contacts API] Validation failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    // Get tenant_id for the new contact
    const supabaseForTenant = await createClient();
    let tenantId = user.businessId;
    if (!tenantId) {
      const { data: tenantUser } = await supabaseForTenant
        .from("tenant_users")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();
      tenantId = tenantUser?.tenant_id;
    }

    console.log("[Contacts API] Creating contact with data:", validation.data, "userId:", user.id, "tenantId:", tenantId);
    const result = await createContact(validation.data, user.id, tenantId);
    console.log("[Contacts API] createContact result:", result);
    if (!result.success) {
      console.error("[Contacts API] createContact failed:", result.error);
      return NextResponse.json(result, { status: 400 });
    }

    // Check if GHL is connected
    const ghlConnected = await isGhlConnected();
    let ghlSyncResult = null;
    let ghlMessage = null;

    if (ghlConnected && result.data?.id) {
      // Sync to GHL
      try {
        ghlSyncResult = await pushToGHL("contact", result.data.id, tenantId);
        console.log("[Contacts API] GHL sync result:", ghlSyncResult);
      } catch (syncError) {
        console.error("[Contacts API] GHL sync failed:", syncError);
        ghlSyncResult = { success: false, error: "Sync failed" };
      }
    } else if (!ghlConnected) {
      ghlMessage = "GHL not connected. Contact admin to enable GHL integration for automatic sync.";
    }

    return NextResponse.json({
      ...result,
      ghlSync: ghlSyncResult,
      ghlMessage: ghlMessage,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
