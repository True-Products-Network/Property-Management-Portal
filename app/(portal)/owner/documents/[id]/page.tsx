"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  MessageSquare,
  Calendar,
  Building2,
  Home,
  User,
  Clock,
  Send,
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
  propertyName?: string;
  unitNumber?: string;
  uploadedBy?: string;
  uploadedAt: string;
  version: string;
  isConfidential: boolean;
  requiresAcknowledgment: boolean;
  acknowledged: boolean;
  acknowledgedAt?: string;
  description?: string;
}

interface Message {
  id: string;
  sender: string;
  message: string;
  createdAt: string;
  isOwner: boolean;
}

export default function OwnerDocumentDetailPage() {
  const params = useParams();
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    loadDocumentData();
  }, [documentId]);

  async function loadDocumentData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/owner/documents/${documentId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load document");
      }

      setDocument(result.data.document);
      setMessages(result.data.messages || []);
    } catch (error) {
      console.error("Error loading document:", error);
      setError(error instanceof Error ? error.message : "Failed to load document");
    } finally {
      setIsLoading(false);
    }
  }

  async function acknowledgeDocument() {
    try {
      setIsAcknowledging(true);
      setError(null);

      const response = await fetch(`/api/owner/documents/${documentId}/acknowledge`, {
        method: "POST",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to acknowledge document");
      }

      setDocument(prev => prev ? {
        ...prev,
        acknowledged: true,
        acknowledgedAt: new Date().toISOString()
      } : null);
    } catch (error) {
      console.error("Error acknowledging document:", error);
      setError(error instanceof Error ? error.message : "Failed to acknowledge document");
    } finally {
      setIsAcknowledging(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    try {
      setIsSendingMessage(true);
      setError(null);

      const response = await fetch(`/api/owner/documents/${documentId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }

      setNewMessage("");
      loadDocumentData();
    } catch (error) {
      console.error("Error sending message:", error);
      setError(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsSendingMessage(false);
    }
  }

  const getDocumentIcon = () => {
    switch (document?.documentType?.toLowerCase()) {
      case "pdf":
        return <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center"><span className="text-red-600 font-bold">PDF</span></div>;
      case "doc":
      case "docx":
        return <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center"><span className="text-blue-600 font-bold">DOC</span></div>;
      case "xls":
      case "xlsx":
        return <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center"><span className="text-green-600 font-bold">XLS</span></div>;
      case "image":
      case "jpg":
      case "png":
        return <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center"><span className="text-purple-600 font-bold">IMG</span></div>;
      default:
        return <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center"><FileText className="h-8 w-8 text-gray-600" /></div>;
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

  if (error && !document) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Link href="/owner/documents">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-[var(--secondary-text)]">Document not found</p>
        <Link href="/owner/documents">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/owner/documents">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">{document.title}</h1>
            {document.requiresAcknowledgment && document.acknowledged && (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Acknowledged
              </Badge>
            )}
            {document.requiresAcknowledgment && !document.acknowledged && (
              <Badge className="bg-amber-100 text-amber-700">Acknowledgment Required</Badge>
            )}
            {isExpired(document.expiryDate) && (
              <Badge className="bg-red-100 text-red-700">Expired</Badge>
            )}
            {isExpiringSoon(document.expiryDate) && !isExpired(document.expiryDate) && (
              <Badge className="bg-amber-100 text-amber-700">Expiring Soon</Badge>
            )}
          </div>
          <p className="text-[var(--secondary-text)]">{document.documentId}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Document Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Document Preview Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                {getDocumentIcon()}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{document.title}</h2>
                  <p className="text-sm text-[var(--secondary-text)] mb-4">{document.fileName}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={document.filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="border-[var(--teal)] text-[var(--teal)]">
                        <Eye className="h-4 w-4 mr-2" />
                        View Document
                      </Button>
                    </a>
                    <a
                      href={document.filePath}
                      download
                    >
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Details */}
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Document Type</p>
                    <p className="font-medium">{document.documentType || "Document"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Issue Date</p>
                    <p className="font-medium">
                      {document.issueDate
                        ? new Date(document.issueDate).toLocaleDateString()
                        : new Date(document.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {document.expiryDate && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Expiry Date</p>
                      <p className={`font-medium ${isExpired(document.expiryDate) ? 'text-red-600' : isExpiringSoon(document.expiryDate) ? 'text-amber-600' : ''}`}>
                        {new Date(document.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Uploaded By</p>
                    <p className="font-medium">{document.uploadedBy || "Management"}</p>
                  </div>
                </div>

                {document.propertyName && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Property</p>
                      <p className="font-medium">{document.propertyName}</p>
                    </div>
                  </div>
                )}

                {document.unitNumber && (
                  <div className="flex items-start gap-3">
                    <Home className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Unit</p>
                      <p className="font-medium">{document.unitNumber}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Version</p>
                    <p className="font-medium">{document.version}</p>
                  </div>
                </div>

                {document.category && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-[var(--teal)] mt-0.5" />
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Category</p>
                      <p className="font-medium">{document.category}</p>
                    </div>
                  </div>
                )}
              </div>

              {document.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-[var(--secondary-text)] mb-1">Description</p>
                  <p className="text-sm">{document.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Questions & Comments
              </CardTitle>
              <CardDescription>
                Ask questions or leave comments about this document
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-[var(--secondary-text)] text-center py-4">
                  No messages yet. Be the first to ask a question.
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.isOwner
                          ? "bg-[var(--teal)]/10 ml-8"
                          : "bg-[var(--page-background)] mr-8"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{msg.sender}</span>
                        <span className="text-xs text-[var(--secondary-text)]">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Textarea
                  placeholder="Type your question or comment..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isSendingMessage || !newMessage.trim()}
                  className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                >
                  {isSendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-6">
          {/* Acknowledgment */}
          {document.requiresAcknowledgment && !document.acknowledged && (
            <Card className="border-amber-300">
              <CardHeader className="bg-amber-50">
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <CheckCircle2 className="h-5 w-5" />
                  Acknowledgment Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-amber-800">
                  Please review this document and acknowledge that you have received and understood its contents.
                </p>
                <Button
                  onClick={acknowledgeDocument}
                  disabled={isAcknowledging}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {isAcknowledging ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      I Acknowledge This Document
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {document.acknowledged && (
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <CheckCircle2 className="h-5 w-5" />
                  Acknowledged
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-800">
                  You acknowledged this document on{" "}
                  <strong>{new Date(document.acknowledgedAt!).toLocaleDateString()}</strong>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Document Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[var(--secondary-text)]">Status</span>
                  <Badge>{document.status}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--secondary-text)]">Confidential</span>
                  <span>{document.isConfidential ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--secondary-text)]">Requires Acknowledgment</span>
                  <span>{document.requiresAcknowledgment ? "Yes" : "No"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
