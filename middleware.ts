import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  // Protect portal routes
  if (request.nextUrl.pathname.startsWith("/management") ||
      request.nextUrl.pathname.startsWith("/admin") ||
      request.nextUrl.pathname.startsWith("/owner") ||
      request.nextUrl.pathname.startsWith("/board") ||
      request.nextUrl.pathname.startsWith("/vendor")) {
    if (!user) {
      return Response.redirect(new URL("/sign-in", request.url));
    }
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Check if user has admin role via custom claims or database
    // This will be handled by the page components for now
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
