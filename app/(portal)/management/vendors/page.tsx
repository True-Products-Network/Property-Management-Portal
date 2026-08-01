"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus, Star, Phone, Mail } from "lucide-react";
import Link from "next/link";

const vendors = [
  { id: "1", name: "ABC Heating & Cooling", category: "HVAC", rating: 4.8, status: "active", contact: "John Smith" },
  { id: "2", name: "Quick Fix Plumbing", category: "Plumbing", rating: 4.5, status: "active", contact: "Mike Johnson" },
  { id: "3", name: "Elite Electric", category: "Electrical", rating: 4.9, status: "active", contact: "Sarah Lee" },
];

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Vendors</h1>
          <p className="text-[var(--secondary-text)] mt-1">Manage vendor relationships and contracts</p>
        </div>
        <Link href="/management/vendors/new">
          <Button className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]">
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--page-background)] rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-[var(--teal)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Total Vendors</p>
                <p className="text-2xl font-semibold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Top Rated</p>
                <p className="text-2xl font-semibold">5</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Active Jobs</p>
                <p className="text-2xl font-semibold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="p-4 bg-[var(--page-background)] rounded-lg flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{vendor.name}</h3>
                  <p className="text-sm text-[var(--secondary-text)]">{vendor.category}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm">Contact: {vendor.contact}</span>
                    <Badge className="bg-green-100 text-green-700">★ {vendor.rating}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Phone className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm"><Mail className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
