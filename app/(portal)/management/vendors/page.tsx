"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Truck,
  Plus,
  Search,
  Star,
  Phone,
  Mail,
  ArrowRight,
  Loader2,
  Building2,
  Wrench,
} from "lucide-react";

interface Vendor {
  id: string;
  vendorId: string;
  companyName: string;
  doingBusinessAs?: string;
  category?: string;
  status: string;
  primaryContactName?: string;
  email?: string;
  phone?: string;
  emergencyPhone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  licenseNumber?: string;
  insuranceExpiry?: string;
  workersCompExpiry?: string;
  rating?: number;
  totalJobs: number;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors() {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/vendors");
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to load vendors");
      }
      
      setVendors(result.data.data || []);
    } catch (error) {
      console.error("Error loading vendors:", error);
      setError(error instanceof Error ? error.message : "Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  }

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = 
      vendor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.doingBusinessAs || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.primaryContactName || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || vendor.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || vendor.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-700">Suspended</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(vendors.map(v => v.category).filter(Boolean)));

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
        <Button onClick={loadVendors} variant="outline">
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
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Vendors</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage vendor relationships and contracts
          </p>
        </div>
        <Link href="/management/vendors/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Vendors</p>
                <p className="text-2xl font-semibold">{vendors.length}</p>
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
                  {vendors.filter((v) => v.status === "active").length}
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
                <p className="text-sm text-[var(--secondary-text)]">Categories</p>
                <p className="text-2xl font-semibold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Top Rated</p>
                <p className="text-2xl font-semibold">
                  {vendors.filter((v) => (v.rating || 0) >= 4.5).length}
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
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Company
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Contact
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Rating
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[var(--secondary-text)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--page-background)]"
                  >
                    <td className="py-3 px-4">
                      <Link
                        href={`/management/vendors/${vendor.id}`}
                        className="font-medium text-[var(--main-text)] hover:text-[var(--teal)]"
                      >
                        {vendor.companyName}
                      </Link>
                      {vendor.doingBusinessAs && vendor.doingBusinessAs !== vendor.companyName && (
                        <p className="text-sm text-[var(--secondary-text)]">DBA: {vendor.doingBusinessAs}</p>
                      )}
                      {vendor.licenseNumber && (
                        <p className="text-xs text-[var(--secondary-text)]">License: {vendor.licenseNumber}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">{vendor.category || "-"}</span>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(vendor.status)}</td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        {vendor.primaryContactName && (
                          <p className="font-medium">{vendor.primaryContactName}</p>
                        )}
                        {vendor.phone && (
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3 text-[var(--secondary-text)]" />
                            <a 
                              href={`tel:${vendor.phone}`}
                              className="text-[var(--secondary-text)] hover:text-[var(--main-text)]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {vendor.phone}
                            </a>
                          </div>
                        )}
                        {vendor.email && (
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="h-3 w-3 text-[var(--secondary-text)]" />
                            <a 
                              href={`mailto:${vendor.email}`}
                              className="text-[var(--teal)] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {vendor.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {vendor.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--secondary-text)]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/management/vendors/${vendor.id}`}>
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
          {filteredVendors.length === 0 && (
            <div className="text-center py-8 text-[var(--secondary-text)]">
              {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                ? "No vendors found matching your criteria."
                : "No vendors yet. Click 'Add Vendor' to create one."}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
