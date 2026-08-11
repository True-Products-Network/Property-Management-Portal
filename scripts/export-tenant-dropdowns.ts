// Export dropdowns from a reference tenant for seeding
// Run with: npx tsx scripts/export-tenant-dropdowns.ts

import { createClient } from "@/lib/supabase/server";

async function exportDropdowns() {
  const supabase = await createClient();

  // Find the Test-True Products Network tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name")
    .eq("name", "Test-True Products Network")
    .single();

  if (tenantError || !tenant) {
    console.error("Tenant not found:", tenantError);
    process.exit(1);
  }

  console.log(`Exporting dropdowns from: ${tenant.name} (${tenant.id})`);

  // Get all dropdown_settings for this tenant
  const { data: dropdowns, error } = await supabase
    .from("dropdown_settings")
    .select("record_type, field_name, value, label, sort_order, is_active")
    .eq("tenant_id", tenant.id)
    .order("record_type")
    .order("field_name")
    .order("sort_order");

  if (error) {
    console.error("Error fetching dropdowns:", error);
    process.exit(1);
  }

  console.log(`\nFound ${dropdowns?.length || 0} dropdown values\n`);

  // Group by record_type and field_name
  const grouped = dropdowns?.reduce((acc, item) => {
    const key = `${item.record_type}.${item.field_name}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<string, typeof dropdowns>);

  // Output as TypeScript code for tenant-seed.ts
  console.log("// Copy this into lib/platform/tenant-seed.ts");
  console.log("const DEFAULT_DROPDOWNS: Record<string, Array<{ value: string; label: string; sortOrder: number; fieldName?: string }>> = {");

  for (const [key, items] of Object.entries(grouped || {})) {
    const [recordType, fieldName] = key.split(".");
    console.log(`  "${recordType}": [`);
    for (const item of items) {
      console.log(`    { value: "${item.value}", label: "${item.label}", sortOrder: ${item.sort_order}, fieldName: "${item.field_name}" },`);
    }
    console.log(`  ],`);
  }

  console.log("};");
}

exportDropdowns();
Vendor Company,Vendor Type,snow_removal,Snow Removal,14,true
Vendor Company,Vendor Type,other,Other,15,true
