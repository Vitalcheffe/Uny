-- ⚡ UNY PROTOCOL: AI USAGE TRACKING
-- Tracks AI requests per organization per month for quota enforcement.

-- Create ai_usage table
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    model VARCHAR(50) DEFAULT 'gemini',
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policy: org users can view their org's usage
DROP POLICY IF EXISTS "Users can view their org ai_usage" ON public.ai_usage;
CREATE POLICY "Users can view their org ai_usage"
ON public.ai_usage FOR SELECT
USING (
    org_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id')::uuid
);

-- RLS Policy: org users can insert their org's usage
DROP POLICY IF EXISTS "Users can insert ai_usage" ON public.ai_usage;
CREATE POLICY "Users can insert ai_usage"
ON public.ai_usage FOR INSERT
WITH CHECK (
    org_id = (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id')::uuid
);

-- Index for monthly queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_month ON public.ai_usage (org_id, created_at);

-- Add plan column to organizations if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'plan'
    ) THEN
        ALTER TABLE public.organizations ADD COLUMN plan VARCHAR(20) DEFAULT 'starter';
    END IF;
END $$;