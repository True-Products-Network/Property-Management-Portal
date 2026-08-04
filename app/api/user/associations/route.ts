// API route to fetch associations accessible to the current user
// GET /api/user/associations

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is platform admin (can see all associations)
    const { data: platformRole } = await supabase
      .from("platform_user_roles")
      .select("role")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .single();

    const isPlatformAdmin = platformRole?.role === "PLATFORM_ADMIN";

    let associations: { id: string; name: string; code: string }[] = [];

    if (isPlatformAdmin) {
      // Platform admins can see all associations
      const { data, error } = await supabase
        .from("associations")
        .select("id, name, association_id as code")
        .order("name");

      if (error) throw error;
      associations = data || [];
    } else {
      // Get user's contact record
      const { data: contact } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (contact) {
        // Get associations from contact relationships
        const { data: contactAssociations } = await supabase
          .from("contact_associations")
          .select("association_id")
          .eq("contact_id", contact.id);

        if (contactAssociations && contactAssociations.length > 0) {
          const associationIds = contactAssociations.map((ca: { association_id: string }) => ca.association_id);
          
          const { data, error } = await supabase
            .from("associations")
            .select("id, name, association_id as code")
            .in("id", associationIds)
            .order("name");

          if (error) throw error;
          associations = data || [];
        }

        // Also check if user has properties/units that link to associations
        const { data: contactProperties } = await supabase
          .from("contact_properties")
          .select("property_id")
          .eq("contact_id", contact.id);

        if (contactProperties && contactProperties.length > 0) {
          const propertyIds = contactProperties.map((cp: { property_id: string }) => cp.property_id);
          
          const { data: properties } = await supabase
            .from("properties")
            .select("association_id")
            .in("id", propertyIds);

          if (properties) {
            const propertyAssociationIds = properties
              .map((p: { association_id: string | null }) => p.association_id)
              .filter((id): id is string => !!id);
            
            const { data: propAssociations } = await supabase
              .from("associations")
              .select("id, name, association_id as code")
              .in("id", propertyAssociationIds)
              .order("name");

            if (propAssociations) {
              // Merge without duplicates
              const existingIds = new Set(associations.map(a => a.id));
              propAssociations.forEach(pa => {
                if (!existingIds.has(pa.id)) {
                  associations.push(pa);
                }
              });
            }
          }
        }
      }
    }

    // Sort by name
    associations.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ associations });

  } catch (error) {
    console.error("Error in GET /api/user/associations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
