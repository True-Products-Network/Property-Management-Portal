"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Building2,
  Home,
  Users,
  Wrench,
  ClipboardCheck,
  FileText,
  Scale,
  MessageSquare,
  Activity,
  Edit,
  Plus,
  Loader2,
  DollarSign,
  Upload,
  Shield,
  CreditCard,
  Megaphone,
} from "lucide-react";

// Mock data - replace with actual API calls
const mockAssociation = {
  id: "ASSOC-001",
  name: "Ridgeland Condominium Association",
  legalName: "Ridgeland Condominium Association",
  type: "Condominium",
  status: "active",
  address: "6722 S Ridgeland Ave, Chicago, IL 60649",
  phone: "(773) 555-0123",
  email: "board@ridgelandcondo.org",
  fiscalYear: "January - December",
  annualMeetingMonth: "May",
  managementStartDate: "2024-01-01",
  assignedManager: "Sarah Johnson",
  propertyCount: 1,
  unitCount: 12,
  openMaintenance: 3,
  pendingApprovals: 2,
  expiringDocuments: 1,
};

const mockProperties = [
  { id: "PROP-001", name: "Ridgeland Condominiums", address: "6722 S Ridgeland Ave, Chicago, IL 60649", type: "Condominium", units: 12 },
];

const mockPeople = [
  { id: "CONT-001", firstName: "John", lastName: "Smith", role: "Board President", unit: "1N", email: "john@example.com", isBoard: true },
  { id: "CONT-002", firstName: "Jane", lastName: "Doe", role: "Board Treasurer", unit: "2N", email: "jane@example.com", isBoard: true },
  { id: "CONT-003", firstName: "Mike", lastName: "Johnson", role: "Owner", unit: "3S", email: "mike@example.com", isBoard: false },
];

const mockMaintenance = [
  { id: "MNT-001", requestNumber: "MNT-2026-0047", title: "HVAC Repair", status: "in_progress", priority: "high", property: "Ridgeland Condominiums" },
  { id: "MNT-002", requestNumber: "MNT-2026-0048", title: "Plumbing Issue", status: "scheduled", priority: "medium", property: "Ridgeland Condominiums" },
];

const mockInspections = [
  { id: "INSP-001", type: "Annual", date: "2026-08-15", status: "scheduled", property: "Ridgeland Condominiums" },
  { id: "INSP-002", type: "Fire Safety", date: "2026-07-01", status: "completed", property: "Ridgeland Condominiums" },
];

const mockDocuments = [
  { id: "DOC-001", name: "Insurance Certificate 2026.pdf", type: "Insurance", date: "2026-01-15", expiring: true },
  { id: "DOC-002", name: "Annual Budget.xlsx", type: "Financial", date: "2026-01-10", expiring: false },
];

const mockCompliance = [
  { id: "COMP-001", title: "Annual Fire Inspection", dueDate: "2026-08-15", status: "compliant", property: "Ridgeland Condominiums" },
  { id: "COMP-002", title: "Elevator Certification", dueDate: "2026-09-01", status: "pending", property: "Ridgeland Condominiums" },
];

const mockCommunications = [
  { id: "COMM-001", subject: "Pool Maintenance Schedule", from: "Sarah Johnson", date: "2026-07-30", type: "announcement" },
  { id: "COMM-002", subject: "Annual Meeting Notice", from: "Board", date: "2026-07-25", type: "notice" },
];

const mockFinancialLinks = [
  { name: "Operating Account", institution: "Chase Bank", accountNumber: "****4567", balance: "$45,230.00" },
  { name: "Reserve Account", institution: "Chase Bank", accountNumber: "****8901", balance: "$125,000.00" },
];

export default function AssociationDetailPage() {
  const params = useParams();
  const [association, setAssociation] = useState(mockAssociation);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "onboarding":
        return <Badge className="bg-blue-100 text-blue-700">Onboarding</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
            <Link
              href="/management/associations"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Associations
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">{association.name}</h1>
            {getStatusBadge(association.status)}
          </div>
          <p className="text-[var(--secondary-text)]">{association.id} • {association.legalName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Properties</p>
                <p className="text-2xl font-semibold">{association.propertyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Units</p>
                <p className="text-2xl font-semibold">{association.unitCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Open Maintenance</p>
                <p className="text-2xl font-semibold">{association.openMaintenance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Pending Approvals</p>
                <p className="text-2xl font-semibold">{association.pendingApprovals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-[var(--page-background)] p-1 text-[var(--secondary-text)]">
          <TabsTrigger value="overview" className="px-3 py-1.5 text-sm">Overview</TabsTrigger>
          <TabsTrigger value="properties" className="px-3 py-1.5 text-sm">Properties</TabsTrigger>
          <TabsTrigger value="people" className="px-3 py-1.5 text-sm">People & Board</TabsTrigger>
          <TabsTrigger value="maintenance" className="px-3 py-1.5 text-sm">Maintenance</TabsTrigger>
          <TabsTrigger value="inspections" className="px-3 py-1.5 text-sm">Inspections</TabsTrigger>
          <TabsTrigger value="documents" className="px-3 py-1.5 text-sm">Documents</TabsTrigger>
          <TabsTrigger value="compliance" className="px-3 py-1.5 text-sm">Compliance</TabsTrigger>
          <TabsTrigger value="communications" className="px-3 py-1.5 text-sm">Communications</TabsTrigger>
          <TabsTrigger value="financial" className="px-3 py-1.5 text-sm">Financial</TabsTrigger>
          <TabsTrigger value="activity" className="px-3 py-1.5 text-sm">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Association Details */}
            <Card>
              <CardHeader>
                <CardTitle>Association Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Association Type</p>
                    <p className="font-medium">{association.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Fiscal Year</p>
                    <p className="font-medium">{association.fiscalYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Annual Meeting</p>
                    <p className="font-medium">{association.annualMeetingMonth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Management Start</p>
                    <p className="font-medium">{association.managementStartDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Assigned Manager</p>
                    <p className="font-medium">{association.assignedManager}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Address</p>
                  <p className="font-medium">{association.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Phone</p>
                    <p className="font-medium">{association.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Email</p>
                    <p className="font-medium">{association.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Link href={`/management/properties/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                      <Plus className="h-5 w-5" />
                      <span className="text-xs text-center">Add Property</span>
                    </Button>
                  </Link>
                  <Link href={`/management/people/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span className="text-xs text-center">Add People</span>
                    </Button>
                  </Link>
                  <Link href={`/management/documents/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                      <Upload className="h-5 w-5" />
                      <span className="text-xs text-center">Upload Doc</span>
                    </Button>
                  </Link>
                  <Link href={`/management/compliance/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                      <Shield className="h-5 w-5" />
                      <span className="text-xs text-center">Add Compliance</span>
                    </Button>
                  </Link>
                  <Link href={`/management/inspections/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                      <ClipboardCheck className="h-5 w-5" />
                      <span className="text-xs text-center">Schedule Insp</span>
                    </Button>
                  </Link>
                  <Link href={`/management/maintenance/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      <span className="text-xs text-center">New Maint</span>
                    </Button>
                  </Link>
                  <Link href={`/management/payments/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      <span className="text-xs text-center">Make Payment</span>
                    </Button>
                  </Link>
                  <Link href={`/management/communications/announcement?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      <span className="text-xs text-center">Send Announce</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Properties ({mockProperties.length})</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockProperties.map((property) => (
              <Card key={property.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                      <Home className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div>
                      <Link
                        href={`/management/properties/${property.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {property.name}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{property.address}</p>
                      <p className="text-sm text-[var(--secondary-text)]">{property.type} • {property.units} units</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* People & Board Tab */}
        <TabsContent value="people" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">People ({mockPeople.length})</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockPeople.map((person) => (
              <Card key={person.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/management/people/${person.id}`}
                          className="font-medium text-[var(--teal)] hover:underline"
                        >
                          {person.firstName} {person.lastName}
                        </Link>
                        {person.isBoard && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">Board</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--secondary-text)]">{person.role}</p>
                      <p className="text-sm text-[var(--secondary-text)]">Unit {person.unit} • {person.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Maintenance Requests ({mockMaintenance.length})</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </div>
          <div className="space-y-4">
            {mockMaintenance.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/management/maintenance/${request.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {request.title}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{request.requestNumber}</p>
                      <p className="text-sm text-[var(--secondary-text)]">{request.property}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-teal-100 text-teal-700">{request.status}</Badge>
                      <Badge className={request.priority === "high" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>
                        {request.priority}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Inspections Tab */}
        <TabsContent value="inspections" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Inspections ({mockInspections.length})</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Inspection
            </Button>
          </div>
          <div className="space-y-4">
            {mockInspections.map((inspection) => (
              <Card key={inspection.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/management/inspections/${inspection.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {inspection.type} Inspection
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{inspection.property}</p>
                      <p className="text-sm text-[var(--secondary-text)]">{inspection.date}</p>
                    </div>
                    <Badge className={inspection.status === "completed" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                      {inspection.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Documents ({mockDocuments.length})</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
          <div className="space-y-4">
            {mockDocuments.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/management/documents/${doc.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {doc.name}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{doc.type} • {doc.date}</p>
                    </div>
                    {doc.expiring && (
                      <Badge className="bg-amber-100 text-amber-700">Expiring Soon</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Compliance Matters ({mockCompliance.length})</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Compliance Matter
            </Button>
          </div>
          <div className="space-y-4">
            {mockCompliance.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/management/compliance/${item.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{item.property}</p>
                      <p className="text-sm text-[var(--secondary-text)]">Due: {item.dueDate}</p>
                    </div>
                    <Badge className={item.status === "compliant" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                      {item.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Communications ({mockCommunications.length})</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Send Announcement
            </Button>
          </div>
          <div className="space-y-4">
            {mockCommunications.map((comm) => (
              <Card key={comm.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div>
                      <p className="font-medium">{comm.subject}</p>
                      <p className="text-sm text-[var(--secondary-text)]">From: {comm.from} • {comm.date}</p>
                      <Badge className="mt-1" variant="secondary">{comm.type}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Financial Links Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockFinancialLinks.map((account, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-[var(--page-background)] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-[var(--secondary-text)]">{account.institution} • {account.accountNumber}</p>
                    </div>
                  </div>
                  <p className="font-semibold">{account.balance}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-4 border-b border-[var(--border-color)]">
                  <Activity className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                  <div>
                    <p className="font-medium">Association record created</p>
                    <p className="text-sm text-[var(--secondary-text)]">By: System • 2024-01-01 10:30 AM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pb-4 border-b border-[var(--border-color)]">
                  <Activity className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                  <div>
                    <p className="font-medium">Management agreement signed</p>
                    <p className="text-sm text-[var(--secondary-text)]">By: Sarah Johnson • 2024-01-01 11:00 AM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                  <div>
                    <p className="font-medium">Property added</p>
                    <p className="text-sm text-[var(--secondary-text)]">By: Admin • 2024-01-02 09:15 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
