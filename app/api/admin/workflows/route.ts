import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/workflows - List all workflows
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is platform admin
    let isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    if (!isPlatformAdmin) {
      const { data: platformRole } = await supabase
        .from("platform_user_roles")
        .select("role")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (platformRole?.role === "PLATFORM_ADMIN") {
        isPlatformAdmin = true;
      }
    }

    const userRoles = user.user_metadata?.roles || [];
    const isAdmin = userRoles.includes("ADMIN_USER") || isPlatformAdmin;
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user's tenant for business isolation
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .maybeSingle();
    
    const isTenantAdmin = tenantUser?.role === 'admin';
    const tenantId = tenantUser?.tenant_id;

    if (!isPlatformAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Fetch workflows from database - FILTERED BY TENANT
    let workflowsQuery = supabase
      .from("workflows")
      .select("*")
      .order("code");
    
    // Filter by tenant_id if not platform admin
    if (!isPlatformAdmin && tenantId) {
      workflowsQuery = workflowsQuery.eq("tenant_id", tenantId);
    }

    const { data: workflows, error } = await workflowsQuery;

    if (error) {
      console.error("Error fetching workflows:", error);
      return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: workflows || [] });
  } catch (error) {
    console.error("Error in GET /api/admin/workflows:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/workflows - Create new workflow
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is platform admin
    let isPlatformAdmin = user.user_metadata?.is_platform_admin === true;
    if (!isPlatformAdmin) {
      const { data: platformRole } = await supabase
        .from("platform_user_roles")
        .select("role")
        .eq("user_id", user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (platformRole?.role === "PLATFORM_ADMIN") {
        isPlatformAdmin = true;
      }
    }

    const userRoles = user.user_metadata?.roles || [];
    const isAdmin = userRoles.includes("ADMIN_USER") || isPlatformAdmin;
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get user's tenant for business isolation
    const { data: tenantUser } = await supabase
      .from("tenant_users")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .maybeSingle();
    
    const isTenantAdmin = tenantUser?.role === 'admin';
    const tenantId = tenantUser?.tenant_id;

    if (!isPlatformAdmin && !isTenantAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { code, ghlWorkflowName, ghlWorkflowId, trigger, active, messageTemplate, reminderTiming, escalationOwner, description } = body;

    if (!code?.trim() || !ghlWorkflowName?.trim()) {
      return NextResponse.json({ error: "Workflow code and name are required" }, { status: 400 });
    }

    // Insert workflow with tenant_id
    const { data: workflow, error: workflowError } = await supabase
      .from("workflows")
      .insert({
        code: code.trim(),
        ghl_workflow_name: ghlWorkflowName.trim(),
        ghl_workflow_id: ghlWorkflowId?.trim() || "",
        trigger: trigger?.trim() || "",
        active: active ?? true,
        message_template: messageTemplate?.trim() || "",
        reminder_timing: reminderTiming?.trim() || "none",
        escalation_owner: escalationOwner?.trim() || "",
        description: description?.trim() || "",
        run_count: 0,
        tenant_id: tenantId,
        created_by: user.id,
      })
      .select()
      .single();

    if (workflowError) {
      console.error("Error creating workflow:", workflowError);
      return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
    }

    // Create audit log entry with tenant_id
    await supabase.from("audit_logs").insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: "WORKFLOW_CREATED",
      entity_type: "workflow",
      entity_id: workflow.id,
      details: { code, ghl_workflow_name: ghlWorkflowName },
    });

    return NextResponse.json({ success: true, data: workflow });
  } catch (error) {
    console.error("Error in POST /api/admin/workflows:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
