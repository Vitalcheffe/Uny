-- Fix column names check for audit_requests
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'audit_requests';