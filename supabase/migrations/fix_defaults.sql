-- Fix audit_requests default status
ALTER TABLE audit_requests 
ALTER COLUMN status SET DEFAULT 'pending';

-- Also ensure invitations table has correct column
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS organization_name text;

-- Enable RLS on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invitations_public" ON invitations;
CREATE POLICY "invitations_public" ON invitations FOR SELECT USING (true);
DROP POLICY IF EXISTS "invitations_insert" ON invitations;
CREATE POLICY "invitations_insert" ON invitations FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "invitations_update" ON invitations;
CREATE POLICY "invitations_update" ON invitations FOR UPDATE USING (true);