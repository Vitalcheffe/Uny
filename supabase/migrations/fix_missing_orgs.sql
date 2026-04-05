-- Create organizations for approved audits that don't have one yet
INSERT INTO organizations (name, plan, status, created_at)
SELECT a.company_name, 'starter', 'active', a.created_at
FROM audit_requests a
LEFT JOIN organizations o ON a.company_name = o.name
WHERE a.status = 'approved' AND o.id IS NULL;