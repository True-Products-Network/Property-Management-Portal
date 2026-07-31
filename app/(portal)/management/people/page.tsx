"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Search,
  Home,
  Building2,
  Mail,
  Phone,
  ArrowRight,
  Loader2,
  User,
  UserCog,
} from "lucide-react";

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  type: "owner" | "tenant" | "both";
  status: "active" | "inactive" | "pending";
  unitId?: string;
  unitNumber?: string;
  propertyId?: string;
  propertyName?: string;
  associationId?: string;
  associationName?: string;
  portalAccess: boolean;
  portalStatus?: "active" | "invited" | "suspended";
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadPeople();
  }, []);

  async function loadPeople() {
    try {
      const mockPeople: Person[] = [
        {
          id: "PERSON-1",
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@example.com",
          phone: "(555) 123-4567",
          type: "owner",
          status: "active",
          unitId: "UNIT-1",
          unitNumber: "1N",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          portalAccess: true,
          portalStatus: "active",
        },
        {
          id: "PERSON-2",
          firstName: "Mary",
          lastName: "Jones",
          email: "mary.jones@example.com",
          phone: "(555) 234-5678",
          type: "owner",
          status: "active",
          unitId: "UNIT-2",
          unitNumber: "1S",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          portalAccess: true,
          portalStatus: "active",
        },
        {
          id: "PERSON-3",
          firstName: "Bob",
          lastName: "Wilson",
          email: "bob.wilson@example.com",
          phone: "(555) 345-6789",
          type: "owner",
          status: "active",
          unitId: "UNIT-3",
          unitNumber: "2N",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          portalAccess: false,
        },
        {
          id: "PERSON-4",
          firstName: "Lisa",
          lastName: "Davis",
          email: "lisa.davis@example.com",
          phone: "(555) 456-7890",
          type: "owner",
          status: "active",
          unitId: "UNIT-4",
          unitNumber: "2S",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          portalAccess: true,
          portalStatus: "invited",
        },
        {
          id: "PERSON-5",
          firstName: "Tom",
          lastName: "Davis",
          email: "tom.davis@example.com",
          phone: "(555) 567-8901",
          type: "tenant",
          status: "active",
          unitId: "UNIT-4",
          unitNumber: "2S",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          portalAccess: false,
        },
        {
          id: "PERSON-6",
          firstName: "Karen",
          lastName: "Lee",
          email: "karen.lee@example.com",
          phone: "(555) 678-9012",
          type: "both",
          status: "active",
          unitId: "UNIT-6",
          unitNumber: "3S",
          propertyId: "TEST-PROP-RIDGELAND",
          propertyName: "6722 S Ridgeland",
          associationId: "TEST-ASSOC-RIDGELAND",
          associationName: "Ridgeland Condominium Association",
          portalAccess: true,
          portalStatus: "active",
        },
      ];
      
      setPeople(mockPeople);
    } catch (error) {
      console.error("Error loading people:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPeople = people.filter((person) => {
    const matchesSearch = 
      person.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.phone?.includes(searchQuery);
    
    const matchesType = typeFilter === "all" || person.type === typeFilter;
    const matchesStatus = statusFilter === "all" || person.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "owner":
        return <Badge className="bg-blue-100 text-blue-700">Owner</Badge>;
      case "tenant":
        return <Badge className="bg-green-100 text-green-700">Tenant</Badge>;
      case "both":
        return <Badge className="bg-purple-100 text-purple-700">Owner & Tenant</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getPortalBadge = (person: Person) => {
    if (!person.portalAccess) {
      return <Badge className="bg-gray-100 text-gray-700">No Access</Badge>;
    }
    switch (person.portalStatus) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "invited":
        return <Badge className="bg-amber-100 text-amber-700">Invited</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-700">Suspended</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">No Access</Badge>;
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Owners & Tenants</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage property owners and tenants
          </p>
        </div>
        <Link href="/management/people/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Add Person
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total</p>
                <p className="text-2xl font-semibold">{people.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Owners</p>
                <p className="text-2xl font-semibold">
                  {people.filter((p) => p.type === "owner" || p.type === "both").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <UserCog className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Tenants</p>
                <p className="text-2xl font-semibold">
                  {people.filter((p) => p.type === "tenant" || p.type === "both").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Portal Active</p>
                <p className="text-2xl font-semibold">
                  {people.filter((p) => p.portalStatus === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Invited</p>
                <p className="text-2xl font-semibold">
                  {people.filter((p) => p.portalStatus === "invited").length}
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
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Types</option>
                <option value="owner">Owners</option>
                <option value="tenant">Tenants</option>
                <option value="both">Both</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* People Table */}
      <Card>
        <CardHeader>
          <CardTitle>People List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Unit
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Portal Access
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPeople.map((person) => (
                  <tr
                    key={person.id}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/management/people/${person.id}`}
                        className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                      >
                        {person.firstName} {person.lastName}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-[var(--secondary-text)]" />
                          <a
                            href={`mailto:${person.email}`}
                            className="text-[var(--teal)] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {person.email}
                          </a>
                        </div>
                        {person.phone && (
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3 text-[var(--secondary-text)]" />
                            <a
                              href={`tel:${person.phone}`}
                              className="text-[var(--secondary-text)] hover:text-[var(--main-text)]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {person.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(person.type)}</td>
                    <td className="py-3 px-4">
                      {person.unitNumber ? (
                        <div className="text-sm">
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-[var(--teal)]" />
                            <Link
                              href={`/management/units/${person.unitId}`}
                              className="font-medium hover:underline"
                            >
                              Unit {person.unitNumber}
                            </Link>
                          </div>
                          <p className="text-[var(--secondary-text)] text-xs mt-1">
                            {person.propertyName}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[var(--secondary-text)]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{getPortalBadge(person)}</td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/management/people/${person.id}`}>
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
          {filteredPeople.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              No people found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
