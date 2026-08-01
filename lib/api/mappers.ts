// Database column mappers
// Convert snake_case database columns to camelCase TypeScript interfaces

import { DropdownSetting } from "./dropdowns";
import { Association } from "./associations";
import { Property } from "./properties";
import { Unit } from "./units";
import { Contact } from "./contacts";
import { MaintenanceRequest } from "./maintenance";
import { Vendor } from "./vendors";
import { Inspection } from "./inspections";
import { Document } from "./documents";
import { ComplianceMatter } from "./compliance";
import { Approval } from "./approvals";
import { PaymentRecord } from "./payments";
import { Communication } from "./communications";
import { Appointment } from "./appointments";

// Dropdown Settings Mapper
export function mapDropdownSetting(row: any): DropdownSetting {
  return {
    id: row.id,
    recordType: row.record_type,
    fieldName: row.field_name,
    value: row.value,
    label: row.label,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Association Mapper
export function mapAssociation(row: any): Association {
  return {
    id: row.id,
    associationId: row.association_id,
    name: row.name,
    legalName: row.legal_name,
    type: row.type,
    status: row.status,
    addressStreet: row.address_street,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZip: row.address_zip,
    phone: row.phone,
    email: row.email,
    fiscalYear: row.fiscal_year,
    annualMeetingMonth: row.annual_meeting_month,
    managementStartDate: row.management_start_date,
    assignedManagerId: row.assigned_manager_id,
    propertyCount: row.property_count,
    unitCount: row.unit_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Property Mapper
export function mapProperty(row: any): Property {
  return {
    id: row.id,
    propertyId: row.property_id,
    associationId: row.association_id,
    name: row.name,
    addressStreet: row.address_street,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZip: row.address_zip,
    type: row.type,
    status: row.status,
    yearBuilt: row.year_built,
    totalUnits: row.total_units,
    managementStartDate: row.management_start_date,
    accessInstructions: row.access_instructions,
    emergencyNotes: row.emergency_notes,
    assignedStaffId: row.assigned_staff_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Unit Mapper
export function mapUnit(row: any): Unit {
  return {
    id: row.id,
    unitId: row.unit_id,
    propertyId: row.property_id,
    associationId: row.association_id,
    unitNumber: row.unit_number,
    type: row.type,
    status: row.status,
    occupancyStatus: row.occupancy_status,
    rentalStatus: row.rental_status,
    squareFeet: row.square_feet,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Contact Mapper
export function mapContact(row: any): Contact {
  return {
    id: row.id,
    contactId: row.contact_id,
    ghlContactId: row.ghl_contact_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    type: row.type,
    roles: row.roles,
    boardPosition: row.board_position,
    associationId: row.association_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    isPrimaryContact: row.is_primary_contact,
    preferredContactMethod: row.preferred_contact_method,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Maintenance Request Mapper
export function mapMaintenanceRequest(row: any): MaintenanceRequest {
  return {
    id: row.id,
    requestId: row.request_id,
    associationId: row.association_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    requestType: row.request_type,
    category: row.category,
    urgency: row.urgency,
    status: row.status,
    title: row.title,
    description: row.description,
    requestedBy: row.requested_by,
    assignedTo: row.assigned_to,
    vendorId: row.vendor_id,
    estimatedCost: row.estimated_cost,
    actualCost: row.actual_cost,
    scheduledDate: row.scheduled_date,
    completedDate: row.completed_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Vendor Mapper
export function mapVendor(row: any): Vendor {
  return {
    id: row.id,
    vendorId: row.vendor_id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    type: row.type,
    status: row.status,
    addressStreet: row.address_street,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZip: row.address_zip,
    services: row.services,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Inspection Mapper
export function mapInspection(row: any): Inspection {
  return {
    id: row.id,
    inspectionId: row.inspection_id,
    associationId: row.association_id,
    propertyId: row.property_id,
    type: row.type,
    status: row.status,
    scheduledDate: row.scheduled_date,
    completedDate: row.completed_date,
    inspectorName: row.inspector_name,
    overallResult: row.overall_result,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Document Mapper
export function mapDocument(row: any): Document {
  return {
    id: row.id,
    documentId: row.document_id,
    associationId: row.association_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    type: row.type,
    name: row.name,
    description: row.description,
    fileUrl: row.file_url,
    fileSize: row.file_size,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Compliance Matter Mapper
export function mapComplianceMatter(row: any): ComplianceMatter {
  return {
    id: row.id,
    complianceId: row.compliance_id,
    associationId: row.association_id,
    propertyId: row.property_id,
    type: row.type,
    status: row.status,
    description: row.description,
    dueDate: row.due_date,
    completedDate: row.completed_date,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Approval Mapper
export function mapApproval(row: any): Approval {
  return {
    id: row.id,
    approvalId: row.approval_id,
    associationId: row.association_id,
    requestType: row.request_type,
    requestId: row.request_id,
    title: row.title,
    description: row.description,
    requestedBy: row.requested_by,
    status: row.status,
    boardVoteDate: row.board_vote_date,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Payment Mapper
export function mapPayment(row: any): PaymentRecord {
  return {
    id: row.id,
    paymentId: row.payment_id,
    associationId: row.association_id,
    contactId: row.contact_id,
    unitId: row.unit_id,
    type: row.type,
    status: row.status,
    amount: row.amount,
    description: row.description,
    dueDate: row.due_date,
    paidDate: row.paid_date,
    paidBy: row.paid_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Communication Mapper
export function mapCommunication(row: any): Communication {
  return {
    id: row.id,
    communicationId: row.communication_id,
    associationId: row.association_id,
    type: row.type,
    subject: row.subject,
    content: row.content,
    sentBy: row.sent_by,
    sentAt: row.sent_at,
    status: row.status,
    recipientCount: row.recipient_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Appointment Mapper
export function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    appointmentId: row.appointment_id,
    associationId: row.association_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    title: row.title,
    description: row.description,
    scheduledDate: row.scheduled_date,
    duration: row.duration,
    status: row.status,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
