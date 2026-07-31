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
          redirect_url: getRedirectUrl(role),
        },
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { message: signUpError.message },
        { status: 400 }
      );
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

function getRedirectUrl(role: string): string {
  switch (role) {
    case "ADMIN_USER":
    case "MANAGEMENT_STAFF":
      return "/management/overview";
    case "BOARD_MEMBER":
      return "/board";
    case "OWNER":
    case "RESIDENT":
      return "/owner";
    case "VENDOR":
      return "/vendor";
    default:
      return "/management/overview";
  }
}
