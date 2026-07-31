"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Home,
  Building2,
  Users,
  Wrench,
  FileText,
  Mail,
  Phone,
  Edit,
  Loader2,
  Ruler,
  Bed,
  Bath,
} from "lucide-react";

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  associationId: string;
  associationName: string;
  status: "occupied" | "vacant" | "maintenance";
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  tenant?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  priority: string;
  reportedDate: string;
}

export default function UnitDetailPage() {
  const params = useParams();
  const unitId = params.id as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadUnit();
  }, [unitId]);

  async function loadUnit() {
    try {
      const mockUnit: Unit = {
        id: unitId,
        unitNumber: "1N",
        propertyId: "TEST-PROP-RIDGELAND",
        propertyName: "6722 S Ridgeland",
        propertyAddress: "6722 S Ridgeland Ave, Chicago, IL 60649",
        associationId: "TEST-ASSOC-RIDGELAND",
        associationName: "Ridgeland Condominium Association",
        status: "occupied",
        squareFeet: 1200,
        bedrooms: 2,
        bathrooms: 2,
        description: "Spacious 2-bedroom unit with updated kitchen and bathroom. Hardwood floors throughout.",
        owner: {
          id: "PERSON-1",
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@example.com",
          phone: "(555) 123-4567",
        },
        tenant: {
          id: "PERSON-1",
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@example.com",
          phone: "(555) 123-4567",
        },
      };

      const mockMaintenance: MaintenanceRequest[] = [
        {
          id: "MNT-001",
          requestNumber: "MNT-2026-0047",
          title: "HVAC Repair",
          status: "in_progress",
          priority: "high",
          reportedDate: "2026-07-28T10:00:00Z",
        },
      ];

      setUnit(mockUnit);
      setMaintenanceRequests(mockMaintenance);
    } catch (error) {
      console.error("Error loading unit:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "occupied":
        return <Badge className="bg-green-100 text-green-700">Occupied</Badge>;
      case "vacant":
        return <Badge className="bg-blue-100 text-blue-700">Vacant</Badge>;
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-700">Maintenance</Badge>;
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

  if (!unit) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">Unit not found</p>
        <Link href="/management/units">
          <Button variant="outline" className="mt-4">
            Back to Units
          </Button>
        </Link>
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
              href="/management/units"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Units
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              Unit {unit.unitNumber}
            </h1>
            {getStatusBadge(unit.status)}
          </div>
          <p className="text-[var(--secondary-text)]">{unit.propertyName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Ruler className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Square Feet</p>
                <p className="text-2xl font-semibold">{unit.squareFeet || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Bed className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Bedrooms</p>
                <p className="text-2xl font-semibold">{unit.bedrooms || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Bath className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Bathrooms</p>
                <p className="text-2xl font-semibold">{unit.bathrooms || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Open Requests</p>
                <p className="text-2xl font-semibold">{maintenanceRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="occupants">Occupants</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle>Property Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Property</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[var(--teal)]" />
                    <Link
                      href={`/management/properties/${unit.propertyId}`}
                      className="font-medium text-[var(--teal)] hover:underline"
                    >
                      {unit.propertyName}
                    </Link>
                  </div>
                  <p className="text-sm text-[var(--secondary-text)] mt-1">
                    {unit.propertyAddress}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Association</p>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-[var(--teal)]" />
                    <Link
                      href={`/management/associations/${unit.associationId}`}
                      className="font-medium text-[var(--teal)] hover:underline"
                    >
                      {unit.associationName}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Unit Details */}
            <Card>
              <CardHeader>
                <CardTitle>Unit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Description</p>
                  <p className="text-[var(--main-text)]">{unit.description || "No description available."}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Square Feet</p>
                    <p className="font-medium">{unit.squareFeet || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Bedrooms</p>
                    <p className="font-medium">{unit.bedrooms || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Bathrooms</p>
                    <p className="font-medium">{unit.bathrooms || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="occupants" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle>Owner</CardTitle>
              </CardHeader>
              <CardContent>
                {unit.owner ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Name</p>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[var(--teal)]" />
                        <Link
                          href={`/management/people/${unit.owner.id}`}
                          className="font-medium text-[var(--teal)] hover:underline"
                        >
                          {unit.owner.firstName} {unit.owner.lastName}
                        </Link>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[var(--secondary-text)]" />
                        <a
                          href={`mailto:${unit.owner.email}`}
                          className="text-[var(--teal)] hover:underline"
                        >
                          {unit.owner.email}
                        </a>
                      </div>
                    </div>
                    {unit.owner.phone && (
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">Phone</p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[var(--secondary-text)]" />
                          <a
                            href={`tel:${unit.owner.phone}`}
                            className="text-[var(--teal)] hover:underline"
                          >
                            {unit.owner.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[var(--secondary-text)]">No owner assigned</p>
                )}
              </CardContent>
            </Card>

            {/* Tenant Info */}
            <Card>
              <CardHeader>
                <CardTitle>Tenant</CardTitle>
              </CardHeader>
              <CardContent>
                {unit.tenant ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Name</p>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[var(--teal)]" />
                        <Link
                          href={`/management/people/${unit.tenant.id}`}
                          className="font-medium text-[var(--teal)] hover:underline"
                        >
                          {unit.tenant.firstName} {unit.tenant.lastName}
                        </Link>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[var(--secondary-text)]" />
                        <a
                          href={`mailto:${unit.tenant.email}`}
                          className="text-[var(--teal)] hover:underline"
                        >
                          {unit.tenant.email}
                        </a>
                      </div>
                    </div>
                    {unit.tenant.phone && (
                      <div>
                        <p className="text-sm text-[var(--secondary-text)]">Phone</p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[var(--secondary-text)]" />
                          <a
                            href={`tel:${unit.tenant.phone}`}
                            className="text-[var(--teal)] hover:underline"
                          >
                            {unit.tenant.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[var(--secondary-text)]">No tenant assigned</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Maintenance Requests</CardTitle>
              <Link href="/management/maintenance/new">
                <Button size="sm" className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                  New Request
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {maintenanceRequests.length > 0 ? (
                <div className="space-y-4">
                  {maintenanceRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-[var(--page-background)] rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/management/maintenance/${request.id}`}
                          className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                        >
                          {request.title}
                        </Link>
                        <Badge className="bg-teal-100 text-teal-700">{request.status}</Badge>
                      </div>
                      <p className="text-xs text-[var(--secondary-text)] mt-1">
                        {request.requestNumber}
                      </p>
                      <p className="text-sm text-[var(--secondary-text)] mt-2">
                        Reported: {new Date(request.reportedDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--secondary-text)]">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No maintenance requests for this unit</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents for this unit</p>
                <Button variant="outline" className="mt-4">
                  Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
