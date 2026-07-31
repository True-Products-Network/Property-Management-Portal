"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Mock data for maintenance request detail
const mockRequest = {
  id: "MNT-2026-0047",
  title: "HVAC Repair - Building B",
  status: "in_progress",
  priority: "high",
  urgency: "urgent",
  createdAt: "2026-07-28T09:30:00Z",
  updatedAt: "2026-07-30T14:22:00Z",
  description:
    "Air conditioning unit in Building B common area is not cooling properly. Temperature readings show 78°F when thermostat is set to 72°F. Unit makes unusual noise when starting.",
  category: "HVAC",
  reporter: {
    name: "Sarah Johnson",
    role: "Property Manager",
    email: "sarah.j@example.com",
    phone: "(555) 123-4567",
  },
  property: {
    name: "Oakwood Heights",
    address: "1234 Oakwood Drive, Chicago, IL 60601",
    association: "Oakwood Heights HOA",
  },
  unit: {
    number: "Common Area - Building B",
    type: "Common Area",
  },
  vendor: {
    name: "ABC Heating & Cooling",
    contact: "Mike Rodriguez",
    phone: "(555) 987-6543",
    email: "dispatch@abc-hvac.com",
    status: "assigned",
  },
  schedule: {
    requestedDate: "2026-07-29",
    scheduledDate: "2026-08-01",
    timeWindow: "9:00 AM - 12:00 PM",
    actualStart: null,
    actualEnd: null,
  },
  cost: {
    estimate: 850.0,
    actual: null,
    currency: "USD",
  },
  timeline: [
    {
      id: 1,
      type: "created",
      title: "Request Created",
      description: "Maintenance request submitted by Sarah Johnson",
      timestamp: "2026-07-28T09:30:00Z",
      user: "Sarah Johnson",
    },
    {
      id: 2,
      type: "status_change",
      title: "Status Updated",
      description: "Request reviewed and prioritized as High",
      timestamp: "2026-07-28T11:15:00Z",
      user: "System",
    },
    {
      id: 3,
      type: "vendor_assigned",
      title: "Vendor Assigned",
      description: "ABC Heating & Cooling assigned to job",
      timestamp: "2026-07-29T08:45:00Z",
      user: "Mike Chen",
    },
    {
      id: 4,
      type: "scheduled",
      title: "Work Scheduled",
      description: "Appointment scheduled for August 1st, 9:00 AM - 12:00 PM",
      timestamp: "2026-07-29T14:30:00Z",
      user: "ABC Heating & Cooling",
    },
  ],
  messages: [
    {
      id: 1,
      sender: "Sarah Johnson",
      role: "Property Manager",
      message:
        "Please prioritize this - residents are complaining about the heat in the common area.",
      timestamp: "2026-07-28T10:15:00Z",
    },
    {
      id: 2,
      sender: "Mike Rodriguez",
      role: "Vendor",
      message:
        "We can schedule this for Thursday morning. Our technician will arrive between 9-12.",
      timestamp: "2026-07-29T08:45:00Z",
    },
  ],
  files: [
    {
      id: 1,
      name: "HVAC_Issue_Photo_1.jpg",
      size: "2.4 MB",
      type: "image",
      uploadedBy: "Sarah Johnson",
      uploadedAt: "2026-07-28T09:32:00Z",
    },
    {
      id: 2,
      name: "Temperature_Reading.pdf",
      size: "156 KB",
      type: "pdf",
      uploadedBy: "Sarah Johnson",
      uploadedAt: "2026-07-28T09:35:00Z",
    },
  ],
};

// Status configuration
const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-teal-100 text-teal-700" },
  waiting: { label: "Waiting", color: "bg-amber-100 text-amber-700" },
  completed: { label: "Completed", color: "bg-green-100 text-green-700" },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-700" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-gray-100 text-gray-700" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  high: { label: "High", color: "bg-amber-100 text-amber-700" },
  emergency: { label: "Emergency", color: "bg-red-100 text-red-700" },
};

// Process tracker steps
const processSteps = [
  { id: "created", label: "Created", icon: CheckCircle2 },
  { id: "reviewed", label: "Reviewed", icon: CheckCircle2 },
  { id: "assigned", label: "Vendor Assigned", icon: CheckCircle2 },
  { id: "scheduled", label: "Scheduled", icon: CheckCircle2 },
  { id: "in_progress", label: "In Progress", icon: Clock },
  { id: "completed", label: "Completed", icon: CheckCircle2 },
];

function ProcessTracker({ currentStep }: { currentStep: string }) {
  const currentIndex = processSteps.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {processSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
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
                  "text-xs mt-2 font-medium",
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
                    "absolute h-0.5 w-full top-5 left-1/2 -z-10",
                    index < currentIndex
                      ? "bg-[var(--teal)]"
                      : "bg-[var(--border-color)]"
                  )}
                  style={{ width: "calc(100% - 2.5rem)", marginLeft: "1.25rem" }}
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

export default function MaintenanceRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [activeTab, setActiveTab] = useState("activity");
  const request = mockRequest;
  const status = statusConfig[request.status];
  const priority = priorityConfig[request.priority];

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {request.title}
            </h1>
            <Badge className={status.color}>{status.label}</Badge>
            <Badge className={priority.color}>{priority.label}</Badge>
          </div>
          <p className="text-lg text-[var(--secondary-text)]">{request.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="text-red-600">
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
          <div className="space-y-2">
            <div>
              <p className="text-xs text-[var(--secondary-text)]">Category</p>
              <p className="text-sm font-medium">{request.category}</p>
            </div>
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
          </div>
        </InfoCard>

        {/* Property Info */}
        <InfoCard
          title="Property"
          icon={Building2}
          action={{ label: "View", href: `/management/properties/${request.property.name}` }}
        >
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">{request.property.name}</p>
              <p className="text-xs text-[var(--secondary-text)]">
                {request.property.address}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--secondary-text)]">Association</p>
              <p className="text-sm">{request.property.association}</p>
            </div>
          </div>
        </InfoCard>

        {/* Unit Info */}
        <InfoCard title="Unit" icon={Home}>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">{request.unit.number}</p>
              <p className="text-xs text-[var(--secondary-text)]">{request.unit.type}</p>
            </div>
          </div>
        </InfoCard>

        {/* Reporter Info */}
        <InfoCard title="Reported By" icon={User}>
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">{request.reporter.name}</p>
              <p className="text-xs text-[var(--secondary-text)]">
                {request.reporter.role}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--secondary-text)]">
                {request.reporter.email}
              </p>
              <p className="text-xs text-[var(--secondary-text)]">
                {request.reporter.phone}
              </p>
            </div>
          </div>
        </InfoCard>

        {/* Vendor Info */}
        <InfoCard
          title="Vendor"
          icon={Truck}
          action={{ label: "Change", href: "#" }}
        >
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">{request.vendor.name}</p>
              <p className="text-xs text-[var(--secondary-text)]">
                {request.vendor.contact}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--secondary-text)]">
                {request.vendor.phone}
              </p>
              <p className="text-xs text-[var(--secondary-text)]">
                {request.vendor.email}
              </p>
            </div>
          </div>
        </InfoCard>

        {/* Schedule Info */}
        <InfoCard title="Schedule" icon={Calendar}>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-[var(--secondary-text)]">Scheduled Date</p>
              <p className="text-sm font-medium">
                {new Date(request.schedule.scheduledDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--secondary-text)]">Time Window</p>
              <p className="text-sm font-medium">{request.schedule.timeWindow}</p>
            </div>
          </div>
        </InfoCard>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-[var(--secondary-text)]">
            Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[var(--main-text)]">{request.description}</p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <Paperclip className="w-4 h-4" />
                Files
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="activity" className="space-y-4">
              {request.timeline.map((event) => (
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
            </TabsContent>

            <TabsContent value="messages" className="space-y-4">
              {request.messages.map((message) => (
                <div key={message.id} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[var(--teal)] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">
                      {message.sender.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 pb-4 border-b border-[var(--border-color)] last:border-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[var(--main-text)]">
                          {message.sender}
                        </p>
                        <p className="text-xs text-[var(--secondary-text)]">
                          {message.role}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--secondary-text)]">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--main-text)] mt-2">
                      {message.message}
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-4">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="input flex-1"
                />
                <Button>Send</Button>
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              {request.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-[var(--page-background)] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <Paperclip className="w-5 h-5 text-[var(--teal)]" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--main-text)]">
                        {file.name}
                      </p>
                      <p className="text-xs text-[var(--secondary-text)]">
                        {file.size} • Uploaded by {file.uploadedBy} on{" "}
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
              ))}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-4">
        <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Mark Complete
        </Button>
        <Button variant="outline">
          <Clock className="w-4 h-4 mr-2" />
          Update Status
        </Button>
        <Button variant="outline">
          <Truck className="w-4 h-4 mr-2" />
          Reassign Vendor
        </Button>
        <Button variant="outline">
          <DollarSign className="w-4 h-4 mr-2" />
          Add Cost
        </Button>
        <Button variant="outline">
          <AlertCircle className="w-4 h-4 mr-2" />
          Escalate
        </Button>
      </div>
    </div>
  );
}
