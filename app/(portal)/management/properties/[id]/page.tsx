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
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

interface Property {
  id: string;
  propertyId: string;
  associationId: string;
  name: string;
  addressStreet: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  type: string;
  status: string;
  yearBuilt?: number;
  totalUnits: number;
  managementStartDate?: string;
  accessInstructions?: string;
  emergencyNotes?: string;
  assignedStaffId?: string;
  photoUrl?: string;
}

interface Association {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitId: string;
  unitNumber: string;
  displayName?: string;
  type?: string;
  status: string;
  occupancyStatus?: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
}

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  urgency?: string;
  reportedDate?: string;
}

interface Contact {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  roles?: string[];
}

interface Vendor {
  id: string;
  vendorId: string;
  companyName: string;
  category?: string;
  status: string;
}

interface Document {
  id: string;
  documentId: string;
  title: string;
  documentType: string;
  status: string;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [association, setAssociation] = useState<Association | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch property details
        const propRes = await fetch(`/api/properties/${propertyId}`);
        if (!propRes.ok) throw new Error("Failed to fetch property");
        const propData = await propRes.json();
        if (!propData.success) throw new Error(propData.error);
        setProperty(propData.data);
        
        // Fetch association details
        if (propData.data.associationId) {
          const assocRes = await fetch(`/api/associations/${propData.data.associationId}`);
          if (assocRes.ok) {
            const assocData = await assocRes.json();
            if (assocData.success) setAssociation(assocData.data);
          }
        }
        
        // Fetch units for this property
        const unitsRes = await fetch(`/api/units?propertyId=${propertyId}`);
        if (unitsRes.ok) {
          const unitsData = await unitsRes.json();
          if (unitsData.success) setUnits(unitsData.data.data || []);
        }
        
        // Fetch maintenance requests for this property
        const maintRes = await fetch(`/api/maintenance?propertyId=${propertyId}`);
        if (maintRes.ok) {
          const maintData = await maintRes.json();
          if (maintData.success) setMaintenanceRequests(maintData.data.data || []);
        }
        
        // Fetch contacts for this property
        const contactsRes = await fetch(`/api/contacts?propertyId=${propertyId}`);
        if (contactsRes.ok) {
          const contactsData = await contactsRes.json();
          if (contactsData.success) setContacts(contactsData.data.data || []);
        }
        
        // Fetch vendors
        const vendorsRes = await fetch(`/api/vendors`);
        if (vendorsRes.ok) {
          const vendorsData = await vendorsRes.json();
          if (vendorsData.success) setVendors(vendorsData.data.data || []);
        }
        
        // Fetch documents for this property
        const docsRes = await fetch(`/api/documents?propertyId=${propertyId}`);
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
    
    fetchData();
  }, [propertyId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-700">Maintenance</Badge>;
      case "under_construction":
        return <Badge className="bg-blue-100 text-blue-700">Construction</Badge>;
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

  if (error || !property) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">{error || "Property not found"}</p>
        <Link href="/management/properties">
          <Button variant="outline">Back to Properties</Button>
        </Link>
      </div>
    );
  }

  const occupiedUnits = units.filter(u => u.occupancyStatus === "occupied" || u.status === "occupied").length;
  const vacantUnits = units.filter(u => u.occupancyStatus === "vacant" || u.status === "vacant").length;
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
          <p className="text-[var(--secondary-text)]">{property.propertyId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/management/properties/${property.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
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
                <p className="text-2xl font-semibold">{units.length || property.totalUnits || 0}</p>
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
                <p className="text-2xl font-semibold">{occupiedUnits}</p>
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
                <p className="text-2xl font-semibold">{vacantUnits}</p>
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
          <TabsTrigger value="units" className="px-3 py-1.5 text-sm">Units ({units.length})</TabsTrigger>
          <TabsTrigger value="people" className="px-3 py-1.5 text-sm">People ({contacts.length})</TabsTrigger>
          <TabsTrigger value="maintenance" className="px-3 py-1.5 text-sm">Maintenance ({maintenanceRequests.length})</TabsTrigger>
          <TabsTrigger value="vendors" className="px-3 py-1.5 text-sm">Vendors ({vendors.length})</TabsTrigger>
          <TabsTrigger value="documents" className="px-3 py-1.5 text-sm">Documents ({documents.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Property Image */}
            <Card className="lg:col-span-1">
              <CardContent className="p-0">
                {property.photoUrl ? (
                  <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                    <img 
                      src={property.photoUrl} 
                      alt={property.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-t-lg">
                    <ImageIcon className="h-16 w-16 text-gray-300" />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm text-[var(--secondary-text)] text-center">
                    {property.photoUrl ? "Property Photo" : "No photo uploaded"}
                  </p>
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
                    <p className="font-medium">{property.type || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Year Built</p>
                    <p className="font-medium">{property.yearBuilt || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Management Start</p>
                    <p className="font-medium">
                      {property.managementStartDate 
                        ? new Date(property.managementStartDate).toLocaleDateString()
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Total Units</p>
                    <p className="font-medium">{property.totalUnits || units.length || 0}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-[var(--border-color)]">
                  <p className="text-sm text-[var(--secondary-text)] mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </p>
                  <p className="font-medium">{property.addressStreet}</p>
                  <p className="text-[var(--main-text)]">
                    {property.addressCity && `${property.addressCity}, `}
                    {property.addressState} {property.addressZip}
                  </p>
                </div>
                
                {property.accessInstructions && (
                  <div className="pt-4 border-t border-[var(--border-color)]">
                    <p className="text-sm text-[var(--secondary-text)]">Access Instructions</p>
                    <p className="font-medium">{property.accessInstructions}</p>
                  </div>
                )}
                
                {property.emergencyNotes && (
                  <div className="pt-2">
                    <p className="text-sm text-[var(--secondary-text)]">Emergency Notes</p>
                    <p className="font-medium">{property.emergencyNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Association Card */}
          <Card>
            <CardHeader>
              <CardTitle>Association</CardTitle>
            </CardHeader>
            <CardContent>
              {association ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-[var(--teal)]" />
                  </div>
                  <div>
                    <Link
                      href={`/management/associations/${association.id}`}
                      className="font-medium text-[var(--teal)] hover:underline"
                    >
                      {association.name}
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-[var(--secondary-text)]">No association assigned</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Units ({units.length})</h3>
            <Link href={`/management/units/new?propertyId=${property.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map((unit) => (
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
                      {unit.displayName && unit.displayName !== unit.unitNumber && (
                        <p className="text-sm text-[var(--secondary-text)]">{unit.displayName}</p>
                      )}
                      <p className="text-sm text-[var(--secondary-text)]">{unit.type || "-"}</p>
                      {unit.bedrooms !== undefined && unit.bathrooms !== undefined && (
                        <p className="text-sm text-[var(--secondary-text)]">
                          {unit.bedrooms} bed, {unit.bathrooms} bath
                          {unit.squareFeet && ` • ${unit.squareFeet} sq ft`}
                        </p>
                      )}
                    </div>
                    {getUnitStatusBadge(unit.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
            {units.length === 0 && (
              <p className="text-[var(--secondary-text)] col-span-3 text-center py-8">No units found</p>
            )}
          </div>
        </TabsContent>

        {/* People Tab */}
        <TabsContent value="people" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">People ({contacts.length})</h3>
            <Link href={`/management/people/new?propertyId=${property.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Person
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/management/people/${contact.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{contact.email}</p>
                      {contact.phone && (
                        <p className="text-sm text-[var(--secondary-text)] flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </p>
                      )}
                      {contact.roles && contact.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {contact.roles.map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {role.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {contacts.length === 0 && (
              <p className="text-[var(--secondary-text)] col-span-2 text-center py-8">No people found</p>
            )}
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Maintenance Requests ({maintenanceRequests.length})</h3>
            <Link href={`/management/maintenance/new?propertyId=${property.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </Link>
          </div>
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
                          className="font-medium text-[var(--teal)] hover:underline"
                        >
                          {request.title}
                        </Link>
                        <p className="text-sm text-[var(--secondary-text)]">{request.requestNumber}</p>
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
            {maintenanceRequests.length === 0 && (
              <p className="text-[var(--secondary-text)] text-center py-8">No maintenance requests found</p>
            )}
          </div>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Vendors ({vendors.length})</h3>
            <Link href="/management/vendors/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendors.map((vendor) => (
              <Card key={vendor.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                      <Truck className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div className="flex-1">
                      <Link
                        href={`/management/vendors/${vendor.id}`}
                        className="font-medium text-[var(--teal)] hover:underline"
                      >
                        {vendor.companyName}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{vendor.category || "-"}</p>
                    </div>
                    <Badge variant="outline">{vendor.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {vendors.length === 0 && (
              <p className="text-[var(--secondary-text)] col-span-2 text-center py-8">No vendors found</p>
            )}
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Documents ({documents.length})</h3>
            <Link href={`/management/documents/new?propertyId=${property.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </Link>
          </div>
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
                        className="font-medium text-[var(--teal)] hover:underline"
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
            {documents.length === 0 && (
              <p className="text-[var(--secondary-text)] text-center py-8">No documents found</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
