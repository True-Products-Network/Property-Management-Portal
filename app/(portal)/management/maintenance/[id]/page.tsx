"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Wrench,
  Building2,
  Home,
  User,
  Truck,
  Calendar,
  DollarSign,
  Clock,
  MessageSquare,
  Paperclip,
  History,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Printer,
  Loader2,
  Phone,
  Mail,
  MapPin,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Types
interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  description?: string;
  status: string;
  urgency?: string;
  category?: string;
  propertyId: string;
  unitId?: string;
  reportedByContactId: string;
  assignedVendorId?: string;
  assignedStaffId?: string;
  estimatedCost?: number;
  actualCost?: number;
  approvedAmount?: number;
  requestedDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  vendorNotes?: string;
  resolutionNotes?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  name: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  associationId?: string;
}

interface Association {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  unitType?: string;
  propertyId: string;
}

interface Vendor {
  id: string;
  companyName: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  primaryPhone?: string;
}

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user: string;
}

// Status configuration
const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-700" },
  triaged: { label: "Triaged", color: "bg-purple-100 text-purple-700" },
  pending_approval: { label: "Pending Approval", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700" },
  vendor_assigned: { label: "Vendor Assigned", color: "bg-indigo-100 text-indigo-700" },
  scheduled: { label: "Scheduled", color: "bg-cyan-100 text-cyan-700" },
  in_progress: { label: "In Progress", color: "bg-teal-100 text-teal-700" },
  on_hold: { label: "On Hold", color: "bg-orange-100 text-orange-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700" },
  normal: { label: "Normal", color: "bg-blue-100 text-blue-700" },
  urgent: { label: "Urgent", color: "bg-amber-100 text-amber-700" },
  emergency: { label: "Emergency", color: "bg-red-100 text-red-700" },
};

// Process tracker steps
const processSteps = [
  { id: "new", label: "Created", icon: CheckCircle2 },
  { id: "triaged", label: "Triaged", icon: CheckCircle2 },
  { id: "vendor_assigned", label: "Vendor Assigned", icon: CheckCircle2 },
  { id: "scheduled", label: "Scheduled", icon: CheckCircle2 },
  { id: "in_progress", label: "In Progress", icon: Clock },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

function ProcessTracker({ currentStep }: { currentStep: string }) {
  const currentIndex = processSteps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between relative">
        {processSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors z-10",
                  isCompleted
                    ? "bg-[var(--teal)] border-[var(--teal)] text-white"
                    : "bg-white border-[var(--border-color)] text-[var(--secondary-text)]",
                  isCurrent && "ring-4 ring-[var(--teal)]/20"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  "text-xs mt-2 font-medium text-center",
                  isCompleted
                    ? "text-[var(--main-text)]"
                    : "text-[var(--secondary-text)]"
                )}
              >
                {step.label}
              </span>
              {index < processSteps.length - 1 && (
                <div
                  className={cn(
                    "absolute h-0.5 top-5 left-1/2 w-full",
                    index < currentIndex
                      ? "bg-[var(--teal)]"
                      : "bg-[var(--border-color)]"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

export default function MaintenanceRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [association, setAssociation] = useState<Association | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reporter, setReporter] = useState<Contact | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("activity");

  // Fetch maintenance request
  useEffect(() => {
    if (id) {
      loadRequest();
    }
  }, [id]);

  async function loadRequest() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/maintenance/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load maintenance request");
      }

      setRequest(result.data);
      
      // Load related data
      await loadRelatedData(result.data);
      
      // Generate timeline from request data
      generateTimeline(result.data);
    } catch (error) {
      console.error("Error loading maintenance request:", error);
      setError(error instanceof Error ? error.message : "Failed to load maintenance request");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRelatedData(requestData: MaintenanceRequest) {
    setIsLoadingRelated(true);
    
    try {
      // Load property
      if (requestData.propertyId) {
        try {
          const propResponse = await fetch(`/api/properties/${requestData.propertyId}`);
          const propResult = await propResponse.json();
          if (propResult.success) {
            setProperty(propResult.data);
            
            // Load association if property has one
            if (propResult.data.associationId) {
              try {
                const assocResponse = await fetch(`/api/associations/${propResult.data.associationId}`);
                const assocResult = await assocResponse.json();
                if (assocResult.success) {
                  setAssociation(assocResult.data);
                }
              } catch (e) {
                console.error("Error loading association:", e);
              }
            }
          }
        } catch (e) {
          console.error("Error loading property:", e);
        }
      }

      // Load unit
      if (requestData.unitId) {
        try {
          const unitResponse = await fetch(`/api/units/${requestData.unitId}`);
          const unitResult = await unitResponse.json();
          if (unitResult.success) {
            setUnit(unitResult.data);
          }
        } catch (e) {
          console.error("Error loading unit:", e);
        }
      }

      // Load vendor
      if (requestData.assignedVendorId) {
        try {
          const vendorResponse = await fetch(`/api/vendors/${requestData.assignedVendorId}`);
          const vendorResult = await vendorResponse.json();
          if (vendorResult.success) {
            setVendor(vendorResult.data);
          }
        } catch (e) {
          console.error("Error loading vendor:", e);
        }
      }

      // Load reporter
      if (requestData.reportedByContactId) {
        try {
          const contactResponse = await fetch(`/api/contacts/${requestData.reportedByContactId}`);
          const contactResult = await contactResponse.json();
          if (contactResult.success) {
            setReporter(contactResult.data);
          }
        } catch (e) {
          console.error("Error loading reporter:", e);
        }
      }
    } finally {
      setIsLoadingRelated(false);
    }
  }

  function generateTimeline(requestData: MaintenanceRequest) {
    const events: TimelineEvent[] = [
      {
        id: "1",
        type: "created",
        title: "Request Created",
        description: `Maintenance request ${requestData.requestNumber} submitted`,
        timestamp: requestData.createdAt,
        user: "System",
      },
    ];

    if (requestData.status !== "new") {
      events.push({
        id: "2",
        type: "status_change",
        title: "Status Updated",
        description: `Status changed to ${statusConfig[requestData.status]?.label || requestData.status}`,
        timestamp: requestData.updatedAt,
        user: "System",
      });
    }

    if (requestData.assignedVendorId) {
      events.push({
        id: "3",
        type: "vendor_assigned",
        title: "Vendor Assigned",
        description: "Vendor assigned to job",
        timestamp: requestData.updatedAt,
        user: "System",
      });
    }

    if (requestData.scheduledDate) {
      events.push({
        id: "4",
        type: "scheduled",
        title: "Work Scheduled",
        description: `Appointment scheduled for ${new Date(requestData.scheduledDate).toLocaleDateString()}`,
        timestamp: requestData.scheduledDate,
        user: "System",
      });
    }

    if (requestData.completedDate) {
      events.push({
        id: "5",
        type: "completed",
        title: "Work Completed",
        description: "Maintenance work has been completed",
        timestamp: requestData.completedDate,
        user: "System",
      });
    }

    setTimeline(events);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this maintenance request?")) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenance/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to delete maintenance request");
      }

      router.push("/management/maintenance");
    } catch (error) {
      console.error("Error deleting maintenance request:", error);
      alert(error instanceof Error ? error.message : "Failed to delete maintenance request");
    }
  }

  async function handleStatusUpdate(newStatus: string) {
    try {
      const response = await fetch(`/api/maintenance/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update status");
      }

      // Reload request data
      await loadRequest();
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error instanceof Error ? error.message : "Failed to update status");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-5 w-5" />
          <p>{error || "Maintenance request not found"}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadRequest} variant="outline">
            Retry
          </Button>
          <Link href="/management/maintenance">
            <Button variant="outline">Back to List</Button>
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[request.status] || { label: request.status, color: "bg-gray-100 text-gray-700" };
  const priority = priorityConfig[request.urgency || "normal"] || { label: request.urgency || "Normal", color: "bg-gray-100 text-gray-700" };

  const fullAddress = property
    ? `${property.streetAddress || ""}, ${property.city || ""}, ${property.state || ""} ${property.zipCode || ""}`.replace(/,\s*,/g, ",").replace(/,\s*$/g, "").trim()
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
            <Link
              href="/management/maintenance"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Maintenance
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {request.title}
            </h1>
            <Badge className={status.color}>{status.label}</Badge>
            <Badge className={priority.color}>{priority.label}</Badge>
          </div>
          <p className="text-lg text-[var(--secondary-text)]">{request.requestNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Link href={`/management/maintenance/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-red-600" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Process Tracker */}
      <Card className="p-6">
        <ProcessTracker currentStep={request.status} />
      </Card>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Request Info */}
        <InfoCard title="Request Details" icon={Wrench}>
          <div className="space-y-3">
            {request.category && (
              <div>
                <p className="text-xs text-[var(--secondary-text)]">Category</p>
                <p className="text-sm font-medium">{request.category}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[var(--secondary-text)]">Created</p>
              <p className="text-sm font-medium">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--secondary-text)]">Last Updated</p>
              <p className="text-sm font-medium">
                {new Date(request.updatedAt).toLocaleDateString()}
              </p>
            </div>
            {request.requestedDate && (
              <div>
                <p className="text-xs text-[var(--secondary-text)]">Requested Date</p>
                <p className="text-sm font-medium">
                  {new Date(request.requestedDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </InfoCard>

        {/* Property Info */}
        <InfoCard
          title="Property"
          icon={Building2}
          action={property ? { label: "View", href: `/management/properties/${property.id}` } : undefined}
        >
          <div className="space-y-2">
            {property ? (
              <>
                <div>
                  <p className="text-sm font-medium">{property.name}</p>
                  {fullAddress && (
                    <p className="text-xs text-[var(--secondary-text)] flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {fullAddress}
                    </p>
                  )}
                </div>
                {association && (
                  <div>
                    <p className="text-xs text-[var(--secondary-text)]">Association</p>
                    <p className="text-sm">{association.name}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--secondary-text)]">Loading...</p>
            )}
          </div>
        </InfoCard>

        {/* Unit Info */}
        <InfoCard 
          title="Unit" 
          icon={Home}
          action={unit ? { label: "View", href: `/management/units/${unit.id}` } : undefined}
        >
          <div className="space-y-2">
            {unit ? (
              <>
                <div>
                  <p className="text-sm font-medium">Unit {unit.unitNumber}</p>
                  {unit.unitType && (
                    <p className="text-xs text-[var(--secondary-text)]">{unit.unitType}</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--secondary-text)]">Common Area / No specific unit</p>
            )}
          </div>
        </InfoCard>

        {/* Reporter Info */}
        <InfoCard 
          title="Reported By" 
          icon={User}
          action={reporter ? { label: "View", href: `/management/people/${reporter.id}` } : undefined}
        >
          <div className="space-y-2">
            {reporter ? (
              <>
                <div>
                  <p className="text-sm font-medium">{reporter.firstName} {reporter.lastName}</p>
                </div>
                {reporter.email && (
                  <div className="flex items-center gap-1 text-xs text-[var(--secondary-text)]">
                    <Mail className="w-3 h-3" />
                    {reporter.email}
                  </div>
                )}
                {reporter.primaryPhone && (
                  <div className="flex items-center gap-1 text-xs text-[var(--secondary-text)]">
                    <Phone className="w-3 h-3" />
                    {reporter.primaryPhone}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--secondary-text)]">Loading...</p>
            )}
          </div>
        </InfoCard>

        {/* Vendor Info */}
        <InfoCard
          title="Vendor"
          icon={Truck}
          action={vendor ? { label: "View", href: `/management/vendors/${vendor.id}` } : undefined}
        >
          <div className="space-y-2">
            {vendor ? (
              <>
                <div>
                  <p className="text-sm font-medium">{vendor.companyName}</p>
                  {vendor.primaryContactName && (
                    <p className="text-xs text-[var(--secondary-text)]">{vendor.primaryContactName}</p>
                  )}
                </div>
                {vendor.primaryContactPhone && (
                  <div className="flex items-center gap-1 text-xs text-[var(--secondary-text)]">
                    <Phone className="w-3 h-3" />
                    {vendor.primaryContactPhone}
                  </div>
                )}
                {vendor.primaryContactEmail && (
                  <div className="flex items-center gap-1 text-xs text-[var(--secondary-text)]">
                    <Mail className="w-3 h-3" />
                    {vendor.primaryContactEmail}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-[var(--secondary-text)]">Not assigned</p>
            )}
          </div>
        </InfoCard>

        {/* Schedule Info */}
        <InfoCard title="Schedule" icon={Calendar}>
          <div className="space-y-3">
            {request.scheduledDate ? (
              <div>
                <p className="text-xs text-[var(--secondary-text)]">Scheduled Date</p>
                <p className="text-sm font-medium">
                  {new Date(request.scheduledDate).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-[var(--secondary-text)]">Scheduled Date</p>
                <p className="text-sm text-[var(--secondary-text)]">Not scheduled</p>
              </div>
            )}
            {request.completedDate && (
              <div>
                <p className="text-xs text-[var(--secondary-text)]">Completed Date</p>
                <p className="text-sm font-medium text-green-600">
                  {new Date(request.completedDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </InfoCard>
      </div>

      {/* Cost Info */}
      {(request.estimatedCost !== undefined || request.actualCost !== undefined || request.approvedAmount !== undefined) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-[var(--secondary-text)] flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Cost Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {request.estimatedCost !== undefined && (
                <div>
                  <p className="text-xs text-[var(--secondary-text)]">Estimated Cost</p>
                  <p className="text-lg font-semibold">
                    ${request.estimatedCost.toLocaleString()}
                  </p>
                </div>
              )}
              {request.approvedAmount !== undefined && (
                <div>
                  <p className="text-xs text-[var(--secondary-text)]">Approved Amount</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    ${request.approvedAmount.toLocaleString()}
                  </p>
                </div>
              )}
              {request.actualCost !== undefined && (
                <div>
                  <p className="text-xs text-[var(--secondary-text)]">Actual Cost</p>
                  <p className="text-lg font-semibold">
                    ${request.actualCost.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {request.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--secondary-text)]">
              Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--main-text)] whitespace-pre-wrap">{request.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Vendor Notes */}
      {request.vendorNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--secondary-text)]">
              Vendor Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--main-text)] whitespace-pre-wrap">{request.vendorNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Resolution Notes */}
      {request.resolutionNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--secondary-text)]">
              Resolution Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--main-text)] whitespace-pre-wrap">{request.resolutionNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Internal Notes */}
      {request.internalNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[var(--secondary-text)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Internal Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[var(--main-text)] whitespace-pre-wrap">{request.internalNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-[var(--secondary-text)] flex items-center gap-2">
            <History className="w-4 h-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timeline.map((event) => (
              <div key={event.id} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--page-background)] flex items-center justify-center flex-shrink-0">
                  <History className="w-4 h-4 text-[var(--teal)]" />
                </div>
                <div className="flex-1 pb-4 border-b border-[var(--border-color)] last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-[var(--main-text)]">
                      {event.title}
                    </p>
                    <span className="text-xs text-[var(--secondary-text)]">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--secondary-text)] mt-1">
                    {event.description}
                  </p>
                  <p className="text-xs text-[var(--secondary-text)] mt-1">
                    by {event.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-4">
        {request.status !== "completed" && request.status !== "closed" && (
          <Button 
            className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
            onClick={() => handleStatusUpdate("completed")}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark Complete
          </Button>
        )}
        {request.status === "new" && (
          <Button 
            variant="outline"
            onClick={() => handleStatusUpdate("in_progress")}
          >
            <Clock className="w-4 h-4 mr-2" />
            Start Work
          </Button>
        )}
        {!request.assignedVendorId && (
          <Button variant="outline">
            <Truck className="w-4 h-4 mr-2" />
            Assign Vendor
          </Button>
        )}
        {request.status !== "completed" && request.status !== "closed" && (
          <Button variant="outline">
            <DollarSign className="w-4 h-4 mr-2" />
            Update Cost
          </Button>
        )}
        {request.urgency !== "emergency" && request.status !== "completed" && request.status !== "closed" && (
          <Button variant="outline">
            <AlertCircle className="w-4 h-4 mr-2" />
            Escalate
          </Button>
        )}
        {request.status !== "closed" && request.status !== "cancelled" && (
          <Button 
            variant="outline" 
            className="text-red-600"
            onClick={() => handleStatusUpdate("cancelled")}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
