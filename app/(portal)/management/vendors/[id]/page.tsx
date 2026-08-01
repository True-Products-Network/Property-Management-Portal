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
  Truck,
  Star,
  Phone,
  Mail,
  Edit,
  Loader2,
  Wrench,
  FileText,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface Vendor {
  id: string;
  vendorId: string;
  companyName: string;
  doingBusinessAs?: string;
  category?: string;
  status: string;
  primaryContactName?: string;
  email?: string;
  phone?: string;
  emergencyPhone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  licenseNumber?: string;
  insuranceExpiry?: string;
  workersCompExpiry?: string;
  rating?: number;
  totalJobs: number;
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceRequest {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  urgency?: string;
  createdAt: string;
  completedDate?: string;
  actualCost?: number;
  propertyName?: string;
  unitNumber?: string;
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (vendorId) {
      loadVendor();
      loadVendorMaintenance();
    }
  }, [vendorId]);

  async function loadVendor() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/vendors/${vendorId}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load vendor");
      }
      
      setVendor(result.data);
    } catch (error) {
      console.error("Error loading vendor:", error);
      setError(error instanceof Error ? error.message : "Failed to load vendor");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadVendorMaintenance() {
    try {
      // Fetch maintenance requests assigned to this vendor
      const response = await fetch(`/api/maintenance?vendorId=${vendorId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setMaintenanceRequests(result.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error loading maintenance requests:", error);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "pending_approval":
        return <Badge className="bg-amber-100 text-amber-700">Pending Approval</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-700">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getRequestStatusBadge = (status: string) => {
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

  const formatCategory = (category?: string) => {
    if (!category) return "-";
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const isInsuranceExpiringSoon = (date?: string) => {
    if (!date) return false;
    const expiry = new Date(date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry > new Date();
  };

  const isInsuranceExpired = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
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
          <Button onClick={loadVendor} variant="outline">
            Retry
          </Button>
          <Link href="/management/vendors">
            <Button variant="outline">Back to Vendors</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">Vendor not found</p>
        <Link href="/management/vendors">
          <Button variant="outline" className="mt-4">
            Back to Vendors
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
              href="/management/vendors"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Vendors
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {vendor.companyName}
            </h1>
            {getStatusBadge(vendor.status)}
          </div>
          {vendor.doingBusinessAs && vendor.doingBusinessAs !== vendor.companyName && (
            <p className="text-[var(--secondary-text)]">DBA: {vendor.doingBusinessAs}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/management/vendors/${vendorId}/edit`)}
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
                <Wrench className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Jobs</p>
                <p className="text-2xl font-semibold">{vendor.totalJobs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Rating</p>
                <p className="text-2xl font-semibold">
                  {vendor.rating ? vendor.rating.toFixed(1) : "-"}
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
                <p className="text-sm text-[var(--secondary-text)]">Active Jobs</p>
                <p className="text-2xl font-semibold">
                  {maintenanceRequests.filter(r => r.status === "new" || r.status === "in_progress").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Completed</p>
                <p className="text-2xl font-semibold">
                  {maintenanceRequests.filter(r => r.status === "completed" || r.status === "closed").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[300px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Jobs</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
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
                  <p className="text-sm text-[var(--secondary-text)]">Category</p>
                  <p className="font-medium">{formatCategory(vendor.category)}</p>
                </div>
                {vendor.primaryContactName && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Primary Contact</p>
                    <p>{vendor.primaryContactName}</p>
                  </div>
                )}
                {vendor.email && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[var(--secondary-text)]" />
                      <a
                        href={`mailto:${vendor.email}`}
                        className="text-[var(--teal)] hover:underline"
                      >
                        {vendor.email}
                      </a>
                    </div>
                  </div>
                )}
                {vendor.phone && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[var(--secondary-text)]" />
                      <a
                        href={`tel:${vendor.phone}`}
                        className="text-[var(--teal)] hover:underline"
                      >
                        {vendor.phone}
                      </a>
                    </div>
                  </div>
                )}
                {vendor.emergencyPhone && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Emergency Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-red-500" />
                      <a
                        href={`tel:${vendor.emergencyPhone}`}
                        className="text-red-500 hover:underline font-medium"
                      >
                        {vendor.emergencyPhone}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address & License */}
            <Card>
              <CardHeader>
                <CardTitle>Address & License</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(vendor.addressStreet || vendor.addressCity) && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Address</p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-[var(--secondary-text)] mt-1" />
                      <div>
                        <p>{vendor.addressStreet}</p>
                        <p>
                          {vendor.addressCity}
                          {vendor.addressState && `, ${vendor.addressState}`}
                          {vendor.addressZip && ` ${vendor.addressZip}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {vendor.licenseNumber && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">License Number</p>
                    <p className="font-medium">{vendor.licenseNumber}</p>
                  </div>
                )}
                {vendor.insuranceExpiry && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Insurance Expires</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[var(--secondary-text)]" />
                      <span
                        className={
                          isInsuranceExpired(vendor.insuranceExpiry)
                            ? "text-red-600 font-medium"
                            : isInsuranceExpiringSoon(vendor.insuranceExpiry)
                            ? "text-amber-600 font-medium"
                            : ""
                        }
                      >
                        {new Date(vendor.insuranceExpiry).toLocaleDateString()}
                      </span>
                      {isInsuranceExpired(vendor.insuranceExpiry) && (
                        <Badge className="bg-red-100 text-red-700">Expired</Badge>
                      )}
                      {isInsuranceExpiringSoon(vendor.insuranceExpiry) && (
                        <Badge className="bg-amber-100 text-amber-700">Expiring Soon</Badge>
                      )}
                    </div>
                  </div>
                )}
                {vendor.workersCompExpiry && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Workers Comp Expires</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[var(--secondary-text)]" />
                      <span
                        className={
                          isInsuranceExpired(vendor.workersCompExpiry)
                            ? "text-red-600 font-medium"
                            : isInsuranceExpiringSoon(vendor.workersCompExpiry)
                            ? "text-amber-600 font-medium"
                            : ""
                        }
                      >
                        {new Date(vendor.workersCompExpiry).toLocaleDateString()}
                      </span>
                      {isInsuranceExpired(vendor.workersCompExpiry) && (
                        <Badge className="bg-red-100 text-red-700">Expired</Badge>
                      )}
                      {isInsuranceExpiringSoon(vendor.workersCompExpiry) && (
                        <Badge className="bg-amber-100 text-amber-700">Expiring Soon</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Assigned Jobs</CardTitle>
              <Link href="/management/maintenance/new">
                <Button size="sm" className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                  Assign New Job
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
                          {getRequestStatusBadge(request.status)}
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
                      <div className="flex items-center gap-4 mt-2 text-sm text-[var(--secondary-text)]">
                        <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                        {request.actualCost && (
                          <span>Cost: ${request.actualCost.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--secondary-text)]">
                  <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No jobs assigned to this vendor</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Button size="sm" className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                <FileText className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-[var(--secondary-text)]">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No documents uploaded</p>
                <p className="text-sm mt-1">Upload insurance certificates, licenses, contracts, etc.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
