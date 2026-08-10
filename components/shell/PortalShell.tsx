import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { isAdmin } from "@/lib/permissions/roles";
import { AssociationProvider } from "@/lib/contexts/AssociationContext";
import { BrandingProvider } from "@/lib/contexts/BrandingContext";

interface Tenant {
  id: string;
  name: string;
  role: string;
}

interface PortalShellProps {
  children: React.ReactNode;
  role: string;
  userName: string;
  userEmail: string;
  notificationCount?: number;
  tenantId?: string;
  tenants?: Tenant[];
}

export function PortalShell({
  children,
  role,
  userName,
  userEmail,
  notificationCount = 0,
  tenantId,
  tenants = [],
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
              tenants={tenants}
              currentTenantId={tenantId}
            />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </BrandingProvider>
    </AssociationProvider>
  );
}
