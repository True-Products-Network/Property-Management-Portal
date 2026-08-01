"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MessageSquare,
  Edit,
  Loader2,
  Building2,
  AlertCircle,
  Send,
  Clock,
  CheckCircle2,
  FileText,
  Users,
  Mail,
  Calendar,
  User,
} from "lucide-react";

interface Communication {
  id: string;
  communicationId: string;
  associationId: string;
  subject: string;
  content?: string;
  type?: string;
  sendToAll: boolean;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  createdBy: string;
  sentBy?: string;
  createdAt: string;
  updatedAt: string;
}

interface Association {
  id: string;
  name: string;
}

export default function CommunicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communicationId = params.id as string;

  const [communication, setCommunication] = useState<Communication | null>(null);
  const [association, setAssociation] = useState<Association | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (communicationId) {
      loadCommunication();
    }
  }, [communicationId]);

  async function loadCommunication() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/communications/${communicationId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load communication");
      }

      setCommunication(result.data);

      // Load related data
      if (result.data.associationId) {
        const assocRes = await fetch(`/api/associations/${result.data.associationId}`);
        if (assocRes.ok) {
          const assocData = await assocRes.json();
          if (assocData.success) setAssociation(assocData.data);
        }
      }
    } catch (error) {
      console.error("Error loading communication:", error);
      setError(error instanceof Error ? error.message : "Failed to load communication");
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-700">Sent</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-700">Draft</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case "announcement":
        return <Badge className="bg-purple-100 text-purple-700">Announcement</Badge>;
      case "notice":
        return <Badge className="bg-amber-100 text-amber-700">Notice</Badge>;
      case "reminder":
        return <Badge className="bg-blue-100 text-blue-700">Reminder</Badge>;
      case "alert":
        return <Badge className="bg-red-100 text-red-700">Alert</Badge>;
      case "newsletter":
        return <Badge className="bg-teal-100 text-teal-700">Newsletter</Badge>;
      default:
        return <Badge variant="secondary">{type || "Other"}</Badge>;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString();
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
          <Button onClick={loadCommunication} variant="outline">
            Retry
          </Button>
          <Link href="/management/communications">
            <Button variant="outline">Back to Communications</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!communication) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">Communication not found</p>
        <Link href="/management/communications">
          <Button variant="outline" className="mt-4">
            Back to Communications
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
              href="/management/communications"
              className="flex items-center gap-1 hover:text-[var(--main-text)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Communications
            </Link>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {communication.subject}
            </h1>
            {getStatusBadge(communication.status)}
            {getTypeBadge(communication.type)}
          </div>
          <p className="text-[var(--secondary-text)]">{communication.communicationId}</p>
        </div>
        <div className="flex items-center gap-2">
          {communication.status === "draft" && (
            <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
              <Send className="h-4 w-4 mr-2" />
              Send Now
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/management/communications/${communicationId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Type</p>
                <p className="text-lg font-semibold">{getTypeBadge(communication.type)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Recipients</p>
                <p className="text-lg font-semibold">
                  {communication.sendToAll ? "All Members" : "Selected"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                {communication.status === "sent" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : communication.status === "scheduled" ? (
                  <Clock className="h-5 w-5 text-blue-600" />
                ) : (
                  <FileText className="h-5 w-5 text-[var(--teal)]" />
                )}
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Status</p>
                <div className="mt-1">{getStatusBadge(communication.status)}</div>
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
                <p className="text-sm text-[var(--secondary-text)]">
                  {communication.status === "sent" ? "Sent" : communication.status === "scheduled" ? "Scheduled" : "Created"}
                </p>
                <p className="text-lg font-semibold">
                  {communication.status === "sent"
                    ? formatDate(communication.sentAt)
                    : communication.status === "scheduled"
                    ? formatDate(communication.scheduledAt)
                    : formatDate(communication.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Content */}
        <Card>
          <CardHeader>
            <CardTitle>Message Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Subject</p>
              <p className="mt-1 font-medium text-lg">{communication.subject}</p>
            </div>

            {communication.content && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Content</p>
                <div className="mt-2 p-4 bg-[var(--page-background)] rounded-lg whitespace-pre-wrap">
                  {communication.content}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Details & Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Communication Type</p>
              <div className="mt-1">{getTypeBadge(communication.type)}</div>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Recipients</p>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-4 w-4 text-[var(--secondary-text)]" />
                <span>{communication.sendToAll ? "All Members" : "Selected Recipients"}</span>
              </div>
            </div>

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

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Current Status</p>
              <div className="mt-1">{getStatusBadge(communication.status)}</div>
            </div>

            {communication.scheduledAt && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Scheduled For</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span>{formatDate(communication.scheduledAt)}</span>
                </div>
              </div>
            )}

            {communication.sentAt && (
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Sent At</p>
                <div className="flex items-center gap-2 mt-1">
                  <Send className="h-4 w-4 text-green-600" />
                  <span>{formatDate(communication.sentAt)}</span>
                </div>
              </div>
            )}

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Created By</p>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-[var(--secondary-text)]" />
                <span>{communication.createdBy}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Created</p>
              <p className="mt-1">{formatDate(communication.createdAt)}</p>
            </div>

            <div>
              <p className="text-sm text-[var(--secondary-text)]">Last Updated</p>
              <p className="mt-1">{formatDate(communication.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {communication.status === "draft" && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                <Send className="h-4 w-4 mr-2" />
                Send Now
              </Button>
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/management/communications/${communicationId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Draft
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
