-- ============================================
-- FIX RLS POLICIES FOR SUPER ADMIN
-- ============================================

-- Organizations: allow super admin full access
DROP POLICY IF EXISTS "Allow public read" ON organizations;
DROP POLICY IF EXISTS "Allow authenticated read" ON organizations;

CREATE POLICY "org_super_admin_all"
ON organizations
FOR ALL
TO public
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Audit Requests: allow super admin full access
DROP POLICY IF EXISTS "Allow read audit_requests" ON audit_requests;
DROP POLICY IF EXISTS "Allow insert audit_requests" ON audit_requests;

CREATE POLICY "audit_super_admin_all"
ON audit_requests
FOR ALL
TO public
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Profiles: allow super admin full access
DROP POLICY IF EXISTS "profiles_read_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

CREATE POLICY "profiles_super_admin_all"
ON profiles
FOR ALL
TO public
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Auth Invitations: allow super admin full access
DROP POLICY IF EXISTS "auth_invitations_read" ON auth_invitations;
DROP POLICY IF EXISTS "auth_invitations_insert" ON auth_invitations;

CREATE POLICY "invitations_super_admin_all"
ON auth_invitations
FOR ALL
TO public
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Anonymous users can also submit audit requests (no auth required)
CREATE POLICY "audit_anonymous_insert"
ON audit_requests
FOR INSERT
TO anon
WITH CHECK (true);

-- ============================================
-- VERIFY TABLES
-- ============================================
SELECT 'organizations' as tbl, count(*) as rows FROM organizations
UNION ALL
SELECT 'audit_requests', count(*) FROM audit_requests
UNION ALL
SELECT 'profiles', count(*) FROM profiles
UNION ALL
SELECT 'auth_invitations', count(*) FROM auth_invitations;