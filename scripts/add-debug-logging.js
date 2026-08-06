// Script to add debug logging to API routes
const fs = require('fs');
const path = require('path');

const apis = [
  'app/api/maintenance/route.ts',
  'app/api/inspections/route.ts', 
  'app/api/documents/route.ts',
  'app/api/approvals/route.ts',
  'app/api/compliance/route.ts',
  'app/api/contacts/route.ts'
];

const debugPattern = (apiName) => `
    console.log("[${apiName} API] Received body:", JSON.stringify(body, null, 2));
    
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      console.error("[${apiName} API] Validation failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ success: false, error: "Validation failed", details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    console.log("[${apiName} API] Creating with data:", validation.data, "userId:", user.id);
    const result = await create${apiName.replace(/s$/, '').replace(/ie$/, 'y').replace(/e$/, '')}(validation.data, user.id);
    console.log("[${apiName} API] Result:", result);
    
    if (!result.success) {
      console.error("[${apiName} API] Failed:", result.error);
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[${apiName} API] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }`;

console.log('Debug logging pattern created. Manual editing required for each API.');
console.log('Files to update:', apis.join(', '));
