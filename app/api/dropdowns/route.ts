// Public Dropdown Values API
// Returns dropdown values for specific record types and fields
// No admin authentication required - read-only access to active values

import { NextRequest, NextResponse } from "next/server";
import { getDropdownValues } from "@/lib/api/dropdowns";

// GET /api/dropdowns?recordType=contact&fieldName=role
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordType = searchParams.get("recordType");
    const fieldName = searchParams.get("fieldName");

    if (!recordType || !fieldName) {
      return NextResponse.json(
        { success: false, error: "recordType and fieldName are required" },
        { status: 400 }
      );
    }

    const result = await getDropdownValues(recordType, fieldName);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    // Return simplified format for dropdown consumption
    const simplified = result.data?.map((item) => ({
      value: item.value,
      label: item.label,
    }));

    return NextResponse.json({ success: true, data: simplified });
  } catch (error) {
    console.error("Error in GET /api/dropdowns:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
