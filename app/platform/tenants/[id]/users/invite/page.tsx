"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, UserPlus, Loader2, Mail, Phone, Shield } from "lucide-react";
import Link from "next/link";

interface InviteFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  sendInviteEmail: boolean;
}

export default function InviteUserPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof InviteFormData, string>>>({});
  const [formData, setFormData] = useState<InviteFormData>({
    email: "",
    firstName: "",
    lastName: "",
    role: "staff",
    phone: "",
    sendInviteEmail: true,
  });

  function validateForm(): boolean {
    const newErrors: Partial<Record<keyof InviteFormData, string>> = {};
    
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (!formData.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName?.trim()) newErrors.lastName = "Last name is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/platform/tenants/${tenantId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert(result.data.message);
        router.push(`/platform/tenants/${tenantId}`);
      } else {
        alert(result.error || "Failed to invite user");
      }
    } catch (error) {
      console.error("Error inviting user:", error);
      alert("An error occurred while inviting the user");
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(field: keyof InviteFormData, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/platform/tenants/${tenantId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenant
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Invite User</h1>
          </div>
          <p className="text-gray-500 mt-1">
            Add a new user to this tenant account
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="user@company.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="John"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Doe"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Shield className="h-4 w-4 inline mr-1" />
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin_user">Admin User - Full access to tenant</option>
                <option value="portfolio_manager">Portfolio Manager - Portfolio Dashboard Overview</option>
                <option value="association_manager">Association Manager - Assigns Associations and Properties</option>
                <option value="property_manager">Property Manager - Assigns Units, People, and Vendors</option>
                <option value="board_member">Board Member - Board Dashboard</option>
                <option value="vendor">Vendor - Vendor Dashboard</option>
                <option value="resident_owner">Resident/Owner - Resident/Owner Dashboard</option>
                <option value="staff">Staff - Standard User Access</option>
                <option value="accountant">Accountant - Financial Access Only</option>
              </select>
            </div>

            {/* Send Invite Email */}
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="sendInvite"
                checked={formData.sendInviteEmail}
                onChange={(e) => handleChange("sendInviteEmail", e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label htmlFor="sendInvite" className="text-sm text-blue-900">
                Send invitation email to user
                <p className="text-xs text-blue-700 mt-0.5">
                  User will receive an email with instructions to set their password
                </p>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Link href={`/platform/tenants/${tenantId}`}>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
