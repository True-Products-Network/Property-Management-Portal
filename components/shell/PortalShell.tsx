import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PortalRole } from "@/schemas/portal/auth";

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
  return (
    <div className="min-h-screen bg-[var(--page-background)]">
      {/* Sidebar */}
      <Sidebar role={role} userName={userName} userEmail={userEmail} />

      {/* Main Content */}
      <div className="ml-[var(--sidebar-width)] min-h-screen flex flex-col">
        <Header userName={userName} notificationCount={notificationCount} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
