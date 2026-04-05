-- Create organizations from previously approved audit requests (simple version)
INSERT INTO organizations (name)
SELECT company_name
FROM audit_requests
WHERE status = 'approved'
AND company_name NOT IN (SELECT name FROM organizations);