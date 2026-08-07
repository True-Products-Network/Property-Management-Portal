-- Add association_dashboard module to portal_roles permissions
-- This allows admins to control access to the Association Dashboard via roles/permissions

-- Update ASSOCIATION_MANAGER role to include association_dashboard permission
UPDATE portal_roles
SET permissions = permissions || '[
  {
    "module": "association_dashboard",
    "read": true,
    "write": false,
    "delete": false,
    "approve": false
  }
]'::jsonb
WHERE name = 'ASSOCIATION_MANAGER'
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(permissions) AS perm
  WHERE perm->>'module' = 'association_dashboard'
);

-- Update PORTFOLIO_MANAGER role to include association_dashboard permission
UPDATE portal_roles
SET permissions = permissions || '[
  {
    "module": "association_dashboard",
    "read": true,
    "write": false,
    "delete": false,
    "approve": false
  }
]'::jsonb
WHERE name = 'PORTFOLIO_MANAGER'
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(permissions) AS perm
  WHERE perm->>'module' = 'association_dashboard'
);

-- Update ADMIN_USER role to include association_dashboard permission
UPDATE portal_roles
SET permissions = permissions || '[
  {
    "module": "association_dashboard",
    "read": true,
    "write": true,
    "delete": true,
    "approve": true
  }
]'::jsonb
WHERE name = 'ADMIN_USER'
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(permissions) AS perm
  WHERE perm->>'module' = 'association_dashboard'
);

-- Update PROPERTY_MANAGER role to include association_dashboard permission
UPDATE portal_roles
SET permissions = permissions || '[
  {
    "module": "association_dashboard",
    "read": true,
    "write": false,
    "delete": false,
    "approve": false
  }
]'::jsonb
WHERE name = 'PROPERTY_MANAGER'
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(permissions) AS perm
  WHERE perm->>'module' = 'association_dashboard'
);

-- Update BOARD_MEMBER role to include association_dashboard permission (read-only)
UPDATE portal_roles
SET permissions = permissions || '[
  {
    "module": "association_dashboard",
    "read": true,
    "write": false,
    "delete": false,
    "approve": false
  }
]'::jsonb
WHERE name = 'BOARD_MEMBER'
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(permissions) AS perm
  WHERE perm->>'module' = 'association_dashboard'
);
