-- ⚡ UNY PROTOCOL: AI SECURITY & LOGGING (V1)
-- Description: Table AI Request Logs (Immutable, Zéro-Trace).

-- 1. Table AI Request Logs
CREATE TABLE IF NOT EXISTS public.ai_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    request_hash TEXT NOT NULL, -- Hash SHA-256 de la requête originale
    is_masked BOOLEAN DEFAULT FALSE, -- Indique si le masquage PII a été appliqué
    model_used TEXT NOT NULL, -- Nom du modèle (ex: gemini-3.1-pro-preview)
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Activation du RLS
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS
-- Tout utilisateur authentifié peut insérer (Append-only)
DROP POLICY IF EXISTS "Authenticated users can insert AI logs" ON public.ai_request_logs;
CREATE POLICY "Authenticated users can insert AI logs" 
ON public.ai_request_logs FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Lecture réservée aux admins ou super admins
DROP POLICY IF EXISTS "Admins can view AI logs" ON public.ai_request_logs;
CREATE POLICY "Admins can view AI logs" 
ON public.ai_request_logs FOR SELECT 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role')::text IN ('SUPER_ADMIN', 'ORG_ADMIN')
);

-- Interdiction formelle de suppression ou modification (Immutable)
DROP POLICY IF EXISTS "AI logs are immutable" ON public.ai_request_logs;
CREATE POLICY "AI logs are immutable" 
ON public.ai_request_logs FOR UPDATE 
USING (false);

DROP POLICY IF EXISTS "AI logs cannot be deleted" ON public.ai_request_logs;
CREATE POLICY "AI logs cannot be deleted" 
ON public.ai_request_logs FOR DELETE 
USING (false);

-- 4. Indexation
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_user_id ON public.ai_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_at ON public.ai_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_request_logs_hash ON public.ai_request_logs(request_hash);
