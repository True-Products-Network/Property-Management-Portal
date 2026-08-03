-- Fix: Create platform roles enum and update references
-- Date: August 3, 2026
--
-- This migration handles the case where portal_role enum doesn't exist
-- or doesn't have the platform admin values

-- ============================================
-- STEP 1: Check if portal_role enum exists and create if not
-- ============================================

DO $$
BEGIN
    -- Check if portal_role type exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'portal_role'
    ) THEN
        -- Create the enum with all values
        CREATE TYPE portal_role AS ENUM (
            'PLATFORM_ADMIN',
            'PLATFORM_SUPPORT',
            'ADMIN_USER',
            'MANAGEMENT_STAFF',
            'OWNER',
            'RESIDENT',
            'BOARD_MEMBER',
            'VENDOR'
        );
        
        RAISE NOTICE 'Created portal_role enum';
    ELSE
        -- Enum exists, try to add values individually
        BEGIN
            ALTER TYPE portal_role ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'PLATFORM_ADMIN already exists';
        END;
        
        BEGIN
            ALTER TYPE portal_role ADD VALUE IF NOT EXISTS 'PLATFORM_SUPPORT';
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'PLATFORM_SUPPORT already exists';
        END;
    END IF;
END $$;

-- ============================================
-- STEP 2: Create a separate enum for platform roles if needed
-- ============================================

-- Create platform_role type for system-level roles
DROP TYPE IF EXISTS platform_role CASCADE;
CREATE TYPE platform_role AS ENUM (
    'PLATFORM_ADMIN',
    'PLATFORM_SUPPORT'
);

-- ============================================
-- STEP 3: Create platform_user_roles table
-- ============================================

CREATE TABLE IF NOT EXISTS platform_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role platform_role NOT NULL,
    
    -- Metadata
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_platform_user_roles_user ON platform_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_user_roles_role ON platform_user_roles(role);

-- Enable RLS
ALTER TABLE platform_user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Update helper functions to use platform_user_roles
-- ============================================

-- Drop existing functions to recreate
DROP FUNCTION IF EXISTS is_platform_admin();
DROP FUNCTION IF EXISTS is_platform_support();

-- Check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM platform_user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'PLATFORM_ADMIN'
        AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is platform support (includes admins)
CREATE OR REPLACE FUNCTION is_platform_support()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM platform_user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('PLATFORM_ADMIN', 'PLATFORM_SUPPORT')
        AND revoked_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Update RLS policies to use correct functions
-- ============================================

-- Update tenants policy
DROP POLICY IF EXISTS tenants_platform_admin ON tenants;
CREATE POLICY tenants_platform_admin ON tenants
    FOR ALL USING (
        is_platform_admin()
    );

-- Update tenant_users policy
DROP POLICY IF EXISTS tenant_users_platform_admin ON tenant_users;
CREATE POLICY tenant_users_platform_admin ON tenant_users
    FOR ALL USING (
        is_platform_admin()
    );

-- Update plans policy
DROP POLICY IF EXISTS plans_platform_admin ON plans;
CREATE POLICY plans_platform_admin ON plans
    FOR ALL USING (
        is_platform_admin()
    );

-- Update features policy
DROP POLICY IF EXISTS features_platform_admin ON features;
CREATE POLICY features_platform_admin ON features
    FOR ALL USING (
        is_platform_admin()
    );

-- Update plan_features policy
DROP POLICY IF EXISTS plan_features_platform_admin ON plan_features;
CREATE POLICY plan_features_platform_admin ON plan_features
    FOR ALL USING (
        is_platform_admin()
    );

-- Update tenant_subscriptions policy
DROP POLICY IF EXISTS tenant_subscriptions_platform_admin ON tenant_subscriptions;
CREATE POLICY tenant_subscriptions_platform_admin ON tenant_subscriptions
    FOR ALL USING (
        is_platform_admin()
    );

-- Update tenant_entitlements policy
DROP POLICY IF EXISTS tenant_entitlements_platform_admin ON tenant_entitlements;
CREATE POLICY tenant_entitlements_platform_admin ON tenant_entitlements
    FOR ALL USING (
        is_platform_admin()
    );

-- Update platform_audit_events policy
DROP POLICY IF EXISTS platform_audit_platform_admin ON platform_audit_events;
CREATE POLICY platform_audit_platform_admin ON platform_audit_events
    FOR ALL USING (
        is_platform_support()
    );

-- Update support_access_sessions policy
DROP POLICY IF EXISTS support_sessions_platform_admin ON support_access_sessions;
CREATE POLICY support_sessions_platform_admin ON support_access_sessions
    FOR ALL USING (
        is_platform_support()
    );

-- Update billing_events policy
DROP POLICY IF EXISTS billing_events_platform_admin ON billing_events;
CREATE POLICY billing_events_platform_admin ON billing_events
    FOR ALL USING (
        is_platform_admin()
    );

-- ============================================
-- STEP 6: Create RLS policy for platform_user_roles
-- ============================================

CREATE POLICY platform_user_roles_admin ON platform_user_roles
    FOR ALL USING (
        is_platform_admin()
    );

-- ============================================
-- STEP 7: Create trigger for platform role changes
-- ============================================

CREATE OR REPLACE FUNCTION log_platform_role_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO platform_audit_events (
            actor_id,
            actor_type,
            action,
            action_category,
            target_type,
            target_id,
            new_value
        )
        VALUES (
            auth.uid(),
            'platform_admin',
            'platform_role_granted',
            'security',
            'platform_user_role',
            NEW.id::TEXT,
            jsonb_build_object(
                'user_id', NEW.user_id,
                'role', NEW.role,
                'granted_by', NEW.granted_by
            )
        );
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' AND NEW.revoked_at IS NOT NULL AND OLD.revoked_at IS NULL THEN
        INSERT INTO platform_audit_events (
            actor_id,
            actor_type,
            action,
            action_category,
            target_type,
            target_id,
            previous_value,
            new_value
        )
        VALUES (
            auth.uid(),
            'platform_admin',
            'platform_role_revoked',
            'security',
            'platform_user_role',
            NEW.id::TEXT,
            jsonb_build_object(
                'user_id', OLD.user_id,
                'role', OLD.role,
                'granted_at', OLD.granted_at
            ),
            jsonb_build_object(
                'revoked_at', NEW.revoked_at
            )
        );
        RETURN NEW;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_platform_role_changes ON platform_user_roles;
CREATE TRIGGER log_platform_role_changes
    AFTER INSERT OR UPDATE ON platform_user_roles
    FOR EACH ROW
    EXECUTE FUNCTION log_platform_role_change();

-- ============================================
-- STEP 8: Seed initial platform admin (if needed)
-- ============================================

-- Note: This would typically be done manually or via a separate secure process
-- Leaving empty for manual configuration

-- ============================================
-- MIGRATION COMPLETION LOG
-- ============================================

INSERT INTO platform_audit_events (
    actor_id,
    actor_type,
    action,
    action_category,
    target_type,
    target_id,
    reason,
    new_value
)
SELECT 
    auth.uid(),
    'system',
    'enum_fix_migration_completed',
    'security',
    'migration',
    '20260803_fix_enum_roles',
    'Fixed portal_role enum and created platform_user_roles table',
    jsonb_build_object(
        'actions', ARRAY[
            'Created platform_role enum',
            'Created platform_user_roles table',
            'Updated helper functions',
            'Updated RLS policies'
        ],
        'timestamp', NOW()
    )
WHERE auth.uid() IS NOT NULL;
