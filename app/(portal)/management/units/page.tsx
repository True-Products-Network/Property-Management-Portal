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
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  associationId: string;
  associationName: string;
  status: "occupied" | "vacant" | "maintenance";
  ownerName?: string;
  tenantName?: string;
  ownerEmail?: string;
  tenantEmail?: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadUnits();
  }, []);

  async function loadUnits() {
    try {
      const mockUnits: Unit[] = [
        {
          id: "UNIT-1",
          unitNumber: "1N",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          status: "occupied",
          ownerName: "John Smith",
          tenantName: "John Smith",
          ownerEmail: "john.smith@example.com",
          squareFeet: 1200,
          bedrooms: 2,
          bathrooms: 2,
        },
        {
          id: "UNIT-2",
          unitNumber: "1S",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          status: "occupied",
          ownerName: "Mary Jones",
          tenantName: "Mary Jones",
          ownerEmail: "mary.jones@example.com",
          squareFeet: 1100,
          bedrooms: 2,
          bathrooms: 1,
        },
        {
          id: "UNIT-3",
          unitNumber: "2N",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          status: "vacant",
          ownerName: "Bob Wilson",
          ownerEmail: "bob.wilson@example.com",
          squareFeet: 1200,
          bedrooms: 2,
          bathrooms: 2,
        },
        {
          id: "UNIT-4",
          unitNumber: "2S",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          status: "occupied",
          ownerName: "Lisa Davis",
          tenantName: "Tom Davis",
          ownerEmail: "lisa.davis@example.com",
          squareFeet: 1100,
          bedrooms: 2,
          bathrooms: 1,
        },
        {
          id: "UNIT-5",
          unitNumber: "3N",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          status: "maintenance",
          squareFeet: 1200,
          bedrooms: 2,
          bathrooms: 2,
        },
        {
          id: "UNIT-6",
          unitNumber: "3S",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          status: "occupied",
          ownerName: "Karen Lee",
          tenantName: "Karen Lee",
          ownerEmail: "karen.lee@example.com",
          squareFeet: 1100,
          bedrooms: 2,
          bathrooms: 1,
        },
      ];
      
      setUnits(mockUnits);
    } catch (error) {
      console.error("Error loading units:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredUnits = units.filter((unit) => {
    const matchesSearch = 
      unit.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.tenantName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || unit.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "occupied":
        return <Badge className="bg-green-100 text-green-700">Occupied</Badge>;
      case "vacant":
        return <Badge className="bg-blue-100 text-blue-700">Vacant</Badge>;
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
                <p className="text-2xl font-semibold">{units.length}</p>
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
                <p className="text-2xl font-semibold">
                  {units.filter((u) => u.status === "occupied").length}
                </p>
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
                <p className="text-2xl font-semibold">
                  {units.filter((u) => u.status === "vacant").length}
                </p>
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
                <p className="text-2xl font-semibold">
                  {units.filter((u) => u.status === "maintenance").length}
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
                placeholder="Search units..."
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
                <option value="occupied">Occupied</option>
                <option value="vacant">Vacant</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Units Table */}
      <Card>
        <CardHeader>
          <CardTitle>Unit List</CardTitle>
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
                    Owner
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Tenant
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
                {filteredUnits.map((unit) => (
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
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                        <Link
                          href={`/management/properties/${unit.propertyId}`}
                          className="text-sm text-[var(--teal)] hover:underline"
                        >
                          {unit.propertyName}
                        </Link>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(unit.status)}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {unit.ownerName ? (
                          <>
                            <p className="font-medium">{unit.ownerName}</p>
                            {unit.ownerEmail && (
                              <p className="text-[var(--secondary-text)] text-xs">{unit.ownerEmail}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-[var(--secondary-text)]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {unit.tenantName ? (
                          <>
                            <p className="font-medium">{unit.tenantName}</p>
                            {unit.tenantEmail && (
                              <p className="text-[var(--secondary-text)] text-xs">{unit.tenantEmail}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-[var(--secondary-text)]">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-[var(--secondary-text)]">
                        {unit.squareFeet && <p>{unit.squareFeet} sq ft</p>}
                        {unit.bedrooms && unit.bathrooms && (
                          <p>{unit.bedrooms} bed, {unit.bathrooms} bath</p>
                        )}
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
                ))}
              </tbody>
            </table>
          </div>
          {filteredUnits.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              No units found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
