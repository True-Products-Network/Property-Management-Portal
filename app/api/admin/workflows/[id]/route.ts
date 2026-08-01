import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/admin/workflows/[id] - Update workflow
export async function PUT(
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

    const body = await request.json();
    const { code, ghlWorkflowName, ghlWorkflowId, trigger, active, messageTemplate, reminderTiming, escalationOwner, description } = body;

    // Get current workflow for audit
    const { data: currentWorkflow } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .single();

    // Update workflow
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .update({
        code: code?.trim(),
        ghl_workflow_name: ghlWorkflowName?.trim(),
        ghl_workflow_id: ghlWorkflowId?.trim(),
        trigger: trigger?.trim(),
        active: active,
        message_template: messageTemplate?.trim(),
        reminder_timing: reminderTiming?.trim(),
        escalation_owner: escalationOwner?.trim(),
        description: description?.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (workflowError) {
      console.error("Error updating workflow:", workflowError);
      return NextResponse.json({ error: "Failed to update workflow" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "WORKFLOW_UPDATED",
      entity_type: "workflow",
      entity_id: id,
      details: {
        code,
        changes: {
          before: currentWorkflow,
          after: workflow,
        },
      },
    });

    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    console.error("Error in PUT /api/admin/workflows/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/workflows/[id] - Delete workflow
export async function DELETE(
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

    // Get workflow details for audit
    const { data: workflow } = await supabase
      .from("workflows")
      .select("code, ghl_workflow_name")
      .eq("id", id)
      .single();

    // Delete workflow
    const { error: deleteError } = await supabase
      .from("workflows")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting workflow:", deleteError);
      return NextResponse.json({ error: "Failed to delete workflow" }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "WORKFLOW_DELETED",
      entity_type: "workflow",
      entity_id: id,
      details: {
        code: workflow?.code,
        ghl_workflow_name: workflow?.ghl_workflow_name,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/admin/workflows/[id]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
