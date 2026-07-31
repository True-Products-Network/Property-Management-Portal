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
} from "lucide-react";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  type: "owner" | "tenant" | "both";
  status: "active" | "inactive" | "pending";
  portalAccess: boolean;
  portalStatus?: "active" | "invited" | "suspended";
  portalLastLogin?: string;
  notes?: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  associationId: string;
  associationName: string;
  role: "owner" | "tenant";
}

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  priority: string;
  reportedDate: string;
  unitNumber?: string;
}

export default function PersonDetailPage() {
  const params = useParams();
  const personId = params.id as string;

  const [person, setPerson] = useState<Person | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadPerson();
  }, [personId]);

  async function loadPerson() {
    try {
      const mockPerson: Person = {
        id: personId,
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@example.com",
        phone: "(555) 123-4567",
        type: "owner",
        status: "active",
        portalAccess: true,
        portalStatus: "active",
        portalLastLogin: "2026-07-30T14:30:00Z",
        notes: "Long-time resident. Prefers email communication.",
      };

      const mockUnits: Unit[] = [
        {
          id: "UNIT-1",
          unitNumber: "1N",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          role: "owner",
        },
      ];

      const mockMaintenance: MaintenanceRequest[] = [
        {
          id: "MNT-001",
          requestNumber: "MNT-2026-0047",
          title: "HVAC Repair",
          status: "in_progress",
          priority: "high",
          reportedDate: "2026-07-28T10:00:00Z",
          unitNumber: "1N",
        },
      ];

      setPerson(mockPerson);
      setUnits(mockUnits);
      setMaintenanceRequests(mockMaintenance);
    } catch (error) {
      console.error("Error loading person:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "owner":
        return <Badge className="bg-blue-100 text-blue-700">Owner</Badge>;
      case "tenant":
        return <Badge className="bg-green-100 text-green-700">Tenant</Badge>;
      case "both":
        return <Badge className="bg-purple-100 text-purple-700">Owner & Tenant</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getPortalBadge = (person: Person) => {
    if (!person.portalAccess) {
      return <Badge className="bg-gray-100 text-gray-700">No Portal Access</Badge>;
    }
    switch (person.portalStatus) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Portal Active</Badge>;
      case "invited":
        return <Badge className="bg-amber-100 text-amber-700">Invited</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-700">Suspended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">No Access</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (!person) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">Person not found</p>
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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {person.firstName} {person.lastName}
            </h1>
            {getTypeBadge(person.type)}
            {getPortalBadge(person)}
          </div>
          <p className="text-[var(--secondary-text)]">{person.email}</p>
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
                <CreditCard className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Payments</p>
                <p className="text-2xl font-semibold">0</p>
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
                <p className="text-sm text-[var(--secondary-text)]">Last Login</p>
                <p className="text-lg font-semibold">
                  {person.portalLastLogin
                    ? new Date(person.portalLastLogin).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-[500px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
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
                      href={`mailto:${person.email}`}
                      className="text-[var(--teal)] hover:underline"
                    >
                      {person.email}
                    </a>
                  </div>
                </div>
                {person.phone && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[var(--secondary-text)]" />
                      <a
                        href={`tel:${person.phone}`}
                        className="text-[var(--teal)] hover:underline"
                      >
                        {person.phone}
                      </a>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Portal Access</p>
                  <div className="flex items-center gap-2 mt-1">
                    {person.portalAccess ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span>
                      {person.portalAccess
                        ? `Portal ${person.portalStatus}`
                        : "No portal access"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--main-text)]">
                  {person.notes || "No notes available."}
                </p>
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
                        <Badge className="bg-blue-100 text-blue-700">
                          {unit.role === "owner" ? "Owner" : "Tenant"}
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
                        <Badge className="bg-teal-100 text-teal-700">
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--secondary-text)] mt-1">
                        {request.requestNumber}
                      </p>
                      {request.unitNumber && (
                        <p className="text-sm text-[var(--secondary-text)] mt-1">
                          Unit: {request.unitNumber}
                        </p>
                      )}
                      <p className="text-sm text-[var(--secondary-text)] mt-1">
                        Reported: {new Date(request.reportedDate).toLocaleDateString()}
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

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payment history available</p>
              </div>
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
