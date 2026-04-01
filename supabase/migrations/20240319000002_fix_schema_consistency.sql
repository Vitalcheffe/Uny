-- ⚡ UNY PROTOCOL: SCHEMA CONSISTENCY & MISSING TABLES (V2)
-- Description: Création de la table profiles, correction des types org_id et ajout des tables métier.

-- 1. Table des profils (Lien entre auth.users et organizations)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    full_name TEXT,
    role TEXT DEFAULT 'member',
    onboarding_completed BOOLEAN DEFAULT false,
    salary NUMERIC,
    health_data JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Correction de la table folders (org_id doit être UUID)
-- On recrée la table si elle a été mal créée
DROP TABLE IF EXISTS public.folders CASCADE;
CREATE TABLE public.folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(org_id, path)
);

-- 3. Table des contrats
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    contract_type TEXT,
    party_name TEXT,
    party_type TEXT,
    start_date DATE,
    end_date DATE,
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'draft',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Table des connexions (Graphe de connaissances AI)
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    source_id UUID NOT NULL,
    source_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL,
    connection_type TEXT NOT NULL,
    ai_confidence NUMERIC DEFAULT 0,
    ai_reasoning TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Table des entrées de temps
CREATE TABLE IF NOT EXISTS public.time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID,
    project_name TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tables CRM & Projets
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    sentiment_score INTEGER DEFAULT 80,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    priority TEXT,
    deadline DATE,
    status TEXT DEFAULT 'ongoing',
    revenue NUMERIC DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    due_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Table de télémétrie
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    session_id TEXT,
    event_type TEXT NOT NULL,
    event_label TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Vue de vélocité organisationnelle
CREATE OR REPLACE VIEW public.org_velocity_tracker AS
SELECT 
    org_id,
    COUNT(id) as total_projects,
    SUM(revenue) as total_revenue,
    AVG(revenue) as avg_revenue_per_project
FROM public.projects
GROUP BY org_id;

-- 9. Activation du RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;

-- 10. Politiques RLS (Isolation par org_id via JWT)
-- Note: On utilise organization_id du JWT app_metadata pour l'isolation

CREATE POLICY "tenant_isolation_profiles" ON public.profiles FOR ALL TO authenticated
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "tenant_isolation_folders" ON public.folders FOR ALL TO authenticated
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "tenant_isolation_contracts" ON public.contracts FOR ALL TO authenticated
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "tenant_isolation_connections" ON public.connections FOR ALL TO authenticated
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "tenant_isolation_time_entries" ON public.time_entries FOR ALL TO authenticated
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "tenant_isolation_clients" ON public.clients FOR ALL TO authenticated
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "tenant_isolation_projects" ON public.projects FOR ALL TO authenticated
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "tenant_isolation_invoices" ON public.invoices FOR ALL TO authenticated
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

CREATE POLICY "tenant_isolation_telemetry" ON public.telemetry_logs FOR ALL TO authenticated
  USING (org_id = (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid);

-- 11. Indexation
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org ON public.contracts(org_id);
CREATE INDEX IF NOT EXISTS idx_connections_org ON public.connections(org_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_org ON public.time_entries(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_org ON public.telemetry_logs(org_id);
