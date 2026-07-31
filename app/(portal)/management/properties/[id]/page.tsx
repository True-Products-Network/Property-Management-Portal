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
  ClipboardCheck,
  FileText,
  MapPin,
  Phone,
  Mail,
  Edit,
  Loader2,
} from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  associationId: string;
  associationName: string;
  unitCount: number;
  status: "active" | "inactive" | "maintenance";
  description?: string;
  yearBuilt?: number;
  propertyType: string;
  manager?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface Unit {
  id: string;
  unitNumber: string;
  status: "occupied" | "vacant" | "maintenance";
  ownerName?: string;
  tenantName?: string;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  async function loadProperty() {
    try {
      // Mock data for now
      const mockProperty: Property = {
        id: propertyId,
        name: "6722 S Ridgeland",
        address: "6722 S Ridgeland Ave",
        city: "Chicago",
        state: "IL",
        zip: "60649",
        associationId: "TEST-ASSOC-RIDGELAND",
        associationName: "Ridgeland Condominium Association",
        unitCount: 12,
        status: "active",
        description: "A well-maintained condominium building with 12 units. Built in 1985 and recently renovated.",
        yearBuilt: 1985,
        propertyType: "Condominium",
        manager: {
          name: "Sarah Johnson",
          email: "sarah@exemplary.com",
          phone: "(555) 123-4567",
        },
      };

      const mockUnits: Unit[] = [
        { id: "UNIT-1", unitNumber: "1N", status: "occupied", ownerName: "John Smith", tenantName: "John Smith" },
        { id: "UNIT-2", unitNumber: "1S", status: "occupied", ownerName: "Mary Jones", tenantName: "Mary Jones" },
        { id: "UNIT-3", unitNumber: "2N", status: "vacant", ownerName: "Bob Wilson" },
        { id: "UNIT-4", unitNumber: "2S", status: "occupied", ownerName: "Lisa Davis", tenantName: "Tom Davis" },
        { id: "UNIT-5", unitNumber: "3N", status: "maintenance" },
        { id: "UNIT-6", unitNumber: "3S", status: "occupied", ownerName: "Karen Lee", tenantName: "Karen Lee" },
      ];

      setProperty(mockProperty);
      setUnits(mockUnits);
    } catch (error) {
      console.error("Error loading property:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-700">Maintenance</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getUnitStatusBadge = (status: string) => {
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

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">Property not found</p>
        <Link href="/management/properties">
          <Button variant="outline" className="mt-4">
            Back to Properties
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
              href="/management/properties"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Properties
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {property.name}
            </h1>
            {getStatusBadge(property.status)}
          </div>
          <p className="text-[var(--secondary-text)]">{property.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
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
                <p className="text-2xl font-semibold">
                  {units.filter((u) => u.status === "occupied").length}
                </p>
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
                <p className="text-2xl font-semibold">
                  {units.filter((u) => u.status === "vacant").length}
                </p>
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
                <p className="text-2xl font-semibold">
                  {units.filter((u) => u.status === "maintenance").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
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
                  <p className="text-sm text-[var(--secondary-text)]">Description</p>
                  <p className="text-[var(--main-text)]">{property.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Property Type</p>
                    <p className="font-medium">{property.propertyType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Year Built</p>
                    <p className="font-medium">{property.yearBuilt}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Association</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[var(--teal)]" />
                    <Link
                      href={`/management/associations/${property.associationId}`}
                      className="font-medium text-[var(--teal)] hover:underline"
                    >
                      {property.associationName}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manager Info */}
            <Card>
              <CardHeader>
                <CardTitle>Property Manager</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.manager ? (
                  <>
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Name</p>
                      <p className="font-medium">{property.manager.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-[var(--secondary-text)]" />
                        <a
                          href={`mailto:${property.manager.email}`}
                          className="text-[var(--teal)] hover:underline"
                        >
                          {property.manager.email}
                        </a>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[var(--secondary-text)]" />
                        <a
                          href={`tel:${property.manager.phone}`}
                          className="text-[var(--teal)] hover:underline"
                        >
                          {property.manager.phone}
                        </a>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[var(--secondary-text)]">No manager assigned</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Address Card */}
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                <div>
                  <p className="font-medium">{property.address}</p>
                  <p className="text-[var(--secondary-text)]">
                    {property.city}, {property.state} {property.zip}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Units</CardTitle>
              <Link href={`/management/units/new?propertyId=${propertyId}`}>
                <Button size="sm" className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                  Add Unit
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                        Unit
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                        Owner
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                        Tenant
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((unit) => (
                      <tr
                        key={unit.id}
                        className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                      >
                        <td className="py-3 px-4">
                          <Link
                            href={`/management/units/${unit.id}`}
                            className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                          >
                            Unit {unit.unitNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4">{getUnitStatusBadge(unit.status)}</td>
                        <td className="py-3 px-4 text-sm">
                          {unit.ownerName || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {unit.tenantName || "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/management/units/${unit.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Maintenance requests will appear here</p>
                <Link href="/management/maintenance/new">
                  <Button variant="outline" className="mt-4">
                    Create Request
                  </Button>
                </Link>
              </div>
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
                <p>Documents will appear here</p>
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
