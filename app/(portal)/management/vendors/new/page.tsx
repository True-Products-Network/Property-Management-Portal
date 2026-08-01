"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Truck, Loader2, Pencil } from "lucide-react";
import Link from "next/link";

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

const VENDOR_CATEGORIES = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "landscaping", label: "Landscaping" },
  { value: "cleaning", label: "Cleaning" },
  { value: "security", label: "Security" },
  { value: "pest_control", label: "Pest Control" },
  { value: "roofing", label: "Roofing" },
  { value: "painting", label: "Painting" },
  { value: "general_contracting", label: "General Contracting" },
  { value: "elevator", label: "Elevator" },
  { value: "fire_safety", label: "Fire Safety" },
  { value: "pool_service", label: "Pool Service" },
  { value: "snow_removal", label: "Snow Removal" },
];

export default function NewVendorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = searchParams.get("id");
  const isEditMode = !!vendorId;

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
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

  // Fetch vendor data when in edit mode
  useEffect(() => {
    if (isEditMode && vendorId) {
      async function fetchVendor() {
        try {
          const response = await fetch(`/api/vendors/${vendorId}`);
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const vendor = result.data;
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
            } else {
              alert("Failed to load vendor data");
              router.push("/management/vendors");
            }
          } else {
            alert("Failed to load vendor data");
            router.push("/management/vendors");
          }
        } catch (error) {
          console.error("Error fetching vendor:", error);
          alert("An error occurred while loading the vendor");
          router.push("/management/vendors");
        } finally {
          setIsLoading(false);
        }
      }
      fetchVendor();
    }
  }, [isEditMode, vendorId, router]);

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
      const url = isEditMode ? `/api/vendors/${vendorId}` : "/api/vendors";
      const method = isEditMode ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
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
          const redirectId = isEditMode ? vendorId : result.data.id;
          router.push(`/management/vendors/${redirectId}`);
        } else {
          alert(result.error || isEditMode ? "Failed to update vendor" : "Failed to create vendor");
        }
      } else {
        alert(isEditMode ? "Failed to update vendor" : "Failed to create vendor");
      }
    } catch (error) {
      console.error(isEditMode ? "Error updating vendor:" : "Error creating vendor:", error);
      alert(isEditMode ? "An error occurred while updating the vendor" : "An error occurred while creating the vendor");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/management/vendors">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            {isEditMode ? "Edit Vendor" : "Add New Vendor"}
          </h1>
          {isEditMode && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Pencil className="h-3 w-3 mr-1" />
              Edit Mode
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
          <span className="ml-2 text-[var(--secondary-text)]">Loading vendor data...</span>
        </div>
      ) : (

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
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className={`input w-full ${errors.category ? "border-red-500" : ""}`}
                >
                  <option value="">Select Category</option>
                  {VENDOR_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="input w-full"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending_approval">Pending Approval</option>
                </select>
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
          <Link href="/management/vendors">
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
                {isEditMode ? "Save Changes" : "Create Vendor"}
              </>
            )}
          </Button>
        </div>
      </form>
      )}
    </div>
  );
}
