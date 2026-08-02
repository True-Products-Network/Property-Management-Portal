"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Loader2,
  AlertCircle,
  Building2,
  Users,
  Home,
  MapPin,
  Phone,
  Mail,
  FileText,
  ArrowLeft,
  TrendingUp,
  Shield,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";

interface AssociationSummary {
  id: string;
  name: string;
  legalName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  email?: string;
  website?: string;
  propertyCount: number;
  unitCount: number;
  boardMembers: BoardMember[];
  propertyManager?: PropertyManager;
  emergencyPlan?: string;
  openWorkOrders: number;
  pendingDocuments: number;
}

interface BoardMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  termStart?: string;
  termEnd?: string;
}

interface PropertyManager {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
}

export default function BoardAssociationPage() {
  const [data, setData] = useState<AssociationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssociationData();
  }, []);

  async function loadAssociationData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/board/association");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load association data");
      }

      setData(result.data);
    } catch (error) {
      console.error("Error loading association data:", error);
      setError(error instanceof Error ? error.message : "Failed to load association data");
    } finally {
      setIsLoading(false);
    }
  }

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
        <Button onClick={loadAssociationData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-[var(--secondary-text)]">No association data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/board">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Association Summary</h1>
          <p className="text-[var(--secondary-text)]">{data.legalName}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Association Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Association Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[var(--teal)]" />
                Association Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Association Name</p>
                  <p className="font-medium">{data.name}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--secondary-text)]">Legal Name</p>
                  <p className="font-medium">{data.legalName}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-[var(--secondary-text)]">Address</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[var(--secondary-text)]" />
                    <p className="font-medium">
                      {data.address}, {data.city}, {data.state} {data.zip}
                    </p>
                  </div>
                </div>
                {data.phone && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Phone</p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[var(--secondary-text)]" />
                      <p className="font-medium">{data.phone}</p>
                    </div>
                  </div>
                )}
                {data.email && (
                  <div>
                    <p className="text-sm text-[var(--secondary-text)]">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[var(--secondary-text)]" />
                      <p className="font-medium">{data.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Board Roster */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[var(--teal)]" />
                Board of Directors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.boardMembers.map((member) => (
                  <div key={member.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[var(--teal)]/10 text-[var(--teal)]">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                      {member.email && (
                        <p className="text-sm text-[var(--secondary-text)] mt-1">
                          {member.email}
                        </p>
                      )}
                      {member.termStart && member.termEnd && (
                        <p className="text-xs text-[var(--secondary-text)]">
                          Term: {new Date(member.termStart).getFullYear()} -{" "}
                          {new Date(member.termEnd).getFullYear()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Property Manager */}
          {data.propertyManager && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--teal)]" />
                  Property Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-[var(--teal)]/10 text-[var(--teal)]">
                      {data.propertyManager.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-lg">{data.propertyManager.name}</p>
                    {data.propertyManager.company && (
                      <p className="text-[var(--secondary-text)]">
                        {data.propertyManager.company}
                      </p>
                    )}
                    {data.propertyManager.email && (
                      <p className="text-sm text-[var(--secondary-text)]">
                        {data.propertyManager.email}
                      </p>
                    )}
                    {data.propertyManager.phone && (
                      <p className="text-sm text-[var(--secondary-text)]">
                        {data.propertyManager.phone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Stats & Quick Links */}
        <div className="space-y-6">
          {/* Property Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                  <span className="text-[var(--secondary-text)]">Properties</span>
                </div>
                <span className="font-semibold text-lg">{data.propertyCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-[var(--secondary-text)]" />
                  <span className="text-[var(--secondary-text)]">Total Units</span>
                </div>
                <span className="font-semibold text-lg">{data.unitCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Work Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/board/maintenance">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-[var(--secondary-text)]" />
                    <span className="text-sm">Open Work Orders</span>
                  </div>
                  <Badge>{data.openWorkOrders}</Badge>
                </div>
              </Link>
              <Link href="/board/documents">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[var(--secondary-text)]" />
                    <span className="text-sm">Pending Documents</span>
                  </div>
                  <Badge>{data.pendingDocuments}</Badge>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Emergency Plan */}
          {data.emergencyPlan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Emergency Plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--secondary-text)]">{data.emergencyPlan}</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/board/reports">
                <Button variant="ghost" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Financial Reports
                </Button>
              </Link>
              <Link href="/board/approvals">
                <Button variant="ghost" className="w-full justify-start">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Pending Approvals
                </Button>
              </Link>
              <Link href="/board/compliance">
                <Button variant="ghost" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Compliance Matters
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
