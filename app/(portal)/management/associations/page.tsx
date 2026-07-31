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
} from "lucide-react";

interface Association {
  id: string;
  associationId: string;
  name: string;
  legalName?: string;
  type: string;
  status: string;
  propertyCount: number;
  unitCount: number;
  assignedManager?: string;
}

export default function AssociationsPage() {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredAssociations = associations.filter(
    (assoc) =>
      assoc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assoc.legalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "onboarding":
        return <Badge className="bg-blue-100 text-blue-700">Onboarding</Badge>;
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
        <p className="text-red-600">{error}</p>
        <Button onClick={loadAssociations} variant="outline">Retry</Button>
      </div>
    );
  }

  const totalProperties = associations.reduce((sum, a) => sum + (a.propertyCount || 0), 0);
  const totalUnits = associations.reduce((sum, a) => sum + (a.unitCount || 0), 0);

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Associations</p>
                <p className="text-2xl font-semibold">{associations.length}</p>
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
                <p className="text-2xl font-semibold">
                  {associations.filter((a) => a.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Properties</p>
                <p className="text-2xl font-semibold">{totalProperties}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Units</p>
                <p className="text-2xl font-semibold">{totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary-text)]" />
            <Input
              placeholder="Search associations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Association List</CardTitle>
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
                    Properties
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
                    </td>
                    <td className="py-3 px-4 text-sm">{assoc.type}</td>
                    <td className="py-3 px-4">{getStatusBadge(assoc.status)}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p>{assoc.propertyCount || 0} properties</p>
                        <p className="text-[var(--secondary-text)]">{assoc.unitCount || 0} units</p>
                      </div>
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
              {searchQuery ? "No associations found matching your search." : "No associations found."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
