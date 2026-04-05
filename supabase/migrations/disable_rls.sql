-- DISABLE RLS FOR TESTING - SUPER ADMIN ACCESS
-- Run this to verify it's an RLS issue

-- Disable RLS
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth_invitations DISABLE ROW LEVEL SECURITY;

-- Verify data
SELECT 'organizations' as tbl, count(*) FROM organizations
UNION ALL SELECT 'audit_requests', count(*) FROM audit_requests
UNION ALL SELECT 'profiles', count(*) FROM profiles;