"use client";

import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface Association {
  id: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
  associationId: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  matterId: string;
  identifiedDate: string;
  dueDate: string;
  resolvedDate: string;
  fineAmount: string;
  associationId: string;
  propertyId: string;
  unitId: string;
  assignedToId: string;
  resolutionNotes: string;
}

// Unified category options - same as new page
const CATEGORIES = [
  { value: "violation", label: "Violation" },
  { value: "delinquency", label: "Delinquency" },
  { value: "insurance", label: "Insurance Issue" },
  { value: "permit", label: "Permit Issue" },
  { value: "safety", label: "Safety Concern" },
  { value: "maintenance", label: "Maintenance Required" },
  { value: "accessibility", label: "Accessibility" },
  { value: "environmental", label: "Environmental" },
  { value: "zoning", label: "Zoning" },
  { value: "financial", label: "Financial Reporting" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function EditCompliancePage() {
  const params = useParams();
  const router = useRouter();
  const complianceId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    status: "open",
    matterId: "",
    identifiedDate: "",
    dueDate: "",
    resolvedDate: "",
    fineAmount: "",
    associationId: "",
    propertyId: "",
    unitId: "",
    assignedToId: "",
    resolutionNotes: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.associationId) {
      loadProperties(formData.associationId);
    } else {
      setProperties([]);
      setFormData(prev => ({ ...prev, propertyId: "", unitId: "" }));
    }
  }, [formData.associationId]);

  useEffect(() => {
    if (formData.propertyId) {
      loadUnits(formData.propertyId);
    } else {
      setUnits([]);
      setFormData(prev => ({ ...prev, unitId: "" }));
    }
  }, [formData.propertyId]);

  async function loadInitialData() {
    try {
      const [compRes, propsRes, assocRes, contactsRes] = await Promise.all([
        fetch(`/api/compliance/${complianceId}`),
        fetch("/api/properties"),
        fetch("/api/associations"),
        fetch("/api/contacts"),
      ]);

      if (compRes.ok) {
        const compData = await compRes.json();
        if (compData.success && compData.data) {
          const comp = compData.data;
          setFormData({
            title: comp.title || "",
            description: comp.description || "",
            category: comp.category || "",
            priority: comp.priority || "medium",
            status: comp.status || "open",
            matterId: comp.matterId || "",
            identifiedDate: comp.identifiedDate ? comp.identifiedDate.split("T")[0] : "",
            dueDate: comp.dueDate ? comp.dueDate.split("T")[0] : "",
            resolvedDate: comp.resolvedDate ? comp.resolvedDate.split("T")[0] : "",
            fineAmount: comp.fineAmount?.toString() || "",
            associationId: comp.associationId || "",
            propertyId: comp.propertyId || "",
            unitId: comp.unitId || "",
            assignedToId: comp.assignedTo || "",
            resolutionNotes: comp.resolutionNotes || "",
          });
          if (comp.propertyId) {
            loadUnits(comp.propertyId);
          }
        }
      }

      if (propsRes.ok) {
        const propsData = await propsRes.json();
        if (propsData.success) setProperties(propsData.data.data || []);
      }

      if (assocRes.ok) {
        const assocData = await assocRes.json();
        if (assocData.success) setAssociations(assocData.data.data || []);
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        if (contactsData.success) setContacts(contactsData.data.data || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProperties(associationId: string) {
    try {
      const res = await fetch(`/api/properties?associationId=${associationId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setProperties(data.data.data || []);
      }
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  async function loadUnits(propertyId: string) {
    try {
      const res = await fetch(`/api/units?propertyId=${propertyId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUnits(data.data.data || []);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  function validateForm(): boolean {
    const newErrors: Partial<FormData> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.category) newErrors.category = "Category is required";
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
        fineAmount: formData.fineAmount ? parseFloat(formData.fineAmount) : null,
      };

      const res = await fetch(`/api/compliance/${complianceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push(`/management/compliance/${complianceId}`);
      } else {
        const error = await res.json();
        alert(error.error?.message || "Failed to update compliance item");
      }
    } catch (error) {
      console.error("Error saving compliance:", error);
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
        <Link href={`/management/compliance/${complianceId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#2f1fac]">Edit Compliance Item</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Compliance Information
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
                  placeholder="Enter compliance title"
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
                <label className="text-sm font-medium">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`w-full h-10 px-3 rounded-md border ${errors.category ? "border-red-500" : "border-input"} bg-background`}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Matter ID</label>
                <Input
                  value={formData.matterId}
                  onChange={(e) => setFormData({ ...formData, matterId: e.target.value })}
                  placeholder="e.g., COMP-2024-001"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Identified Date</label>
                <Input
                  type="date"
                  value={formData.identifiedDate}
                  onChange={(e) => setFormData({ ...formData, identifiedDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resolved Date</label>
                <Input
                  type="date"
                  value={formData.resolvedDate}
                  onChange={(e) => setFormData({ ...formData, resolvedDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fine Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.fineAmount}
                  onChange={(e) => setFormData({ ...formData, fineAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Association</label>
                <select
                  value={formData.associationId}
                  onChange={(e) => setFormData({ ...formData, associationId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select association</option>
                  {associations.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Property</label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value, unitId: "" })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  disabled={!formData.propertyId}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background disabled:opacity-50"
                >
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.unitNumber}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assigned To</label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Select person</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Resolution Notes</label>
                <textarea
                  value={formData.resolutionNotes}
                  onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                  placeholder="Enter resolution notes"
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Link href={`/management/compliance/${complianceId}`}>
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
