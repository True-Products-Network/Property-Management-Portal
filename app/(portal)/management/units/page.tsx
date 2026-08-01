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
  Users,
  Wrench,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface Unit {
  id: string;
  unitId: string;
  propertyId: string;
  unitNumber: string;
  displayName?: string;
  type?: string;
  status: string;
  occupancyStatus?: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string;
}

interface Property {
  id: string;
  name: string;
  associationId: string;
}

interface Association {
  id: string;
  name: string;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [associations, setAssociations] = useState<Record<string, Association>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [occupancyFilter, setOccupancyFilter] = useState<string>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("all");

  useEffect(() => {
    loadUnits();
    loadProperties();
    loadAssociations();
  }, []);

  async function loadUnits() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/units");
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load units");
      }
      
      setUnits(result.data.data || []);
    } catch (error) {
      console.error("Error loading units:", error);
      setError(error instanceof Error ? error.message : "Failed to load units");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProperties() {
    try {
      const response = await fetch("/api/properties");
      const result = await response.json();
      
      if (result.success) {
        const propMap: Record<string, Property> = {};
        result.data.data.forEach((prop: Property) => {
          propMap[prop.id] = prop;
        });
        setProperties(propMap);
      }
    } catch (error) {
      console.error("Error loading properties:", error);
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

  const filteredUnits = units.filter((unit) => {
    const property = properties[unit.propertyId];
    const matchesSearch = 
      unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (unit.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (property?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
    const matchesOccupancy = occupancyFilter === "all" || unit.occupancyStatus === occupancyFilter;
    const matchesProperty = propertyFilter === "all" || unit.propertyId === propertyFilter;
    
    return matchesSearch && matchesStatus && matchesOccupancy && matchesProperty;
  });

  // Get unique properties for filter
  const uniqueProperties = Array.from(new Set(units.map((u) => u.propertyId)))
    .map((id) => ({ id, name: properties[id]?.name || "Unknown Property" }));

  // Calculate stats
  const totalUnits = units.length;
  const occupiedUnits = units.filter((u) => u.occupancyStatus === "occupied" || u.status === "occupied").length;
  const vacantUnits = units.filter((u) => u.occupancyStatus === "vacant" || u.status === "vacant").length;
  const maintenanceUnits = units.filter((u) => u.status === "maintenance").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "occupied":
        return <Badge className="bg-green-100 text-green-700">Occupied</Badge>;
      case "vacant":
        return <Badge className="bg-blue-100 text-blue-700">Vacant</Badge>;
      case "maintenance":
        return <Badge className="bg-amber-100 text-amber-700">Maintenance</Badge>;
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
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
        <Button onClick={loadUnits} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Units</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage units across all properties
          </p>
        </div>
        <Link href="/management/units/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
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
                <p className="text-sm text-[var(--secondary-text)]">Total Units</p>
                <p className="text-2xl font-semibold">{totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Occupied</p>
                <p className="text-2xl font-semibold">{occupiedUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Home className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Vacant</p>
                <p className="text-2xl font-semibold">{vacantUnits}</p>
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
                <p className="text-sm text-[var(--secondary-text)]">Maintenance</p>
                <p className="text-2xl font-semibold">{maintenanceUnits}</p>
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
                placeholder="Search units..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="input min-w-[150px]"
              >
                <option value="all">All Properties</option>
                {uniqueProperties.map((prop) => (
                  <option key={prop.id} value={prop.id}>{prop.name}</option>
                ))}
              </select>
              <select
                value={occupancyFilter}
                onChange={(e) => setOccupancyFilter(e.target.value)}
                className="input min-w-[120px]"
              >
                <option value="all">All Occupancy</option>
                <option value="occupied">Occupied</option>
                <option value="vacant">Vacant</option>
                <option value="under_renovation">Renovation</option>
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
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Units Table */}
      <Card>
        <CardHeader>
          <CardTitle>Unit List ({filteredUnits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Unit
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Property
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Details
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map((unit) => {
                  const property = properties[unit.propertyId];
                  const association = property ? associations[property.associationId] : null;
                  
                  return (
                    <tr
                      key={unit.id}
                      className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/management/units/${unit.id}`}
                          className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                        >
                          Unit {unit.unitNumber}
                        </Link>
                        {unit.displayName && unit.displayName !== unit.unitNumber && (
                          <p className="text-sm text-[var(--secondary-text)]">{unit.displayName}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                            <Link
                              href={`/management/properties/${unit.propertyId}`}
                              className="text-[var(--teal)] hover:underline"
                            >
                              {property?.name || "Unknown Property"}
                            </Link>
                          </div>
                          {association && (
                            <p className="text-[var(--secondary-text)] text-xs mt-1">
                              {association.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(unit.status)}</td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{unit.type || "-"}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-[var(--secondary-text)]">
                          {unit.squareFeet && <p>{unit.squareFeet} sq ft</p>}
                          {unit.bedrooms !== undefined && unit.bathrooms !== undefined && (
                            <p>{unit.bedrooms} bed, {unit.bathrooms} bath</p>
                          )}
                          {unit.floor && <p>Floor {unit.floor}</p>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/management/units/${unit.id}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredUnits.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              {searchQuery || statusFilter !== "all" || occupancyFilter !== "all" || propertyFilter !== "all"
                ? "No units found matching your criteria."
                : "No units yet. Click 'Add Unit' to create one."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
