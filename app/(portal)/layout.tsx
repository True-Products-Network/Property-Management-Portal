import { redirect } from "next/navigation";
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
  if (!primaryRole) {
    redirect("/access-denied");
  }

  return (
    <PortalShell
      role={primaryRole}
      userName={`User ${user.id.slice(-4)}`}
      userEmail={user.email}
      notificationCount={0}
    >
      {children}
    </PortalShell>
  );
}
