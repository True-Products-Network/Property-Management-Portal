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
  Upload,
  Shield,
  CircleDollarSign,
  Megaphone,
} from "lucide-react";

interface Association {
  id: string;
  associationId: string;
  name: string;
  legalName?: string;
  type: string;
  status: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  phone?: string;
  email?: string;
  fiscalYear?: string;
  annualMeetingMonth?: string;
  managementStartDate?: string;
  assignedManagerId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  propertyId: string;
  name: string;
  addressStreet: string;
  type: string;
  totalUnits: number;
}

interface Contact {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  urgency?: string;
}

export default function AssociationDetailPage() {
  const params = useParams();
  const associationId = params.id as string;
  
  const [association, setAssociation] = useState<Association | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        
        // Fetch association details
        const assocRes = await fetch(`/api/associations/${associationId}`);
        if (!assocRes.ok) throw new Error("Failed to fetch association");
        const assocData = await assocRes.json();
        if (!assocData.success) throw new Error(assocData.error);
        setAssociation(assocData.data);
        
        // Fetch properties for this association
        const propsRes = await fetch(`/api/properties?associationId=${associationId}`);
        if (propsRes.ok) {
          const propsData = await propsRes.json();
          if (propsData.success) setProperties(propsData.data.data || []);
        }
        
        // Fetch maintenance requests
        const maintRes = await fetch(`/api/maintenance?associationId=${associationId}`);
        if (maintRes.ok) {
          const maintData = await maintRes.json();
          if (maintData.success) setMaintenanceRequests(maintData.data.data || []);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [associationId]);

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

  if (error || !association) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">{error || "Association not found"}</p>
        <Link href="/management/associations">
          <Button variant="outline">Back to Associations</Button>
        </Link>
      </div>
    );
  }

  const openMaintenanceCount = maintenanceRequests.filter(
    m => !["completed", "closed", "cancelled"].includes(m.status)
  ).length;

  const totalUnits = properties.reduce((sum, p) => sum + (p.totalUnits || 0), 0);

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
          <p className="text-[var(--secondary-text)]">{association.associationId} • {association.legalName}</p>
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
                <p className="text-2xl font-semibold">{properties.length}</p>
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
                <p className="text-2xl font-semibold">{totalUnits}</p>
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Pending Approvals</p>
                <p className="text-2xl font-semibold">0</p>
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
          <TabsTrigger value="maintenance" className="px-3 py-1.5 text-sm">Maintenance</TabsTrigger>
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
                    <p className="font-medium">{association.fiscalYear || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Annual Meeting</p>
                    <p className="font-medium">{association.annualMeetingMonth || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Management Start</p>
                    <p className="font-medium">{association.managementStartDate || "N/A"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Address</p>
                  <p className="font-medium">
                    {association.addressStreet && (
                      <>
                        {association.addressStreet}
                        {association.addressCity && `, ${association.addressCity}`}
                        {association.addressState && `, ${association.addressState}`}
                        {association.addressZip && ` ${association.addressZip}`}
                      </>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Phone</p>
                    <p className="font-medium">{association.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Email</p>
                    <p className="font-medium">{association.email || "N/A"}</p>
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
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2 border-2 border-[var(--border-color)] hover:border-[var(--teal)] hover:bg-[var(--teal)]/5 transition-all">
                      <Plus className="h-5 w-5" />
                      <span className="text-xs text-center">Add Property</span>
                    </Button>
                  </Link>
                  <Link href={`/management/people/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2 border-2 border-[var(--border-color)] hover:border-[var(--teal)] hover:bg-[var(--teal)]/5 transition-all">
                      <Users className="h-5 w-5" />
                      <span className="text-xs text-center">Add People</span>
                    </Button>
                  </Link>
                  <Link href={`/management/documents/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2 border-2 border-[var(--border-color)] hover:border-[var(--teal)] hover:bg-[var(--teal)]/5 transition-all">
                      <Upload className="h-5 w-5" />
                      <span className="text-xs text-center leading-tight">Upload<br/>Document</span>
                    </Button>
                  </Link>
                  <Link href={`/management/compliance/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2 border-2 border-[var(--border-color)] hover:border-[var(--teal)] hover:bg-[var(--teal)]/5 transition-all">
                      <Shield className="h-5 w-5" />
                      <span className="text-xs text-center leading-tight">Add Compliance<br/>Matter</span>
                    </Button>
                  </Link>
                  <Link href={`/management/inspections/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2 border-2 border-[var(--border-color)] hover:border-[var(--teal)] hover:bg-[var(--teal)]/5 transition-all">
                      <ClipboardCheck className="h-5 w-5" />
                      <span className="text-xs text-center leading-tight">Schedule<br/>Inspection</span>
                    </Button>
                  </Link>
                  <Link href={`/management/maintenance/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2 border-2 border-[var(--border-color)] hover:border-[var(--teal)] hover:bg-[var(--teal)]/5 transition-all">
                      <Wrench className="h-5 w-5" />
                      <span className="text-xs text-center leading-tight">New Maintenance<br/>Request</span>
                    </Button>
                  </Link>
                  <Link href={`/management/payments/new?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2 border-2 border-[var(--border-color)] hover:border-[var(--teal)] hover:bg-[var(--teal)]/5 transition-all">
                      <CircleDollarSign className="h-5 w-5" />
                      <span className="text-xs text-center">Make Payment</span>
                    </Button>
                  </Link>
                  <Link href={`/management/communications/announcement?associationId=${association.id}`}>
                    <Button variant="outline" className="w-full h-auto py-3 flex flex-col items-center gap-2 border-2 border-[var(--border-color)] hover:border-[var(--teal)] hover:bg-[var(--teal)]/5 transition-all">
                      <Megaphone className="h-5 w-5" />
                      <span className="text-xs text-center leading-tight">Send<br/>Announcement</span>
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
            <h3 className="text-lg font-medium">Properties ({properties.length})</h3>
            <Link href={`/management/properties/new?associationId=${association.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {properties.map((property) => (
              <Card key={property.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                      <Home className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div className="flex-1">
                      <Link href={`/management/properties/${property.id}`}>
                        <p className="font-medium hover:text-[var(--teal)] transition-colors">{property.name}</p>
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">{property.addressStreet}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{property.type}</Badge>
                        <span className="text-sm text-[var(--secondary-text)]">{property.totalUnits} units</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {properties.length === 0 && (
              <p className="text-[var(--secondary-text)] col-span-2 text-center py-8">No properties found</p>
            )}
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Maintenance Requests ({maintenanceRequests.length})</h3>
            <Link href={`/management/maintenance/new?associationId=${association.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {maintenanceRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-[var(--teal)]" />
                      </div>
                      <div>
                        <Link href={`/management/maintenance/${request.id}`}>
                          <p className="font-medium hover:text-[var(--teal)] transition-colors">{request.title}</p>
                        </Link>
                        <p className="text-sm text-[var(--secondary-text)]">{request.requestNumber}</p>
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
      </Tabs>
    </div>
  );
}
