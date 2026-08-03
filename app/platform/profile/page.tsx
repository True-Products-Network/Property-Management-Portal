// Platform Admin Profile Page

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";

export default async function PlatformProfilePage() {
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

  if (!platformRole) {
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
        <h1 className="text-3xl font-bold text-gray-900">Platform Profile</h1>
        <p className="text-gray-500">Manage your platform administrator account</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={platformRole.role} disabled />
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user.id} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Password changes are managed through Supabase Auth.
            </p>
            <Button variant="outline" className="w-full">
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
