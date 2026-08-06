import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signUpSchema } from "@/schemas/portal/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = signUpSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, role, ghlContactId } = body;

    // Create Supabase admin client with service role to bypass email confirmation
    const supabase = await createClient();

    // Get redirect URL from database
    const redirectUrl = await getRedirectUrl(supabase, role);

    // Note: To create confirmed users without email verification,
    // you need to use the service role key in Supabase
    // For now, we'll create the user and they need to confirm via email
    // or you can disable email confirmation in Supabase Auth settings

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          roles: [role],
          ghl_contact_id: ghlContactId || `TEST-${Date.now()}`,
          redirect_url: redirectUrl,
        },
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { message: signUpError.message },
        { status: 400 }
      );
    }

    // Create portal_users record
    if (data.user) {
      const { error: portalError } = await supabase.from("portal_users").insert({
        id: data.user.id,
        ghl_contact_id: ghlContactId || `TEST-${Date.now()}`,
        email: email,
        is_admin: role === "ADMIN_USER",
        status: "ACTIVE",
      });

      if (portalError) {
        console.error("Failed to create portal_users record:", portalError);
        // Don't fail the signup, but log the error
      }

      // Create user_roles record
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: role,
        is_primary: true,
      });

      if (roleError) {
        console.error("Failed to create user_roles record:", roleError);
      }
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      message: "User created. Check Supabase Dashboard to confirm if email verification is enabled.",
    });
  } catch (error) {
    console.error("Sign up error:", error);
    return NextResponse.json(
      { message: "An error occurred during sign up" },
      { status: 500 }
    );
  }
}

async function getRedirectUrl(supabase: any, role: string): Promise<string> {
  // Fetch role configuration from roles table
  const { data: roleData } = await supabase
    .from("roles")
    .select("name")
    .eq("name", role)
    .single();

  if (roleData?.redirect_url) {
    return roleData.redirect_url;
  }

  // Default fallback based on role name patterns
  const roleLower = role.toLowerCase();
  if (roleLower.includes("board")) {
    return "/board";
  }
  if (roleLower.includes("owner") || roleLower.includes("resident")) {
    return "/owner";
  }
  if (roleLower.includes("vendor")) {
    return "/vendor";
  }

  // Default for all management roles
  return "/management/overview";
}
