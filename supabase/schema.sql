-- Supabase Database Schema for Property Management Portal
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Status Enum
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED', 'PENDING_INVITE');

-- Portal Role Enum
CREATE TYPE portal_role AS ENUM ('ADMIN_USER', 'MANAGEMENT_STAFF', 'OWNER', 'RESIDENT', 'BOARD_MEMBER', 'VENDOR');

-- Portal Users Table (extends Supabase Auth users)
CREATE TABLE portal_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    ghl_contact_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    status user_status DEFAULT 'ACTIVE',
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles Table
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
    role portal_role NOT NULL,
    association_id TEXT,
    property_id TEXT,
    unit_id TEXT,
    vendor_id TEXT,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by TEXT,
    revoked_at TIMESTAMP WITH TIME ZONE,
    is_primary BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_association ON user_roles(association_id);

-- User Preferences Table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Idempotency Keys Table
CREATE TABLE idempotency_keys (
    key TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_idempotency_keys_expires ON idempotency_keys(expires_at);

-- Correlation Records Table
CREATE TABLE correlation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correlation_id TEXT UNIQUE NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    request JSONB NOT NULL,
    response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_correlation_correlation_id ON correlation_records(correlation_id);
CREATE INDEX idx_correlation_created ON correlation_records(created_at);

-- Integration Events Table
CREATE TABLE integration_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL,
    payload JSONB,
    error JSONB,
    correlation_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_integration_provider_type ON integration_events(provider, event_type);
CREATE INDEX idx_integration_created ON integration_events(created_at);

-- Audit Events Table
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT UNIQUE NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actor_id TEXT NOT NULL,
    role TEXT NOT NULL,
    association_id TEXT,
    record_type TEXT,
    record_id TEXT,
    action TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    correlation_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    reason TEXT
);

CREATE INDEX idx_audit_actor ON audit_events(actor_id);
CREATE INDEX idx_audit_occurred ON audit_events(occurred_at);
CREATE INDEX idx_audit_association ON audit_events(association_id);
CREATE INDEX idx_audit_action ON audit_events(action);

-- File References Table
CREATE TABLE file_references (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name TEXT NOT NULL,
    storage_key TEXT UNIQUE NOT NULL,
    content_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    association_id TEXT NOT NULL,
    related_type TEXT,
    related_id TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    scan_status TEXT DEFAULT 'pending',
    ghl_document_id TEXT
);

CREATE INDEX idx_files_association ON file_references(association_id);
CREATE INDEX idx_files_related ON file_references(related_type, related_id);
CREATE INDEX idx_files_uploaded ON file_references(uploaded_at);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_references ENABLE ROW LEVEL SECURITY;

-- Portal Users RLS
CREATE POLICY "Users can view own profile" ON portal_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON portal_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN_USER'
        )
    );

-- User Roles RLS
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN_USER'
        )
    );

-- User Preferences RLS
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (user_id = auth.uid());

-- Audit Events RLS
CREATE POLICY "Users can view audit events for their associations" ON audit_events
    FOR SELECT USING (
        actor_id = auth.uid()::text OR
        association_id IN (
            SELECT association_id FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all audit events" ON audit_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'ADMIN_USER'
        )
    );

-- File References RLS
CREATE POLICY "Users can view files for their associations" ON file_references
    FOR SELECT USING (
        association_id IN (
            SELECT association_id FROM user_roles 
            WHERE user_id = auth.uid()
        )
    );

-- Functions

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger
CREATE TRIGGER update_portal_users_updated_at BEFORE UPDATE ON portal_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
