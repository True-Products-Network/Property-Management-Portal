-- Complete Business Schema for Property Management Portal
-- Portal Database = Master, GHL = Sync Target
-- Date: July 31, 2026
-- FIXED VERSION - Proper table ordering

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE BUSINESS ENTITIES
-- ============================================

-- Associations (HOAs, Condominiums, etc.)
CREATE TABLE associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    association_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    legal_name TEXT,
    type TEXT NOT NULL CHECK (type IN ('Condominium', 'HOA', 'Cooperative', 'Commercial', 'Other')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'onboarding')),
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    phone TEXT,
    email TEXT,
    fiscal_year TEXT,
    annual_meeting_month TEXT,
    management_start_date DATE,
    assigned_manager_id UUID REFERENCES portal_users(id),
    ghl_company_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES portal_users(id),
    updated_by UUID REFERENCES portal_users(id)
);

CREATE INDEX idx_associations_status ON associations(status);
CREATE INDEX idx_associations_manager ON associations(assigned_manager_id);
CREATE INDEX idx_associations_ghl ON associations(ghl_company_id);

-- Properties
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id TEXT UNIQUE NOT NULL,
    association_id UUID NOT NULL REFERENCES associations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address_street TEXT NOT NULL,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    type TEXT NOT NULL CHECK (type IN ('Condominium', 'Apartment', 'Townhouse', 'Single Family', 'Commercial', 'Mixed Use')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'under_construction')),
    year_built INTEGER,
    total_units INTEGER DEFAULT 0,
    management_start_date DATE,
    access_instructions TEXT,
    emergency_notes TEXT,
    assigned_staff_id UUID REFERENCES portal_users(id),
    ghl_custom_object_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES portal_users(id),
    updated_by UUID REFERENCES portal_users(id)
);

CREATE INDEX idx_properties_association ON properties(association_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_staff ON properties(assigned_staff_id);
CREATE INDEX idx_properties_ghl ON properties(ghl_custom_object_id);

-- Units
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id TEXT UNIQUE NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    display_name TEXT,
    type TEXT CHECK (type IN ('Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4+ Bedroom', 'Penthouse', 'Loft', 'Townhouse')),
    status TEXT DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'maintenance', 'renovation')),
    square_feet INTEGER,
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    floor TEXT,
    occupancy_status TEXT CHECK (occupancy_status IN ('owner_occupied', 'tenant_occupied', 'vacant')),
    rental_status TEXT CHECK (rental_status IN ('rented', 'available', 'not_for_rent')),
    parking_spot TEXT,
    storage_unit TEXT,
    move_in_date DATE,
    move_out_date DATE,
    mailing_address TEXT,
    access_notes TEXT,
    ghl_custom_object_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES portal_users(id),
    updated_by UUID REFERENCES portal_users(id)
);

CREATE INDEX idx_units_property ON units(property_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_ghl ON units(ghl_custom_object_id);

-- ============================================
-- VENDORS (Defined before contact_roles to avoid FK error)
-- ============================================

CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    doing_business_as TEXT,
    category TEXT CHECK (category IN ('HVAC', 'Plumbing', 'Electrical', 'Landscaping', 'Cleaning', 'Security', 'Pest Control', 'Roofing', 'Painting', 'General Contracting', 'Elevator', 'Fire Safety', 'Pool Service', 'Snow Removal', 'Other')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_approval')),
    primary_contact_name TEXT,
    email TEXT,
    phone TEXT,
    emergency_phone TEXT,
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    license_number TEXT,
    insurance_expiry DATE,
    workers_comp_expiry DATE,
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    total_jobs INTEGER DEFAULT 0,
    ghl_company_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES portal_users(id),
    updated_by UUID REFERENCES portal_users(id)
);

CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_ghl ON vendors(ghl_company_id);

-- ============================================
-- CONTACTS AND ROLES
-- ============================================

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id TEXT UNIQUE NOT NULL,
    portal_user_id UUID REFERENCES portal_users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    mobile_phone TEXT,
    work_phone TEXT,
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'sms', 'mail')),
    mailing_preference TEXT CHECK (mailing_preference IN ('email', 'physical', 'both')),
    email_permission BOOLEAN DEFAULT false,
    sms_permission BOOLEAN DEFAULT false,
    mailing_address_street TEXT,
    mailing_address_city TEXT,
    mailing_address_state TEXT,
    mailing_address_zip TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    portal_invitation_status TEXT DEFAULT 'not_invited' CHECK (portal_invitation_status IN ('not_invited', 'invited', 'active', 'suspended', 'revoked')),
    portal_invited_at TIMESTAMP WITH TIME ZONE,
    ghl_contact_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES portal_users(id),
    updated_by UUID REFERENCES portal_users(id)
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_portal_user ON contacts(portal_user_id);
CREATE INDEX idx_contacts_ghl ON contacts(ghl_contact_id);

-- Contact Roles
CREATE TABLE contact_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    role_type TEXT NOT NULL CHECK (role_type IN ('owner', 'co_owner', 'tenant', 'occupant', 'board_president', 'board_treasurer', 'board_secretary', 'board_member', 'property_manager', 'assistant_manager', 'maintenance_staff', 'vendor_contact', 'emergency_contact', 'other')),
    association_id UUID REFERENCES associations(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    board_position TEXT,
    board_term_start DATE,
    board_term_end DATE,
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contact_roles_contact ON contact_roles(contact_id);
CREATE INDEX idx_contact_roles_association ON contact_roles(association_id);
CREATE INDEX idx_contact_roles_property ON contact_roles(property_id);
CREATE INDEX idx_contact_roles_unit ON contact_roles(unit_id);
CREATE INDEX idx_contact_roles_vendor ON contact_roles(vendor_id);
CREATE INDEX idx_contact_roles_type ON contact_roles(role_type);

-- Unit Occupants
CREATE TABLE unit_occupants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'co_owner', 'tenant', 'occupant')),
    is_primary BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(unit_id, contact_id, role)
);

CREATE INDEX idx_unit_occupants_unit ON unit_occupants(unit_id);
CREATE INDEX idx_unit_occupants_contact ON unit_occupants(contact_id);

-- Property-Vendor relationships
CREATE TABLE property_vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    is_preferred BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, vendor_id)
);

CREATE INDEX idx_property_vendors_property ON property_vendors(property_id);
CREATE INDEX idx_property_vendors_vendor ON property_vendors(vendor_id);

-- ============================================
-- MAINTENANCE
-- ============================================

CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_number TEXT UNIQUE NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    reported_by_contact_id UUID NOT NULL REFERENCES contacts(id),
    assigned_vendor_id UUID REFERENCES vendors(id),
    assigned_staff_id UUID REFERENCES portal_users(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('HVAC', 'Plumbing', 'Electrical', 'Appliance', 'Structural', 'Cosmetic', 'Safety', 'Cleaning', 'Landscaping', 'Other')),
    urgency TEXT CHECK (urgency IN ('emergency', 'urgent', 'normal', 'low')),
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'pending_approval', 'approved', 'vendor_assigned', 'scheduled', 'in_progress', 'on_hold', 'completed', 'closed', 'cancelled')),
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    approved_amount DECIMAL(10,2),
    requested_date DATE,
    scheduled_date DATE,
    completed_date DATE,
    vendor_notes TEXT,
    resolution_notes TEXT,
    internal_notes TEXT,
    ghl_custom_object_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES portal_users(id),
    updated_by UUID REFERENCES portal_users(id)
);

CREATE INDEX idx_maintenance_property ON maintenance_requests(property_id);
CREATE INDEX idx_maintenance_unit ON maintenance_requests(unit_id);
CREATE INDEX idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_urgency ON maintenance_requests(urgency);
CREATE INDEX idx_maintenance_vendor ON maintenance_requests(assigned_vendor_id);
CREATE INDEX idx_maintenance_reporter ON maintenance_requests(reported_by_contact_id);
CREATE INDEX idx_maintenance_ghl ON maintenance_requests(ghl_custom_object_id);

CREATE TABLE maintenance_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('status_change', 'comment', 'vendor_assigned', 'schedule_set', 'cost_updated', 'completion', 'reopen', 'file_added')),
    description TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    performed_by UUID REFERENCES portal_users(id),
    performed_by_contact UUID REFERENCES contacts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_activity_request ON maintenance_activity(maintenance_request_id);

-- ============================================
-- INSPECTIONS
-- ============================================

CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id TEXT UNIQUE NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    inspection_type TEXT NOT NULL CHECK (inspection_type IN ('annual', 'move_in', 'move_out', 'fire_safety', 'elevator', 'hvac', 'roof', 'pool', 'emergency_systems', 'insurance', 'other')),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'overdue', 'cancelled', 'rescheduled')),
    scheduled_date DATE,
    scheduled_time TIME,
    completed_date DATE,
    inspector_id UUID REFERENCES contacts(id),
    inspector_vendor_id UUID REFERENCES vendors(id),
    findings TEXT,
    recommendations TEXT,
    overall_rating TEXT CHECK (overall_rating IN ('excellent', 'good', 'fair', 'poor', 'critical')),
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_maintenance_id UUID REFERENCES maintenance_requests(id),
    ghl_custom_object_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES portal_users(id),
    updated_by UUID REFERENCES portal_users(id)
);

CREATE INDEX idx_inspections_property ON inspections(property_id);
CREATE INDEX idx_inspections_unit ON inspections(unit_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_inspections_type ON inspections(inspection_type);
CREATE INDEX idx_inspections_ghl ON inspections(ghl_custom_object_id);

-- ============================================
-- DOCUMENTS
-- ============================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    content_type TEXT,
    document_type TEXT CHECK (document_type IN ('insurance', 'financial', 'legal', 'meeting_minutes', 'contract', 'inspection_report', 'certificate', 'policy', 'notice', 'other')),
    category TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'expired')),
    issue_date DATE,
    expiry_date DATE,
    association_id UUID REFERENCES associations(id),
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    contact_id UUID REFERENCES contacts(id),
    maintenance_request_id UUID REFERENCES maintenance_requests(id),
    inspection_id UUID REFERENCES inspections(id),
    is_confidential BOOLEAN DEFAULT false,
    requires_acknowledgment BOOLEAN DEFAULT false,
    uploaded_by UUID NOT NULL REFERENCES portal_users(id),
    ghl_document_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_association ON documents(association_id);
CREATE INDEX idx_documents_property ON documents(property_id);
CREATE INDEX idx_documents_unit ON documents(unit_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_expiry ON documents(expiry_date);
CREATE INDEX idx_documents_ghl ON documents(ghl_document_id);

CREATE TABLE document_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    UNIQUE(document_id, contact_id)
);

CREATE INDEX idx_doc_ack_document ON document_acknowledgments(document_id);
CREATE INDEX idx_doc_ack_contact ON document_acknowledgments(contact_id);

-- ============================================
-- COMPLIANCE
-- ============================================

CREATE TABLE compliance_matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id TEXT UNIQUE NOT NULL,
    association_id UUID NOT NULL REFERENCES associations(id),
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('fire_safety', 'elevator', 'accessibility', 'environmental', 'zoning', 'licensing', 'insurance', 'financial', 'other')),
    priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'notice_issued', 'evidence_gathering', 'hearing_scheduled', 'under_review', 'decision_pending', 'resolved', 'closed', 'appealed')),
    identified_date DATE,
    due_date DATE,
    resolved_date DATE,
    assigned_to UUID REFERENCES portal_users(id),
    resolution_notes TEXT,
    fine_amount DECIMAL(10,2),
    ghl_custom_object_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES portal_users(id),
    updated_by UUID REFERENCES portal_users(id)
);

CREATE INDEX idx_compliance_association ON compliance_matters(association_id);
CREATE INDEX idx_compliance_property ON compliance_matters(property_id);
CREATE INDEX idx_compliance_status ON compliance_matters(status);
CREATE INDEX idx_compliance_priority ON compliance_matters(priority);
CREATE INDEX idx_compliance_due ON compliance_matters(due_date);
CREATE INDEX idx_compliance_ghl ON compliance_matters(ghl_custom_object_id);

-- ============================================
-- APPROVALS
-- ============================================

CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_id TEXT UNIQUE NOT NULL,
    association_id UUID NOT NULL REFERENCES associations(id),
    title TEXT NOT NULL,
    description TEXT,
    approval_type TEXT CHECK (approval_type IN ('maintenance', 'capital_improvement', 'vendor_contract', 'budget_item', 'policy_change', 'assessment', 'other')),
    requested_amount DECIMAL(10,2),
    approved_amount DECIMAL(10,2),
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'under_review', 'approved', 'rejected', 'deferred', 'escalated', 'withdrawn')),
    requested_by UUID NOT NULL REFERENCES portal_users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES portal_users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    denial_reason TEXT,
    denied_by UUID REFERENCES portal_users(id),
    denied_at TIMESTAMP WITH TIME ZONE,
    maintenance_request_id UUID REFERENCES maintenance_requests(id),
    vendor_id UUID REFERENCES vendors(id),
    ghl_opportunity_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approvals_association ON approvals(association_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_requester ON approvals(requested_by);
CREATE INDEX idx_approvals_ghl ON approvals(ghl_opportunity_id);

CREATE TABLE approval_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_id UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES portal_users(id),
    vote TEXT NOT NULL CHECK (vote IN ('approve', 'reject', 'abstain')),
    comments TEXT,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(approval_id, voter_id)
);

CREATE INDEX idx_approval_votes_approval ON approval_votes(approval_id);

-- ============================================
-- COMMUNICATIONS
-- ============================================

CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    communication_id TEXT UNIQUE NOT NULL,
    association_id UUID NOT NULL REFERENCES associations(id),
    subject TEXT NOT NULL,
    content TEXT,
    type TEXT CHECK (type IN ('announcement', 'notice', 'reminder', 'alert', 'newsletter')),
    send_to_all BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES portal_users(id),
    sent_by UUID REFERENCES portal_users(id),
    ghl_message_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_communications_association ON communications(association_id);
CREATE INDEX idx_communications_status ON communications(status);
CREATE INDEX idx_communications_ghl ON communications(ghl_message_id);

CREATE TABLE communication_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    communication_id UUID NOT NULL REFERENCES communications(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id),
    sent_via TEXT CHECK (sent_via IN ('email', 'sms', 'portal')),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(communication_id, contact_id)
);

CREATE INDEX idx_comm_recipients_comm ON communication_recipients(communication_id);
CREATE INDEX idx_comm_recipients_contact ON communication_recipients(contact_id);

-- ============================================
-- PAYMENTS
-- ============================================

CREATE TABLE payment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id TEXT UNIQUE NOT NULL,
    association_id UUID NOT NULL REFERENCES associations(id),
    contact_id UUID NOT NULL REFERENCES contacts(id),
    unit_id UUID REFERENCES units(id),
    payment_type TEXT CHECK (payment_type IN ('assessment', 'special_assessment', 'late_fee', 'fine', 'vendor_payment', 'deposit', 'other')),
    amount DECIMAL(10,2) NOT NULL,
    processor TEXT NOT NULL CHECK (processor IN ('stripe', 'paypal')),
    processor_transaction_id TEXT,
    processor_customer_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'disputed')),
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    payment_method_type TEXT CHECK (payment_method_type IN ('card', 'bank_transfer', 'paypal')),
    payment_method_last4 TEXT,
    invoice_number TEXT,
    maintenance_request_id UUID REFERENCES maintenance_requests(id),
    approval_id UUID REFERENCES approvals(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES portal_users(id)
);

CREATE INDEX idx_payments_association ON payment_records(association_id);
CREATE INDEX idx_payments_contact ON payment_records(contact_id);
CREATE INDEX idx_payments_status ON payment_records(status);
CREATE INDEX idx_payments_processor ON payment_records(processor_transaction_id);

CREATE TABLE association_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    association_id UUID NOT NULL REFERENCES associations(id),
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('operating', 'reserve', 'special', 'escrow')),
    institution TEXT,
    account_number_last4 TEXT,
    routing_number_last4 TEXT,
    current_balance DECIMAL(12,2),
    balance_updated_at TIMESTAMP WITH TIME ZONE,
    processor_account_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_accounts_association ON association_accounts(association_id);

-- ============================================
-- CALENDAR/APPOINTMENTS
-- ============================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id TEXT UNIQUE NOT NULL,
    association_id UUID NOT NULL REFERENCES associations(id),
    title TEXT NOT NULL,
    description TEXT,
    appointment_type TEXT CHECK (appointment_type IN ('maintenance', 'inspection', 'meeting', 'showing', 'vendor_visit', 'other')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    is_virtual BOOLEAN DEFAULT false,
    virtual_link TEXT,
    property_id UUID REFERENCES properties(id),
    unit_id UUID REFERENCES units(id),
    maintenance_request_id UUID REFERENCES maintenance_requests(id),
    inspection_id UUID REFERENCES inspections(id),
    organizer_id UUID NOT NULL REFERENCES portal_users(id),
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    ghl_calendar_event_id TEXT,
    ghl_appointment_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appointments_association ON appointments(association_id);
CREATE INDEX idx_appointments_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE TABLE appointment_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    user_id UUID REFERENCES portal_users(id),
    role TEXT CHECK (role IN ('organizer', 'attendee', 'optional')),
    accepted BOOLEAN,
    responded_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX idx_apt_participants_unique_contact ON appointment_participants(appointment_id, contact_id) WHERE contact_id IS NOT NULL;
CREATE UNIQUE INDEX idx_apt_participants_unique_user ON appointment_participants(appointment_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_apt_participants_appointment ON appointment_participants(appointment_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_occupants ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE communication_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE association_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_participants ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_roles.user_id = $1 
        AND user_roles.role = 'ADMIN_USER'
        AND user_roles.revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_association_ids(user_id UUID)
RETURNS TABLE(association_id TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ur.association_id
    FROM user_roles ur
    WHERE ur.user_id = $1
    AND ur.association_id IS NOT NULL
    AND ur.revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Users can view their associations" ON associations
    FOR SELECT USING (
        id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage associations" ON associations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('ADMIN_USER', 'MANAGEMENT_STAFF')
            AND (association_id = associations.id::TEXT OR association_id IS NULL)
            AND revoked_at IS NULL
        )
    );

CREATE POLICY "Users can view properties in their associations" ON properties
    FOR SELECT USING (
        association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage properties" ON properties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('ADMIN_USER', 'MANAGEMENT_STAFF')
            AND (association_id = properties.association_id::TEXT OR association_id IS NULL)
            AND revoked_at IS NULL
        )
    );

CREATE POLICY "Users can view units in their associations" ON units
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE association_id::TEXT IN (SELECT get_user_association_ids(auth.uid()))
        )
        OR is_admin_user(auth.uid())
    );

CREATE POLICY "Management can manage units" ON units
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN properties p ON p.association_id::TEXT = ur.association_id
            WHERE ur.user_id = auth.uid()
            AND p.id = units.property_id
            AND ur.role IN ('ADMIN_USER', 'MANAGEMENT_STAFF')
            AND ur.revoked_at IS NULL
        )
    );
