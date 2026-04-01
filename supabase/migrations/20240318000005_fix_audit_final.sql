-- ⚡ UNY PROTOCOL: FIX AUDIT REQUESTS (V5)
-- Description: Réparation critique de la table audit_requests pour les formulaires publics.

-- 1. Vérification et ajout des colonnes manquantes
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_requests' AND column_name = 'team_size') THEN
        ALTER TABLE public.audit_requests ADD COLUMN team_size text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_requests' AND column_name = 'industry') THEN
        ALTER TABLE public.audit_requests ADD COLUMN industry text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_requests' AND column_name = 'company_name') THEN
        ALTER TABLE public.audit_requests ADD COLUMN company_name text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_requests' AND column_name = 'annual_revenue') THEN
        ALTER TABLE public.audit_requests ADD COLUMN annual_revenue text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_requests' AND column_name = 'email') THEN
        ALTER TABLE public.audit_requests ADD COLUMN email text;
    END IF;

    -- Assurer que organization_name est nullable s'il existe (pour éviter les erreurs si on ne l'envoie plus)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_requests' AND column_name = 'organization_name') THEN
        ALTER TABLE public.audit_requests ALTER COLUMN organization_name DROP NOT NULL;
    END IF;
END $$;

-- 2. Reset de la RLS
ALTER TABLE public.audit_requests DISABLE ROW LEVEL SECURITY;

-- 3. Suppression des anciennes politiques
DROP POLICY IF EXISTS "Enable insert for all" ON public.audit_requests;
DROP POLICY IF EXISTS "Allow public insert" ON public.audit_requests;
DROP POLICY IF EXISTS "allow_public_insert_audit_requests" ON public.audit_requests;
DROP POLICY IF EXISTS "public_insert_audit_v2" ON public.audit_requests;

-- 4. Réactivation de la RLS
ALTER TABLE public.audit_requests ENABLE ROW LEVEL SECURITY;

-- 5. Politique "Ultra-Ouverte" pour l'insertion
CREATE POLICY "public_insert_audit_v2" ON public.audit_requests 
    FOR INSERT 
    WITH CHECK (true);

-- 6. Attribution des permissions au rôle anon
GRANT INSERT ON TABLE public.audit_requests TO anon, authenticated;
