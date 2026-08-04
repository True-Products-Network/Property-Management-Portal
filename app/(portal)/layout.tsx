import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { PortalShell } from "@/components/shell/PortalShell";
import { getPrimaryRole } from "@/lib/permissions/roles";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) {
    redirect("/sign-in");
  }

  const primaryRole = getPrimaryRole(user.roles);
  
  // Check for support session cookie
  const cookieStore = await cookies();
  const supportSessionId = cookieStore.get("support_session_id")?.value;
  
  // If no primary role but has support session, allow access (support mode)
  if (!primaryRole && !supportSessionId) {
    redirect("/access-denied");
  }

  // Use support role if in support mode, otherwise use primary role
  const effectiveRole = primaryRole || "ADMIN_USER";
  const displayName = supportSessionId 
    ? `Support (${user.email})`
    : `User ${user.id.slice(-4)}`;

  return (
    <PortalShell
      role={effectiveRole}
      userName={displayName}
      userEmail={user.email}
      notificationCount={0}
    >
      {children}
    </PortalShell>
  );
}
