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
  Truck,
  ClipboardCheck,
  FileText,
  Scale,
  Activity,
  Edit,
  Plus,
  Loader2,
  ImageIcon,
} from "lucide-react";

// Mock data - replace with actual API calls
const mockProperty = {
  id: "PROP-001",
  name: "Ridgeland Condominiums",
  address: "6722 S Ridgeland Ave, Chicago, IL 60649",
  type: "Condominium",
  status: "active",
  yearBuilt: 1985,
  unitCount: 12,
  occupiedUnits: 10,
  vacantUnits: 2,
  openMaintenance: 3,
  managementStartDate: "2024-01-01",
  accessInstructions: "Key fob required for entry. Main entrance on south side.",
  emergencyNotes: "Emergency contact: 555-0123. Fire panel located in lobby.",
  assignedStaff: "Sarah Johnson",
  image: "/images/property-placeholder.jpg",
  association: {
    id: "ASSOC-001",
    name: "Ridgeland Condominium Association",
  },
};

const mockUnits = [
  { id: "UNIT-001", unitNumber: "1N", type: "2BR/2BA", status: "occupied", owner: "John Smith" },
  { id: "UNIT-002", unitNumber: "2N", type: "2BR/2BA", status: "occupied", owner: "Jane Doe" },
  { id: "UNIT-003", unitNumber: "3S", type: "3BR/2BA", status: "vacant", owner: "Mike Johnson" },
];

const mockPeople = [
  { id: "CONT-001", firstName: "John", lastName: "Smith", role: "Owner", unit: "1N", email: "john@example.com" },
  { id: "CONT-002", firstName: "Jane", lastName: "Doe", role: "Owner", unit: "2N", email: "jane@example.com" },
];

const mockMaintenance = [
  { id: "MNT-001", requestNumber: "MNT-2026-0047", title: "HVAC Repair", status: "in_progress", priority: "high", date: "2026-07-30" },
  { id: "MNT-002", requestNumber: "MNT-2026-0048", title: "Plumbing Issue", status: "scheduled", priority: "medium", date: "2026-08-01" },
];

const mockVendors = [
  { id: "VEND-001", name: "ABC Heating & Cooling", category: "HVAC", rating: 4.8 },
  { id: "VEND-002", name: "Quick Fix Plumbing", category: "Plumbing", rating: 4.5 },
];

const mockInspections = [
  { id: "INSP-001", type: "Annual", date: "2026-08-15", status: "scheduled" },
  { id: "INSP-002", type: "Fire Safety", date: "2026-07-01", status: "completed" },
];

const mockDocuments = [
  { id: "DOC-001", name: "Insurance Certificate 2026.pdf", type: "Insurance", date: "2026-01-15" },
  { id: "DOC-002", name: "Annual Budget.xlsx", type: "Financial", date: "2026-01-10" },
];

const mockCompliance = [
  { id: "COMP-001", title: "Annual Fire Inspection", dueDate: "2026-08-15", status: "compliant" },
  { id: "COMP-002", title: "Elevator Certification", dueDate: "2026-09-01", status: "pending" },
];

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState(mockProperty);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
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
              href="/management/properties"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Properties
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">{property.name}</h1>
            {getStatusBadge(property.status)}
          </div>
          <p className="text-[var(--secondary-text)]">{property.id} • {property.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Units</p>
                <p className="text-2xl font-semibold">{property.unitCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Occupied</p>
                <p className="text-2xl font-semibold">{property.occupiedUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Vacant</p>
                <p className="text-2xl font-semibold">{property.vacantUnits}</p>
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
                <p className="text-sm text-[var(--secondary-text)]">Maintenance</p>
                <p className="text-2xl font-semibold">{property.openMaintenance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9 lg:w-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Property Image */}
            <Card className="lg:col-span-1">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-t-lg">
                  <ImageIcon className="h-16 w-16 text-gray-300" />
                </div>
                <div className="p-4">
                  <p className="text-sm text-[var(--secondary-text)] text-center">Property Photo</p>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Property Type</p>
                    <p className="font-medium">{property.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Year Built</p>
                    <p className="font-medium">{property.yearBuilt}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Management Start</p>
                    <p className="font-medium">{property.managementStartDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Assigned Staff</p>
                    <p className="font-medium">{property.assignedStaff}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Access Instructions</p>
                  <p className="font-medium">{property.accessInstructions}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Emergency Notes</p>
                  <p className="font-medium">{property.emergencyNotes}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Association Card */}
          <Card>
            <CardHeader>
              <CardTitle>Association</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-[var(--teal)]" />
                </div>
                <div>
                  <Link
                    href={`/management/associations/${property.association.id}`}
                    className="font-medium text-[var(--teal)] hover:underline"
                  >
                    {property.association.name}
                  </Link>
                  <p className="text-sm text-[var(--secondary-text)]">{property.association.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Units ({mockUnits.length})</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockUnits.map((unit) => (
              <Card key={unit.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/management/units/${unit.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        Unit {unit.unitNumber}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{unit.type}</p>
                      <p className="text-sm text-[var(--secondary-text)]">Owner: {unit.owner}</p>
                    </div>
                    <Badge className={unit.status === "occupied" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
                      {unit.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* People Tab */}
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
                    <div>
                      <Link
                        href={`/management/people/${person.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {person.firstName} {person.lastName}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{person.role} • Unit {person.unit}</p>
                      <p className="text-sm text-[var(--secondary-text)]">{person.email}</p>
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
                      <p className="text-sm text-[var(--secondary-text)]">{request.date}</p>
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

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Vendors ({mockVendors.length})</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockVendors.map((vendor) => (
              <Card key={vendor.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                      <Truck className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div>
                      <Link
                        href={`/management/vendors/${vendor.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {vendor.name}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{vendor.category}</p>
                      <Badge className="mt-1">★ {vendor.rating}</Badge>
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
                    <div>
                      <Link
                        href={`/management/documents/${doc.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {doc.name}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{doc.type} • {doc.date}</p>
                    </div>
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
                    <p className="font-medium">Property record created</p>
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
                    <p className="font-medium">Unit 1N added</p>
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
