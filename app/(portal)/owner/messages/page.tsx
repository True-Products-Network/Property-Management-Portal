"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Loader2,
  AlertCircle,
  Search,
  MessageSquare,
  ArrowRight,
  Filter,
  Clock,
  Wrench,
  FileText,
  ClipboardCheck,
  FileWarning,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface MessageThread {
  id: string;
  subject: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: string;
  relatedType?: string;
  relatedId?: string;
  relatedTitle?: string;
  participants: string[];
}

export default function OwnerMessagesPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadThreads();
  }, []);

  async function loadThreads() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/owner/messages");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load messages");
      }

      setThreads(result.data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      setError(error instanceof Error ? error.message : "Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredThreads = threads.filter((thread) => {
    const matchesSearch =
      searchQuery === "" ||
      thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (thread.relatedTitle || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || thread.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getRelatedIcon = (type?: string) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-4 w-4" />;
      case "inspection":
        return <ClipboardCheck className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "compliance":
        return <FileWarning className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-700">Open</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
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
        <Button onClick={loadThreads} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Messages</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Communicate with management and track conversations
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total</p>
                <p className="text-2xl font-semibold">{threads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Circle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Open</p>
                <p className="text-2xl font-semibold">
                  {threads.filter((t) => t.status === "open").length}
                </p>
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
                <p className="text-sm text-[var(--secondary-text)]">Pending</p>
                <p className="text-2xl font-semibold">
                  {threads.filter((t) => t.status === "pending").length}
                </p>
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
                <p className="text-sm text-[var(--secondary-text)]">Resolved</p>
                <p className="text-2xl font-semibold">
                  {threads.filter((t) => t.status === "resolved").length}
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
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--secondary-text)]" />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-40"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      {filteredThreads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-text)]" />
            <p className="text-[var(--secondary-text)] mb-2">No messages found</p>
            <p className="text-sm text-[var(--secondary-text)]">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Start a conversation from any record page"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredThreads.map((thread) => (
            <Link key={thread.id} href={`/owner/messages/${thread.id}`}>
              <Card className={`hover:shadow-md transition-shadow cursor-pointer ${thread.unreadCount > 0 ? 'border-blue-300' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      thread.unreadCount > 0 ? 'bg-blue-100' : 'bg-[var(--page-background)]'
                    }`}>
                      {thread.unreadCount > 0 ? (
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        getRelatedIcon(thread.relatedType)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold ${thread.unreadCount > 0 ? 'text-blue-900' : ''}`}>
                              {thread.subject}
                            </h3>
                            {getStatusBadge(thread.status)}
                            {thread.unreadCount > 0 && (
                              <Badge className="bg-blue-100 text-blue-700">
                                {thread.unreadCount} unread
                              </Badge>
                            )}
                          </div>
                          {thread.relatedTitle && (
                            <p className="text-sm text-[var(--secondary-text)] mt-1">
                              Re: {thread.relatedTitle}
                            </p>
                          )}
                          <p className={`text-sm mt-2 line-clamp-2 ${thread.unreadCount > 0 ? 'text-blue-800 font-medium' : 'text-[var(--secondary-text)]'}`}>
                            {thread.lastMessage}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-[var(--secondary-text)]">
                            {new Date(thread.lastMessageAt).toLocaleDateString()}
                          </p>
                          <ArrowRight className="h-4 w-4 text-[var(--secondary-text)] mt-2 ml-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
