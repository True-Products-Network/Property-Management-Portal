"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Truck, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { DropdownSelect } from "@/components/ui/DropdownSelect";

interface Vendor {
  id: string;
  companyName: string;
  doingBusinessAs?: string;
  category?: string;
  status: string;
  primaryContactName?: string;
  email?: string;
  phone?: string;
  emergencyPhone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  licenseNumber?: string;
  insuranceExpiry?: string;
  workersCompExpiry?: string;
}

interface FormData {
  companyName: string;
  doingBusinessAs: string;
  category: string;
  status: string;
  primaryContactName: string;
  email: string;
  phone: string;
  emergencyPhone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  licenseNumber: string;
  insuranceExpiry: string;
  workersCompExpiry: string;
}

export default function EditVendorPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    doingBusinessAs: "",
    category: "",
    status: "active",
    primaryContactName: "",
    email: "",
    phone: "",
    emergencyPhone: "",
    addressStreet: "",
    addressCity: "",
    addressState: "",
    addressZip: "",
    licenseNumber: "",
    insuranceExpiry: "",
    workersCompExpiry: "",
  });

  useEffect(() => {
    loadVendor();
  }, [vendorId]);

  async function loadVendor() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/vendors/${vendorId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load vendor");
      }
      
      const vendor: Vendor = result.data;
      setFormData({
        companyName: vendor.companyName || "",
        doingBusinessAs: vendor.doingBusinessAs || "",
        category: vendor.category || "",
        status: vendor.status || "active",
        primaryContactName: vendor.primaryContactName || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        emergencyPhone: vendor.emergencyPhone || "",
        addressStreet: vendor.addressStreet || "",
        addressCity: vendor.addressCity || "",
        addressState: vendor.addressState || "",
        addressZip: vendor.addressZip || "",
        licenseNumber: vendor.licenseNumber || "",
        insuranceExpiry: vendor.insuranceExpiry || "",
        workersCompExpiry: vendor.workersCompExpiry || "",
      });
    } catch (error) {
      console.error("Error loading vendor:", error);
      setError(error instanceof Error ? error.message : "Failed to load vendor");
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};
    
    if (!formData.companyName?.trim()) newErrors.companyName = "Company name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.phone?.trim()) newErrors.phone = "Phone is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          doingBusinessAs: formData.doingBusinessAs || undefined,
          category: formData.category,
          status: formData.status,
          primaryContactName: formData.primaryContactName || undefined,
          email: formData.email,
          phone: formData.phone,
          emergencyPhone: formData.emergencyPhone || undefined,
          addressStreet: formData.addressStreet || undefined,
          addressCity: formData.addressCity || undefined,
          addressState: formData.addressState || undefined,
          addressZip: formData.addressZip || undefined,
          licenseNumber: formData.licenseNumber || undefined,
          insuranceExpiry: formData.insuranceExpiry || undefined,
          workersCompExpiry: formData.workersCompExpiry || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          router.push(`/management/vendors/${vendorId}`);
        } else {
          alert(result.error || "Failed to update vendor");
        }
      } else {
        alert("Failed to update vendor");
      }
    } catch (error) {
      console.error("Error updating vendor:", error);
      alert("An error occurred while updating the vendor");
    } finally {
      setIsSaving(false);
    }
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <div className="flex gap-2">
          <Button onClick={loadVendor} variant="outline">
            Retry
          </Button>
          <Link href={`/management/vendors/${vendorId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/management/vendors/${vendorId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Edit Vendor</h1>
          <p className="text-[var(--secondary-text)] mt-1">Update vendor information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-[var(--teal)]" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="e.g., ABC Heating & Cooling"
                  className={errors.companyName ? "border-red-500" : ""}
                />
                {errors.companyName && <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Doing Business As
                </label>
                <Input
                  value={formData.doingBusinessAs}
                  onChange={(e) => handleChange("doingBusinessAs", e.target.value)}
                  placeholder="e.g., ABC HVAC"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Vendor Type <span className="text-red-500">*</span>
                </label>
                <DropdownSelect
                  recordType="Vendor"
                  fieldName="type"
                  value={formData.category}
                  onChange={(value) => handleChange("category", value)}
                  placeholder="Select Vendor Type"
                  className={errors.category ? "border-red-500" : ""}
                />
                {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Vendor Status
                </label>
                <DropdownSelect
                  recordType="Vendor"
                  fieldName="vendor_status"
                  value={formData.status}
                  onChange={(value) => handleChange("status", value)}
                  placeholder="Select Vendor Status"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Primary Contact Name
              </label>
              <Input
                value={formData.primaryContactName}
                onChange={(e) => handleChange("primaryContactName", e.target.value)}
                placeholder="e.g., John Smith"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="e.g., contact@abchvac.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="e.g., (555) 123-4567"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Emergency Phone
              </label>
              <Input
                type="tel"
                value={formData.emergencyPhone}
                onChange={(e) => handleChange("emergencyPhone", e.target.value)}
                placeholder="e.g., (555) 987-6543"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Street Address
              </label>
              <Input
                value={formData.addressStreet}
                onChange={(e) => handleChange("addressStreet", e.target.value)}
                placeholder="e.g., 1234 Business Ave"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  City
                </label>
                <Input
                  value={formData.addressCity}
                  onChange={(e) => handleChange("addressCity", e.target.value)}
                  placeholder="e.g., Chicago"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  State
                </label>
                <Input
                  value={formData.addressState}
                  onChange={(e) => handleChange("addressState", e.target.value)}
                  placeholder="e.g., IL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  ZIP Code
                </label>
                <Input
                  value={formData.addressZip}
                  onChange={(e) => handleChange("addressZip", e.target.value)}
                  placeholder="e.g., 60601"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License & Insurance */}
        <Card>
          <CardHeader>
            <CardTitle>License & Insurance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  License Number
                </label>
                <Input
                  value={formData.licenseNumber}
                  onChange={(e) => handleChange("licenseNumber", e.target.value)}
                  placeholder="e.g., LIC-123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Insurance Expiry
                </label>
                <Input
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => handleChange("insuranceExpiry", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Workers Comp Expiry
              </label>
              <Input
                type="date"
                value={formData.workersCompExpiry}
                onChange={(e) => handleChange("workersCompExpiry", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href={`/management/vendors/${vendorId}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
