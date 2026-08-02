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
  FileWarning,
  Calendar,
  ArrowRight,
  Filter,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface Notice {
  id: string;
  matterNumber: string;
  title: string;
  type: string;
  status: string;
  date: string;
  responseDeadline?: string;
  propertyName: string;
  unitNumber?: string;
  requiredAction?: string;
  isOverdue: boolean;
}

export default function OwnerNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadNotices();
  }, []);

  async function loadNotices() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/owner/notices");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load notices");
      }

      setNotices(result.data || []);
    } catch (error) {
      console.error("Error loading notices:", error);
      setError(error instanceof Error ? error.message : "Failed to load notices");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredNotices = notices.filter((notice) => {
    const matchesSearch =
      searchQuery === "" ||
      notice.matterNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.propertyName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || notice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "notice_sent":
        return <Badge className="bg-amber-100 text-amber-700">Notice Sent</Badge>;
      case "response_received":
        return <Badge className="bg-blue-100 text-blue-700">Response Received</Badge>;
      case "hearing_scheduled":
        return <Badge className="bg-purple-100 text-purple-700">Hearing Scheduled</Badge>;
      case "corrective_action":
        return <Badge className="bg-orange-100 text-orange-700">Corrective Action</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-700">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysRemaining = (deadline?: string) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
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
        <Button onClick={loadNotices} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Notices & Compliance</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            View and respond to notices and compliance matters
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
                placeholder="Search notices..."
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
                <option value="notice_sent">Notice Sent</option>
                <option value="response_received">Response Received</option>
                <option value="hearing_scheduled">Hearing Scheduled</option>
                <option value="corrective_action">Corrective Action</option>
                <option value="resolved">Resolved</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notices List */}
      {filteredNotices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileWarning className="h-12 w-12 mx-auto mb-4 text-[var(--secondary-text)]" />
            <p className="text-[var(--secondary-text)] mb-2">No notices found</p>
            <p className="text-sm text-[var(--secondary-text)]">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "You don't have any active notices or compliance matters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => {
            const daysRemaining = getDaysRemaining(notice.responseDeadline);
            
            return (
              <Card key={notice.id} className={notice.isOverdue ? "border-red-300" : ""}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          notice.isOverdue ? 'bg-red-100' : 'bg-amber-100'
                        }`}>
                          <FileWarning className={`h-5 w-5 ${notice.isOverdue ? 'text-red-600' : 'text-amber-600'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{notice.title}</h3>
                            {getStatusBadge(notice.status)}
                            {notice.isOverdue && (
                              <Badge className="bg-red-100 text-red-700">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-[var(--secondary-text)]">
                            {notice.matterNumber} • {notice.type}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
                        <div>
                          <span className="text-[var(--secondary-text)]">Property:</span>
                          <p className="font-medium">{notice.propertyName}</p>
                          {notice.unitNumber && (
                            <p className="text-[var(--secondary-text)]">Unit {notice.unitNumber}</p>
                          )}
                        </div>
                        <div>
                          <span className="text-[var(--secondary-text)]">Date:</span>
                          <p className="font-medium flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(notice.date).toLocaleDateString()}
                          </p>
                        </div>
                        {notice.responseDeadline && (
                          <div className="sm:col-span-2">
                            <span className="text-[var(--secondary-text)]">Response Deadline:</span>
                            <p className={`font-medium flex items-center gap-1 ${
                              notice.isOverdue ? 'text-red-600' : daysRemaining && daysRemaining <= 7 ? 'text-amber-600' : ''
                            }`}>
                              <Clock className="h-4 w-4" />
                              {new Date(notice.responseDeadline).toLocaleDateString()}
                              {daysRemaining !== null && (
                                <span className="ml-2">
                                  ({daysRemaining > 0 ? `${daysRemaining} days remaining` : `${Math.abs(daysRemaining)} days overdue`})
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        {notice.requiredAction && (
                          <div className="sm:col-span-2">
                            <span className="text-[var(--secondary-text)]">Required Action:</span>
                            <p className="font-medium text-amber-700">{notice.requiredAction}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/owner/notices/${notice.id}`}>
                        <Button variant="outline" className="border-[var(--teal)] text-[var(--teal)]">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
