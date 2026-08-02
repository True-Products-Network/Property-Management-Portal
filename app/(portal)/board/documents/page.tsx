"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  AlertCircle,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  Download,
  Eye,
  Folder,
} from "lucide-react";

interface Document {
  id: string;
  documentId: string;
  title: string;
  fileName: string;
  documentType: string;
  category: string;
  status: string;
  issueDate?: string;
  expiryDate?: string;
  requiresAcknowledgment: boolean;
  acknowledgmentRate?: number;
  requiresBoardVote: boolean;
  voteStatus?: string;
}

export default function BoardDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/board/documents");
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

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.documentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "pending_review":
        return <Badge className="bg-amber-100 text-amber-700">Pending Review</Badge>;
      case "archived":
        return <Badge className="bg-gray-100 text-gray-700">Archived</Badge>;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Board Documents</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Access documents requiring board review or action
          </p>
        </div>
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
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 border rounded-md"
            >
              <option value="all">All Categories</option>
              <option value="financial">Financial</option>
              <option value="legal">Legal</option>
              <option value="governance">Governance</option>
              <option value="minutes">Meeting Minutes</option>
              <option value="policies">Policies</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Folder className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-text)]" />
              <p className="text-[var(--secondary-text)]">No documents found</p>
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((doc) => (
            <Link key={doc.id} href={`/board/documents/${doc.id}`}>
              <Card
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  doc.requiresBoardVote || doc.requiresAcknowledgment ? "border-amber-300" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-[var(--teal)]" />
                        <p className="font-medium">{doc.title}</p>
                        {getStatusBadge(doc.status)}
                        {doc.requiresBoardVote && (
                          <Badge className="bg-purple-100 text-purple-700">Vote Required</Badge>
                        )}
                        {doc.requiresAcknowledgment && (
                          <Badge className="bg-amber-100 text-amber-700">Acknowledgment Required</Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {doc.documentId} • {doc.category}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-[var(--secondary-text)]">
                        {doc.issueDate && (
                          <span>Issued: {new Date(doc.issueDate).toLocaleDateString()}</span>
                        )}
                        {doc.expiryDate && (
                          <span>Expires: {new Date(doc.expiryDate).toLocaleDateString()}</span>
                        )}
                      </div>
                      {doc.acknowledgmentRate !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-[var(--secondary-text)]">
                              Acknowledgment Rate:
                            </span>
                            <span className="text-sm font-medium">{doc.acknowledgmentRate}%</span>
                          </div>
                          <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-full bg-[var(--teal)] rounded-full"
                              style={{ width: `${doc.acknowledgmentRate}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="ghost" size="sm">
                        Review
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
