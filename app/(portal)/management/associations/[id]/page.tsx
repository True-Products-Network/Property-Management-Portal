"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

interface Association {
  id: string;
  associationId: string;
  name: string;
  shortName?: string;
  legalName?: string;
  type: string;
  status: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  mailingAddress?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  fiscalYear?: string;
  fiscalYearEndMonth?: string;
  fiscalYearEndDay?: number;
  annualMeetingMonth?: string;
  managementStartDate?: string;
  assignedManagerId?: string;
  financialPlatform?: string;
  financialPortalLink?: string;
  documentStorageLink?: string;
  emergencyInstructions?: string;
  generalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  propertyId: string;
  name: string;
  addressStreet: string;
  type: string;
  status: string;
  totalUnits: number;
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

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  urgency?: string;
}

interface Document {
  id: string;
  documentId: string;
  title: string;
  documentType: string;
  status: string;
}

interface ComplianceItem {
  id: string;
  complianceId: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
}

export default function AssociationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const associationId = params.id as string;
  
  const [association, setAssociation] = useState<Association | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
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
        
        // Fetch contacts for this association
        const contactsRes = await fetch(`/api/contacts?associationId=${associationId}`);
        if (contactsRes.ok) {
          const contactsData = await contactsRes.json();
          if (contactsData.success) setContacts(contactsData.data.data || []);
        }
        
        // Fetch maintenance requests
        const maintRes = await fetch(`/api/maintenance?associationId=${associationId}`);
        if (maintRes.ok) {
          const maintData = await maintRes.json();
          if (maintData.success) setMaintenanceRequests(maintData.data.data || []);
        }
        
        // Fetch documents
        const docsRes = await fetch(`/api/documents?associationId=${associationId}`);
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          if (docsData.success) setDocuments(docsData.data.data || []);
        }
        
        // Fetch compliance items
        const complianceRes = await fetch(`/api/compliance?associationId=${associationId}`);
        if (complianceRes.ok) {
          const complianceData = await complianceRes.json();
          if (complianceData.success) setComplianceItems(complianceData.data.data || []);
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
      case "prospect":
        return <Badge className="bg-purple-100 text-purple-700">Prospect</Badge>;
      case "on_hold":
        return <Badge className="bg-amber-100 text-amber-700">On Hold</Badge>;
      case "ending_management":
        return <Badge className="bg-red-100 text-red-700">Ending</Badge>;
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      condominium: "Condominium",
      hoa: "HOA",
      cooperative: "Cooperative",
      commercial: "Commercial",
      mixed_use: "Mixed Use",
      other: "Other",
    };
    return labels[type] || type;
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
        <p className="text-red-600">{error || "Business not found"}</p>
        <Link href="/management/associations">
          <Button variant="outline">Back to Businesses</Button>
        </Link>
      </div>
    );
  }

  const openMaintenanceCount = maintenanceRequests.filter(
    m => !["completed", "closed", "cancelled"].includes(m.status)
  ).length;

  const totalUnits = properties.reduce((sum, p) => sum + (p.totalUnits || 0), 0);
  const boardMembers = contacts.filter(c => c.roles?.includes("board_member"));
  const openCompliance = complianceItems.filter(c => c.status !== "resolved").length;

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
              Back to Businesses
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">{association.name}</h1>
            {getStatusBadge(association.status)}
          </div>
          <p className="text-[var(--secondary-text)]">{association.associationId}</p>
          {association.legalName && association.legalName !== association.name && (
            <p className="text-sm text-[var(--secondary-text)]">{association.legalName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/management/associations/${association.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
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
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Board Members</p>
                <p className="text-2xl font-semibold">{boardMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-[var(--page-background)] p-1 text-[var(--secondary-text)] flex-wrap gap-1">
          <TabsTrigger value="overview" className="px-3 py-1.5 text-sm">Overview</TabsTrigger>
          <TabsTrigger value="properties" className="px-3 py-1.5 text-sm">Properties ({properties.length})</TabsTrigger>
          <TabsTrigger value="people" className="px-3 py-1.5 text-sm">People ({contacts.length})</TabsTrigger>
          <TabsTrigger value="maintenance" className="px-3 py-1.5 text-sm">Maintenance ({maintenanceRequests.length})</TabsTrigger>
          <TabsTrigger value="documents" className="px-3 py-1.5 text-sm">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="compliance" className="px-3 py-1.5 text-sm">Compliance ({complianceItems.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Details */}
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Business Type</p>
                    <p className="font-medium">{getTypeLabel(association.type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Tax ID</p>
                    <p className="font-medium">{association.taxId || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Fiscal Year End</p>
                    <p className="font-medium">
                      {association.fiscalYearEndMonth 
                        ? `${association.fiscalYearEndMonth} ${association.fiscalYearEndDay || ""}`
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Annual Meeting</p>
                    <p className="font-medium">{association.annualMeetingMonth || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Management Start</p>
                    <p className="font-medium">
                      {association.managementStartDate 
                        ? new Date(association.managementStartDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Financial Platform</p>
                    <p className="font-medium capitalize">{association.financialPlatform || "N/A"}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-[var(--border-color)]">
                  <p className="text-sm text-[var(--secondary-text)] mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address
                  </p>
                  <p className="font-medium">
                    {association.addressStreet || "No address on file"}
                  </p>
                  {(association.addressCity || association.addressState || association.addressZip) && (
                    <p className="text-[var(--main-text)]">
                      {association.addressCity && `${association.addressCity}, `}
                      {association.addressState} {association.addressZip}
                    </p>
                  )}
                </div>
                
                {association.mailingAddress && (
                  <div className="pt-2">
                    <p className="text-sm text-[var(--secondary-text)]">Mailing Address</p>
                    <p className="font-medium whitespace-pre-line">{association.mailingAddress}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]">
                  {association.phone && (
                    <div>
                      <p className="text-sm text-[var(--secondary-text)] flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </p>
                      <p className="font-medium">{association.phone}</p>
                    </div>
                  )}
                  {association.email && (
                    <div>
                      <p className="text-sm text-[var(--secondary-text)] flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </p>
                      <a href={`mailto:${association.email}`} className="font-medium text-[var(--teal)] hover:underline">
                        {association.email}
                      </a>
                    </div>
                  )}
                </div>
                
                {association.emergencyInstructions && (
                  <div className="pt-4 border-t border-[var(--border-color)]">
                    <p className="text-sm text-[var(--secondary-text)]">Emergency Instructions</p>
                    <p className="font-medium whitespace-pre-line">{association.emergencyInstructions}</p>
                  </div>
                )}
                
                {association.generalNotes && (
                  <div className="pt-2">
                    <p className="text-sm text-[var(--secondary-text)]">General Notes</p>
                    <p className="font-medium whitespace-pre-line">{association.generalNotes}</p>
                  </div>
                )}
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
                        {getStatusBadge(property.status)}
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

        {/* People Tab */}
        <TabsContent value="people" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">People ({contacts.length})</h3>
            <Link href={`/management/people/new?associationId=${association.id}`}>
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
                    <div className="flex-1 min-w-0">
                      <Link href={`/management/people/${contact.id}`}>
                        <p className="font-medium hover:text-[var(--teal)] transition-colors truncate">
                          {contact.firstName} {contact.lastName}
                        </p>
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)] truncate">{contact.email}</p>
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

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Documents ({documents.length})</h3>
            <Link href={`/management/documents/new?associationId=${association.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[var(--teal)]" />
                    </div>
                    <div className="flex-1">
                      <Link href={`/management/documents/${doc.id}`}>
                        <p className="font-medium hover:text-[var(--teal)] transition-colors">{doc.title}</p>
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

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Compliance Matters ({complianceItems.length})</h3>
            <Link href={`/management/compliance/new?associationId=${association.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Compliance
              </Button>
            </Link>
          </div>
          <div className="space-y-3">
            {complianceItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-[var(--teal)]" />
                      </div>
                      <div>
                        <Link href={`/management/compliance/${item.id}`}>
                          <p className="font-medium hover:text-[var(--teal)] transition-colors">{item.title}</p>
                        </Link>
                        {item.dueDate && (
                          <p className="text-sm text-[var(--secondary-text)]">
                            Due: {new Date(item.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline">{item.status}</Badge>
                      <Badge className={
                        item.priority === "high" ? "bg-red-100 text-red-700" :
                        item.priority === "medium" ? "bg-amber-100 text-amber-700" :
                        "bg-blue-100 text-blue-700"
                      }>
                        {item.priority}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {complianceItems.length === 0 && (
              <p className="text-[var(--secondary-text)] text-center py-8">No compliance items found</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
