"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Plus,
  Search,
  Download,
  Folder,
  Clock,
  AlertCircle,
  HardDrive,
  ArrowRight,
  Loader2,
  Building2,
  Home,
  Lock,
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

interface Association {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [associations, setAssociations] = useState<Record<string, Association>>({});
  const [units, setUnits] = useState<Record<string, Unit>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadDocuments();
    loadProperties();
    loadAssociations();
    loadUnits();
  }, []);

  async function loadDocuments() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/documents");
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load documents");
      }
      
      setDocuments(result.data.data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      setError(error instanceof Error ? error.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProperties() {
    try {
      const response = await fetch("/api/properties");
      const result = await response.json();
      
      if (result.success) {
        const propMap: Record<string, Property> = {};
        result.data.data.forEach((prop: Property) => {
          propMap[prop.id] = prop;
        });
        setProperties(propMap);
      }
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  }

  async function loadAssociations() {
    try {
      const response = await fetch("/api/associations");
      const result = await response.json();
      
      if (result.success) {
        const assocMap: Record<string, Association> = {};
        result.data.data.forEach((assoc: Association) => {
          assocMap[assoc.id] = assoc;
        });
        setAssociations(assocMap);
      }
    } catch (error) {
      console.error("Error loading associations:", error);
    }
  }

  async function loadUnits() {
    try {
      const response = await fetch("/api/units");
      const result = await response.json();
      
      if (result.success) {
        const unitMap: Record<string, Unit> = {};
        result.data.data.forEach((unit: Unit) => {
          unitMap[unit.id] = unit;
        });
        setUnits(unitMap);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  // Calculate stats
  const totalDocuments = documents.length;
  
  const uniqueTypes = new Set(documents.map(d => d.documentType).filter(Boolean));
  const typeCount = uniqueTypes.size;
  
  const expiringSoonCount = documents.filter(doc => {
    if (!doc.expiryDate) return false;
    const expiry = new Date(doc.expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry >= now;
  }).length;
  
  const totalStorageBytes = documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0);
  const totalStorageMB = totalStorageBytes / (1024 * 1024);
  const totalStorageGB = totalStorageMB / 1024;
  const storageDisplay = totalStorageGB >= 1 
    ? `${totalStorageGB.toFixed(2)} GB` 
    : `${totalStorageMB.toFixed(2)} MB`;

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.documentType || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || doc.documentType === typeFilter;
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

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
        <p className="text-red-500">{error}</p>
        <Button onClick={loadDocuments} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Documents</h1>
          <p className="text-[var(--secondary-text)] mt-1">Manage documents and file storage</p>
        </div>
        <Link href="/management/documents/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Documents</p>
                <p className="text-2xl font-semibold">{totalDocuments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Folder className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">By Type</p>
                <p className="text-2xl font-semibold">{typeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Expiring Soon</p>
                <p className="text-2xl font-semibold">{expiringSoonCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <HardDrive className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Storage Used</p>
                <p className="text-2xl font-semibold">{storageDisplay}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
              <Input
                placeholder="Search by title or file name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Types</option>
                <option value="insurance">Insurance</option>
                <option value="financial">Financial</option>
                <option value="legal">Legal</option>
                <option value="meeting_minutes">Meeting Minutes</option>
                <option value="contract">Contract</option>
                <option value="inspection_report">Inspection Report</option>
                <option value="certificate">Certificate</option>
                <option value="policy">Policy</option>
                <option value="notice">Notice</option>
                <option value="other">Other</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="archived">Archived</option>
                <option value="pending_review">Pending Review</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Document
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Location
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Size
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Uploaded
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const property = doc.propertyId ? properties[doc.propertyId] : null;
                  const association = doc.associationId ? associations[doc.associationId] : null;
                  const unit = doc.unitId ? units[doc.unitId] : null;

                  return (
                    <tr
                      key={doc.id}
                      className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)] cursor-pointer"
                      onClick={() => window.open(doc.filePath, '_blank')}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-[var(--teal)]" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[var(--main-text)]">{doc.title}</span>
                              {doc.isConfidential && (
                                <Lock className="h-3 w-3 text-amber-500" />
                              )}
                            </div>
                            <p className="text-xs text-[var(--secondary-text)]">{doc.fileName}</p>
                            <p className="text-xs text-[var(--secondary-text)]">{doc.documentId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getDocumentTypeBadge(doc.documentType)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {association && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                              <span>{association.name}</span>
                            </div>
                          )}
                          {property && (
                            <div className="flex items-center gap-2 mt-1">
                              <Home className="h-3 w-3 text-[var(--secondary-text)]" />
                              <span className="text-xs text-[var(--secondary-text)]">{property.name}</span>
                            </div>
                          )}
                          {unit && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-[var(--secondary-text)]">Unit {unit.unitNumber}</span>
                            </div>
                          )}
                          {!association && !property && !unit && (
                            <span className="text-sm text-[var(--secondary-text)]">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(doc.status)}
                        {doc.expiryDate && (
                          <p className="text-xs text-[var(--secondary-text)] mt-1">
                            Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-[var(--secondary-text)]">
                          {formatFileSize(doc.fileSize)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-[var(--secondary-text)]">
                          <p>{new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(doc.filePath, '_blank');
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredDocuments.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "No documents found matching your criteria."
                : "No documents yet. Click 'Add New' to upload one."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
