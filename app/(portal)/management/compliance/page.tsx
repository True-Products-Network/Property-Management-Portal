"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Scale,
  Plus,
  Search,
  Building2,
  Home,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface ComplianceMatter {
  id: string;
  matterId: string;
  associationId: string;
  propertyId?: string;
  unitId?: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  status: string;
  identifiedDate?: string;
  dueDate?: string;
  resolvedDate?: string;
  assignedTo?: string;
  resolutionNotes?: string;
  fineAmount?: number;
  createdAt: string;
  updatedAt: string;
}

interface Association {
  id: string;
  associationName: string;
}

interface Property {
  id: string;
  name: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  propertyId: string;
}

export default function CompliancePage() {
  const [complianceItems, setComplianceItems] = useState<ComplianceMatter[]>([]);
  const [associations, setAssociations] = useState<Record<string, Association>>({});
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [units, setUnits] = useState<Record<string, Unit>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    loadComplianceItems();
    loadAssociations();
    loadProperties();
    loadUnits();
  }, []);

  async function loadComplianceItems() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/compliance");
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load compliance matters");
      }
      
      setComplianceItems(result.data.data || []);
    } catch (error) {
      console.error("Error loading compliance matters:", error);
      setError(error instanceof Error ? error.message : "Failed to load compliance matters");
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

  async function loadUnits() {
    try {
      const response = await fetch("/api/units");
      const result = await response.json();
      
      if (result.success) {
        const unitMap: Record<string, Unit> = {};
        result.data.data.forEach((unit: Unit) => {
          unitMap[unit.id] = unit;
        });
        setUnits(unitMap);
      }
    } catch (error) {
      console.error("Error loading units:", error);
    }
  }

  const today = new Date();

  const filteredItems = complianceItems.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.matterId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (associations[item.associationId]?.associationName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (properties[item.propertyId || ""]?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Calculate stats
  const totalCount = complianceItems.length;
  const openCount = complianceItems.filter((item) => item.status === "open").length;
  const criticalCount = complianceItems.filter(
    (item) => item.priority === "critical" && item.status !== "resolved"
  ).length;
  const overdueCount = complianceItems.filter((item) => {
    if (!item.dueDate || item.status === "resolved") return false;
    return new Date(item.dueDate) < today;
  }).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-blue-100 text-blue-700">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-teal-100 text-teal-700">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>;
      case "closed":
        return <Badge className="bg-gray-100 text-gray-700">Closed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "critical":
        return <Badge className="bg-red-100 text-red-700">Critical</Badge>;
      case "high":
        return <Badge className="bg-amber-100 text-amber-700">High</Badge>;
      case "medium":
        return <Badge className="bg-blue-100 text-blue-700">Medium</Badge>;
      case "low":
        return <Badge className="bg-gray-100 text-gray-700">Low</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">-</Badge>;
    }
  };

  const getCategoryLabel = (category?: string) => {
    const labels: Record<string, string> = {
      fire_safety: "Fire Safety",
      elevator: "Elevator",
      accessibility: "Accessibility",
      environmental: "Environmental",
      zoning: "Zoning",
      licensing: "Licensing",
      insurance: "Insurance",
      financial: "Financial",
      other: "Other",
    };
    return labels[category || ""] || category || "-";
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (item: ComplianceMatter) => {
    if (!item.dueDate || item.status === "resolved") return false;
    return new Date(item.dueDate) < today;
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
        <Button onClick={loadComplianceItems} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Compliance</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Track compliance requirements and deadlines
          </p>
        </div>
        <Link href="/management/compliance/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Add Compliance Item
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Items</p>
                <p className="text-2xl font-semibold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Open</p>
                <p className="text-2xl font-semibold">{openCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Critical</p>
                <p className="text-2xl font-semibold">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Overdue</p>
                <p className="text-2xl font-semibold">{overdueCount}</p>
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
                placeholder="Search compliance matters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Categories</option>
                <option value="fire_safety">Fire Safety</option>
                <option value="elevator">Elevator</option>
                <option value="accessibility">Accessibility</option>
                <option value="environmental">Environmental</option>
                <option value="zoning">Zoning</option>
                <option value="licensing">Licensing</option>
                <option value="insurance">Insurance</option>
                <option value="financial">Financial</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Matters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Matter
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Location
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Priority
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Due Date
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const association = associations[item.associationId];
                  const property = item.propertyId ? properties[item.propertyId] : null;
                  const unit = item.unitId ? units[item.unitId] : null;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/management/compliance/${item.id}`}
                          className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-[var(--secondary-text)]">{item.matterId}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {association && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-[var(--secondary-text)]" />
                              <span>{association.associationName}</span>
                            </div>
                          )}
                          {property && (
                            <div className="flex items-center gap-2 mt-1">
                              <Home className="h-3 w-3 text-[var(--secondary-text)]" />
                              <Link
                                href={`/management/properties/${item.propertyId}`}
                                className="text-xs text-[var(--teal)] hover:underline"
                              >
                                {property.name}
                              </Link>
                            </div>
                          )}
                          {unit && (
                            <p className="text-xs text-[var(--secondary-text)] mt-1">
                              Unit {unit.unitNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-[var(--secondary-text)]">
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                      <td className="py-3 px-4">{getPriorityBadge(item.priority)}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {isOverdue(item) ? (
                            <span className="text-red-600 font-medium">
                              {formatDate(item.dueDate)} (Overdue)
                            </span>
                          ) : (
                            <span className={item.dueDate && new Date(item.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? "text-amber-600" : ""}>
                              {formatDate(item.dueDate)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/management/compliance/${item.id}`}>
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
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || categoryFilter !== "all"
                ? "No compliance matters found matching your criteria."
                : "No compliance matters yet. Click 'Add Compliance Item' to create one."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
