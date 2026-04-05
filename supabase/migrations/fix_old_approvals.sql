-- Create organizations from previously approved audit requests
INSERT INTO organizations (name, subscription_tier, subscription_status)
SELECT company_name, 'Free', 'active'
FROM audit_requests
WHERE status = 'approved'
AND company_name NOT IN (SELECT name FROM organizations);