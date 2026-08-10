"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardCheck,
  Building2,
  Home,
  User,
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trash2,
  Printer,
  FileText,
  Star,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types
interface Inspection {
  id: string;
  inspectionId: string;
  propertyId: string;
  unitId?: string;
  inspectionType: string;
  status: string;
  scheduledDate?: string;
  scheduledTime?: string;
  completedDate?: string;
  inspectorId?: string;
  inspectorVendorId?: string;
  findings?: string;
  recommendations?: string;
  overallRating?: string;
  followUpRequired: boolean;
  followUpMaintenanceId?: string;
  createdAt: string;
  updatedAt: string;
}

interface DropdownOption {
  value: string;
  label: string;
}

interface Property {
  id: string;
  propertyId: string;
  name: string;
  addressStreet: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
}

interface Unit {
  id: string;
  unitId: string;
  unitNumber: string;
  displayName?: string;
}

interface Vendor {
  id: string;
  vendorId: string;
  companyName: string;
  primaryContactName?: string;
  email?: string;
  phone?: string;
}

interface Contact {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

// Status configuration
const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-teal-100 text-teal-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700" },
  rescheduled: { label: "Rescheduled", color: "bg-amber-100 text-amber-700" },
};

// Inspection type labels
const inspectionTypeLabels: Record<string, string> = {
  annual: "Annual Inspection",
  move_in: "Move-In Inspection",
  move_out: "Move-Out Inspection",
  fire_safety: "Fire Safety Inspection",
  elevator: "Elevator Inspection",
  hvac: "HVAC Inspection",
  roof: "Roof Inspection",
  pool: "Pool Inspection",
  emergency_systems: "Emergency Systems Inspection",
  insurance: "Insurance Inspection",
  other: "Other",
};

// Rating configuration
const ratingConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  excellent: { label: "Excellent", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  good: { label: "Good", color: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  fair: { label: "Fair", color: "bg-amber-100 text-amber-700", icon: AlertCircle },
  poor: { label: "Poor", color: "bg-orange-100 text-orange-700", icon: AlertTriangle },
  critical: { label: "Critical", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

function InfoCard({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-[var(--secondary-text)] flex items-center gap-2">
            <Icon className="w-4 h-4" />
            {title}
          </CardTitle>
          {action && (
            <Link
              href={action.href}
              className="text-xs text-[var(--teal)] hover:text-[var(--teal-hover)]"
            >
              {action.label}
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function InspectionDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [inspector, setInspector] = useState<Contact | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [inspectionTypeOptions, setInspectionTypeOptions] = useState<DropdownOption[]>([]);
  const [inspectionStatusOptions, setInspectionStatusOptions] = useState<DropdownOption[]>([]);
  const [overallResultOptions, setOverallResultOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInspectionData() {
      try {
        setLoading(true);
        setError(null);

        // Load dropdown options first
        await loadDropdownOptions();

        // Fetch inspection
        const inspectionRes = await fetch(`/api/inspections/${id}`);
        const inspectionData = await inspectionRes.json();

        if (!inspectionData.success) {
          setError(inspectionData.error || "Failed to load inspection");
          return;
        }

        const inspectionResult = inspectionData.data;
        setInspection(inspectionResult);

        // Fetch related data in parallel
        const fetchPromises = [];

        // Fetch property
        if (inspectionResult.propertyId) {
          fetchPromises.push(
            fetch(`/api/properties/${inspectionResult.propertyId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success) setProperty(data.data);
              })
              .catch(() => {})
          );
        }

        // Fetch unit
        if (inspectionResult.unitId) {
          fetchPromises.push(
            fetch(`/api/units/${inspectionResult.unitId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success) setUnit(data.data);
              })
              .catch(() => {})
          );
        }

        // Fetch inspector (contact)
        if (inspectionResult.inspectorId) {
          fetchPromises.push(
            fetch(`/api/contacts/${inspectionResult.inspectorId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success) setInspector(data.data);
              })
              .catch(() => {})
          );
        }

        // Fetch vendor
        if (inspectionResult.inspectorVendorId) {
          fetchPromises.push(
            fetch(`/api/vendors/${inspectionResult.inspectorVendorId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success) setVendor(data.data);
              })
              .catch(() => {})
          );
        }

        await Promise.all(fetchPromises);
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    async function loadDropdownOptions() {
      try {
        // Load inspection types
        const typeRes = await fetch("/api/dropdowns?recordType=Inspection&fieldName=Inspection%20Type");
        if (typeRes.ok) {
          const typeData = await typeRes.json();
          if (typeData.success) setInspectionTypeOptions(typeData.data);
        }

        // Load inspection statuses
        const statusRes = await fetch("/api/dropdowns?recordType=Inspection&fieldName=Inspection%20Status");
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.success) setInspectionStatusOptions(statusData.data);
        }

        // Load overall results (ratings)
        const resultRes = await fetch("/api/dropdowns?recordType=Inspection&fieldName=Overall%20Result");
        if (resultRes.ok) {
          const resultData = await resultRes.json();
          if (resultData.success) setOverallResultOptions(resultData.data);
        }
      } catch (error) {
        console.error("Error loading dropdown options:", error);
      }
    }

    if (id) {
      fetchInspectionData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-lg text-[var(--secondary-text)]">
          {error || "Inspection not found"}
        </p>
        <Link href="/management/inspections">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inspections
          </Button>
        </Link>
      </div>
    );
  }

  // Get display labels from dropdown options
  const statusOption = inspectionStatusOptions.find(o => o.value === inspection.status);
  const status = {
    label: statusOption?.label || inspection.status,
    color: statusConfig[inspection.status]?.color || "bg-gray-100 text-gray-700",
  };

  const typeOption = inspectionTypeOptions.find(o => o.value === inspection.inspectionType);
  const inspectionTypeLabel = typeOption?.label || inspection.inspectionType;

  const ratingOption = overallResultOptions.find(o => o.value === inspection.overallRating);
  const rating = inspection.overallRating
    ? {
        label: ratingOption?.label || inspection.overallRating,
        color: ratingConfig[inspection.overallRating]?.color || "bg-gray-100 text-gray-700",
      }
    : null;

  // Helper function to safely format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString();
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
            <Link
              href="/management/inspections"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Inspections
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {inspectionTypeLabel}
            </h1>
            <Badge className={status.color}>{status.label}</Badge>
            {inspection.followUpRequired && (
              <Badge className="bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Follow-up Required
              </Badge>
            )}
          </div>
          <p className="text-lg text-[var(--secondary-text)]">
            {inspection.inspectionId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Link href={`/management/inspections/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Inspection Info */}
        <InfoCard title="Inspection Details" icon={ClipboardCheck}>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-[var(--secondary-text)]">Type</p>
              <p className="text-sm font-medium">{inspectionTypeLabel}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--secondary-text)]">Status</p>
              <p className="text-sm font-medium">{status.label}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--secondary-text)]">Created</p>
              <p className="text-sm font-medium">{formatDate(inspection.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--secondary-text)]">Last Updated</p>
              <p className="text-sm font-medium">{formatDate(inspection.updatedAt)}</p>
            </div>
          </div>
        </InfoCard>

        {/* Property Info */}
        <InfoCard
          title="Property"
          icon={Building2}
          action={
            property
              ? { label: "View", href: `/management/properties/${property.id}` }
              : undefined
          }
        >
          <div className="space-y-2">
            {property ? (
              <>
                <div>
                  <p className="text-sm font-medium">{property.name}</p>
                  <p className="text-xs text-[var(--secondary-text)]">
                    {property.addressStreet}
                    {property.addressCity && `, ${property.addressCity}`}
                    {property.addressState && `, ${property.addressState}`}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--secondary-text)]">
                Property not found
              </p>
            )}
          </div>
        </InfoCard>

        {/* Unit Info */}
        <InfoCard title="Unit" icon={Home}>
          <div className="space-y-2">
            {unit ? (
              <div>
                <p className="text-sm font-medium">
                  {unit.displayName || unit.unitNumber}
                </p>
                <p className="text-xs text-[var(--secondary-text)]">
                  Unit {unit.unitNumber}
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--secondary-text)]">
                {inspection.unitId ? "Unit not found" : "No unit specified"}
              </p>
            )}
          </div>
        </InfoCard>

        {/* Schedule Info */}
        <InfoCard title="Schedule" icon={Calendar}>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-[var(--secondary-text)]">Scheduled Date</p>
              <p className="text-sm font-medium">
                {inspection.scheduledDate
                  ? new Date(inspection.scheduledDate).toLocaleDateString()
                  : "Not scheduled"}
              </p>
            </div>
            {inspection.scheduledTime && (
              <div>
                <p className="text-xs text-[var(--secondary-text)]">Time</p>
                <p className="text-sm font-medium">{inspection.scheduledTime}</p>
              </div>
            )}
            {inspection.completedDate && (
              <div>
                <p className="text-xs text-[var(--secondary-text)]">Completed</p>
                <p className="text-sm font-medium">
                  {new Date(inspection.completedDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </InfoCard>

        {/* Inspector Info */}
        <InfoCard title="Inspector" icon={User}>
          <div className="space-y-2">
            {inspector ? (
              <>
                <div>
                  <p className="text-sm font-medium">
                    {inspector.firstName} {inspector.lastName}
                  </p>
                  <p className="text-xs text-[var(--secondary-text)]">
                    {inspector.email}
                  </p>
                </div>
                {inspector.phone && (
                  <p className="text-xs text-[var(--secondary-text)]">
                    {inspector.phone}
                  </p>
                )}
              </>
            ) : vendor ? (
              <>
                <div>
                  <p className="text-sm font-medium">{vendor.companyName}</p>
                  {vendor.primaryContactName && (
                    <p className="text-xs text-[var(--secondary-text)]">
                      {vendor.primaryContactName}
                    </p>
                  )}
                </div>
                {vendor.email && (
                  <p className="text-xs text-[var(--secondary-text)]">
                    {vendor.email}
                  </p>
                )}
                {vendor.phone && (
                  <p className="text-xs text-[var(--secondary-text)]">
                    {vendor.phone}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--secondary-text)]">
                No inspector assigned
              </p>
            )}
          </div>
        </InfoCard>

        {/* Overall Rating */}
        <InfoCard title="Overall Rating" icon={Star}>
          <div className="space-y-2">
            {rating ? (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    rating.color.split(" ")[0]
                  )}
                >
                  {RatingIcon && <RatingIcon className={cn("w-5 h-5", rating.color.split(" ")[1])} />}
                </div>
                <div>
                  <p className={cn("text-sm font-medium", rating.color.split(" ")[1])}>
                    {rating.label}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--secondary-text)]">
                Not rated yet
              </p>
            )}
          </div>
        </InfoCard>
      </div>

      {/* Findings */}
      {inspection.findings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--secondary-text)] flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--main-text)] whitespace-pre-wrap">
              {inspection.findings}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {inspection.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--secondary-text)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--main-text)] whitespace-pre-wrap">
              {inspection.recommendations}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Follow-up Alert */}
      {inspection.followUpRequired && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">
                  Follow-up Action Required
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  This inspection requires follow-up actions. Please review the
                  findings and create any necessary maintenance requests.
                </p>
                {inspection.followUpMaintenanceId && (
                  <div className="mt-3">
                    <Link
                      href={`/management/maintenance/${inspection.followUpMaintenanceId}`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        View Related Maintenance Request
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-4">
        {inspection.status !== "completed" && (
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark Complete
          </Button>
        )}
        <Button variant="outline">
          <Clock className="w-4 h-4 mr-2" />
          Update Status
        </Button>
        <Button variant="outline">
          <Truck className="w-4 h-4 mr-2" />
          Reassign Inspector
        </Button>
        {!inspection.followUpRequired && inspection.status === "completed" && (
          <Button variant="outline">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Flag for Follow-up
          </Button>
        )}
      </div>
    </div>
  );
}
