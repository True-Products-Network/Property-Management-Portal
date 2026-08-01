"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Plus,
  Search,
  Home,
  Users,
  ArrowRight,
  Loader2,
  Filter,
} from "lucide-react";

interface Association {
  id: string;
  associationId: string;
  name: string;
  legalName?: string;
  type: string;
  status: string;
  addressCity?: string;
  addressState?: string;
  createdAt: string;
}

export default function AssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadAssociations();
  }, []);

  async function loadAssociations() {
    try {
      setIsLoading(true);
      const response = await fetch("/api/associations");
      if (!response.ok) throw new Error("Failed to fetch associations");
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      setAssociations(result.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredAssociations = associations.filter((assoc) => {
    const matchesSearch =
      assoc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assoc.legalName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assoc.associationId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === "all" || assoc.type === typeFilter;
    const matchesStatus = statusFilter === "all" || assoc.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Get unique types for filter dropdown
  const uniqueTypes = Array.from(new Set(associations.map((a) => a.type))).filter(Boolean);

  // Calculate stats
  const totalAssociations = associations.length;
  const activeAssociations = associations.filter((a) => a.status === "active").length;
  const onboardingAssociations = associations.filter((a) => a.status === "onboarding").length;
  const typeCounts = associations.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "onboarding":
        return <Badge className="bg-blue-100 text-blue-700">Onboarding</Badge>;
      case "prospect":
        return <Badge className="bg-purple-100 text-purple-700">Prospect</Badge>;
      case "on_hold":
        return <Badge className="bg-amber-100 text-amber-700">On Hold</Badge>;
      case "ending_management":
        return <Badge className="bg-red-100 text-red-700">Ending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      condominium: "Condominium",
      hoa: "HOA",
      cooperative: "Cooperative",
      commercial: "Commercial",
      mixed_use: "Mixed Use",
      other: "Other",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  // Show empty state - no data in database yet
  if (associations.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--main-text)]">Associations</h1>
            <p className="text-[var(--secondary-text)] mt-1">
              Manage homeowner associations and communities
            </p>
          </div>
          <Link href="/management/associations/new">
            <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
              <Plus className="h-4 w-4 mr-2" />
              Add Association
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-[var(--page-background)] rounded-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-[var(--secondary-text)]" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[var(--main-text)]">No Associations Found</h3>
                <p className="text-[var(--secondary-text)] mt-1 max-w-md">
                  Get started by adding your first association or refresh to check for data.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={loadAssociations} variant="outline">
                  <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Link href="/management/associations/new">
                  <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Association
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Associations</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage homeowner associations and communities
          </p>
        </div>
        <Link href="/management/associations/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Add Association
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Associations</p>
                <p className="text-2xl font-semibold">{totalAssociations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Active</p>
                <p className="text-2xl font-semibold">{activeAssociations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Onboarding</p>
                <p className="text-2xl font-semibold">{onboardingAssociations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Types</p>
                <p className="text-2xl font-semibold">{Object.keys(typeCounts).length}</p>
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
                placeholder="Search associations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input min-w-[140px]"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {getTypeLabel(type)}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="onboarding">Onboarding</option>
                <option value="prospect">Prospect</option>
                <option value="on_hold">On Hold</option>
                <option value="ending_management">Ending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Association List */}
      <Card>
        <CardHeader>
          <CardTitle>Association List ({filteredAssociations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Association
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Location
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAssociations.map((assoc) => (
                  <tr
                    key={assoc.id}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/management/associations/${assoc.id}`}
                        className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                      >
                        {assoc.name}
                      </Link>
                      {assoc.legalName && assoc.legalName !== assoc.name && (
                        <p className="text-xs text-[var(--secondary-text)]">{assoc.legalName}</p>
                      )}
                      <p className="text-xs text-[var(--secondary-text)]">{assoc.associationId}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{getTypeLabel(assoc.type)}</span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(assoc.status)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-[var(--secondary-text)]">
                        {assoc.addressCity && assoc.addressState
                          ? `${assoc.addressCity}, ${assoc.addressState}`
                          : assoc.addressCity || assoc.addressState || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/management/associations/${assoc.id}`}>
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
          {filteredAssociations.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                ? "No associations found matching your criteria."
                : "No associations found."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
