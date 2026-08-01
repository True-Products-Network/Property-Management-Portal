"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

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
  status: string;
  associationId: string;
  relatedMaintenanceId: string;
  relatedVendorId: string;
}

const APPROVAL_TYPES = [
  { value: "expense", label: "Expense" },
  { value: "maintenance", label: "Maintenance" },
  { value: "vendor", label: "Vendor" },
  { value: "contract", label: "Contract" },
  { value: "budget", label: "Budget" },
  { value: "other", label: "Other" },
];

export default function EditApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const approvalId = params.id as string;

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
    status: "pending",
    associationId: "",
    relatedMaintenanceId: "",
    relatedVendorId: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const [approvalRes, assocRes, maintRes, vendorsRes] = await Promise.all([
        fetch(`/api/approvals/${approvalId}`),
        fetch("/api/associations"),
        fetch("/api/maintenance"),
        fetch("/api/vendors"),
      ]);

      if (approvalRes.ok) {
        const approvalData = await approvalRes.json();
        if (approvalData.success && approvalData.data) {
          const approval = approvalData.data;
          setFormData({
            title: approval.title || "",
            description: approval.description || "",
            approvalType: approval.approvalType || "",
            requestedAmount: approval.requestedAmount?.toString() || "",
            status: approval.status || "pending",
            associationId: approval.associationId || "",
            relatedMaintenanceId: approval.relatedMaintenanceId || "",
            relatedVendorId: approval.relatedVendorId || "",
          });
        }
      }

      if (assocRes.ok) {
        const assocData = await assocRes.json();
        if (assocData.success) setAssociations(assocData.data.data || []);
      }

      if (maintRes.ok) {
        const maintData = await maintRes.json();
        if (maintData.success) setMaintenanceRequests(maintData.data.data || []);
      }

      if (vendorsRes.ok) {
        const vendorsData = await vendorsRes.json();
        if (vendorsData.success) setVendors(vendorsData.data.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.approvalType) newErrors.approvalType = "Approval type is required";
    if (!formData.requestedAmount) newErrors.requestedAmount = "Amount is required";
    if (!formData.associationId) newErrors.associationId = "Association is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        requestedAmount: parseFloat(formData.requestedAmount),
      };

      const res = await fetch(`/api/approvals/${approvalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(`/management/approvals/${approvalId}`);
      } else {
        const error = await res.json();
        alert(error.error?.message || "Failed to update approval");
      }
    } catch (error) {
      console.error("Error saving approval:", error);
      alert("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#2f1fac]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/management/approvals/${approvalId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#2f1fac]">Edit Approval Request</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Approval Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Title *</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter approval title"
                  className={errors.title ? "border-red-500" : ""}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Approval Type *</label>
                <select
                  value={formData.approvalType}
                  onChange={(e) => setFormData({ ...formData, approvalType: e.target.value })}
                  className={`w-full h-10 px-3 rounded-md border ${errors.approvalType ? "border-red-500" : "border-input"} bg-background`}
                >
                  <option value="">Select type</option>
                  {APPROVAL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {errors.approvalType && <p className="text-sm text-red-500">{errors.approvalType}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Requested Amount *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.requestedAmount}
                  onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                  placeholder="0.00"
                  className={errors.requestedAmount ? "border-red-500" : ""}
                />
                {errors.requestedAmount && <p className="text-sm text-red-500">{errors.requestedAmount}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Association *</label>
                <select
                  value={formData.associationId}
                  onChange={(e) => setFormData({ ...formData, associationId: e.target.value })}
                  className={`w-full h-10 px-3 rounded-md border ${errors.associationId ? "border-red-500" : "border-input"} bg-background`}
                >
                  <option value="">Select association</option>
                  {associations.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                {errors.associationId && <p className="text-sm text-red-500">{errors.associationId}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Related Maintenance Request</label>
                <select
                  value={formData.relatedMaintenanceId}
                  onChange={(e) => setFormData({ ...formData, relatedMaintenanceId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select maintenance request</option>
                  {maintenanceRequests.map((m) => (
                    <option key={m.id} value={m.id}>{m.requestNumber} - {m.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Related Vendor</label>
                <select
                  value={formData.relatedVendorId}
                  onChange={(e) => setFormData({ ...formData, relatedVendorId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select vendor</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.companyName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <Link href={`/management/approvals/${approvalId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSaving} className="bg-[#2f1fac]">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
