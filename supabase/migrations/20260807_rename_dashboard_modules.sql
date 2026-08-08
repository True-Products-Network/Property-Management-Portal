-- Rename Dashboard modules for clarity
-- Portfolio = multi-association view (was "dashboard")
-- Dashboard = association-level view (was "association_dashboard")

-- ============================================
-- STEP 1: Rename existing dashboard module to portfolio
-- ============================================

UPDATE roles
SET permissions = (
    SELECT jsonb_agg(
        CASE 
            WHEN perm->>'module' = 'dashboard' THEN
                jsonb_set(perm, '{module}', '"portfolio"')
            ELSE perm
        END
    )
    FROM jsonb_array_elements(permissions) AS perm
)
WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements(permissions) AS perm
    WHERE perm->>'module' = 'dashboard'
);

-- ============================================
-- STEP 2: Add portfolio module to roles that should have it
-- ============================================

-- Portfolio Manager gets portfolio view
UPDATE roles
SET permissions = permissions || '[
  {
    "module": "portfolio",
    "read": true,
    "write": false,
    "delete": false,
    "approve": false
  }
]'::jsonb
WHERE name = 'PORTFOLIO_MANAGER'
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(permissions) AS perm
  WHERE perm->>'module' = 'portfolio'
);

-- Business Admin gets portfolio view
UPDATE roles
SET permissions = permissions || '[
  {
    "module": "portfolio",
    "read": true,
    "write": true,
    "delete": false,
    "approve": true
  }
]'::jsonb
WHERE name = 'ADMIN_USER'
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(permissions) AS perm
  WHERE perm->>'module' = 'portfolio'
);

-- ============================================
-- STEP 3: Update association_dashboard to dashboard
-- ============================================

UPDATE roles
SET permissions = (
    SELECT jsonb_agg(
        CASE 
            WHEN perm->>'module' = 'association_dashboard' THEN
                jsonb_set(perm, '{module}', '"dashboard"')
            ELSE perm
        END
    )
    FROM jsonb_array_elements(permissions) AS perm
)
WHERE EXISTS (
    SELECT 1 FROM jsonb_array_elements(permissions) AS perm
    WHERE perm->>'module' = 'association_dashboard'
);

-- ============================================
-- STEP 4: Add dashboard module to appropriate roles
-- ============================================

-- Association Manager gets dashboard
UPDATE roles
SET permissions = permissions || '[
  {
    "module": "dashboard",
    "read": true,
    "write": false,
    "delete": false,
    "approve": false
  }
]'::jsonb
WHERE name = 'ASSOCIATION_MANAGER'
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(permissions) AS perm
  WHERE perm->>'module' = 'dashboard'
);

-- Property Manager gets dashboard
UPDATE roles
SET permissions = permissions || '[
  {
    "module": "dashboard",
    "read": true,
    "write": false,
    "delete": false,
    "approve": false
  }
]'::jsonb
WHERE name = 'PROPERTY_MANAGER'
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(permissions) AS perm
  WHERE perm->>'module' = 'dashboard'
);

-- Board Member gets dashboard
UPDATE roles
SET permissions = permissions || '[
  {
    "module": "dashboard",
    "read": true,
    "write": false,
    "delete": false,
    "approve": false
  }
]'::jsonb
WHERE name = 'BOARD_MEMBER'
AND NOT EXISTS (
  SELECT 1 FROM jsonb_array_elements(permissions) AS perm
  WHERE perm->>'module' = 'dashboard'
);
