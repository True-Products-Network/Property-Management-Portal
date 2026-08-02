"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Users,
  Home,
  Car,
  PawPrint,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  Edit3,
  X,
  Plus,
  Trash2,
} from "lucide-react";

interface Occupant {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  email?: string;
  phone?: string;
}

interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  color?: string;
  weight?: number;
  licenseNumber?: string;
  vaccinationDate?: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  color?: string;
  licensePlate: string;
  parkingSpot?: string;
}

interface HouseholdData {
  occupancyStatus: string;
  moveInDate?: string;
  moveOutDate?: string;
  mailingAddress?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingZip?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  occupants: Occupant[];
  pets: Pet[];
  vehicles: Vehicle[];
  preferredContactMethod: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  portalNotifications: boolean;
}

export default function OwnerHouseholdPage() {
  const [data, setData] = useState<HouseholdData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<HouseholdData | null>(null);

  useEffect(() => {
    loadHouseholdData();
  }, []);

  async function loadHouseholdData() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/owner/household");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load household data");
      }

      setData(result.data);
      setEditedData(result.data);
    } catch (error) {
      console.error("Error loading household data:", error);
      setError(error instanceof Error ? error.message : "Failed to load household data");
    } finally {
      setIsLoading(false);
    }
  }

  async function saveHouseholdData() {
    if (!editedData) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch("/api/owner/household", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to save household data");
      }

      setData(editedData);
      setSuccessMessage("Household information updated successfully");
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error saving household data:", error);
      setError(error instanceof Error ? error.message : "Failed to save household data");
    } finally {
      setIsSaving(false);
    }
  }

  const addOccupant = () => {
    if (!editedData) return;
    const newOccupant: Occupant = {
      id: `temp-${Date.now()}`,
      firstName: "",
      lastName: "",
      relationship: "",
    };
    setEditedData({
      ...editedData,
      occupants: [...editedData.occupants, newOccupant],
    });
  };

  const removeOccupant = (id: string) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      occupants: editedData.occupants.filter((o) => o.id !== id),
    });
  };

  const updateOccupant = (id: string, field: keyof Occupant, value: string) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      occupants: editedData.occupants.map((o) =>
        o.id === id ? { ...o, [field]: value } : o
      ),
    });
  };

  const addPet = () => {
    if (!editedData) return;
    const newPet: Pet = {
      id: `temp-${Date.now()}`,
      name: "",
      type: "",
    };
    setEditedData({
      ...editedData,
      pets: [...editedData.pets, newPet],
    });
  };

  const removePet = (id: string) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      pets: editedData.pets.filter((p) => p.id !== id),
    });
  };

  const updatePet = (id: string, field: keyof Pet, value: string | number) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      pets: editedData.pets.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    });
  };

  const addVehicle = () => {
    if (!editedData) return;
    const newVehicle: Vehicle = {
      id: `temp-${Date.now()}`,
      make: "",
      model: "",
      licensePlate: "",
    };
    setEditedData({
      ...editedData,
      vehicles: [...editedData.vehicles, newVehicle],
    });
  };

  const removeVehicle = (id: string) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      vehicles: editedData.vehicles.filter((v) => v.id !== id),
    });
  };

  const updateVehicle = (id: string, field: keyof Vehicle, value: string | number) => {
    if (!editedData) return;
    setEditedData({
      ...editedData,
      vehicles: editedData.vehicles.map((v) =>
        v.id === id ? { ...v, [field]: value } : v
      ),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "owner_occupied":
        return <Badge className="bg-green-100 text-green-700">Owner Occupied</Badge>;
      case "tenant_occupied":
        return <Badge className="bg-blue-100 text-blue-700">Tenant Occupied</Badge>;
      case "vacant":
        return <Badge className="bg-amber-100 text-amber-700">Vacant</Badge>;
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

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-red-500">{error}</p>
        <Button onClick={loadHouseholdData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (!data || !editedData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-[var(--secondary-text)]">No household data available</p>
      </div>
    );
  }

  const displayData = isEditing ? editedData : data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--main-text)]">Household Information</h1>
          <p className="text-[var(--secondary-text)] mt-1">
            Manage your occupancy details and household members
          </p>
        </div>
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="border-[var(--teal)] text-[var(--teal)] hover:bg-[var(--teal)]/10"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit Information
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setIsEditing(false);
                setEditedData(data);
                setError(null);
              }}
              variant="outline"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={saveHouseholdData}
              disabled={isSaving}
              className="bg-[var(--teal)] hover:bg-[var(--teal-hover)]"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Occupancy Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-[var(--teal)]" />
            Occupancy Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[var(--secondary-text)]">Current Status:</span>
            {getStatusBadge(displayData.occupancyStatus)}
          </div>

          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Move-in Date</Label>
                <Input
                  type="date"
                  value={editedData.moveInDate?.split("T")[0] || ""}
                  onChange={(e) =>
                    setEditedData({ ...editedData, moveInDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Move-out Date (if applicable)</Label>
                <Input
                  type="date"
                  value={editedData.moveOutDate?.split("T")[0] || ""}
                  onChange={(e) =>
                    setEditedData({ ...editedData, moveOutDate: e.target.value })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--secondary-text)]">Move-in Date:</span>
                <p className="font-medium">
                  {displayData.moveInDate
                    ? new Date(displayData.moveInDate).toLocaleDateString()
                    : "Not specified"}
                </p>
              </div>
              {displayData.moveOutDate && (
                <div>
                  <span className="text-[var(--secondary-text)]">Move-out Date:</span>
                  <p className="font-medium">
                    {new Date(displayData.moveOutDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mailing Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[var(--teal)]" />
            Mailing Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Street Address</Label>
                <Input
                  value={editedData.mailingAddress || ""}
                  onChange={(e) =>
                    setEditedData({ ...editedData, mailingAddress: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={editedData.mailingCity || ""}
                  onChange={(e) =>
                    setEditedData({ ...editedData, mailingCity: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>State</Label>
                  <Input
                    value={editedData.mailingState || ""}
                    onChange={(e) =>
                      setEditedData({ ...editedData, mailingState: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>ZIP</Label>
                  <Input
                    value={editedData.mailingZip || ""}
                    onChange={(e) =>
                      setEditedData({ ...editedData, mailingZip: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm">
              {displayData.mailingAddress ? (
                <>
                  <p className="font-medium">{displayData.mailingAddress}</p>
                  <p className="text-[var(--secondary-text)]">
                    {displayData.mailingCity}, {displayData.mailingState} {displayData.mailingZip}
                  </p>
                </>
              ) : (
                <p className="text-[var(--secondary-text)]">Same as property address</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-[var(--teal)]" />
            Emergency Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editedData.emergencyContactName || ""}
                  onChange={(e) =>
                    setEditedData({ ...editedData, emergencyContactName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Relationship</Label>
                <Input
                  value={editedData.emergencyContactRelationship || ""}
                  onChange={(e) =>
                    setEditedData({ ...editedData, emergencyContactRelationship: e.target.value })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={editedData.emergencyContactPhone || ""}
                  onChange={(e) =>
                    setEditedData({ ...editedData, emergencyContactPhone: e.target.value })
                  }
                />
              </div>
            </div>
          ) : (
            <div className="text-sm">
              {displayData.emergencyContactName ? (
                <>
                  <p className="font-medium">{displayData.emergencyContactName}</p>
                  <p className="text-[var(--secondary-text)]">
                    {displayData.emergencyContactRelationship}
                  </p>
                  <p className="text-[var(--secondary-text)]">{displayData.emergencyContactPhone}</p>
                </>
              ) : (
                <p className="text-[var(--secondary-text)]">No emergency contact specified</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Occupants */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[var(--teal)]" />
            Household Members
          </CardTitle>
          {isEditing && (
            <Button onClick={addOccupant} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {displayData.occupants.length === 0 ? (
            <p className="text-[var(--secondary-text)] text-sm">No additional household members</p>
          ) : (
            <div className="space-y-4">
              {displayData.occupants.map((occupant) => (
                <div
                  key={occupant.id}
                  className="p-4 bg-[var(--page-background)] rounded-lg"
                >
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>First Name</Label>
                        <Input
                          value={occupant.firstName}
                          onChange={(e) =>
                            updateOccupant(occupant.id, "firstName", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Last Name</Label>
                        <Input
                          value={occupant.lastName}
                          onChange={(e) =>
                            updateOccupant(occupant.id, "lastName", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Relationship</Label>
                        <Input
                          value={occupant.relationship}
                          onChange={(e) =>
                            updateOccupant(occupant.id, "relationship", e.target.value)
                          }
                          placeholder="e.g., Spouse, Child, Roommate"
                        />
                      </div>
                      <div>
                        <Label>Email (optional)</Label>
                        <Input
                          type="email"
                          value={occupant.email || ""}
                          onChange={(e) =>
                            updateOccupant(occupant.id, "email", e.target.value)
                          }
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <Button
                          onClick={() => removeOccupant(occupant.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {occupant.firstName} {occupant.lastName}
                        </p>
                        <p className="text-sm text-[var(--secondary-text)]">
                          {occupant.relationship}
                        </p>
                        {occupant.email && (
                          <p className="text-sm text-[var(--secondary-text)]">{occupant.email}</p>
                        )}
                        {occupant.phone && (
                          <p className="text-sm text-[var(--secondary-text)]">{occupant.phone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <PawPrint className="h-5 w-5 text-[var(--teal)]" />
            Pets
          </CardTitle>
          {isEditing && (
            <Button onClick={addPet} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Pet
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {displayData.pets.length === 0 ? (
            <p className="text-[var(--secondary-text)] text-sm">No pets registered</p>
          ) : (
            <div className="space-y-4">
              {displayData.pets.map((pet) => (
                <div key={pet.id} className="p-4 bg-[var(--page-background)] rounded-lg">
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        <Input
                          value={pet.name}
                          onChange={(e) => updatePet(pet.id, "name", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Input
                          value={pet.type}
                          onChange={(e) => updatePet(pet.id, "type", e.target.value)}
                          placeholder="e.g., Dog, Cat, Bird"
                        />
                      </div>
                      <div>
                        <Label>Breed (optional)</Label>
                        <Input
                          value={pet.breed || ""}
                          onChange={(e) => updatePet(pet.id, "breed", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Color (optional)</Label>
                        <Input
                          value={pet.color || ""}
                          onChange={(e) => updatePet(pet.id, "color", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>License Number (optional)</Label>
                        <Input
                          value={pet.licenseNumber || ""}
                          onChange={(e) => updatePet(pet.id, "licenseNumber", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Vaccination Date (optional)</Label>
                        <Input
                          type="date"
                          value={pet.vaccinationDate?.split("T")[0] || ""}
                          onChange={(e) => updatePet(pet.id, "vaccinationDate", e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <Button
                          onClick={() => removePet(pet.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {pet.name} {pet.breed && `(${pet.breed})`}
                        </p>
                        <p className="text-sm text-[var(--secondary-text)]">
                          {pet.type} {pet.color && `• ${pet.color}`}
                        </p>
                        {pet.licenseNumber && (
                          <p className="text-sm text-[var(--secondary-text)]">
                            License: {pet.licenseNumber}
                          </p>
                        )}
                        {pet.vaccinationDate && (
                          <p className="text-sm text-[var(--secondary-text)]">
                            Vaccinated: {new Date(pet.vaccinationDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vehicles */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-[var(--teal)]" />
            Vehicles
          </CardTitle>
          {isEditing && (
            <Button onClick={addVehicle} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Add Vehicle
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {displayData.vehicles.length === 0 ? (
            <p className="text-[var(--secondary-text)] text-sm">No vehicles registered</p>
          ) : (
            <div className="space-y-4">
              {displayData.vehicles.map((vehicle) => (
                <div key={vehicle.id} className="p-4 bg-[var(--page-background)] rounded-lg">
                  {isEditing ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Make</Label>
                        <Input
                          value={vehicle.make}
                          onChange={(e) => updateVehicle(vehicle.id, "make", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Model</Label>
                        <Input
                          value={vehicle.model}
                          onChange={(e) => updateVehicle(vehicle.id, "model", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Year (optional)</Label>
                        <Input
                          type="number"
                          value={vehicle.year || ""}
                          onChange={(e) =>
                            updateVehicle(vehicle.id, "year", parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                      <div>
                        <Label>Color (optional)</Label>
                        <Input
                          value={vehicle.color || ""}
                          onChange={(e) => updateVehicle(vehicle.id, "color", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>License Plate</Label>
                        <Input
                          value={vehicle.licensePlate}
                          onChange={(e) => updateVehicle(vehicle.id, "licensePlate", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Parking Spot (optional)</Label>
                        <Input
                          value={vehicle.parkingSpot || ""}
                          onChange={(e) => updateVehicle(vehicle.id, "parkingSpot", e.target.value)}
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-end">
                        <Button
                          onClick={() => removeVehicle(vehicle.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-[var(--secondary-text)]">
                          License: {vehicle.licensePlate}
                          {vehicle.color && ` • ${vehicle.color}`}
                        </p>
                        {vehicle.parkingSpot && (
                          <p className="text-sm text-[var(--secondary-text)]">
                            Parking: {vehicle.parkingSpot}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
