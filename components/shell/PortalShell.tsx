import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PortalRole } from "@/schemas/portal/auth";
import { isAdmin } from "@/lib/permissions/roles";
import { AssociationProvider } from "@/lib/contexts/AssociationContext";

interface PortalShellProps {
  children: React.ReactNode;
  role: PortalRole;
  userName: string;
  userEmail: string;
  notificationCount?: number;
}

export function PortalShell({
  children,
  role,
  userName,
  userEmail,
  notificationCount = 0,
}: PortalShellProps) {
  const userIsAdmin = isAdmin([role]);

  return (
    <AssociationProvider>
      <div className="min-h-screen bg-[var(--page-background)]">
        {/* Sidebar */}
        <Sidebar role={role} userName={userName} userEmail={userEmail} />

        {/* Main Content */}
        <div className="ml-[var(--sidebar-width)] min-h-screen flex flex-col">
          <Header
            userName={userName}
            userEmail={userEmail}
            notificationCount={notificationCount}
            isAdmin={userIsAdmin}
          />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AssociationProvider>
  );
}
