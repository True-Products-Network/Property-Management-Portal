"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Edit,
  Loader2,
  Building2,
  Home,
  AlertCircle,
  Download,
  Lock,
  Eye,
  Calendar,
  User,
  HardDrive,
} from "lucide-react";

interface Document {
  id: string;
  documentId: string;
  title: string;
  fileName: string;
  filePath: string;
  fileSize?: number;
  contentType?: string;
  documentType?: string;
  category?: string;
  status: string;
  issueDate?: string;
  expiryDate?: string;
  associationId?: string;
  propertyId?: string;
  unitId?: string;
  contactId?: string;
  isConfidential: boolean;
  requiresAcknowledgment: boolean;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
}

interface Association {
  id: string;
  name: string;
}

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [association, setAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (documentId) {
      loadDocument();
    }
  }, [documentId]);

  async function loadDocument() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/documents/${documentId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load document");
      }

      setDocument(result.data);

      // Load related data
      if (result.data.propertyId) {
        const propRes = await fetch(`/api/properties/${result.data.propertyId}`);
        if (propRes.ok) {
          const propData = await propRes.json();
          if (propData.success) setProperty(propData.data);
        }
      }

      if (result.data.unitId) {
        const unitRes = await fetch(`/api/units/${result.data.unitId}`);
        if (unitRes.ok) {
          const unitData = await unitRes.json();
          if (unitData.success) setUnit(unitData.data);
        }
      }

      if (result.data.associationId) {
        const assocRes = await fetch(`/api/associations/${result.data.associationId}`);
        if (assocRes.ok) {
          const assocData = await assocRes.json();
          if (assocData.success) setAssociation(assocData.data);
        }
      }
    } catch (error) {
      console.error("Error loading document:", error);
      setError(error instanceof Error ? error.message : "Failed to load document");
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "expired":
        return <Badge className="bg-red-100 text-red-700">Expired</Badge>;
      case "archived":
        return <Badge className="bg-gray-100 text-gray-700">Archived</Badge>;
      case "pending_review":
        return <Badge className="bg-amber-100 text-amber-700">Pending Review</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDocumentTypeBadge = (type?: string) => {
    switch (type) {
      case "insurance":
        return <Badge className="bg-blue-100 text-blue-700">Insurance</Badge>;
      case "financial":
        return <Badge className="bg-green-100 text-green-700">Financial</Badge>;
      case "legal":
        return <Badge className="bg-purple-100 text-purple-700">Legal</Badge>;
      case "meeting_minutes":
        return <Badge className="bg-amber-100 text-amber-700">Meeting Minutes</Badge>;
      case "contract":
        return <Badge className="bg-teal-100 text-teal-700">Contract</Badge>;
      case "inspection_report":
        return <Badge className="bg-orange-100 text-orange-700">Inspection</Badge>;
      case "certificate":
        return <Badge className="bg-cyan-100 text-cyan-700">Certificate</Badge>;
      case "policy":
        return <Badge className="bg-indigo-100 text-indigo-700">Policy</Badge>;
      case "notice":
        return <Badge className="bg-pink-100 text-pink-700">Notice</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">{type || "Other"}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const mb = bytes / (1024 * 1024);
    if (mb < 1) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (mb < 1024) {
      return `${mb.toFixed(1)} MB`;
    }
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const expiry = new Date(date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry > new Date();
  };

  const isExpired = (date?: string) => {
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
          <Button onClick={loadDocument} variant="outline">
            Retry
          </Button>
          <Link href="/management/documents">
            <Button variant="outline">Back to Documents</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">Document not found</p>
        <Link href="/management/documents">
          <Button variant="outline" className="mt-4">
            Back to Documents
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
              href="/management/documents"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Documents
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {document.title}
            </h1>
            {getStatusBadge(document.status)}
            {document.isConfidential && (
              <Badge className="bg-amber-100 text-amber-700">
                <Lock className="h-3 w-3 mr-1" />
                Confidential
              </Badge>
            )}
          </div>
          <p className="text-[var(--secondary-text)]">{document.documentId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(document.filePath, "_blank")}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/management/documents/${documentId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Alert for expiring documents */}
      {isExpired(document.expiryDate) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="font-medium text-red-700">This document has expired</p>
            <p className="text-sm text-red-600">
              Expired on {formatDate(document.expiryDate)}
            </p>
          </div>
        </div>
      )}
      {isExpiringSoon(document.expiryDate) && !isExpired(document.expiryDate) && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-700">This document is expiring soon</p>
            <p className="text-sm text-amber-600">
              Expires on {formatDate(document.expiryDate)}
            </p>
          </div>
        </div>
      )}

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Document Type</p>
                <p className="text-lg font-semibold">{getDocumentTypeBadge(document.documentType)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">File Size</p>
                <p className="text-lg font-semibold">{formatFileSize(document.fileSize)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Issue Date</p>
                <p className="text-lg font-semibold">{formatDate(document.issueDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Expiry Date</p>
                <p className={`text-lg font-semibold ${isExpired(document.expiryDate) ? "text-red-600" : isExpiringSoon(document.expiryDate) ? "text-amber-600" : ""}`}>
                  {formatDate(document.expiryDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Details */}
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--secondary-text)]">File Name</p>
              <p className="mt-1 font-medium">{document.fileName}</p>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Content Type</p>
              <p className="mt-1">{document.contentType || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Status</p>
              <div className="mt-1">{getStatusBadge(document.status)}</div>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Category</p>
              <p className="mt-1">{document.category || "-"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Confidential</p>
                <p className="mt-1">{document.isConfidential ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Requires Acknowledgment</p>
                <p className="mt-1">{document.requiresAcknowledgment ? "Yes" : "No"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Uploaded By</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-[var(--secondary-text)]" />
                <span>{document.uploadedBy}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Upload Date</p>
              <p className="mt-1">{new Date(document.createdAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {association && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Association</p>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                  <Link
                    href={`/management/associations/${association.id}`}
                    className="text-[var(--teal)] hover:underline"
                  >
                    {association.name}
                  </Link>
                </div>
              </div>
            )}

            {property && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Property</p>
                <div className="flex items-center gap-2 mt-1">
                  <Home className="h-4 w-4 text-[var(--secondary-text)]" />
                  <Link
                    href={`/management/properties/${property.id}`}
                    className="text-[var(--teal)] hover:underline"
                  >
                    {property.name}
                  </Link>
                </div>
              </div>
            )}

            {unit && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Unit</p>
                <div className="flex items-center gap-2 mt-1">
                  <Home className="h-4 w-4 text-[var(--secondary-text)]" />
                  <Link
                    href={`/management/units/${unit.id}`}
                    className="text-[var(--teal)] hover:underline"
                  >
                    Unit {unit.unitNumber}
                  </Link>
                </div>
              </div>
            )}

            {!association && !property && !unit && (
              <p className="text-[var(--secondary-text)]">No location specified</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => window.open(document.filePath, "_blank")}>
              <Eye className="h-4 w-4 mr-2" />
              View Document
            </Button>
            <Button variant="outline" onClick={() => window.open(document.filePath, "_blank")}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/management/documents/${documentId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
