// Communications API Routes
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getCommunications, createCommunication } from "@/lib/api/communications";
import { z } from "zod";

const createSchema = z.object({
  associationId: z.string().uuid(),
  subject: z.string().min(1),
  content: z.string().optional(),
  type: z.enum(["announcement", "notice", "reminder", "alert", "newsletter"]).optional(),
  sendToAll: z.boolean().optional(),
  scheduledAt: z.string().optional(),
  recipientIds: z.array(z.string().uuid()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const filters: Record<string, string> = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    
    const result = await getCommunications({
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      associationId: searchParams.get("associationId") || undefined,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    });

    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result);
  } catch (error) {
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

    const result = await createCommunication(validation.data, user.id);
    if (!result.success) return NextResponse.json(result, { status: 400 });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
