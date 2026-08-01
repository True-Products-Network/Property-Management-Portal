"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  Inbox,
  Mail,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  ArrowRight,
  Loader2,
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
}

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadCommunications();
  }, []);

  async function loadCommunications() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/communications");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load communications");
      }

      setCommunications(result.data.data || []);
    } catch (error) {
      console.error("Error loading communications:", error);
      setError(error instanceof Error ? error.message : "Failed to load communications");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredCommunications = communications.filter((comm) => {
    const matchesSearch =
      comm.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comm.content || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.communicationId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || comm.status === statusFilter;
    const matchesType = typeFilter === "all" || comm.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

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
    return new Date(dateString).toLocaleDateString();
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
        <Button onClick={loadCommunications} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Communications</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage messages and announcements
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/management/communications/announcement">
            <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Messages</p>
                <p className="text-2xl font-semibold">{communications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Send className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Sent</p>
                <p className="text-2xl font-semibold">
                  {communications.filter((c) => c.status === "sent").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Drafts</p>
                <p className="text-2xl font-semibold">
                  {communications.filter((c) => c.status === "draft").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Scheduled</p>
                <p className="text-2xl font-semibold">
                  {communications.filter((c) => c.status === "scheduled").length}
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
                placeholder="Search communications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Types</option>
                <option value="announcement">Announcement</option>
                <option value="notice">Notice</option>
                <option value="reminder">Reminder</option>
                <option value="alert">Alert</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Communications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Subject
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Send To
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCommunications.map((comm) => (
                  <tr
                    key={comm.id}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/management/communications/${comm.id}`}
                        className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                      >
                        {comm.subject}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {comm.communicationId}
                      </p>
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(comm.type)}</td>
                    <td className="py-3 px-4">{getStatusBadge(comm.status)}</td>
                    <td className="py-3 px-4">
                      {comm.sendToAll ? (
                        <Badge variant="outline">All Members</Badge>
                      ) : (
                        <Badge variant="outline">Selected</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[var(--secondary-text)]">
                        {comm.status === "sent"
                          ? formatDate(comm.sentAt)
                          : comm.status === "scheduled"
                          ? formatDate(comm.scheduledAt)
                          : formatDate(comm.createdAt)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/management/communications/${comm.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCommunications.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "No communications found matching your criteria."
                : "No communications yet. Click 'New Announcement' to create one."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
