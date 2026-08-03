// Platform Console Layout
// For True Products Network Platform Admin and Support users only

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlatformSidebar } from "@/components/platform/PlatformSidebar";
import { PlatformHeader } from "@/components/platform/PlatformHeader";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform-login");
  }
  
  // Check if user is platform admin or support
  const { data: platformRole } = await supabase
    .from("platform_user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .single();
  
  if (!platformRole) {
    redirect("/unauthorized");
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <PlatformHeader user={user} role={platformRole.role} />
      <div className="flex">
        <PlatformSidebar />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
