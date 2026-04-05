-- Create organizations from previously approved audit requests
INSERT INTO organizations (name, plan, sector, team_size)
SELECT company_name, 'Free', sector, size
FROM audit_requests
WHERE status = 'approved'
AND company_name NOT IN (SELECT name FROM organizations);