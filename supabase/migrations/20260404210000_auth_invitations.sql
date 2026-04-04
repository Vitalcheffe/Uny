-- Create auth_invitations table for invite-based signup
CREATE TABLE IF NOT EXISTS public.auth_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    invite_token text UNIQUE NOT NULL,
    role text DEFAULT 'MEMBER',
    status text DEFAULT 'PENDING',
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.auth_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone with valid token can use invitation
CREATE POLICY "invitation_usable" ON public.auth_invitations
    FOR SELECT USING (status = 'PENDING' AND expires_at > now());

-- Policy: Only service role can insert/update
CREATE POLICY "auth_invitations_admin" ON public.auth_invitations
    FOR ALL USING (auth.role() = 'service_role');