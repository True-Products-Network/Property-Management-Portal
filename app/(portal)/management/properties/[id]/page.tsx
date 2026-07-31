"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RelatedRecordCard } from "@/components/relationships/RelatedRecordCard";
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
  managementStartDate: "2024-01-01",
  accessInstructions: "Key fob required for entry",
  emergencyNotes: "Emergency contact: 555-0123",
  assignedStaff: "Sarah Johnson",
  association: {
    id: "ASSOC-001",
    name: "Ridgeland Condominium Association",
  },
};

const mockUnits = [
  { id: "UNIT-001", name: "Unit 1N", type: "2BR/2BA", status: "occupied", owner: "John Smith" },
  { id: "UNIT-002", name: "Unit 2N", type: "2BR/2BA", status: "occupied", owner: "Jane Doe" },
  { id: "UNIT-003", name: "Unit 3S", type: "3BR/2BA", status: "vacant", owner: "Mike Johnson" },
];

const mockPeople = [
  { id: "CONT-001", name: "John Smith", role: "Owner", unit: "Unit 1N", email: "john@example.com" },
  { id: "CONT-002", name: "Jane Doe", role: "Owner", unit: "Unit 2N", email: "jane@example.com" },
  { id: "CONT-003", name: "Mike Johnson", role: "Owner", unit: "Unit 3S", email: "mike@example.com" },
];

const mockMaintenance = [
  { id: "MNT-001", title: "HVAC Repair", status: "in_progress", priority: "high", date: "2026-07-30" },
  { id: "MNT-002", title: "Plumbing Issue", status: "scheduled", priority: "medium", date: "2026-08-01" },
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
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/management/properties">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">{property.name}</h1>
            <p className="text-[var(--secondary-text)]">{property.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={property.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
            {property.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-[var(--border-color)] p-1">
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
            {/* Property Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Property Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Address</p>
                    <p className="font-medium">{property.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Type</p>
                    <p className="font-medium">{property.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Year Built</p>
                    <p className="font-medium">{property.yearBuilt}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Total Units</p>
                    <p className="font-medium">{property.unitCount}</p>
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

            {/* Association Card - Clickable */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[var(--secondary-text)] uppercase tracking-wide">Association</h3>
              <RelatedRecordCard
                type="association"
                id={property.association.id}
                title={property.association.name}
                href={`/management/associations/${property.association.id}`}
              />

              {/* Open Items Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Open Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--secondary-text)]">Maintenance</span>
                    <span className="font-medium">{mockMaintenance.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--secondary-text)]">Inspections</span>
                    <span className="font-medium">{mockInspections.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--secondary-text)]">Compliance</span>
                    <span className="font-medium">{mockCompliance.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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
              <RelatedRecordCard
                key={unit.id}
                type="unit"
                id={unit.id}
                title={unit.name}
                subtitle={unit.type}
                status={unit.status}
                badge={unit.owner}
                href={`/management/units/${unit.id}`}
              />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockPeople.map((person) => (
              <RelatedRecordCard
                key={person.id}
                type="contact"
                id={person.id}
                title={person.name}
                subtitle={person.email}
                badge={person.role}
                href={`/management/people/${person.id}`}
              />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockMaintenance.map((request) => (
              <RelatedRecordCard
                key={request.id}
                type="maintenance"
                id={request.id}
                title={request.title}
                subtitle={request.date}
                status={request.status}
                badge={request.priority}
                href={`/management/maintenance/${request.id}`}
              />
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
              <RelatedRecordCard
                key={vendor.id}
                type="vendor"
                id={vendor.id}
                title={vendor.name}
                subtitle={vendor.category}
                badge={`★ ${vendor.rating}`}
                href={`/management/vendors/${vendor.id}`}
              />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockInspections.map((inspection) => (
              <RelatedRecordCard
                key={inspection.id}
                type="inspection"
                id={inspection.id}
                title={`${inspection.type} Inspection`}
                subtitle={inspection.date}
                status={inspection.status}
                href={`/management/inspections/${inspection.id}`}
              />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockDocuments.map((doc) => (
              <RelatedRecordCard
                key={doc.id}
                type="document"
                id={doc.id}
                title={doc.name}
                subtitle={doc.date}
                badge={doc.type}
                href={`/management/documents/${doc.id}`}
              />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockCompliance.map((item) => (
              <RelatedRecordCard
                key={item.id}
                type="compliance"
                id={item.id}
                title={item.title}
                subtitle={`Due: ${item.dueDate}`}
                status={item.status}
                href={`/management/compliance/${item.id}`}
              />
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
