import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PortalRole } from "@/schemas/portal/auth";
import { isAdmin } from "@/lib/permissions/roles";
import { AssociationProvider } from "@/lib/contexts/AssociationContext";
import { BrandingProvider } from "@/lib/contexts/BrandingContext";

interface PortalShellProps {
  children: React.ReactNode;
  role: PortalRole;
  userName: string;
  userEmail: string;
  notificationCount?: number;
  tenantId?: string;
}

export function PortalShell({
  children,
  role,
  userName,
  userEmail,
  notificationCount = 0,
  tenantId,
}: PortalShellProps) {
  const userIsAdmin = isAdmin([role]);

  return (
    <AssociationProvider>
      <BrandingProvider tenantId={tenantId}>
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
      </BrandingProvider>
    </AssociationProvider>
  );
}
