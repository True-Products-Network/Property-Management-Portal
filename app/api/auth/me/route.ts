import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("first_name, last_name, email")
      .eq("id", user.id)
      .single();

    if (profileError) {
      // If no profile in users table, return basic auth data
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.user_metadata?.first_name || "",
          lastName: user.user_metadata?.last_name || "",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: profile?.first_name || user.user_metadata?.first_name || "",
        lastName: profile?.last_name || user.user_metadata?.last_name || "",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/auth/me:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
