// Business isolation context helpers
// Manages business data isolation for multi-company SaaS

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface Business {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings: Record<string, any>;
}

// Get current user's business from session
export async function getCurrentBusiness(): Promise<Business | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  // Get business from user metadata
  const businessId = user.user_metadata?.business_id;
  if (!businessId) return null;
  
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();
  
  return business;
}

// Get business ID for current user
export async function getCurrentBusinessId(): Promise<string | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  return user.user_metadata?.business_id || null;
}

// Set business for user (admin only)
export async function setUserBusiness(userId: string, businessId: string): Promise<boolean> {
  const supabase = createServiceClient();
  
  // Update user metadata
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: { business_id: businessId }
  });
  
  if (error) {
    console.error("Error setting user business:", error);
    return false;
  }
  
  // Add to business_users junction
  await supabase
    .from("business_users")
    .upsert({
      business_id: businessId,
      user_id: userId,
      role: "member"
    }, { onConflict: "business_id,user_id" });
  
  return true;
}

// Create new business
export async function createBusiness(
  name: string,
  slug: string,
  adminUserId: string
): Promise<{ success: boolean; business?: Business; error?: string }> {
  const supabase = createServiceClient();
  
  try {
    // Create business
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .insert({ name, slug, status: "active" })
      .select()
      .single();
    
    if (businessError) throw businessError;
    
    // Add admin user to business
    await supabase
      .from("business_users")
      .insert({
        business_id: business.id,
        user_id: adminUserId,
        role: "admin"
      });
    
    // Set business in user metadata
    await supabase.auth.admin.updateUserById(adminUserId, {
      user_metadata: { business_id: business.id }
    });
    
    return { success: true, business };
  } catch (error) {
    console.error("Error creating business:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

// Check if user belongs to business
export async function userBelongsToBusiness(userId: string, businessId: string): Promise<boolean> {
  const supabase = createServiceClient();
  
  const { data } = await supabase
    .from("business_users")
    .select("id")
    .eq("user_id", userId)
    .eq("business_id", businessId)
    .single();
  
  return !!data;
}
