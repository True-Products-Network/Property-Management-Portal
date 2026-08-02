"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  AlertCircle,
  Users,
  Mail,
  Phone,
  Calendar,
  Shield,
  Search,
} from "lucide-react";

interface BoardMember {
  id: string;
  name: string;
  role: string;
  title?: string;
  email?: string;
  phone?: string;
  termStart?: string;
  termEnd?: string;
  bio?: string;
  committees?: string[];
}

interface PropertyManager {
  id: string;
  name: string;
  company?: string;
  title?: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
}

interface DirectoryData {
  boardMembers: BoardMember[];
  propertyManager?: PropertyManager;
  emergencyContacts: EmergencyContact[];
}

interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  available: string;
}

export default function BoardDirectoryPage() {
  const [data, setData] = useState<DirectoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadDirectoryData();
  }, []);

  async function loadDirectoryData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/board/directory");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load directory");
      }

      setData(result.data);
    } catch (error) {
      console.error("Error loading directory:", error);
      setError(error instanceof Error ? error.message : "Failed to load directory");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredBoardMembers = data?.boardMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
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
        <Button onClick={loadDirectoryData} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Board Directory</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Contact information for board members and management
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Property Manager */}
      {data?.propertyManager && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--teal)]" />
              Property Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-[var(--teal)]/10 text-[var(--teal)] text-xl">
                  {data.propertyManager.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{data.propertyManager.name}</h3>
                {data.propertyManager.company && (
                  <p className="text-[var(--secondary-text)]">{data.propertyManager.company}</p>
                )}
                {data.propertyManager.title && (
                  <p className="text-sm text-[var(--secondary-text)]">
                    {data.propertyManager.title}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-3">
                  {data.propertyManager.email && (
                    <a
                      href={`mailto:${data.propertyManager.email}`}
                      className="flex items-center gap-1 text-sm text-[var(--teal)] hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      {data.propertyManager.email}
                    </a>
                  )}
                  {data.propertyManager.phone && (
                    <a
                      href={`tel:${data.propertyManager.phone}`}
                      className="flex items-center gap-1 text-sm text-[var(--teal)] hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {data.propertyManager.phone}
                    </a>
                  )}
                </div>
                {data.propertyManager.emergencyContact && (
                  <p className="mt-3 text-sm text-red-600">
                    <strong>Emergency:</strong> {data.propertyManager.emergencyContact}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Board Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--teal)]" />
            Board of Directors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBoardMembers?.map((member) => (
              <div key={member.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-[var(--teal)]/10 text-[var(--teal)]">
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold">{member.name}</h4>
                  <Badge variant="outline" className="mt-1">
                    {member.role}
                  </Badge>
                  {member.title && (
                    <p className="text-sm text-[var(--secondary-text)] mt-1">{member.title}</p>
                  )}
                  {(member.termStart || member.termEnd) && (
                    <p className="text-xs text-[var(--secondary-text)] mt-1">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Term: {member.termStart ? new Date(member.termStart).getFullYear() : "?"} -{" "}
                      {member.termEnd ? new Date(member.termEnd).getFullYear() : "?"}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="text-sm text-[var(--teal)] hover:underline"
                      >
                        <Mail className="h-4 w-4 inline" />
                      </a>
                    )}
                    {member.phone && (
                      <a
                        href={`tel:${member.phone}`}
                        className="text-sm text-[var(--teal)] hover:underline"
                      >
                        <Phone className="h-4 w-4 inline" />
                      </a>
                    )}
                  </div>
                  {member.committees && member.committees.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {member.committees.map((committee) => (
                        <Badge key={committee} variant="secondary" className="text-xs">
                          {committee}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      {data?.emergencyContacts && data.emergencyContacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.emergencyContacts.map((contact) => (
                <div key={contact.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-semibold">{contact.name}</h4>
                  <p className="text-sm text-[var(--secondary-text)]">{contact.role}</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-lg font-semibold text-red-600 hover:underline mt-2 block"
                  >
                    {contact.phone}
                  </a>
                  <p className="text-xs text-[var(--secondary-text)] mt-1">
                    Available: {contact.available}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
