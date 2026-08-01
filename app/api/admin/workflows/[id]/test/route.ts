import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/workflows/[id]/test - Test a workflow
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRoles = user.user_metadata?.roles || [];
    if (!userRoles.includes("ADMIN_USER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get workflow details
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .single();

    if (workflowError || !workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    // In a real implementation, this would trigger the actual GHL workflow
    // For now, we just update the last_test timestamp
    const { error: updateError } = await supabase
      .from("workflows")
      .update({
        last_test: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating workflow test timestamp:", updateError);
      return NextResponse.json({ error: "Failed to test workflow" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "WORKFLOW_TESTED",
      entity_type: "workflow",
      entity_id: id,
      details: {
        code: workflow.code,
        ghl_workflow_name: workflow.ghl_workflow_name,
      },
    });

    return NextResponse.json({ success: true, message: "Workflow test initiated" });
  } catch (error) {
    console.error("Error in POST /api/admin/workflows/[id]/test:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
