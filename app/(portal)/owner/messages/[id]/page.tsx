"use client";

import { useState, useEffect, useRef } from "react";
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
  MessageSquare,
  Send,
  Clock,
  CheckCircle2,
  Wrench,
  FileText,
  ClipboardCheck,
  FileWarning,
  ExternalLink,
  User,
} from "lucide-react";

interface Message {
  id: string;
  sender: string;
  senderRole: string;
  content: string;
  createdAt: string;
  isOwner: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
  }>;
}

interface Thread {
  id: string;
  subject: string;
  status: string;
  relatedType?: string;
  relatedId?: string;
  relatedTitle?: string;
  participants: string[];
}

export default function OwnerMessageDetailPage() {
  const params = useParams();
  const threadId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    loadThreadData();
  }, [threadId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function loadThreadData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/owner/messages/${threadId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load message thread");
      }

      setThread(result.data.thread);
      setMessages(result.data.messages || []);
    } catch (error) {
      console.error("Error loading thread:", error);
      setError(error instanceof Error ? error.message : "Failed to load message thread");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      setError(null);

      const response = await fetch(`/api/owner/messages/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to send message");
      }

      setNewMessage("");
      loadThreadData();
    } catch (error) {
      console.error("Error sending message:", error);
      setError(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  }

  const getRelatedIcon = (type?: string) => {
    switch (type) {
      case "maintenance":
        return <Wrench className="h-5 w-5" />;
      case "inspection":
        return <ClipboardCheck className="h-5 w-5" />;
      case "document":
        return <FileText className="h-5 w-5" />;
      case "compliance":
        return <FileWarning className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getRelatedLink = (type?: string, id?: string) => {
    if (!type || !id) return null;
    switch (type) {
      case "maintenance":
        return `/owner/maintenance/${id}`;
      case "inspection":
        return `/owner/inspections/${id}`;
      case "document":
        return `/owner/documents/${id}`;
      case "compliance":
        return `/owner/notices/${id}`;
      default:
        return null;
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

  if (error && !thread) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Link href="/owner/messages">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Button>
        </Link>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-[var(--secondary-text)]">Message thread not found</p>
        <Link href="/owner/messages">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Button>
        </Link>
      </div>
    );
  }

  const relatedLink = getRelatedLink(thread.relatedType, thread.relatedId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/owner/messages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">{thread.subject}</h1>
            {getStatusBadge(thread.status)}
          </div>
          {thread.relatedTitle && relatedLink && (
            <Link href={relatedLink} className="text-sm text-[var(--teal)] hover:underline flex items-center gap-1 mt-1">
              {getRelatedIcon(thread.relatedType)}
              {thread.relatedTitle}
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Messages */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation
          </CardTitle>
          <CardDescription>
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-[var(--secondary-text)]" />
              <p className="text-[var(--secondary-text)]">No messages yet</p>
              <p className="text-sm text-[var(--secondary-text)]">
                Start the conversation by sending a message below
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {messages.map((message, index) => {
                const showDate = index === 0 || 
                  new Date(message.createdAt).toDateString() !== 
                  new Date(messages[index - 1].createdAt).toDateString();

                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-[var(--secondary-text)] bg-[var(--page-background)] px-3 py-1 rounded-full">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex ${message.isOwner ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] ${
                          message.isOwner
                            ? "bg-[var(--teal)] text-white rounded-2xl rounded-tr-sm"
                            : "bg-[var(--page-background)] border border-[var(--border)] rounded-2xl rounded-tl-sm"
                        } px-4 py-3`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className={`h-4 w-4 ${message.isOwner ? "text-white/70" : "text-[var(--secondary-text)]"}`} />
                          <span className={`text-sm font-medium ${message.isOwner ? "text-white/90" : "text-[var(--main-text)]"}`}>
                            {message.sender}
                          </span>
                          <span className={`text-xs ${message.isOwner ? "text-white/60" : "text-[var(--secondary-text)]"}`}>
                            {message.senderRole}
                          </span>
                        </div>
                        <p className={`text-sm ${message.isOwner ? "text-white" : "text-[var(--main-text)]"}`}>
                          {message.content}
                        </p>
                        <div className={`flex items-center gap-1 mt-2 text-xs ${message.isOwner ? "text-white/60" : "text-[var(--secondary-text)]"}`}>
                          <Clock className="h-3 w-3" />
                          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Form */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={2}
              className="flex-1 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
              className="bg-[var(--teal)] hover:bg-[var(--teal-hover)] self-end"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-[var(--secondary-text)] mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
