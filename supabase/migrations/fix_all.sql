-- Fix all data issues in one go

-- 1. Fix audit_requests status
ALTER TABLE audit_requests 
ALTER COLUMN status SET DEFAULT 'pending';

UPDATE audit_requests 
SET status = 'pending'
WHERE status IS NULL OR status = 'rejected';

-- 2. Fix organizations status
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

UPDATE organizations 
SET status = 'active'
WHERE status IS NULL OR status = 'suspended';

-- 3. Ensure invitations table exists
CREATE TABLE IF NOT EXISTS public.invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id text,
 organization_name text,
 email text NOT NULL,
 token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
 role text DEFAULT 'OWNER',
 status text DEFAULT 'pending',
 expires_at timestamptz DEFAULT now() + interval '7 days',
 created_at timestamptz DEFAULT now()
);

-- 4. RLS on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inv_public_read" ON invitations;
CREATE POLICY "inv_public_read" ON invitations FOR SELECT USING (true);
DROP POLICY IF EXISTS "inv_insert" ON invitations;
CREATE POLICY "inv_insert" ON invitations FOR INSERT WITH CHECK (true);

-- 5. Show result
SELECT 'audit_requests:' as tbl, COUNT(*) as cnt, status as status FROM audit_requests GROUP BY status
UNION ALL
SELECT 'organizations:', COUNT(*), status FROM organizations GROUP BY status
UNION ALL
SELECT 'invitations:', COUNT(*), status FROM invitations GROUP BY status;