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
  Calendar,
  Clock,
  MapPin,
  FileText,
  ArrowRight,
  Search,
  Video,
  Users,
} from "lucide-react";

interface Meeting {
  id: string;
  title: string;
  meetingNumber: string;
  type: string;
  status: string;
  scheduledDate: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isVirtual: boolean;
  virtualLink?: string;
  agendaItems: number;
  documentsAttached: number;
  attendeeCount: number;
}

export default function BoardMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadMeetings();
  }, []);

  async function loadMeetings() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/board/meetings");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load meetings");
      }

      setMeetings(result.data || []);
    } catch (error) {
      console.error("Error loading meetings:", error);
      setError(error instanceof Error ? error.message : "Failed to load meetings");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredMeetings = meetings.filter(
    (meeting) =>
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.meetingNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const upcomingMeetings = filteredMeetings.filter(
    (m) => new Date(m.scheduledDate) >= new Date()
  );
  const pastMeetings = filteredMeetings.filter(
    (m) => new Date(m.scheduledDate) < new Date()
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>;
      case "in_progress":
        return <Badge className="bg-green-100 text-green-700">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-700">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
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
        <Button onClick={loadMeetings} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Meetings</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Board meetings and meeting packets
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Upcoming Meetings</h2>
        <div className="space-y-4">
          {upcomingMeetings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-text)]" />
                <p className="text-[var(--secondary-text)]">No upcoming meetings</p>
              </CardContent>
            </Card>
          ) : (
            upcomingMeetings.map((meeting) => (
              <Link key={meeting.id} href={`/board/meetings/${meeting.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-[var(--teal)]/10 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-[var(--teal)]">
                            {new Date(meeting.scheduledDate).toLocaleDateString("en-US", {
                              month: "short",
                            })}
                          </span>
                          <span className="text-2xl font-bold text-[var(--teal)]">
                            {new Date(meeting.scheduledDate).getDate()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-lg">{meeting.title}</p>
                            {getStatusBadge(meeting.status)}
                          </div>
                          <p className="text-sm text-[var(--secondary-text)]">
                            {meeting.meetingNumber} • {meeting.type}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-[var(--secondary-text)]">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {meeting.startTime}
                              {meeting.endTime && ` - ${meeting.endTime}`}
                            </div>
                            {meeting.isVirtual ? (
                              <div className="flex items-center gap-1">
                                <Video className="h-4 w-4" />
                                Virtual
                              </div>
                            ) : (
                              meeting.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {meeting.location}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
                          <FileText className="h-4 w-4" />
                          {meeting.documentsAttached} docs
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[var(--secondary-text)]">
                          <Users className="h-4 w-4" />
                          {meeting.attendeeCount} attendees
                        </div>
                        <Button variant="outline" size="sm">
                          View Packet
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

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Past Meetings</h2>
          <div className="space-y-4">
            {pastMeetings.slice(0, 5).map((meeting) => (
              <Link key={meeting.id} href={`/board/meetings/${meeting.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-xs text-gray-500">
                            {new Date(meeting.scheduledDate).toLocaleDateString("en-US", {
                              month: "short",
                            })}
                          </span>
                          <span className="text-lg font-bold text-gray-700">
                            {new Date(meeting.scheduledDate).getDate()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{meeting.title}</p>
                          <p className="text-sm text-[var(--secondary-text)]">
                            {meeting.meetingNumber}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(meeting.status)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
