-- ============================================
-- PROPER RLS POLICIES FOR UNY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "org_super_admin_all" ON organizations;
DROP POLICY IF EXISTS "audit_super_admin_all" ON audit_requests;
DROP POLICY IF EXISTS "profiles_super_admin_all" ON profiles;
DROP POLICY IF EXISTS "audit_anonymous_insert" ON audit_requests;

-- ============================================
-- ORGANIZATIONS POLICIES
-- ============================================

-- Super Admin can see all organizations
CREATE POLICY "org_super_admin_select"
ON organizations
FOR SELECT
TO public
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

CREATE POLICY "org_super_admin_update"
ON organizations
FOR UPDATE
TO public
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Regular users can only see their own organization (via profiles join)
CREATE POLICY "org_user_select"
ON organizations
FOR SELECT
TO authenticated
USING (
  id IN (SELECT organization_id::uuid FROM profiles WHERE user_id = auth.uid())
);

-- ============================================
-- AUDIT_REQUESTS POLICIES
-- ============================================

-- Anyone can submit an audit request (no auth required - anonymous inserts)
CREATE POLICY "audit_anyone_insert"
ON audit_requests
FOR INSERT
TO anon
WITH CHECK (true);

-- Super Admin can see all, update all
CREATE POLICY "audit_super_admin_all"
ON audit_requests
FOR ALL
TO public
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read/update their own profile
CREATE POLICY "profiles_own_read"
ON profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "profiles_own_update"
ON profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Super Admin can see all profiles
CREATE POLICY "profiles_super_admin_all"
ON profiles
FOR ALL
TO public
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- ============================================
-- AUTH_INVITATIONS POLICIES
-- ============================================

ALTER TABLE auth_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invitations_super_admin_all" ON auth_invitations;
DROP POLICY IF EXISTS "invitations_own_read" ON auth_invitations;

-- Super Admin can do everything
CREATE POLICY "invitations_super_admin_all"
ON auth_invitations
FOR ALL
TO public
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Users can read their own invitations
CREATE POLICY "invitations_own_read"
ON auth_invitations
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('organizations', 'audit_requests', 'profiles', 'auth_invitations');