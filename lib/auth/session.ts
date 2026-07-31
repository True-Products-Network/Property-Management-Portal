import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { SessionUser } from "@/schemas/portal/auth";

const SESSION_COOKIE = "portal_session";
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

// Use environment variable in production
const SECRET = new TextEncoder().encode(
  process.env.APP_SECRET || "default-secret-change-in-production"
);

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.user as SessionUser;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const user = await requireAuth();
  const hasRole = user.roles.some((role) => allowedRoles.includes(role));
  if (!hasRole) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  return requireRole(["ADMIN_USER"]);
}
