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
record_type,field_name,value,label,sort_order,is_active
Approval,Approval Type,maintenance,Maintenance Approval,1,true
Approval,Approval Type,capital_improvement,Capital Improvement,2,true
Approval,Approval Type,vendor_contract,Vendor Contract,3,true
Approval,Approval Type,budget_item,Budget Item,4,true
Approval,Approval Type,policy_change,Policy Change,5,true
Approval,Approval Type,special_assessment,Special Assessment,6,true
Approval,Approval Type,vendor_selection,Vendor Selection,7,true
Approval,Approval Type,contract_approval,Contract Approval,8,true
Approval,Approval Type,capital_expense,Capital Expense,9,true
Approval,Approval Type,other,Other,10,true
Association Company,Association Status,prospect,Prospect,1,true
Association Company,Association Status,onboarding,Onboarding,2,true
Association Company,Association Status,active,Active,3,true
Association Company,Association Status,on_hold,On-Hold,4,true
Association Company,Association Status,ending_management,Ending Management,5,true
Association Company,Association Status,inactive,Inactive,6,true
Association Company,Association Type,condominium,Condominium,1,true
Association Company,Association Type,hoa,HOA (Homeowners Association),2,true
Association Company,Association Type,cooperative,Cooperative,3,true
Association Company,Association Type,commercial,Commercial,4,true
Association Company,Association Type,mixed_use,Mixed Use,5,true
Association Company,Association Type,other,Other,6,true
Compliance Matter,Compliance Status,open,Open,1,true
Compliance Matter,Compliance Status,notice_issued,Notice Issued,2,true
Compliance Matter,Compliance Status,evidence_gathering,Evidence Gathering,3,true
Compliance Matter,Compliance Status,hearing_scheduled,Hearing Scheduled,4,true
Compliance Matter,Compliance Status,under_review,Under Review,5,true
Compliance Matter,Compliance Status,decision_pending,Decision Pending,6,true
Compliance Matter,Compliance Status,resolved,Resolved,7,true
Compliance Matter,Compliance Status,closed,Closed,8,true
Compliance Matter,Compliance Status,appealed,Appealed,9,true
Contact,role,admin_user,Admin User,1,true
Contact,role,association_manager,Association Manager,2,true
Contact,role,board_member,Board Member,3,true
Contact,role,finance_user,Finance User,4,true
Contact,role,owner,Owner,5,true
Contact,role,portfolio_manager,Portfolio Manager,6,true
Contact,role,resident,Resident,7,true
Contact,role,staff,Staff,8,true
Contact,role,vendor_contractor,Vendor Contractor,9,true
Contact,role,property_manager,Property Manager,10,true
Contact,role,emergency_contact,Emergency Contact,11,true
Contact,role,inspector,Inspector,12,true
Contact,role,co_owner,Co-Owner,13,true
Contact,role,maintenance_contact,Maintenance Contact,14,true
Contact,role,other,Other,15,true
Document Record,Document Type,insurance,Insurance,1,true
Document Record,Document Type,financial,Financial,2,true
Document Record,Document Type,legal,Legal,3,true
Document Record,Document Type,meeting_minutes,Meeting Minutes,4,true
Document Record,Document Type,contract,Contract,5,true
Document Record,Document Type,inspection_report,Inspection Report,6,true
Document Record,Document Type,certificate,Certificate,7,true
Document Record,Document Type,policy,Policy,8,true
Document Record,Document Type,notice,Notice,9,true
Document Record,Document Type,other,Other,10,true
Inspection,Inspection Status,scheduled,Scheduled,1,true
Inspection,Inspection Status,in_progress,In Progress,2,true
Inspection,Inspection Status,completed,Completed,3,true
Inspection,Inspection Status,overdue,Overdue,4,true
Inspection,Inspection Status,cancelled,Cancelled,5,true
Inspection,Inspection Status,rescheduled,Rescheduled,6,true
Inspection,Inspection Type,routine,Routine,1,true
Inspection,Inspection Type,move_in,Move In,2,true
Inspection,Inspection Type,move_out,Move Out,3,true
Inspection,Inspection Type,annual,Annual,4,true
Inspection,Inspection Type,fire_safety,Fire Safety,5,true
Inspection,Inspection Type,elevator,Elevator,6,true
Inspection,Inspection Type,hvac,HVAC,7,true
Inspection,Inspection Type,roof,Roof,8,true
Inspection,Inspection Type,pool,Pool,9,true
Inspection,Inspection Type,emergency_systems,Emergency Systems,10,true
Inspection,Inspection Type,insurance,Insurance,11,true
Inspection,Inspection Type,other,Other,12,true
Inspection,Overall Result,excellent,Excellent,1,true
Inspection,Overall Result,good,Good,2,true
Inspection,Overall Result,fair,Fair,3,true
Inspection,Overall Result,poor,Poor,4,true
Inspection,Overall Result,critical,Critical,5,true
Maintenance Request,Category,repair,Repair,1,true
Maintenance Request,Category,hvac,HVAC,1,true
Maintenance Request,Category,plumbing,Plumbing,2,true
Maintenance Request,Category,electrical,Electrical,3,true
Maintenance Request,Category,appliance,Appliance,4,true
Maintenance Request,Category,structural,Structural,5,true
Maintenance Request,Category,cosmetic,Cosmetic,6,true
Maintenance Request,Category,safety,Safety,7,true
Maintenance Request,Category,cleaning,Cleaning,8,true
Maintenance Request,Category,landscaping,Landscaping,9,true
Maintenance Request,Category,other,Other,10,true
Maintenance Request,Current Status,new,New,1,true
Maintenance Request,Current Status,triaged,Triaged,2,true
Maintenance Request,Current Status,pending_approval,Pending Approval,3,true
Maintenance Request,Current Status,approved,Approved,4,true
Maintenance Request,Current Status,vendor_assigned,Vendor Assigned,5,true
Maintenance Request,Current Status,scheduled,Scheduled,6,true
Maintenance Request,Current Status,in_progress,In Progress,7,true
Maintenance Request,Current Status,on_hold,On Hold,8,true
Maintenance Request,Current Status,completed,Completed,9,true
Maintenance Request,Current Status,closed,Closed,10,true
Maintenance Request,Current Status,cancelled,Cancelled,11,true
Maintenance Request,Urgency,emergency,Emergency,1,true
Maintenance Request,Urgency,urgent,Urgent,2,true
Maintenance Request,Urgency,normal,Normal,3,true
Maintenance Request,Urgency,low,Low,4,true
People,Board Position,not_a_board_member,Not a Board Member,0,true
People,Board Position,president,President,1,true
People,Board Position,vice_president,Vice President,2,true
People,Board Position,treasurer,Treasurer,3,true
People,Board Position,secretary,Secretary,4,true
People,Board Position,member_at_large,Member,5,true
People,Board Position,committee_chair,Committee Chair,6,true
People,Preferred Contact Method,email,Email,1,true
People,Preferred Contact Method,phone,Phone,2,true
People,Preferred Contact Method,sms,SMS/Text,3,true
People,Preferred Contact Method,mail,Mail,4,true
Property,Property Status,active,Active,1,true
Property,Property Status,inactive,Inactive,2,true
Property,Property Status,under_construction,Under Construction,3,true
Property,Property Status,pending_sale,Pending Sale,4,true
Property,Property Type,condominium,Condominium,1,true
Property,Property Type,apartment,Apartment,2,true
Property,Property Type,Townhouse,Townhouse,3,true
Property,Property Type,single_family,Single Family,4,true
Property,Property Type,commercial,Commercial,5,true
Property,Property Type,mixed_use,Mixed Use,6,true
Unit,Occupancy Status,occupied,Occupied,1,true
Unit,Occupancy Status,owner_occupied,Owner Occupied,1,true
Unit,Occupancy Status,tenant_occupied,Tenant Occupied,2,true
Unit,Occupancy Status,vacant,Vacant,3,true
Unit,Rental Status,rented,Rented,1,true
Unit,Rental Status,available,Available,2,true
Unit,Rental Status,not_for_rent,Not For Rent,3,true
Unit,type,studio,Studio,1,true
Unit,type,1_bedroom,1 Bedroom,2,true
Unit,type,2_bedroom,2 Bedroom,3,true
Unit,type,3_bedroom,3 Bedroom,4,true
Unit,type,4_bedroom,4+ Bedroom,5,true
Unit,type,penthouse,Penthouse,6,true
Unit,type,loft,Loft,7,true
Unit,type,Townhouse,Townhouse,8,true
Vendor Company,Vendor Status,active,Active,1,true
Vendor Company,Vendor Status,inactive,Inactive,2,true
Vendor Company,Vendor Status,pending_approval,Pending Approval,3,true
Vendor Company,Vendor Status,suspended,Suspended,4,true
Vendor Company,Vendor Type,construction,Construction,0,true
Vendor Company,Vendor Type,hvac,HVAC,1,true
Vendor Company,Vendor Type,plumbing,Plumbing,2,true
Vendor Company,Vendor Type,electrical,Electrical,3,true
Vendor Company,Vendor Type,landscaping,Landscaping,4,true
Vendor Company,Vendor Type,cleaning,Cleaning,5,true
Vendor Company,Vendor Type,security,Security,6,true
Vendor Company,Vendor Type,pest_control,Pest Control,7,true
Vendor Company,Vendor Type,roofing,Roofing,8,true
Vendor Company,Vendor Type,painting,Painting,9,true
Vendor Company,Vendor Type,general_contracting,General Contracting,10,true
Vendor Company,Vendor Type,elevator,Elevator,11,true
Vendor Company,Vendor Type,fire_safety,Fire Safety,12,true
Vendor Company,Vendor Type,pool_service,Pool Service,13,true
Vendor Company,Vendor Type,snow_removal,Snow Removal,14,true
Vendor Company,Vendor Type,other,Other,15,true
