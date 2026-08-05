"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { signUpSchema, type SignUpInput } from "@/schemas/portal/auth";
import { createClient } from "@/lib/supabase/client";

const roles = [
  { value: "ADMIN_USER", label: "Admin User", description: "Full system access" },
  { value: "STAFF", label: "Staff", description: "Standard staff access" },
  { value: "PORTFOLIO_MANAGER", label: "Portfolio Manager", description: "Portfolio operations and management" },
  { value: "ASSOCIATION_MANAGER", label: "Association Manager", description: "Association management" },
  { value: "PROPERTY_MANAGER", label: "Property Manager", description: "Property management" },
  { value: "FINANCE_USER", label: "Finance User", description: "Financial access only" },
  { value: "OWNER", label: "Owner", description: "Property owner access" },
  { value: "RESIDENT", label: "Resident", description: "Tenant/occupant access" },
  { value: "BOARD_MEMBER", label: "Board Member", description: "Association board access" },
  { value: "VENDOR", label: "Vendor", description: "Contractor/vendor access" },
];

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdUser, setCreatedUser] = useState<{email: string; password: string} | null>(null);
  const [formData, setFormData] = useState<SignUpInput & { role: string; ghlContactId: string }>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "OWNER",
    ghlContactId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setCreatedUser(null);

    const result = signUpSchema.safeParse(formData);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/sign-in`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            roles: [formData.role],
            ghl_contact_id: formData.ghlContactId || `TEST-${Date.now()}`,
            // redirect_url is set server-side based on portal_roles configuration
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        setSuccess(true);
        setCreatedUser({ email: formData.email, password: formData.password });
        // Clear form
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          firstName: "",
          lastName: "",
          role: "OWNER",
          ghlContactId: "",
        });
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect URL is now determined server-side based on portal_roles configuration

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--primary-navy)] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-[var(--main-text)] mb-2">
              User Created!
            </h2>
            <p className="text-[var(--secondary-text)] mb-4">
              The user account has been successfully created in Supabase Auth.
            </p>
            
            {createdUser && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-medium text-amber-800 mb-2">Important:</p>
                <p className="text-sm text-amber-700 mb-2">
                  Check your Supabase Dashboard to confirm this user, or disable email confirmation in Auth settings.
                </p>
                <div className="text-xs text-amber-600 font-mono bg-amber-100 p-2 rounded">
                  Email: {createdUser.email}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => setSuccess(false)}
                className="btn btn-primary w-full"
              >
                Create Another User
              </button>
              <Link
                href="/sign-in"
                className="btn btn-secondary w-full block"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--primary-navy)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[var(--teal)] rounded-xl flex items-center justify-center">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="text-white">
              <h1 className="text-xl font-semibold">Associos</h1>
              <p className="text-sm text-white/60">Property Management</p>
            </div>
          </div>
        </div>

        {/* Sign Up Card */}
        <div className="card p-8">
          <h2 className="text-2xl font-semibold text-[var(--main-text)] mb-2">
            Create User Account
          </h2>
          <p className="text-[var(--secondary-text)] mb-6">
            Add a new user to the portal
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-[var(--error)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-[var(--main-text)] mb-1"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="input"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-[var(--main-text)] mb-1"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="input"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--main-text)] mb-1"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input"
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-[var(--main-text)] mb-1"
              >
                Portal Role
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="input"
                required
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                {roles.find((r) => r.value === formData.role)?.description}
              </p>
            </div>

            <div>
              <label
                htmlFor="ghlContactId"
                className="block text-sm font-medium text-[var(--main-text)] mb-1"
              >
                GHL Contact ID (Optional)
              </label>
              <input
                id="ghlContactId"
                type="text"
                value={formData.ghlContactId}
                onChange={(e) =>
                  setFormData({ ...formData, ghlContactId: e.target.value })
                }
                className="input"
                placeholder="TEST-CONTACT-001"
              />
              <p className="text-xs text-[var(--secondary-text)] mt-1">
                Leave empty to auto-generate
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--main-text)] mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="input pr-10"
                  placeholder="Min 8 characters"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--secondary-text)] hover:text-[var(--main-text)]"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[var(--main-text)] mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="input"
                placeholder="Confirm password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-2.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating User...
                </>
              ) : (
                "Create User"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--secondary-text)]">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-[var(--teal)] hover:text-[var(--teal-hover)]"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
