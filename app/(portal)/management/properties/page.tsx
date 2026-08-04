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
  Building2,
  Wrench,
  ArrowRight,
  Loader2,
  Filter,
} from "lucide-react";
import { useEntityLimit } from "@/lib/entitlements/use-entity-limits";

interface Property {
  id: string;
  propertyId: string;
  name: string;
  addressStreet: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  associationId: string;
  type: string;
  status: string;
  yearBuilt?: number;
  totalUnits: number;
}

interface Association {
  id: string;
  name: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [associations, setAssociations] = useState<Record<string, Association>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [associationFilter, setAssociationFilter] = useState<string>("all");

  useEffect(() => {
    loadProperties();
    loadAssociations();
  }, []);

  async function loadProperties() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/properties");
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load properties");
      }
      
      setProperties(result.data.data || []);
    } catch (error) {
      console.error("Error loading properties:", error);
      setError(error instanceof Error ? error.message : "Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadAssociations() {
    try {
      const response = await fetch("/api/associations");
      const result = await response.json();
      
      if (result.success) {
        const assocMap: Record<string, Association> = {};
        result.data.data.forEach((assoc: Association) => {
          assocMap[assoc.id] = assoc;
        });
        setAssociations(assocMap);
      }
    } catch (error) {
      console.error("Error loading associations:", error);
    }
  }

  const filteredProperties = properties.filter((property) => {
    const matchesSearch = 
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.addressStreet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (associations[property.associationId]?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || property.status === statusFilter;
    const matchesType = typeFilter === "all" || property.type === typeFilter;
    const matchesAssociation = associationFilter === "all" || property.associationId === associationFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesAssociation;
  });

  // Get unique types and associations for filters
  const uniqueTypes = Array.from(new Set(properties.map((p) => p.type))).filter(Boolean);
  const uniqueAssociations = Array.from(new Set(properties.map((p) => p.associationId)))
    .map((id) => ({ id, name: associations[id]?.name || "Unknown" }));

  // Calculate stats
  const totalProperties = properties.length;
  const activeProperties = properties.filter((p) => p.status === "active").length;
  const maintenanceProperties = properties.filter((p) => p.status === "maintenance").length;
  const totalUnits = properties.reduce((sum, p) => sum + (p.totalUnits || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-700">Maintenance</Badge>;
      case "under_construction":
        return <Badge className="bg-blue-100 text-blue-700">Construction</Badge>;
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
        <p className="text-red-500">{error}</p>
        <Button onClick={loadProperties} variant="outline">
          Retry
        </Button>
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
                <p className="text-2xl font-semibold">{totalProperties}</p>
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
                <p className="text-2xl font-semibold">{activeProperties}</p>
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
                <p className="text-sm text-[var(--secondary-text)]">Total Units</p>
                <p className="text-2xl font-semibold">{totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">In Maintenance</p>
                <p className="text-2xl font-semibold">{maintenanceProperties}</p>
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
            <div className="flex gap-2 flex-wrap">
              <select
                value={associationFilter}
                onChange={(e) => setAssociationFilter(e.target.value)}
                className="input min-w-[150px]"
              >
                <option value="all">All Associations</option>
                {uniqueAssociations.map((assoc) => (
                  <option key={assoc.id} value={assoc.id}>{assoc.name}</option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input min-w-[120px]"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="under_construction">Construction</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Table */}
      <Card>
        <CardHeader>
          <CardTitle>Property List ({filteredProperties.length})</CardTitle>
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
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Units
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Year Built
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
                        {property.addressStreet}
                        {property.addressCity && `, ${property.addressCity}`}
                        {property.addressState && `, ${property.addressState}`}
                        {property.addressZip && ` ${property.addressZip}`}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                        <Link
                          href={`/management/associations/${property.associationId}`}
                          className="text-sm text-[var(--teal)] hover:underline"
                        >
                          {associations[property.associationId]?.name || "Unknown Association"}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(property.status)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{property.type || "-"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{property.totalUnits || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{property.yearBuilt || "-"}</span>
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
              {searchQuery || statusFilter !== "all" || typeFilter !== "all" || associationFilter !== "all"
                ? "No properties found matching your criteria."
                : "No properties yet. Click 'Add Property' to create one."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
