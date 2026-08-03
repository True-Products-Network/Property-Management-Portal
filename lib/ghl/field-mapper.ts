// GHL Field Mapper
// Maps fields between Portal and GHL schemas

import { GhlContact, GhlCompany, GhlCustomObject } from "./api-client";

// ============================================
// Contact Field Mapping
// ============================================

export interface PortalContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  contactRole?: string;
  ghlContactId?: string;
  portalUserId?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Additional fields
  dateOfBirth?: string;
  companyName?: string;
  website?: string;
  notes?: string;
}

export function mapPortalContactToGhl(contact: PortalContact): GhlContact {
  return {
    id: contact.ghlContactId,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    address1: contact.addressStreet,
    city: contact.addressCity,
    state: contact.addressState,
    postalCode: contact.addressZip,
    country: "US",
    customFields: [
      {
        fieldKey: "contact_role",
        value: contact.contactRole || "",
      },
      {
        fieldKey: "portal_user_id",
        value: contact.portalUserId || "",
      },
      {
        fieldKey: "portal_contact_id",
        value: contact.id,
      },
    ],
    tags: ["Property Management Portal"],
  };
}

export function mapGhlContactToPortal(ghlContact: GhlContact): Partial<PortalContact> {
  const customFields = ghlContact.customFields || [];
  
  const getCustomField = (key: string): string => {
    const field = customFields.find(
      (f) => f.fieldKey === key || f.key === key
    );
    return field?.value || "";
  };
  
  return {
    ghlContactId: ghlContact.id,
    firstName: ghlContact.firstName,
    lastName: ghlContact.lastName,
    email: ghlContact.email,
    phone: ghlContact.phone,
    addressStreet: ghlContact.address1,
    addressCity: ghlContact.city,
    addressState: ghlContact.state,
    addressZip: ghlContact.postalCode,
    contactRole: getCustomField("contact_role"),
    portalUserId: getCustomField("portal_user_id"),
  };
}

// ============================================
// Association/Company Field Mapping
// ============================================

export interface PortalAssociation {
  id: string;
  name: string;
  legalName?: string;
  ein?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  phone?: string;
  email?: string;
  website?: string;
  ghlCompanyId?: string;
  managementStartDate?: string;
  managementEndDate?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapPortalAssociationToGhl(assoc: PortalAssociation): GhlCompany {
  return {
    id: assoc.ghlCompanyId,
    name: assoc.name,
    email: assoc.email,
    phone: assoc.phone,
    address1: assoc.addressStreet,
    city: assoc.addressCity,
    state: assoc.addressState,
    postalCode: assoc.addressZip,
    country: "US",
    customFields: [
      {
        fieldKey: "legal_name",
        value: assoc.legalName || "",
      },
      {
        fieldKey: "ein",
        value: assoc.ein || "",
      },
      {
        fieldKey: "portal_association_id",
        value: assoc.id,
      },
      {
        fieldKey: "management_start_date",
        value: assoc.managementStartDate || "",
      },
      {
        fieldKey: "association_status",
        value: assoc.status || "active",
      },
    ],
  };
}

export function mapGhlCompanyToPortal(ghlCompany: GhlCompany): Partial<PortalAssociation> {
  const customFields = ghlCompany.customFields || [];
  
  const getCustomField = (key: string): string => {
    const field = customFields.find(
      (f) => f.fieldKey === key || f.key === key
    );
    return field?.value || "";
  };
  
  return {
    ghlCompanyId: ghlCompany.id,
    name: ghlCompany.name,
    legalName: getCustomField("legal_name"),
    ein: getCustomField("ein"),
    email: ghlCompany.email,
    phone: ghlCompany.phone,
    addressStreet: ghlCompany.address1,
    addressCity: ghlCompany.city,
    addressState: ghlCompany.state,
    addressZip: ghlCompany.postalCode,
    managementStartDate: getCustomField("management_start_date"),
    status: getCustomField("association_status") || "active",
  };
}

// ============================================
// Property Field Mapping (Custom Object)
// ============================================

export interface PortalProperty {
  id: string;
  associationId: string;
  name: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  type?: string;
  status?: string;
  yearBuilt?: number;
  totalUnits?: number;
  managementStartDate?: string;
  accessInstructions?: string;
  emergencyNotes?: string;
  ghlPropertyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const PROPERTY_OBJECT_KEY = "properties";

export function mapPortalPropertyToGhl(property: PortalProperty): GhlCustomObject {
  return {
    objectKey: PROPERTY_OBJECT_KEY,
    properties: {
      id: property.ghlPropertyId,
      name: property.name,
      address: property.addressStreet,
      city: property.addressCity,
      state: property.addressState,
      postal_code: property.addressZip,
      property_type: property.type,
      property_status: property.status,
      year_built: property.yearBuilt,
      total_units: property.totalUnits,
      management_start_date: property.managementStartDate,
      access_instructions: property.accessInstructions,
      emergency_notes: property.emergencyNotes,
      portal_property_id: property.id,
      association_id: property.associationId,
    },
  };
}

export function mapGhlPropertyToPortal(ghlProperty: GhlCustomObject): Partial<PortalProperty> {
  const props = ghlProperty.properties;
  
  return {
    ghlPropertyId: ghlProperty.id,
    name: props.name as string,
    addressStreet: props.address as string,
    addressCity: props.city as string,
    addressState: props.state as string,
    addressZip: props.postal_code as string,
    type: props.property_type as string,
    status: props.property_status as string,
    yearBuilt: props.year_built as number,
    totalUnits: props.total_units as number,
    managementStartDate: props.management_start_date as string,
    accessInstructions: props.access_instructions as string,
    emergencyNotes: props.emergency_notes as string,
    associationId: props.association_id as string,
  };
}

// ============================================
// Unit Field Mapping (Custom Object)
// ============================================

export interface PortalUnit {
  id: string;
  propertyId: string;
  associationId: string;
  unitNumber: string;
  displayName?: string;
  type?: string;
  floor?: string;
  sqFt?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: string;
  rentalStatus?: string;
  parkingSpot?: string;
  storageUnit?: string;
  ghlUnitId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const UNIT_OBJECT_KEY = "units";

export function mapPortalUnitToGhl(unit: PortalUnit): GhlCustomObject {
  return {
    objectKey: UNIT_OBJECT_KEY,
    properties: {
      id: unit.ghlUnitId,
      unit_number: unit.unitNumber,
      display_name: unit.displayName,
      unit_type: unit.type,
      floor: unit.floor,
      square_feet: unit.sqFt,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      unit_status: unit.status,
      rental_status: unit.rentalStatus,
      parking_spot: unit.parkingSpot,
      storage_unit: unit.storageUnit,
      portal_unit_id: unit.id,
      property_id: unit.propertyId,
      association_id: unit.associationId,
    },
  };
}

export function mapGhlUnitToPortal(ghlUnit: GhlCustomObject): Partial<PortalUnit> {
  const props = ghlUnit.properties;
  
  return {
    ghlUnitId: ghlUnit.id,
    unitNumber: props.unit_number as string,
    displayName: props.display_name as string,
    type: props.unit_type as string,
    floor: props.floor as string,
    sqFt: props.square_feet as number,
    bedrooms: props.bedrooms as number,
    bathrooms: props.bathrooms as number,
    status: props.unit_status as string,
    rentalStatus: props.rental_status as string,
    parkingSpot: props.parking_spot as string,
    storageUnit: props.storage_unit as string,
    propertyId: props.property_id as string,
    associationId: props.association_id as string,
  };
}

// ============================================
// Entity Type Helpers
// ============================================

export type EntityType = "contact" | "association" | "property" | "unit" | "vendor";

export function getGhlObjectKey(entityType: EntityType): string | null {
  switch (entityType) {
    case "property":
      return PROPERTY_OBJECT_KEY;
    case "unit":
      return UNIT_OBJECT_KEY;
    case "contact":
    case "association":
      return null; // These use native GHL endpoints
    default:
      return entityType;
  }
}
