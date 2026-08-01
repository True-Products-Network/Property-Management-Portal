"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Scale,
  Edit,
  Loader2,
  Building2,
  Home,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  User,
  Calendar,
} from "lucide-react";

interface ComplianceMatter {
  id: string;
  matterId: string;
  associationId: string;
  propertyId?: string;
  unitId?: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status: string;
  identifiedDate?: string;
  dueDate?: string;
  resolvedDate?: string;
  assignedTo?: string;
  resolutionNotes?: string;
  fineAmount?: number;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
}

interface Association {
  id: string;
  name: string;
}

export default function ComplianceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matterId = params.id as string;

  const [matter, setMatter] = useState<ComplianceMatter | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [association, setAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (matterId) {
      loadMatter();
    }
  }, [matterId]);

  async function loadMatter() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/compliance/${matterId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load compliance matter");
      }

      setMatter(result.data);

      // Load related data
      if (result.data.propertyId) {
        const propRes = await fetch(`/api/properties/${result.data.propertyId}`);
        if (propRes.ok) {
          const propData = await propRes.json();
          if (propData.success) setProperty(propData.data);
        }
      }

      if (result.data.unitId) {
        const unitRes = await fetch(`/api/units/${result.data.unitId}`);
        if (unitRes.ok) {
          const unitData = await unitRes.json();
          if (unitData.success) setUnit(unitData.data);
        }
      }

      if (result.data.associationId) {
        const assocRes = await fetch(`/api/associations/${result.data.associationId}`);
        if (assocRes.ok) {
          const assocData = await assocRes.json();
          if (assocData.success) setAssociation(assocData.data);
        }
      }
    } catch (error) {
      console.error("Error loading compliance matter:", error);
      setError(error instanceof Error ? error.message : "Failed to load compliance matter");
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-700">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-teal-100 text-teal-700">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-700">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-100 text-red-700">Critical</Badge>;
      case "high":
        return <Badge className="bg-amber-100 text-amber-700">High</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-700">Medium</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-700">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">-</Badge>;
    }
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      fire_safety: "Fire Safety",
      elevator: "Elevator",
      accessibility: "Accessibility",
      environmental: "Environmental",
      zoning: "Zoning",
      licensing: "Licensing",
      insurance: "Insurance",
      financial: "Financial",
      other: "Other",
    };
    return labels[category || ""] || category || "-";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate?: string, status?: string) => {
    if (!dueDate || status === "resolved" || status === "closed") return false;
    return new Date(dueDate) < new Date();
  };

  const daysUntilDue = (dueDate?: string) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
          <Button onClick={loadMatter} variant="outline">
            Retry
          </Button>
          <Link href="/management/compliance">
            <Button variant="outline">Back to Compliance</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">Compliance matter not found</p>
        <Link href="/management/compliance">
          <Button variant="outline" className="mt-4">
            Back to Compliance
          </Button>
        </Link>
      </div>
    );
  }

  const overdue = isOverdue(matter.dueDate, matter.status);
  const daysLeft = daysUntilDue(matter.dueDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
            <Link
              href="/management/compliance"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Compliance
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {matter.title}
            </h1>
            {getStatusBadge(matter.status)}
            {getPriorityBadge(matter.priority)}
          </div>
          <p className="text-[var(--secondary-text)]">{matter.matterId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/management/compliance/${matterId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Alert for overdue items */}
      {overdue && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-700">This item is overdue</p>
            <p className="text-sm text-red-600">
              Due date was {formatDate(matter.dueDate)} ({Math.abs(daysLeft || 0)} days ago)
            </p>
          </div>
        </div>
      )}

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Category</p>
                <p className="text-lg font-semibold">{getCategoryLabel(matter.category)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Due Date</p>
                <p className={`text-lg font-semibold ${overdue ? "text-red-600" : ""}`}>
                  {formatDate(matter.dueDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Days Remaining</p>
                <p className={`text-lg font-semibold ${overdue ? "text-red-600" : daysLeft && daysLeft <= 7 ? "text-amber-600" : ""}`}>
                  {overdue ? `${Math.abs(daysLeft || 0)} days overdue` : daysLeft !== null ? `${daysLeft} days` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Fine Amount</p>
                <p className="text-lg font-semibold">
                  {matter.fineAmount ? `$${matter.fineAmount.toFixed(2)}` : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matter Details */}
        <Card>
          <CardHeader>
            <CardTitle>Matter Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {matter.description && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Description</p>
                <p className="mt-1">{matter.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Status</p>
                <div className="mt-1">{getStatusBadge(matter.status)}</div>
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Priority</p>
                <div className="mt-1">{getPriorityBadge(matter.priority)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Identified Date</p>
                <p className="mt-1">{formatDate(matter.identifiedDate)}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Due Date</p>
                <p className={`mt-1 ${overdue ? "text-red-600 font-medium" : ""}`}>
                  {formatDate(matter.dueDate)}
                </p>
              </div>
            </div>

            {matter.resolvedDate && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Resolved Date</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{formatDate(matter.resolvedDate)}</span>
                </div>
              </div>
            )}

            {matter.assignedTo && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Assigned To</p>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-[var(--secondary-text)]" />
                  <span>{matter.assignedTo}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {association && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Association</p>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                  <Link
                    href={`/management/associations/${association.id}`}
                    className="text-[var(--teal)] hover:underline"
                  >
                    {association.name}
                  </Link>
                </div>
              </div>
            )}

            {property && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Property</p>
                <div className="flex items-center gap-2 mt-1">
                  <Home className="h-4 w-4 text-[var(--secondary-text)]" />
                  <Link
                    href={`/management/properties/${property.id}`}
                    className="text-[var(--teal)] hover:underline"
                  >
                    {property.name}
                  </Link>
                </div>
              </div>
            )}

            {unit && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Unit</p>
                <div className="flex items-center gap-2 mt-1">
                  <Home className="h-4 w-4 text-[var(--secondary-text)]" />
                  <Link
                    href={`/management/units/${unit.id}`}
                    className="text-[var(--teal)] hover:underline"
                  >
                    Unit {unit.unitNumber}
                  </Link>
                </div>
              </div>
            )}

            {!property && !unit && (
              <p className="text-[var(--secondary-text)]">Association-wide matter</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resolution Notes */}
      {matter.resolutionNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Resolution Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{matter.resolutionNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
