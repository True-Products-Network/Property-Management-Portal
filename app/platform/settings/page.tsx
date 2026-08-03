// Platform Settings Page

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Settings } from "lucide-react";
import Link from "next/link";

export default async function PlatformSettingsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/platform-login");
  }

  const { data: platformRole } = await supabase
    .from("platform_user_roles")
    .select("role")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .single();

  if (!platformRole || platformRole.role !== "PLATFORM_ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/platform">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500">Configure global platform settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Platform Name</Label>
              <Input defaultValue="Associos Platform" />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input defaultValue="support@trueproductsnetwork.com" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Support Session Duration (minutes)</Label>
              <Input type="number" defaultValue="60" />
            </div>
            <div className="space-y-2">
              <Label>Billing Grace Period (days)</Label>
              <Input type="number" defaultValue="7" />
            </div>
            <Button>Save Security Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
