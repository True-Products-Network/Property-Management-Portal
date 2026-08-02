"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2,
  AlertCircle,
  MessageSquare,
  Search,
  ArrowRight,
  Clock,
} from "lucide-react";

interface MessageThread {
  id: string;
  subject: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  participantName: string;
  participantRole: string;
  relatedJob?: string;
  status: string;
}

export default function VendorMessagesPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadThreads();
  }, []);

  async function loadThreads() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/vendor/messages");
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

  const filteredThreads = threads.filter(
    (thread) =>
      thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Communicate with property management
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Message Threads */}
      <div className="space-y-4">
        {filteredThreads.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-text)]" />
              <p className="text-[var(--secondary-text)]">No messages</p>
            </CardContent>
          </Card>
        ) : (
          filteredThreads.map((thread) => (
            <Link key={thread.id} href={`/vendor/messages/${thread.id}`}>
              <Card className={`cursor-pointer hover:shadow-md transition-shadow ${thread.unreadCount > 0 ? 'border-blue-300' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[var(--teal)]/10 text-[var(--teal)]">
                        {thread.participantName.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{thread.subject}</p>
                        {thread.unreadCount > 0 && (
                          <Badge className="bg-[var(--teal)] text-white">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {thread.participantName} • {thread.participantRole}
                      </p>
                      <p className="text-sm text-[var(--secondary-text)] truncate mt-1">
                        {thread.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-[var(--secondary-text)]">
                        <Clock className="h-3 w-3" />
                        {new Date(thread.lastMessageAt).toLocaleDateString()}
                        {thread.relatedJob && (
                          <>
                            <span>•</span>
                            <span>Re: {thread.relatedJob}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
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
