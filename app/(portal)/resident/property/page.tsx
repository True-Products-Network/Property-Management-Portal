"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import {
  Home,
  Building2,
  Users,
  Car,
  AlertTriangle,
  Phone,
  Mail,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface PropertyData {
  unit: {
    id: string;
    unitNumber: string;
    floor: string;
    squareFeet: number;
    bedrooms: number;
    bathrooms: number;
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    yearBuilt: number;
  };
  association: {
    id: string;
    name: string;
    managementCompany: string;
    emergencyPhone: string;
    officePhone: string;
    officeEmail: string;
  };
  occupants: Occupant[];
  parkingSpots: string[];
  storageUnits: string[];
  emergencyInstructions: string;
}

interface Occupant {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  isPrimary: boolean;
}

export default function MyPropertyPage() {
  const [data, setData] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPropertyData();
  }, []);

  async function loadPropertyData() {
    try {
      const response = await fetch("/api/resident/property");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        }
      }
    } catch (error) {
      console.error("Error loading property data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--teal)]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--secondary-text)]">No property information found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/resident">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">
            My Property & Unit
          </h1>
          <p className="text-[var(--secondary-text)]">
            {data.property.name} - Unit {data.unit.unitNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5 text-[var(--teal)]" />
              Unit Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Unit Number</p>
                <p className="font-medium">{data.unit.unitNumber}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Floor</p>
                <p className="font-medium">{data.unit.floor || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Square Feet</p>
                <p className="font-medium">{data.unit.squareFeet || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Bedrooms</p>
                <p className="font-medium">{data.unit.bedrooms || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--secondary-text)]">Bathrooms</p>
                <p className="font-medium">{data.unit.bathrooms || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Property Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--teal)]" />
              Property Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Property Name</p>
              <p className="font-medium">{data.property.name}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Address</p>
              <p className="font-medium">{data.property.address}</p>
              <p className="font-medium">
                {data.property.city}, {data.property.state} {data.property.zip}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Year Built</p>
              <p className="font-medium">{data.property.yearBuilt || "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Association & Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[var(--teal)]" />
              Association
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Association Name</p>
              <p className="font-medium">{data.association.name}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--secondary-text)]">Management Company</p>
              <p className="font-medium">{data.association.managementCompany || "N/A"}</p>
            </div>
            <div className="pt-2 border-t border-[var(--border-color)]">
              <p className="text-sm font-medium text-[var(--main-text)] mb-2">Contact Information</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-[var(--teal)]" />
                  <span>{data.association.officePhone || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-[var(--teal)]" />
                  <span>{data.association.officeEmail || "N/A"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Occupants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--teal)]" />
              Occupants
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.occupants && data.occupants.length > 0 ? (
              <div className="space-y-3">
                {data.occupants.map((occupant) => (
                  <div
                    key={occupant.id}
                    className="flex items-center justify-between p-3 bg-[var(--page-background)] rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {occupant.firstName} {occupant.lastName}
                        {occupant.isPrimary && (
                          <span className="ml-2 text-xs bg-[var(--teal)] text-white px-2 py-0.5 rounded">
                            Primary
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-[var(--secondary-text)]">{occupant.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[var(--secondary-text)] text-center py-4">
                No occupants listed
              </p>
            )}
            <Link href="/resident/household">
              <Button variant="outline" className="w-full mt-4">
                Manage Household
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Parking & Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-[var(--teal)]" />
              Parking & Storage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-[var(--secondary-text)] mb-2">Assigned Parking</p>
              {data.parkingSpots && data.parkingSpots.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.parkingSpots.map((spot, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[var(--page-background)] rounded-full text-sm"
                    >
                      {spot}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--secondary-text)]">No parking assigned</p>
              )}
            </div>
            <div>
              <p className="text-sm text-[var(--secondary-text)] mb-2">Storage Units</p>
              {data.storageUnits && data.storageUnits.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {data.storageUnits.map((unit, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[var(--page-background)] rounded-full text-sm"
                    >
                      {unit}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--secondary-text)]">No storage assigned</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Emergency Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.emergencyInstructions ? (
              <p className="text-sm whitespace-pre-wrap">{data.emergencyInstructions}</p>
            ) : (
              <p className="text-[var(--secondary-text)]">
                No specific emergency instructions. In case of emergency, call 911.
              </p>
            )}
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Emergency Contact:</strong> {data.association.emergencyPhone || "911"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
