"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Building2,
  DoorOpen,
  ArrowRight,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  User,
} from "lucide-react";

interface Property {
  id: string;
  propertyId: string;
  name: string;
  addressStreet: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  type: string;
  status: string;
  yearBuilt?: number;
  totalUnits: number;
  associationId: string;
  associationName?: string;
  associationPhone?: string;
  associationEmail?: string;
  managementStartDate?: string;
  accessInstructions?: string;
  emergencyNotes?: string;
}

interface Unit {
  id: string;
  unitId: string;
  propertyId: string;
  propertyName?: string;
  unitNumber: string;
  displayName?: string;
  type?: string;
  status: string;
  squareFeet?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: string;
  occupancyStatus?: string;
  rentalStatus?: string;
  parkingSpot?: string;
  storageUnit?: string;
  moveInDate?: string;
  mailingAddress?: string;
}

interface OwnerPropertiesData {
  properties: Property[];
  units: Unit[];
}

export default function OwnerPropertiesPage() {
  const [data, setData] = useState<OwnerPropertiesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  useEffect(() => {
    loadPropertiesData();
  }, []);

  async function loadPropertiesData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/owner/properties");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load properties");
      }

      setData(result.data);
      if (result.data.properties.length > 0) {
        setSelectedProperty(result.data.properties[0].id);
      }
    } catch (error) {
      console.error("Error loading properties:", error);
      setError(error instanceof Error ? error.message : "Failed to load properties");
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "occupied":
      case "owner_occupied":
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-700">Inactive</Badge>;
      case "vacant":
        return <Badge className="bg-amber-100 text-amber-700">Vacant</Badge>;
      case "tenant_occupied":
        return <Badge className="bg-blue-100 text-blue-700">Rented</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const selectedPropertyData = data?.properties.find(p => p.id === selectedProperty);
  const propertyUnits = data?.units.filter(u => u.propertyId === selectedProperty) || [];

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
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={loadPropertiesData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.properties.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">My Properties</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            View your properties and units
          </p>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <Home className="h-16 w-16 mx-auto mb-4 text-[var(--secondary-text)] opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Properties Found</h3>
            <p className="text-[var(--secondary-text)] max-w-md mx-auto">
              You don&apos;t have any properties associated with your account yet. 
              Contact your property management if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--main-text)]">My Properties</h1>
        <p className="text-[var(--secondary-text)] mt-1">
          {data.properties.length} property{data.properties.length !== 1 ? "ies" : ""} • {data.units.length} unit{data.units.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-medium">Your Properties</h2>
          {data.properties.map((property) => (
            <Card
              key={property.id}
              className={`cursor-pointer transition-all ${
                selectedProperty === property.id
                  ? "ring-2 ring-[var(--teal)] border-[var(--teal)]"
                  : "hover:shadow-md"
              }`}
              onClick={() => setSelectedProperty(property.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[var(--teal)]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-[var(--teal)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{property.name}</p>
                    <p className="text-sm text-[var(--secondary-text)] truncate">
                      {property.addressStreet}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(property.status)}
                      <span className="text-xs text-[var(--secondary-text)]">
                        {propertyUnits.length} unit{propertyUnits.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Property Details */}
        <div className="lg:col-span-2">
          {selectedPropertyData ? (
            <div className="space-y-6">
              {/* Property Info Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedPropertyData.name}</CardTitle>
                      <CardDescription>
                        {selectedPropertyData.associationName}
                      </CardDescription>
                    </div>
                    {getStatusBadge(selectedPropertyData.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[var(--secondary-text)] mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-[var(--secondary-text)]">
                        {selectedPropertyData.addressStreet}
                        <br />
                        {selectedPropertyData.addressCity}, {selectedPropertyData.addressState} {selectedPropertyData.addressZip}
                      </p>
                    </div>
                  </div>

                  {/* Association Contact */}
                  {selectedPropertyData.associationName && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-[var(--secondary-text)] mt-0.5" />
                      <div>
                        <p className="font-medium">Association</p>
                        <p className="text-[var(--secondary-text)]">
                          {selectedPropertyData.associationName}
                        </p>
                        {selectedPropertyData.associationPhone && (
                          <p className="text-sm text-[var(--secondary-text)] flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {selectedPropertyData.associationPhone}
                          </p>
                        )}
                        {selectedPropertyData.associationEmail && (
                          <p className="text-sm text-[var(--secondary-text)] flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {selectedPropertyData.associationEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Property Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[var(--border-color)]">
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Type</p>
                      <p className="font-medium">{selectedPropertyData.type || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Year Built</p>
                      <p className="font-medium">{selectedPropertyData.yearBuilt || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Total Units</p>
                      <p className="font-medium">{selectedPropertyData.totalUnits || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--secondary-text)]">Managed Since</p>
                      <p className="font-medium">
                        {selectedPropertyData.managementStartDate
                          ? new Date(selectedPropertyData.managementStartDate).toLocaleDateString()
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Access Instructions */}
                  {selectedPropertyData.accessInstructions && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="font-medium text-blue-900 mb-1">Access Instructions</p>
                      <p className="text-sm text-blue-800">{selectedPropertyData.accessInstructions}</p>
                    </div>
                  )}

                  {/* Emergency Notes */}
                  {selectedPropertyData.emergencyNotes && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <p className="font-medium text-red-900 mb-1">Emergency Notes</p>
                      <p className="text-sm text-red-800">{selectedPropertyData.emergencyNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Units List */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Units</CardTitle>
                  <CardDescription>
                    Units you own or rent at this property
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {propertyUnits.length === 0 ? (
                    <div className="text-center py-8 text-[var(--secondary-text)]">
                      <DoorOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No units found for this property</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {propertyUnits.map((unit) => (
                        <Card key={unit.id} className="border border-[var(--border-color)]">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <DoorOpen className="h-5 w-5 text-[var(--teal)]" />
                                <span className="font-medium text-lg">Unit {unit.unitNumber}</span>
                              </div>
                              {getStatusBadge(unit.occupancyStatus || unit.status)}
                            </div>

                            {unit.displayName && unit.displayName !== `Unit ${unit.unitNumber}` && (
                              <p className="text-sm text-[var(--secondary-text)] mb-2">
                                {unit.displayName}
                              </p>
                            )}

                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              {unit.type && (
                                <div>
                                  <span className="text-[var(--secondary-text)]">Type:</span>{" "}
                                  <span>{unit.type}</span>
                                </div>
                              )}
                              {unit.squareFeet && (
                                <div>
                                  <span className="text-[var(--secondary-text)]">Size:</span>{" "}
                                  <span>{unit.squareFeet} sq ft</span>
                                </div>
                              )}
                              {unit.bedrooms !== undefined && (
                                <div>
                                  <span className="text-[var(--secondary-text)]">Bedrooms:</span>{" "}
                                  <span>{unit.bedrooms}</span>
                                </div>
                              )}
                              {unit.bathrooms !== undefined && (
                                <div>
                                  <span className="text-[var(--secondary-text)]">Bathrooms:</span>{" "}
                                  <span>{unit.bathrooms}</span>
                                </div>
                              )}
                              {unit.floor && (
                                <div>
                                  <span className="text-[var(--secondary-text)]">Floor:</span>{" "}
                                  <span>{unit.floor}</span>
                                </div>
                              )}
                            </div>

                            {(unit.parkingSpot || unit.storageUnit) && (
                              <div className="pt-3 border-t border-[var(--border-color)] text-sm">
                                {unit.parkingSpot && (
                                  <p className="text-[var(--secondary-text)]">
                                    Parking: {unit.parkingSpot}
                                  </p>
                                )}
                                {unit.storageUnit && (
                                  <p className="text-[var(--secondary-text)]">
                                    Storage: {unit.storageUnit}
                                  </p>
                                )}
                              </div>
                            )}

                            {unit.mailingAddress && (
                              <div className="pt-3 border-t border-[var(--border-color)] text-sm">
                                <p className="text-[var(--secondary-text)]">
                                  Mailing: {unit.mailingAddress}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="h-16 w-16 mx-auto mb-4 text-[var(--secondary-text)] opacity-50" />
                <p className="text-[var(--secondary-text)]">Select a property to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
