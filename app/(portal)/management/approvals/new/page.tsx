"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, CheckSquare, Loader2 } from "lucide-react";
import Link from "next/link";
import { EntitlementGuard } from "@/components/entitlements/EntitlementGuard";

interface Association {
  id: string;
  name: string;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  requestNumber: string;
}

interface Vendor {
  id: string;
  companyName: string;
}

interface FormData {
  title: string;
  description: string;
  approvalType: string;
  requestedAmount: string;
  associationId: string;
  maintenanceRequestId: string;
  vendorId: string;
}

const APPROVAL_TYPES = [
  { value: "maintenance", label: "Maintenance Approval" },
  { value: "capital_expense", label: "Capital Expense" },
  { value: "vendor_selection", label: "Vendor Selection" },
  { value: "contract", label: "Contract Approval" },
  { value: "policy_change", label: "Policy Change" },
  { value: "special_assessment", label: "Special Assessment" },
];

function NewApprovalFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const approvalId = searchParams.get("id");
  const isEditMode = !!approvalId;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    approvalType: "",
    requestedAmount: "",
    associationId: "",
    maintenanceRequestId: "",
    vendorId: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [assocRes, maintRes, vendorRes] = await Promise.all([
        fetch("/api/associations"),
        fetch("/api/maintenance"),
        fetch("/api/vendors"),
      ]);

      if (assocRes.ok) {
        const assocData = await assocRes.json();
        if (assocData.success) setAssociations(assocData.data.data || []);
      }
      if (maintRes.ok) {
        const maintData = await maintRes.json();
        if (maintData.success) setMaintenanceRequests(maintData.data.data || []);
      }
      if (vendorRes.ok) {
        const vendorData = await vendorRes.json();
        if (vendorData.success) setVendors(vendorData.data.data || []);
      }

      // If in edit mode, fetch the approval data
      if (isEditMode && approvalId) {
        await loadApprovalData(approvalId);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadApprovalData(id: string) {
    try {
      const response = await fetch(`/api/approvals/${id}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const approval = result.data;
          setFormData({
            title: approval.title || "",
            description: approval.description || "",
            approvalType: approval.approvalType || "",
            requestedAmount: approval.requestedAmount?.toString() || "",
            associationId: approval.associationId || "",
            maintenanceRequestId: approval.maintenanceRequestId || "",
            vendorId: approval.vendorId || "",
          });
        }
      } else {
        console.error("Failed to load approval data");
      }
    } catch (error) {
      console.error("Error loading approval data:", error);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};

    if (!formData.title?.trim()) newErrors.title = "Title is required";
    if (!formData.approvalType) newErrors.approvalType = "Approval type is required";
    if (!formData.associationId) newErrors.associationId = "Association is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const url = isEditMode ? `/api/approvals/${approvalId}` : "/api/approvals";
      const method = isEditMode ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || undefined,
          approvalType: formData.approvalType,
          requestedAmount: formData.requestedAmount ? parseFloat(formData.requestedAmount) : undefined,
          associationId: formData.associationId,
          maintenanceRequestId: formData.maintenanceRequestId || undefined,
          vendorId: formData.vendorId || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const redirectId = isEditMode ? approvalId : result.data.id;
          router.push(`/management/approvals/${redirectId}`);
        } else {
          alert(result.error || `Failed to ${isEditMode ? "update" : "create"} approval request`);
        }
      } else {
        alert(`Failed to ${isEditMode ? "update" : "create"} approval request`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} approval request:`, error);
      alert(`An error occurred while ${isEditMode ? "updating" : "creating"} the approval request`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/management/approvals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {isEditMode ? "Edit Approval Request" : "Request Board Approval"}
            </h1>
            {isEditMode && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                Edit Mode
              </Badge>
            )}
          </div>
          <p className="text-[var(--secondary-text)] mt-1">
            {isEditMode ? "Update the approval request details" : "Submit a request for board approval"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-[var(--teal)]" />
              Request Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Association <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.associationId}
                onChange={(e) => handleChange("associationId", e.target.value)}
                className={`input w-full ${errors.associationId ? "border-red-500" : ""}`}
              >
                <option value="">Select Association</option>
                {associations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>
                    {assoc.name}
                  </option>
                ))}
              </select>
              {errors.associationId && <p className="text-sm text-red-500 mt-1">{errors.associationId}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Approval Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.approvalType}
                  onChange={(e) => handleChange("approvalType", e.target.value)}
                  className={`input w-full ${errors.approvalType ? "border-red-500" : ""}`}
                >
                  <option value="">Select Type</option>
                  {APPROVAL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.approvalType && <p className="text-sm text-red-500 mt-1">{errors.approvalType}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                  Requested Amount
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.requestedAmount}
                  onChange={(e) => handleChange("requestedAmount", e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Roof Replacement Approval"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className="input w-full"
                placeholder="Detailed description of what needs approval..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Related Records */}
        <Card>
          <CardHeader>
            <CardTitle>Related Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Related Maintenance Request
              </label>
              <select
                value={formData.maintenanceRequestId}
                onChange={(e) => handleChange("maintenanceRequestId", e.target.value)}
                className="input w-full"
              >
                <option value="">None</option>
                {maintenanceRequests.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.requestNumber} - {req.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--main-text)] mb-1">
                Related Vendor
              </label>
              <select
                value={formData.vendorId}
                onChange={(e) => handleChange("vendorId", e.target.value)}
                className="input w-full"
              >
                <option value="">None</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.companyName}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/management/approvals">
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
                {isEditMode ? "Saving..." : "Submitting..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Save Changes" : "Submit for Approval"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Wrap with EntitlementGuard
export default function NewApprovalWrapper() {
  return (
    <EntitlementGuard featureKey="approvals">
      <NewApprovalForm />
    </EntitlementGuard>
  );
}
