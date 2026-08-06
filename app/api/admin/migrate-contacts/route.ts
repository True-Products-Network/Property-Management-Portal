import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// POST /api/admin/migrate-contacts - Create missing contact records for existing users
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: platformRole } = await supabase
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", authUser.id)
      .is("revoked_at", null)
      .maybeSingle();
    
    const isPlatformAdmin = platformRole?.role === "PLATFORM_ADMIN" || 
                            authUser.user_metadata?.is_platform_admin === true;
    
    if (!isPlatformAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden - Platform admin required" }, { status: 403 });
    }

    const serviceClient = createServiceClient();

    // Get all tenant_users
    console.log("[Migration] Starting migration, checking auth...");

    const { data: tenantUsers, error: tuError } = await serviceClient
      .from('tenant_users')
      .select('user_id, tenant_id, role, is_primary_admin');

    console.log("[Migration] Tenant users:", tenantUsers?.length, "Error:", tuError);

    if (tuError) {
      return NextResponse.json({ success: false, error: tuError.message }, { status: 500 });
    }

    // Get existing contacts
    const { data: existingContacts, error: ecError } = await serviceClient
      .from('contacts')
      .select('portal_user_id');

    if (ecError) {
      return NextResponse.json({ success: false, error: ecError.message }, { status: 500 });
    }

    const existingPortalUserIds = new Set(
      existingContacts?.map(c => c.portal_user_id).filter(Boolean) || []
    );

    // Find users without contacts
    const usersNeedingContacts = tenantUsers?.filter(
      tu => !existingPortalUserIds.has(tu.user_id)
    ) || [];

    // Get auth users
    const { data: authUsers, error: auError } = await serviceClient.auth.admin.listUsers();

    if (auError) {
      return NextResponse.json({ success: false, error: auError.message }, { status: 500 });
    }

    const authUserMap = new Map(
      authUsers?.users?.map(u => [u.id, u]) || []
    );

    // Create contacts
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const tu of usersNeedingContacts) {
      const user = authUserMap.get(tu.user_id);
      
      if (!user) {
        errors.push(`Skipping ${tu.user_id} - no auth user found`);
        continue;
      }

      const metadata = user.user_metadata || {};
      const firstName = metadata.first_name || metadata.full_name?.split(' ')[0] || 'Unknown';
      const lastName = metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || 'User';
      const phone = metadata.phone || null;
      const isAdmin = tu.role === 'admin' || tu.is_primary_admin;

      // Check if portal_user exists, create if not
      const { data: existingPortalUser } = await serviceClient
        .from('portal_users')
        .select('id')
        .eq('id', tu.user_id)
        .maybeSingle();

      if (!existingPortalUser) {
        // Create portal_user record first
        const { error: puError } = await serviceClient
          .from('portal_users')
          .insert({
            id: tu.user_id,
            email: user.email,
            ghl_contact_id: `GHL-${Date.now()}`,
            status: 'ACTIVE',
          });
        
        if (puError) {
          console.error(`[Migration] Failed to create portal_user for ${user.email}:`, puError);
          errors.push(`Failed portal_user ${user.email}: ${puError.message}`);
          failed++;
          continue;
        }
        console.log(`[Migration] Created portal_user for ${user.email}`);
      }

      const { error: insertError } = await serviceClient
        .from('contacts')
        .insert({
          contact_id: `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          first_name: firstName,
          last_name: lastName,
          email: user.email,
          phone: phone,
          email_permission: true,
          tenant_id: tu.tenant_id,
          portal_user_id: tu.user_id,
          allow_login: isAdmin,
          portal_invitation_status: isAdmin ? 'active' : 'invited',
        });

      if (insertError) {
        console.error(`[Migration] Failed to create contact for ${user.email}:`, insertError);
        errors.push(`Failed ${user.email}: ${insertError.message} (code: ${insertError.code})`);
        failed++;
      } else {
        console.log(`[Migration] Created contact for ${user.email}`);
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalTenantUsers: tenantUsers?.length || 0,
        existingContacts: existingPortalUserIds.size,
        needingContacts: usersNeedingContacts.length,
        created,
        failed,
        errors: errors.slice(0, 10), // Limit errors in response
      }
    });

  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
