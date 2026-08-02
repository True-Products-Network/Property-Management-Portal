"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Calendar,
  Building2,
  Home,
} from "lucide-react";

interface Document {
  id: string;
  documentId: string;
  title: string;
  fileName: string;
  filePath: string;
  documentType?: string;
  category?: string;
  status: string;
  issueDate?: string;
  expiryDate?: string;
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitNumber?: string;
  isConfidential: boolean;
  requiresAcknowledgment: boolean;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
}

export default function OwnerDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/owner/documents");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load documents");
      }

      setDocuments(result.data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      setError(error instanceof Error ? error.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }

  async function acknowledgeDocument(documentId: string) {
    try {
      setAcknowledgingId(documentId);
      const response = await fetch(`/api/owner/documents/${documentId}/acknowledge`, {
        method: "POST",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to acknowledge document");
      }

      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, acknowledged: true, acknowledgedAt: new Date().toISOString() }
          : doc
      ));
    } catch (error) {
      console.error("Error acknowledging document:", error);
      alert(error instanceof Error ? error.message : "Failed to acknowledge document");
    } finally {
      setAcknowledgingId(null);
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.documentType || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(documents.map(d => d.category).filter(Boolean)));

  // Group documents
  const pendingAcknowledgment = filteredDocuments.filter(d => d.requiresAcknowledgment && !d.acknowledged);
  const otherDocuments = filteredDocuments.filter(d => !d.requiresAcknowledgment || d.acknowledged);

  const getDocumentIcon = (documentType?: string) => {
    switch (documentType?.toLowerCase()) {
      case "pdf":
        return <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><span className="text-red-600 font-bold text-xs">PDF</span></div>;
      case "doc":
      case "docx":
        return <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><span className="text-blue-600 font-bold text-xs">DOC</span></div>;
      case "xls":
      case "xlsx":
        return <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><span className="text-green-600 font-bold text-xs">XLS</span></div>;
      case "image":
      case "jpg":
      case "png":
        return <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><span className="text-purple-600 font-bold text-xs">IMG</span></div>;
      default:
        return <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center"><FileText className="h-5 w-5 text-gray-600" /></div>;
    }
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry <= thirtyDaysFromNow && expiry >= new Date();
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
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
        <Button onClick={loadDocuments} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">My Documents</h1>
        <p className="text-[var(--secondary-text)] mt-1">
          Access documents related to your properties
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total</p>
                <p className="text-2xl font-semibold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Action Required</p>
                <p className="text-2xl font-semibold">{pendingAcknowledgment.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Acknowledged</p>
                <p className="text-2xl font-semibold">
                  {documents.filter(d => d.requiresAcknowledgment && d.acknowledged).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Expiring Soon</p>
                <p className="text-2xl font-semibold">
                  {documents.filter(d => isExpiringSoon(d.expiryDate)).length}
                </p>
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
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input min-w-[150px]"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Acknowledgment */}
      {pendingAcknowledgment.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Action Required - Acknowledgment Needed
            </CardTitle>
            <CardDescription>
              Please review and acknowledge these important documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAcknowledgment.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getDocumentIcon(doc.documentType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
                        {doc.propertyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {doc.propertyName}
                          </span>
                        )}
                        {doc.unitNumber && (
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            Unit {doc.unitNumber}
                          </span>
                        )}
                        {doc.category && <span>{doc.category}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-[var(--secondary-text)] hover:text-[var(--teal)] transition-colors"
                      title="View Document"
                    >
                      <Eye className="h-5 w-5" />
                    </a>
                    <Button
                      size="sm"
                      onClick={() => acknowledgeDocument(doc.id)}
                      disabled={acknowledgingId === doc.id}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      {acknowledgingId === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Acknowledge
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Documents */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents ({filteredDocuments.length})</CardTitle>
          <CardDescription>
            Browse and download your documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery || categoryFilter !== "all" ? (
                <>
                  <Filter className="h-12 w-12 mx-auto mb-3 text-[var(--secondary-text)] opacity-50" />
                  <p className="text-[var(--secondary-text)]">No documents match your filters</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => { setSearchQuery(""); setCategoryFilter("all"); }}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 mx-auto mb-3 text-[var(--secondary-text)] opacity-50" />
                  <p className="text-[var(--secondary-text)]">No documents available</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {otherDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-[var(--page-background)] rounded-lg hover:bg-[var(--border-color)] transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getDocumentIcon(doc.documentType)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">{doc.title}</p>
                        {doc.requiresAcknowledgment && doc.acknowledged && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Acknowledged
                          </Badge>
                        )}
                        {isExpired(doc.expiryDate) && (
                          <Badge className="bg-red-100 text-red-700">Expired</Badge>
                        )}
                        {isExpiringSoon(doc.expiryDate) && !isExpired(doc.expiryDate) && (
                          <Badge className="bg-amber-100 text-amber-700">Expiring Soon</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
                        {doc.propertyName && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {doc.propertyName}
                          </span>
                        )}
                        {doc.unitNumber && (
                          <span className="flex items-center gap-1">
                            <Home className="h-3 w-3" />
                            Unit {doc.unitNumber}
                          </span>
                        )}
                        {doc.category && <span>{doc.category}</span>}
                        <span>•</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                      {doc.expiryDate && (
                        <p className={`text-xs mt-1 ${isExpired(doc.expiryDate) ? 'text-red-600' : isExpiringSoon(doc.expiryDate) ? 'text-amber-600' : 'text-[var(--secondary-text)]'}`}>
                          Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={doc.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-[var(--secondary-text)] hover:text-[var(--teal)] transition-colors"
                      title="View Document"
                    >
                      <Eye className="h-5 w-5" />
                    </a>
                    <a
                      href={doc.filePath}
                      download
                      className="p-2 text-[var(--secondary-text)] hover:text-[var(--teal)] transition-colors"
                      title="Download"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
