-- Minimal test to see if we can create any table
CREATE TABLE IF NOT EXISTS test_user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    role_id UUID NOT NULL
);
