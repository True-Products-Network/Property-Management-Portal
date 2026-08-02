"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Wrench,
  Clock,
  CheckCircle2,
  MessageSquare,
  Upload,
  AlertTriangle,
  Calendar,
  User,
  Home,
} from "lucide-react";

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  urgency: string;
  category: string;
  unitNumber: string;
  propertyName: string;
  createdAt: string;
  updatedAt: string;
  scheduledDate?: string;
  vendorName?: string;
  vendorPhone?: string;
  accessInstructions?: string;
  safetyConcern: boolean;
  safetyDescription?: string;
  canConfirmResolution: boolean;
}

interface StatusUpdate {
  id: string;
  status: string;
  notes: string;
  createdAt: string;
  createdBy: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: string;
  isStaff: boolean;
}

export default function ResidentMaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (requestId) {
      loadRequestData();
    }
  }, [requestId]);

  async function loadRequestData() {
    try {
      const [requestRes, updatesRes, messagesRes] = await Promise.all([
        fetch(`/api/resident/maintenance/${requestId}`),
        fetch(`/api/resident/maintenance/${requestId}/updates`),
        fetch(`/api/resident/maintenance/${requestId}/messages`),
      ]);

      if (requestRes.ok) {
        const requestData = await requestRes.json();
        if (requestData.success) {
          setRequest(requestData.data);
        }
      }

      if (updatesRes.ok) {
        const updatesData = await updatesRes.json();
        if (updatesData.success) {
          setStatusUpdates(updatesData.data);
        }
      }

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        if (messagesData.success) {
          setMessages(messagesData.data);
        }
      }
    } catch (error) {
      console.error("Error loading request data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const response = await fetch(`/api/resident/maintenance/${requestId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        setNewMessage("");
        loadRequestData();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  }

  async function handleConfirmResolution() {
    router.push(`/resident/maintenance/${requestId}/confirm`);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">Request not found</p>
        <Link href="/resident/maintenance">
          <Button variant="outline" className="mt-4">
            Back to Requests
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/resident/maintenance">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">
              {request.title}
            </h1>
            <p className="text-[var(--secondary-text)]">
              Request #{request.id.slice(0, 8)}
            </p>
          </div>
        </div>
        {request.canConfirmResolution && (
          <Button
            onClick={handleConfirmResolution}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirm Resolution
          </Button>
        )}
      </div>

      {/* Status Tracker */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {["Submitted", "In Review", "Scheduled", "In Progress", "Completed"].map(
              (step, index) => {
                const isActive = getStatusStep(request.status) >= index;
                const isCurrent = getStatusStep(request.status) === index;
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        isActive
                          ? isCurrent
                            ? "bg-[var(--teal)] text-white"
                            : "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isActive && !isCurrent ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs ${
                        isActive ? "text-[var(--main-text)]" : "text-[var(--secondary-text)]"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[var(--teal)]" />
                Request Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Status</p>
                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Urgency</p>
                  <Badge className={getUrgencyColor(request.urgency)}>{request.urgency}</Badge>
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Category</p>
                  <p className="font-medium capitalize">{request.category}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Submitted</p>
                  <p className="font-medium">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)]">
                <p className="text-sm text-[var(--secondary-text)] mb-1">Description</p>
                <p className="text-sm">{request.description}</p>
              </div>

              {request.safetyConcern && request.safetyDescription && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Safety Concern</span>
                  </div>
                  <p className="text-sm text-red-700">{request.safetyDescription}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[var(--teal)]" />
                Status Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusUpdates.length > 0 ? (
                <div className="space-y-4">
                  {statusUpdates.map((update) => (
                    <div key={update.id} className="flex gap-4">
                      <div className="w-2 h-2 bg-[var(--teal)] rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">
                          Status changed to{" "}
                          <span className={getStatusColor(update.status)}>{update.status}</span>
                        </p>
                        {update.notes && (
                          <p className="text-sm text-[var(--secondary-text)] mt-1">
                            {update.notes}
                          </p>
                        )}
                        <p className="text-xs text-[var(--secondary-text)] mt-1">
                          {new Date(update.createdAt).toLocaleString()} by {update.createdBy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--secondary-text)] text-center py-4">
                  No status updates yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[var(--teal)]" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.isStaff
                          ? "bg-blue-50 border border-blue-100"
                          : "bg-[var(--page-background)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.sender}</span>
                        {message.isStaff && (
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Staff</Badge>
                        )}
                      </div>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs text-[var(--secondary-text)] mt-1">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-[var(--secondary-text)] text-center py-4">
                    No messages yet
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSending || !newMessage.trim()}
                  className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Unit Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-[var(--teal)]" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{request.propertyName}</p>
              <p className="text-[var(--secondary-text)]">Unit {request.unitNumber}</p>
            </CardContent>
          </Card>

          {/* Appointment */}
          {request.scheduledDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[var(--teal)]" />
                  Scheduled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {new Date(request.scheduledDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-[var(--secondary-text)]">
                  {new Date(request.scheduledDate).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Vendor */}
          {request.vendorName && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[var(--teal)]" />
                  Assigned Vendor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{request.vendorName}</p>
                {request.vendorPhone && (
                  <p className="text-sm text-[var(--secondary-text)]">
                    {request.vendorPhone}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
              {request.canConfirmResolution && (
                <Button
                  onClick={handleConfirmResolution}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Resolution
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getStatusStep(status: string): number {
  const steps: Record<string, number> = {
    submitted: 0,
    pending: 0,
    in_review: 1,
    scheduled: 2,
    in_progress: 3,
    completed: 4,
    closed: 4,
  };
  return steps[status.toLowerCase()] ?? 0;
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
    case "closed":
      return "bg-green-100 text-green-700";
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "scheduled":
      return "bg-purple-100 text-purple-700";
    case "pending":
    case "submitted":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getUrgencyColor(urgency: string): string {
  switch (urgency.toLowerCase()) {
    case "emergency":
      return "bg-red-100 text-red-700";
    case "urgent":
      return "bg-orange-100 text-orange-700";
    case "high":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
}
