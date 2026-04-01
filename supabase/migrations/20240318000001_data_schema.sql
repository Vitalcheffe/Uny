-- ⚡ UNY PROTOCOL: DATA SCHEMA & RLS MIGRATION (V1)
-- Description: Schéma souverain pour les organisations, documents et audit ledger.

-- 1. Activation de pgvector pour le futur RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Table des organisations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table des documents (avec support vectoriel)
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    size BIGINT NOT NULL,
    type TEXT NOT NULL,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding vector(1536), -- Dimension standard pour OpenAI/Gemini embeddings
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ -- Soft delete support
);

-- 4. Table Audit Ledger (Immutable, Append-only)
CREATE TABLE IF NOT EXISTS public.audit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Activation du RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_ledger ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS pour Organizations
-- Un utilisateur ne peut voir que son organisation (basé sur son organization_id dans le JWT)
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization" 
ON public.organizations FOR SELECT 
USING (
  id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
);

-- 7. Politiques RLS pour Documents
-- Isolation stricte par org_id
DROP POLICY IF EXISTS "Users can manage documents of their organization" ON public.documents;
CREATE POLICY "Users can manage documents of their organization" 
ON public.documents FOR ALL 
USING (
  org_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
);

-- 8. Politiques RLS pour Audit Ledger
-- Tout utilisateur authentifié peut insérer (Append-only)
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_ledger;
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_ledger FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Lecture réservée aux admins de l'org ou super admins
DROP POLICY IF EXISTS "Admins can view audit logs of their organization" ON public.audit_ledger;
CREATE POLICY "Admins can view audit logs of their organization" 
ON public.audit_ledger FOR SELECT 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role')::text IN ('SUPER_ADMIN', 'ORG_ADMIN')
);

-- Interdiction formelle de suppression ou modification (Immutable)
DROP POLICY IF EXISTS "Audit logs are immutable" ON public.audit_ledger;
CREATE POLICY "Audit logs are immutable" 
ON public.audit_ledger FOR UPDATE 
USING (false);

DROP POLICY IF EXISTS "Audit logs cannot be deleted" ON public.audit_ledger;
CREATE POLICY "Audit logs cannot be deleted" 
ON public.audit_ledger FOR DELETE 
USING (false);

-- 9. Indexation
CREATE INDEX IF NOT EXISTS idx_documents_org_id ON public.documents(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_ledger_user_id ON public.audit_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_ledger_created_at ON public.audit_ledger(created_at);
