"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Home,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Building2,
  Wrench,
  ClipboardCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { mockGhlAdapter } from "@/lib/ghl/mock-adapter";

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  associationId: string;
  associationName: string;
  unitCount: number;
  status: "active" | "inactive" | "maintenance";
  openRequests: number;
  upcomingInspections: number;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadProperties();
  }, []);

  async function loadProperties() {
    try {
      // In production, this would fetch from GHL
      // For now, using mock data
      const mockProperties: Property[] = [
        {
          id: "TEST-PROP-RIDGELAND",
          name: "6722 S Ridgeland",
          address: "6722 S Ridgeland Ave",
          city: "Chicago",
          state: "IL",
          zip: "60649",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          unitCount: 12,
          status: "active",
          openRequests: 2,
          upcomingInspections: 1,
        },
        {
          id: "TEST-PROP-OAKWOOD",
          name: "Oakwood Heights",
          address: "1234 Oakwood Drive",
          city: "Chicago",
          state: "IL",
          zip: "60601",
          associationId: "TEST-ASSOC-OAKWOOD",
          associationName: "Oakwood Heights HOA",
          unitCount: 48,
          status: "active",
          openRequests: 5,
          upcomingInspections: 2,
        },
        {
          id: "TEST-PROP-MAIN",
          name: "Main Street Plaza",
          address: "5678 Main Street",
          city: "Chicago",
          state: "IL",
          zip: "60602",
          associationId: "TEST-ASSOC-MAIN",
          associationName: "Main Street Association",
          unitCount: 24,
          status: "maintenance",
          openRequests: 8,
          upcomingInspections: 0,
        },
      ];
      
      setProperties(mockProperties);
    } catch (error) {
      console.error("Error loading properties:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = 
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.associationName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-700">Maintenance</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Properties</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage properties and buildings across all associations
          </p>
        </div>
        <Link href="/management/properties/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Properties</p>
                <p className="text-2xl font-semibold">{properties.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Active</p>
                <p className="text-2xl font-semibold">
                  {properties.filter((p) => p.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Open Requests</p>
                <p className="text-2xl font-semibold">
                  {properties.reduce((sum, p) => sum + p.openRequests, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Inspections Due</p>
                <p className="text-2xl font-semibold">
                  {properties.reduce((sum, p) => sum + p.upcomingInspections, 0)}
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
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Property List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Property
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Association
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Units
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Open Requests
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Inspections
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProperties.map((property) => (
                  <tr
                    key={property.id}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/management/properties/${property.id}`}
                        className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                      >
                        {property.name}
                      </Link>
                      <p className="text-sm text-[var(--secondary-text)]">
                        {property.address}, {property.city}, {property.state} {property.zip}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                        <span className="text-sm">{property.associationName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(property.status)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{property.unitCount}</span>
                    </td>
                    <td className="py-3 px-4">
                      {property.openRequests > 0 ? (
                        <Badge className="bg-red-100 text-red-700">
                          {property.openRequests}
                        </Badge>
                      ) : (
                        <span className="text-sm text-[var(--secondary-text)]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {property.upcomingInspections > 0 ? (
                        <Badge className="bg-blue-100 text-blue-700">
                          {property.upcomingInspections}
                        </Badge>
                      ) : (
                        <span className="text-sm text-[var(--secondary-text)]">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/management/properties/${property.id}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProperties.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              No properties found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
