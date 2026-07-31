"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewAssociationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    type: "Condominium",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    phone: "",
    email: "",
    fiscalYear: "",
    annualMeetingMonth: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/associations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create association");
      }

      router.push("/management/associations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/management/associations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Add Association</h1>
          <p className="text-[var(--secondary-text)]">Create a new association or community</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Association Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Association Name *
                </label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ridgeland Condominium Association"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Legal Name
                </label>
                <Input
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  placeholder="e.g., Ridgeland Condominium Association, Inc."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-color)] bg-white"
                >
                  <option value="Condominium">Condominium</option>
                  <option value="HOA">HOA</option>
                  <option value="Cooperative">Cooperative</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="board@example.org"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Fiscal Year
                </label>
                <Input
                  value={formData.fiscalYear}
                  onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                  placeholder="e.g., January - December"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  Annual Meeting Month
                </label>
                <select
                  value={formData.annualMeetingMonth}
                  onChange={(e) => setFormData({ ...formData, annualMeetingMonth: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-[var(--border-color)] bg-white"
                >
                  <option value="">Select month...</option>
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--main-text)]">
                Street Address
              </label>
              <Input
                value={formData.addressStreet}
                onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  City
                </label>
                <Input
                  value={formData.addressCity}
                  onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                  placeholder="Chicago"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  State
                </label>
                <Input
                  value={formData.addressState}
                  onChange={(e) => setFormData({ ...formData, addressState: e.target.value })}
                  placeholder="IL"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--main-text)]">
                  ZIP Code
                </label>
                <Input
                  value={formData.addressZip}
                  onChange={(e) => setFormData({ ...formData, addressZip: e.target.value })}
                  placeholder="60601"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-[var(--border-color)]">
              <Link href="/management/associations">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Association"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
