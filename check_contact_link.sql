-- Check contacts table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'contacts'
ORDER BY ordinal_position;

-- Check if there's a contact with this GHL ID
SELECT id, ghl_contact_id, first_name, last_name, email
FROM contacts
WHERE ghl_contact_id = 'GHL-1786034109587';

-- Check all contacts for this email
SELECT id, ghl_contact_id, first_name, last_name, email
FROM contacts
WHERE email = 'nigel.lear+admin@me.com';
