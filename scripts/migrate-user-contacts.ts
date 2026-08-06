#!/usr/bin/env tsx
/**
 * Migration Script: Create missing contact records for existing users
 * 
 * This script finds all users who:
 * 1. Are in tenant_users (belong to a tenant)
 * 2. Don't have a corresponding contact record
 * 
 * And creates contact records for them with:
 * - tenant_id set
 * - portal_user_id linked
 * - allow_login = true for admin users
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function migrateUserContacts() {
  console.log('Starting user contacts migration...\n');

  // Get all tenant_users with their tenant info
  const { data: tenantUsers, error: tuError } = await supabase
    .from('tenant_users')
    .select('user_id, tenant_id, role, is_primary_admin');

  if (tuError) {
    console.error('Error fetching tenant_users:', tuError);
    return;
  }

  console.log(`Found ${tenantUsers?.length || 0} tenant user relationships`);

  // Get all existing contacts with portal_user_id
  const { data: existingContacts, error: ecError } = await supabase
    .from('contacts')
    .select('portal_user_id, tenant_id');

  if (ecError) {
    console.error('Error fetching existing contacts:', ecError);
    return;
  }

  // Create a set of existing portal_user_ids for quick lookup
  const existingPortalUserIds = new Set(
    existingContacts?.map(c => c.portal_user_id).filter(Boolean) || []
  );

  console.log(`Found ${existingPortalUserIds.size} existing contact records`);

  // Find users without contacts
  const usersNeedingContacts = tenantUsers?.filter(
    tu => !existingPortalUserIds.has(tu.user_id)
  ) || [];

  console.log(`Found ${usersNeedingContacts.length} users needing contact records\n`);

  // Get auth user details for each missing contact
  const { data: authUsers, error: auError } = await supabase.auth.admin.listUsers();

  if (auError) {
    console.error('Error fetching auth users:', auError);
    return;
  }

  const authUserMap = new Map(
    authUsers?.users?.map(u => [u.id, u]) || []
  );

  // Create contact records
  let created = 0;
  let failed = 0;

  for (const tu of usersNeedingContacts) {
    const authUser = authUserMap.get(tu.user_id);
    
    if (!authUser) {
      console.log(`Skipping ${tu.user_id} - no auth user found`);
      continue;
    }

    const metadata = authUser.user_metadata || {};
    const firstName = metadata.first_name || metadata.full_name?.split(' ')[0] || 'Unknown';
    const lastName = metadata.last_name || metadata.full_name?.split(' ').slice(1).join(' ') || 'User';
    const phone = metadata.phone || null;

    // Determine if user should have allow_login = true
    const isAdmin = tu.role === 'admin' || tu.is_primary_admin || 
                    metadata.roles?.includes('ADMIN_USER') ||
                    metadata.portal_role === 'admin_user';

    const contactData = {
      contact_id: `CNT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      first_name: firstName,
      last_name: lastName,
      email: authUser.email,
      phone: phone,
      email_permission: true,
      tenant_id: tu.tenant_id,
      portal_user_id: tu.user_id,
      allow_login: isAdmin,
      portal_invitation_status: isAdmin ? 'ACTIVE' : 'INVITED',
    };

    const { error: insertError } = await supabase
      .from('contacts')
      .insert(contactData);

    if (insertError) {
      console.error(`Failed to create contact for ${authUser.email}:`, insertError.message);
      failed++;
    } else {
      console.log(`✓ Created contact for ${authUser.email} (admin: ${isAdmin})`);
      created++;
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`Created: ${created}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total processed: ${usersNeedingContacts.length}`);
}

migrateUserContacts().catch(console.error);
