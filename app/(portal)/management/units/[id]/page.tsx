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
  MapPin,
  Plus,
} from "lucide-react";

interface Unit {
  id: string;
  unitId: string;
  propertyId: string;
  unitNumber: string;
  displayName?: string;
  type?: string;
  status: string;
  occupancyStatus?: string;
  rentalStatus?: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string;
  parkingSpot?: string;
  storageUnit?: string;
  moveInDate?: string;
  moveOutDate?: string;
  mailingAddress?: string;
  accessNotes?: string;
}

interface Property {
  id: string;
  name: string;
  addressStreet: string;
  addressCity?: string;
  addressState?: string;
  associationId: string;
}

interface Association {
  id: string;
  name: string;
}

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  urgency?: string;
  reportedDate?: string;
}

interface Document {
  id: string;
  documentId: string;
  title: string;
  documentType: string;
  status: string;
}

export default function UnitDetailPage() {
  const params = useParams();
  const unitId = params.id as string;

  const [unit, setUnit] = useState<Unit | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [association, setAssociation] = useState<Association | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Fetch unit details
        const unitRes = await fetch(`/api/units/${unitId}`);
        if (!unitRes.ok) throw new Error("Failed to fetch unit");
        const unitData = await unitRes.json();
        if (!unitData.success) throw new Error(unitData.error);
        setUnit(unitData.data);
        
        // Fetch property details
        if (unitData.data.propertyId) {
          const propRes = await fetch(`/api/properties/${unitData.data.propertyId}`);
          if (propRes.ok) {
            const propData = await propRes.json();
            if (propData.success) {
              setProperty(propData.data);
              
              // Fetch association details
              if (propData.data.associationId) {
                const assocRes = await fetch(`/api/associations/${propData.data.associationId}`);
                if (assocRes.ok) {
                  const assocData = await assocRes.json();
                  if (assocData.success) setAssociation(assocData.data);
                }
              }
            }
          }
        }
        
        // Fetch maintenance requests for this unit
        const maintRes = await fetch(`/api/maintenance?unitId=${unitId}`);
        if (maintRes.ok) {
          const maintData = await maintRes.json();
          if (maintData.success) setMaintenanceRequests(maintData.data.data || []);
        }
        
        // Fetch documents for this unit
        const docsRes = await fetch(`/api/documents?unitId=${unitId}`);
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          if (docsData.success) setDocuments(docsData.data.data || []);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [unitId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "occupied":
        return <Badge className="bg-green-100 text-green-700">Occupied</Badge>;
      case "vacant":
        return <Badge className="bg-blue-100 text-blue-700">Vacant</Badge>;
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-700">Maintenance</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency?: string) => {
    switch (urgency) {
      case "emergency":
        return <Badge className="bg-red-100 text-red-700">Emergency</Badge>;
      case "urgent":
        return <Badge className="bg-orange-100 text-orange-700">Urgent</Badge>;
      case "high":
        return <Badge className="bg-amber-100 text-amber-700">High</Badge>;
      default:
        return <Badge variant="secondary">{urgency || "Normal"}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">{error || "Unit not found"}</p>
        <Link href="/management/units">
          <Button variant="outline">Back to Units</Button>
        </Link>
      </div>
    );
  }

  const openMaintenanceCount = maintenanceRequests.filter(
    m => !["completed", "closed", "cancelled"].includes(m.status)
  ).length;

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
          {unit.displayName && unit.displayName !== unit.unitNumber && (
            <p className="text-[var(--secondary-text)]">{unit.displayName}</p>
          )}
          <p className="text-sm text-[var(--secondary-text)]">{unit.unitId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/management/units/${unit.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
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
                <p className="text-2xl font-semibold">{unit.bedrooms ?? "-"}</p>
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
                <p className="text-2xl font-semibold">{unit.bathrooms ?? "-"}</p>
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
                <p className="text-sm text-[var(--secondary-text)]">Open Requests</p>
                <p className="text-2xl font-semibold">{openMaintenanceCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-[var(--page-background)] p-1 text-[var(--secondary-text)] flex-wrap gap-1">
          <TabsTrigger value="overview" className="px-3 py-1.5 text-sm">Overview</TabsTrigger>
          <TabsTrigger value="maintenance" className="px-3 py-1.5 text-sm">Maintenance ({maintenanceRequests.length})</TabsTrigger>
          <TabsTrigger value="documents" className="px-3 py-1.5 text-sm">Documents ({documents.length})</TabsTrigger>
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
                    {property ? (
                      <Link
                        href={`/management/properties/${property.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {property.name}
                      </Link>
                    ) : (
                      <span className="font-medium">Unknown Property</span>
                    )}
                  </div>
                  {property && (
                    <p className="text-sm text-[var(--secondary-text)] mt-1">
                      {property.addressStreet}
                      {property.addressCity && `, ${property.addressCity}`}
                      {property.addressState && `, ${property.addressState}`}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Association</p>
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-[var(--teal)]" />
                    {association ? (
                      <Link
                        href={`/management/associations/${association.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {association.name}
                      </Link>
                    ) : (
                      <span className="font-medium">Unknown Association</span>
                    )}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Unit Type</p>
                    <p className="font-medium">{unit.type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Floor</p>
                    <p className="font-medium">{unit.floor || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Occupancy Status</p>
                    <p className="font-medium capitalize">{unit.occupancyStatus || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Rental Status</p>
                    <p className="font-medium capitalize">{unit.rentalStatus?.replace(/_/g, " ") || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Parking Spot</p>
                    <p className="font-medium">{unit.parkingSpot || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Storage Unit</p>
                    <p className="font-medium">{unit.storageUnit || "-"}</p>
                  </div>
                </div>
                
                {(unit.moveInDate || unit.moveOutDate) && (
                  <div className="pt-4 border-t border-[var(--border-color)]">
                    <div className="grid grid-cols-2 gap-4">
                      {unit.moveInDate && (
                        <div>
                          <p className="text-sm text-[var(--secondary-text)]">Move-in Date</p>
                          <p className="font-medium">{new Date(unit.moveInDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {unit.moveOutDate && (
                        <div>
                          <p className="text-sm text-[var(--secondary-text)]">Move-out Date</p>
                          <p className="font-medium">{new Date(unit.moveOutDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {unit.mailingAddress && (
                  <div className="pt-4 border-t border-[var(--border-color)]">
                    <p className="text-sm text-[var(--secondary-text)] flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Mailing Address
                    </p>
                    <p className="font-medium whitespace-pre-line">{unit.mailingAddress}</p>
                  </div>
                )}
                
                {unit.accessNotes && (
                  <div className="pt-4 border-t border-[var(--border-color)]">
                    <p className="text-sm text-[var(--secondary-text)]">Access Notes</p>
                    <p className="font-medium">{unit.accessNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Maintenance Requests ({maintenanceRequests.length})</h3>
            <Link href={`/management/maintenance/new?unitId=${unit.id}`}>
              <Button size="sm" className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </Link>
          </div>
          {maintenanceRequests.length > 0 ? (
            <div className="space-y-4">
              {maintenanceRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                          <Wrench className="h-5 w-5 text-[var(--teal)]" />
                        </div>
                        <div>
                          <Link
                            href={`/management/maintenance/${request.id}`}
                            className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                          >
                            {request.title}
                          </Link>
                          <p className="text-xs text-[var(--secondary-text)]">
                            {request.requestNumber}
                          </p>
                          {request.reportedDate && (
                            <p className="text-sm text-[var(--secondary-text)]">
                              Reported: {new Date(request.reportedDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">{request.status}</Badge>
                        {getUrgencyBadge(request.urgency)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No maintenance requests for this unit</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Documents ({documents.length})</h3>
            <Link href={`/management/documents/new?unitId=${unit.id}`}>
              <Button size="sm" className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </Link>
          </div>
          {documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-[var(--teal)]" />
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/management/documents/${doc.id}`}
                          className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                        >
                          {doc.title}
                        </Link>
                        <p className="text-sm text-[var(--secondary-text)]">{doc.documentType}</p>
                      </div>
                      <Badge variant="outline">{doc.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents for this unit</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
