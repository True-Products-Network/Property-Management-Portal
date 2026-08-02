// Multi-tenancy context helpers
// Manages tenant isolation for multi-business SaaS

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings: Record<string, any>;
}

// Get current user's tenant from session
export async function getCurrentTenant(): Promise<Tenant | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Get tenant from user metadata
  const tenantId = user.user_metadata?.tenant_id;
  if (!tenantId) return null;
  
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single();
  
  return tenant;
}

// Get tenant ID for current user
export async function getCurrentTenantId(): Promise<string | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  return user.user_metadata?.tenant_id || null;
}

// Set tenant for user (admin only)
export async function setUserTenant(userId: string, tenantId: string): Promise<boolean> {
  const supabase = createServiceClient();
  
  // Update user metadata
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { tenant_id: tenantId }
  });
  
  if (error) {
    console.error("Error setting user tenant:", error);
    return false;
  }
  
  // Add to tenant_users junction
  await supabase
    .from("tenant_users")
    .upsert({
      tenant_id: tenantId,
      user_id: userId,
      role: "member"
    }, { onConflict: "tenant_id,user_id" });
  
  return true;
}

// Create new tenant
export async function createTenant(
  name: string,
  slug: string,
  adminUserId: string
): Promise<{ success: boolean; tenant?: Tenant; error?: string }> {
  const supabase = createServiceClient();
  
  try {
    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({ name, slug, status: "active" })
      .select()
      .single();
    
    if (tenantError) throw tenantError;
    
    // Add admin user to tenant
    await supabase
      .from("tenant_users")
      .insert({
        tenant_id: tenant.id,
        user_id: adminUserId,
        role: "admin"
      });
    
    // Set tenant in user metadata
    await supabase.auth.admin.updateUserById(adminUserId, {
      user_metadata: { tenant_id: tenant.id }
    });
    
    return { success: true, tenant };
  } catch (error) {
    console.error("Error creating tenant:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// Check if user belongs to tenant
export async function userBelongsToTenant(userId: string, tenantId: string): Promise<boolean> {
  const supabase = createServiceClient();
  
  const { data } = await supabase
    .from("tenant_users")
    .select("id")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .single();
  
  return !!data;
}
