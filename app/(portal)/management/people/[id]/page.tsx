"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Home,
  Building2,
  Mail,
  Phone,
  Edit,
  Loader2,
  Wrench,
  FileText,
  CreditCard,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Contact {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  preferredContactMethod?: string;
  mailingPreference?: string;
  emailPermission: boolean;
  smsPermission: boolean;
  mailingAddressStreet?: string;
  mailingAddressCity?: string;
  mailingAddressState?: string;
  mailingAddressZip?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  portalInvitationStatus: string;
  portalInvitedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  associationId: string;
  associationName: string;
  role: string;
}

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  urgency?: string;
  createdAt: string;
  unitNumber?: string;
  propertyName?: string;
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (contactId) {
      loadContact();
      loadContactUnits();
      loadContactMaintenance();
    }
  }, [contactId]);

  async function loadContact() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/contacts/${contactId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load contact");
      }
      
      setContact(result.data);
    } catch (error) {
      console.error("Error loading contact:", error);
      setError(error instanceof Error ? error.message : "Failed to load contact");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadContactUnits() {
    try {
      // Fetch contact units from a joined query
      const response = await fetch(`/api/contacts/${contactId}/units`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUnits(result.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading contact units:", error);
      // Non-critical error, don't show to user
    }
  }

  async function loadContactMaintenance() {
    try {
      // Fetch maintenance requests reported by this contact
      const response = await fetch(`/api/maintenance?reportedBy=${contactId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMaintenanceRequests(result.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading maintenance requests:", error);
      // Non-critical error, don't show to user
    }
  }

  const getPortalBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Portal Active</Badge>;
      case "invited":
        return <Badge className="bg-amber-100 text-amber-700">Invited</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-700">Suspended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">No Portal Access</Badge>;
    }
  };

  const getPreferredContactBadge = (method?: string) => {
    switch (method) {
      case "email":
        return <Badge className="bg-blue-100 text-blue-700">Email</Badge>;
      case "phone":
        return <Badge className="bg-green-100 text-green-700">Phone</Badge>;
      case "sms":
        return <Badge className="bg-purple-100 text-purple-700">SMS</Badge>;
      case "mail":
        return <Badge className="bg-amber-100 text-amber-700">Mail</Badge>;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-700">New</Badge>;
      case "in_progress":
        return <Badge className="bg-teal-100 text-teal-700">In Progress</Badge>;
      case "waiting":
        return <Badge className="bg-amber-100 text-amber-700">Waiting</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-700">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "emergency":
        return <Badge className="bg-red-100 text-red-700">Emergency</Badge>;
      case "urgent":
        return <Badge className="bg-amber-100 text-amber-700">Urgent</Badge>;
      case "normal":
        return <Badge className="bg-blue-100 text-blue-700">Normal</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-700">Low</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <div className="flex gap-2">
          <Button onClick={loadContact} variant="outline">
            Retry
          </Button>
          <Link href="/management/people">
            <Button variant="outline">Back to People</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">Contact not found</p>
        <Link href="/management/people">
          <Button variant="outline" className="mt-4">
            Back to People
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
              href="/management/people"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to People
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {contact.firstName} {contact.lastName}
            </h1>
            {getPortalBadge(contact.portalInvitationStatus)}
            {getPreferredContactBadge(contact.preferredContactMethod)}
          </div>
          <p className="text-[var(--secondary-text)]">{contact.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/management/people/${contactId}/edit`)}
          >
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
                <Home className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Units</p>
                <p className="text-2xl font-semibold">{units.length}</p>
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
                <p className="text-sm text-[var(--secondary-text)]">Requests</p>
                <p className="text-2xl font-semibold">{maintenanceRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Email Opt-in</p>
                <p className="text-2xl font-semibold">
                  {contact.emailPermission ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Added</p>
                <p className="text-lg font-semibold">
                  {new Date(contact.createdAt).toLocaleDateString()}
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
          <TabsTrigger value="communications">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[var(--secondary-text)]" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-[var(--teal)] hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
                {contact.phone && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[var(--secondary-text)]" />
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-[var(--teal)] hover:underline"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                )}
                {contact.mobilePhone && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Mobile</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[var(--secondary-text)]" />
                      <a
                        href={`tel:${contact.mobilePhone}`}
                        className="text-[var(--teal)] hover:underline"
                      >
                        {contact.mobilePhone}
                      </a>
                    </div>
                  </div>
                )}
                {contact.workPhone && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Work Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[var(--secondary-text)]" />
                      <a
                        href={`tel:${contact.workPhone}`}
                        className="text-[var(--teal)] hover:underline"
                      >
                        {contact.workPhone}
                      </a>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Preferred Contact</p>
                  <p className="capitalize">{contact.preferredContactMethod || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Mailing Preference</p>
                  <p className="capitalize">{contact.mailingPreference || "Not set"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Permissions & Address */}
            <Card>
              <CardHeader>
                <CardTitle>Permissions & Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Communication Permissions</p>
                  <div className="flex gap-2 mt-1">
                    {contact.emailPermission ? (
                      <Badge className="bg-blue-100 text-blue-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Email OK
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700">
                        <XCircle className="h-3 w-3 mr-1" />
                        No Email
                      </Badge>
                    )}
                    {contact.smsPermission ? (
                      <Badge className="bg-purple-100 text-purple-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        SMS OK
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700">
                        <XCircle className="h-3 w-3 mr-1" />
                        No SMS
                      </Badge>
                    )}
                  </div>
                </div>
                {(contact.mailingAddressStreet || contact.mailingAddressCity) && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Mailing Address</p>
                    <p>{contact.mailingAddressStreet}</p>
                    <p>
                      {contact.mailingAddressCity}
                      {contact.mailingAddressState && `, ${contact.mailingAddressState}`}
                      {contact.mailingAddressZip && ` ${contact.mailingAddressZip}`}
                    </p>
                  </div>
                )}
                {(contact.emergencyContactName || contact.emergencyContactPhone) && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Emergency Contact</p>
                    <p className="font-medium">{contact.emergencyContactName}</p>
                    {contact.emergencyContactPhone && (
                      <p className="text-sm">{contact.emergencyContactPhone}</p>
                    )}
                    {contact.emergencyContactRelationship && (
                      <p className="text-sm text-[var(--secondary-text)]">
                        {contact.emergencyContactRelationship}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="units">
          <Card>
            <CardHeader>
              <CardTitle>Units</CardTitle>
            </CardHeader>
            <CardContent>
              {units.length > 0 ? (
                <div className="space-y-4">
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      className="p-4 bg-[var(--page-background)] rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Link
                            href={`/management/units/${unit.id}`}
                            className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                          >
                            Unit {unit.unitNumber}
                          </Link>
                          <p className="text-sm text-[var(--secondary-text)]">
                            {unit.propertyName}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 capitalize">
                          {unit.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                        <Link
                          href={`/management/associations/${unit.associationId}`}
                          className="text-sm text-[var(--teal)] hover:underline"
                        >
                          {unit.associationName}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--secondary-text)]">
                  <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No units assigned</p>
                </div>
              )}
            </CardContent>
          </Card>
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
                        <div className="flex gap-2">
                          {getPriorityBadge(request.urgency)}
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                      <p className="text-xs text-[var(--secondary-text)] mt-1">
                        {request.requestNumber}
                      </p>
                      {request.propertyName && (
                        <p className="text-sm text-[var(--secondary-text)] mt-1">
                          {request.propertyName}
                          {request.unitNumber && ` - Unit ${request.unitNumber}`}
                        </p>
                      )}
                      <p className="text-sm text-[var(--secondary-text)] mt-1">
                        Reported: {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--secondary-text)]">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No maintenance requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Messages</CardTitle>
              <Button size="sm" className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No messages</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
