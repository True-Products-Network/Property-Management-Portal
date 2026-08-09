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
    shortName: row.short_name,
    legalName: row.legal_name,
    type: row.type,
    status: row.status,
    addressStreet: row.address_street,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZip: row.address_zip,
    mailingAddress: row.mailing_address,
    phone: row.phone,
    email: row.email,
    taxId: row.tax_id,
    fiscalYear: row.fiscal_year,
    fiscalYearEndMonth: row.fiscal_year_end_month,
    fiscalYearEndDay: row.fiscal_year_end_day,
    annualMeetingMonth: row.annual_meeting_month,
    managementStartDate: row.management_start_date,
    assignedManagerId: row.assigned_manager_id,
    assignedManagerName: row.contacts ? `${row.contacts.first_name} ${row.contacts.last_name}` : undefined,
    financialPlatform: row.financial_platform,
    financialPortalLink: row.financial_portal_link,
    documentStorageLink: row.document_storage_link,
    emergencyInstructions: row.emergency_instructions,
    generalNotes: row.general_notes,
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
    associationName: row.associations?.name,
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
    photoUrl: row.photo_url,
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
    unitNumber: row.unit_number,
    displayName: row.display_name,
    type: row.type,
    status: row.status,
    squareFeet: row.square_feet,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    floor: row.floor,
    occupancyStatus: row.occupancy_status,
    rentalStatus: row.rental_status,
    parkingSpot: row.parking_spot,
    storageUnit: row.storage_unit,
    moveInDate: row.move_in_date,
    moveOutDate: row.move_out_date,
    mailingAddress: row.mailing_address,
    accessNotes: row.access_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Contact Mapper
export function mapContact(row: any): Contact {
  return {
    id: row.id,
    contactId: row.contact_id,
    portalUserId: row.portal_user_id,
    associationId: row.association_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    mobilePhone: row.mobile_phone,
    workPhone: row.work_phone,
    preferredContactMethod: row.preferred_contact_method,
    mailingPreference: row.mailing_preference,
    emailPermission: row.email_permission,
    smsPermission: row.sms_permission,
    mailingAddressStreet: row.mailing_address_street,
    mailingAddressCity: row.mailing_address_city,
    mailingAddressState: row.mailing_address_state,
    mailingAddressZip: row.mailing_address_zip,
    emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
    emergencyContactRelationship: row.emergency_contact_relationship,
    portalInvitationStatus: row.portal_invitation_status,
    portalInvitedAt: row.portal_invited_at,
    allowLogin: row.allow_login,
    roles: row.contact_roles?.map((r: any) => r.role_type) || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Maintenance Request Mapper
export function mapMaintenanceRequest(row: any): MaintenanceRequest {
  return {
    id: row.id,
    requestNumber: row.request_number,
    propertyId: row.property_id,
    propertyName: row.properties?.name,
    unitId: row.unit_id,
    unitName: row.unit_name || (row.unit_id ? `Unit ${row.units?.unit_number || ''}` : "Common Area"),
    reportedByContactId: row.reported_by_contact_id,
    reportedByName: row.reported_by_name || (row.reported_by_contact ? `${row.reported_by_contact.first_name || ''} ${row.reported_by_contact.last_name || ''}`.trim() : "Unknown"),
    submittedByName: row.submitted_by_name || "System",
    assignedVendorId: row.assigned_vendor_id,
    assignedStaffId: row.assigned_staff_id,
    title: row.title,
    description: row.description,
    category: row.category,
    urgency: row.urgency,
    status: row.status,
    estimatedCost: row.estimated_cost,
    actualCost: row.actual_cost,
    approvedAmount: row.approved_amount,
    requestedDate: row.requested_date,
    scheduledDate: row.scheduled_date,
    completedDate: row.completed_date,
    vendorNotes: row.vendor_notes,
    resolutionNotes: row.resolution_notes,
    internalNotes: row.internal_notes,
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
    doingBusinessAs: row.doing_business_as,
    category: row.category,
    status: row.status,
    primaryContactName: row.primary_contact_name,
    email: row.email,
    phone: row.phone,
    emergencyPhone: row.emergency_phone,
    addressStreet: row.address_street,
    addressCity: row.address_city,
    addressState: row.address_state,
    addressZip: row.address_zip,
    licenseNumber: row.license_number,
    insuranceExpiry: row.insurance_expiry,
    workersCompExpiry: row.workers_comp_expiry,
    rating: row.rating,
    totalJobs: row.total_jobs,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Inspection Mapper
export function mapInspection(row: any): Inspection {
  return {
    id: row.id,
    inspectionId: row.inspection_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    inspectionType: row.inspection_type,
    status: row.status,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    completedDate: row.completed_date,
    inspectorId: row.inspector_id,
    inspectorVendorId: row.inspector_vendor_id,
    findings: row.findings,
    recommendations: row.recommendations,
    overallRating: row.overall_rating,
    followUpRequired: row.follow_up_required,
    followUpMaintenanceId: row.follow_up_maintenance_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Document Mapper
export function mapDocument(row: any): Document {
  return {
    id: row.id,
    documentId: row.document_id,
    title: row.title,
    fileName: row.file_name,
    filePath: row.file_path,
    fileSize: row.file_size,
    contentType: row.content_type,
    documentType: row.document_type,
    category: row.category,
    status: row.status,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    associationId: row.association_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    contactId: row.contact_id,
    maintenanceRequestId: row.maintenance_request_id,
    inspectionId: row.inspection_id,
    isConfidential: row.is_confidential,
    requiresAcknowledgment: row.requires_acknowledgment,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Compliance Matter Mapper
export function mapComplianceMatter(row: any): ComplianceMatter {
  return {
    id: row.id,
    matterId: row.matter_id,
    associationId: row.association_id,
    propertyId: row.property_id,
    unitId: row.unit_id,
    title: row.title,
    description: row.description,
    category: row.category,
    priority: row.priority,
    status: row.status,
    identifiedDate: row.identified_date,
    dueDate: row.due_date,
    resolvedDate: row.resolved_date,
    assignedTo: row.assigned_to,
    resolutionNotes: row.resolution_notes,
    fineAmount: row.fine_amount,
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
    title: row.title,
    description: row.description,
    approvalType: row.approval_type,
    requestedAmount: row.requested_amount,
    approvedAmount: row.approved_amount,
    status: row.status,
    requestedBy: row.requested_by,
    requestedAt: row.requested_at,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    denialReason: row.denial_reason,
    deniedBy: row.denied_by,
    deniedAt: row.denied_at,
    maintenanceRequestId: row.maintenance_request_id,
    vendorId: row.vendor_id,
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
    paymentType: row.payment_type,
    amount: row.amount,
    processor: row.processor,
    processorTransactionId: row.processor_transaction_id,
    processorCustomerId: row.processor_customer_id,
    status: row.status,
    initiatedAt: row.initiated_at,
    completedAt: row.completed_at,
    paymentMethodType: row.payment_method_type,
    paymentMethodLast4: row.payment_method_last4,
    invoiceNumber: row.invoice_number,
    maintenanceRequestId: row.maintenance_request_id,
    approvalId: row.approval_id,
    createdAt: row.created_at,
  };
}

// Communication Mapper
export function mapCommunication(row: any): Communication {
  return {
    id: row.id,
    communicationId: row.communication_id,
    associationId: row.association_id,
    subject: row.subject,
    content: row.content,
    type: row.type,
    sendToAll: row.send_to_all,
    status: row.status,
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    createdBy: row.created_by,
    sentBy: row.sent_by,
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
    title: row.title,
    description: row.description,
    appointmentType: row.appointment_type,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    isVirtual: row.is_virtual,
    virtualLink: row.virtual_link,
    propertyId: row.property_id,
    unitId: row.unit_id,
    maintenanceRequestId: row.maintenance_request_id,
    inspectionId: row.inspection_id,
    organizerId: row.organizer_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
