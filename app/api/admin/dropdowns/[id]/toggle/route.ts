// Admin Dropdown Toggle Status Route
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toggleDropdownStatus } from "@/lib/api/dropdowns";
import { z } from "zod";

const toggleSchema = z.object({
  isActive: z.boolean(),
});

// Helper to check admin from JWT metadata
function checkAdminFromMetadata(user: any): { isAdmin: boolean; userId: string | null } {
  if (!user) return { isAdmin: false, userId: null };
  
  const roles = user.user_metadata?.roles;
  const hasAdminRole = Array.isArray(roles) && roles.includes("ADMIN_USER");
  const isAdmin = user.user_metadata?.is_admin === true || hasAdminRole;
  
  return { isAdmin, userId: user.id };
}

// POST /api/admin/dropdowns/[id]/toggle - Toggle active status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { isAdmin, userId } = checkAdminFromMetadata(user);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = toggleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const result = await toggleDropdownStatus(id, validation.data.isActive, userId!);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/admin/dropdowns/[id]/toggle:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
