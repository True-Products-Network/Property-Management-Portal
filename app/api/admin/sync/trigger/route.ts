// Admin API: Trigger manual sync
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/permissions/roles";
import { queueSync, pushToGHL, pullFromGHL } from "@/lib/ghl/sync-engine";
import { EntityType } from "@/lib/ghl/field-mapper";

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user || !isAdmin(user.roles)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { entityType, entityId, direction, ghlId } = body;

    if (!entityType || !entityId || !direction) {
      return NextResponse.json(
        { error: "Missing required fields: entityType, entityId, direction" },
        { status: 400 }
      );
    }

    if (!["push", "pull"].includes(direction)) {
      return NextResponse.json(
        { error: "Direction must be 'push' or 'pull'" },
        { status: 400 }
      );
    }

    const validEntityTypes: EntityType[] = ["contact", "association", "property", "unit"];
    if (!validEntityTypes.includes(entityType)) {
      return NextResponse.json(
        { error: `Invalid entity type. Must be one of: ${validEntityTypes.join(", ")}` },
        { status: 400 }
      );
    }

    let result;
    if (direction === "push") {
      result = await pushToGHL(entityType as EntityType, entityId);
    } else {
      if (!ghlId) {
        return NextResponse.json(
          { error: "ghlId is required for pull operations" },
          { status: 400 }
        );
      }
      result = await pullFromGHL(entityType as EntityType, ghlId);
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced ${entityType}:${entityId} ${direction === "push" ? "to" : "from"} GHL`,
        ghlId: result.ghlId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Admin Sync] Error triggering sync:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
