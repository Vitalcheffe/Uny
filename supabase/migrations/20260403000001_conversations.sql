-- ⚡ UNY PROTOCOL: CONVERSATIONS TABLE
-- Stores AI chat history for each organization.

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: org users can view their org's conversations
DROP POLICY IF EXISTS "Users can view their org conversations" ON public.conversations;
CREATE POLICY "Users can view their org conversations"
ON public.conversations FOR SELECT
USING (
    org_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id')::uuid
);

-- RLS Policy: org users can insert conversations
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
CREATE POLICY "Users can insert conversations"
ON public.conversations FOR INSERT
WITH CHECK (
    org_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id')::uuid
);

-- Index for org queries
CREATE INDEX IF NOT EXISTS idx_conversations_org ON public.conversations (org_id, created_at DESC);