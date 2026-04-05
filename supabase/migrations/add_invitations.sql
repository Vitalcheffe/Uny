-- Add status column to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id text NOT NULL,
 email text NOT NULL,
 token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
 role text DEFAULT 'OWNER',
 status text DEFAULT 'pending',
 expires_at timestamptz DEFAULT now() + interval '7 days',
 created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to read (for the invite page)
DROP POLICY IF EXISTS "invitations_public_read" ON invitations;
CREATE POLICY "invitations_public_read" ON invitations
FOR SELECT USING (true);

-- Allow any authenticated user to create invitations
DROP POLICY IF EXISTS "invitations_insert" ON invitations;
CREATE POLICY "invitations_insert" ON invitations
FOR INSERT TO authenticated WITH CHECK (true);

-- Allow org owners to update their invitation
DROP POLICY IF EXISTS "invitations_update" ON invitations;
CREATE POLICY "invitations_update" ON invitations
FOR UPDATE USING (auth.uid() IN (
  SELECT user_id::uuid FROM profiles 
  WHERE organization_id = invitations.organization_id
));