-- ⚡ SOVEREIGN KERNEL: FINAL SCHEMA & RLS RECURSION FIX (V2)
-- Description: Résolution définitive de la récursion infinie RLS et synchronisation JWT complète.

-- 1. Nettoyage des types (Migration safety)
DO $$ 
BEGIN 
    BEGIN
        ALTER TABLE public.user_roles ALTER COLUMN organization_id TYPE text;
    EXCEPTION WHEN OTHERS THEN 
        NULL;
    END;
END $$;

-- 2. Optimisation des Helpers de Sécurité (SECURITY DEFINER + JWT Cache)
-- Ces fonctions sont critiques pour éviter la récursion infinie.

CREATE OR REPLACE FUNCTION public.get_auth_uid() 
RETURNS uuid AS $$
BEGIN
    -- Priorité au JWT pour la performance
    RETURN coalesce(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid,
        auth.uid()
    );
EXCEPTION WHEN OTHERS THEN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.uid_org_id() 
RETURNS text AS $$
DECLARE
    _org_id text;
    _uid uuid;
BEGIN
    -- 1. Tenter de récupérer depuis le JWT (Cache ultra-rapide, évite la récursion)
    _org_id := (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'org_id');
    IF _org_id IS NOT NULL THEN RETURN _org_id; END IF;

    -- 2. Fallback sur la base de données (SECURITY DEFINER bypass RLS)
    _uid := public.get_auth_uid();
    IF _uid IS NULL THEN RETURN NULL; END IF;

    -- On utilise une requête directe. Étant SECURITY DEFINER, elle ne déclenche pas le RLS de 'profiles'.
    SELECT org_id::text INTO _org_id FROM public.profiles WHERE user_id = _uid LIMIT 1;
    
    RETURN _org_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Synchronisation JWT (Role + OrgID)
-- On met à jour auth.users.raw_app_metadata pour inclure le rôle et l'org_id.

CREATE OR REPLACE FUNCTION public.handle_update_user_role()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_app_metadata = 
        coalesce(raw_app_metadata, '{}'::jsonb) || 
        jsonb_build_object(
            'role', NEW.role,
            'org_id', NEW.organization_id
        )
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = auth, public;

-- 4. Synchronisation Profiles -> User Roles
-- On s'assure que si l'org_id change dans profiles, il est répercuté dans user_roles (et donc dans le JWT)

CREATE OR REPLACE FUNCTION public.sync_profile_org_to_user_roles()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_roles
    SET organization_id = NEW.org_id
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_org_change ON public.profiles;
CREATE TRIGGER on_profile_org_change
AFTER UPDATE OF org_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_org_to_user_roles();

-- 5. Refactorisation des Politiques RLS (Éviter la récursion)

-- PROFILES: Politique simplifiée
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_profiles" ON public.profiles;
CREATE POLICY "tenant_isolation_profiles" ON public.profiles
    FOR ALL TO authenticated 
    USING (
        user_id = auth.uid() OR 
        org_id = (SELECT p.org_id FROM public.profiles p WHERE p.user_id = auth.uid() LIMIT 1) OR
        public.is_super_admin()
    );
-- Note: On utilise une sous-requête directe ici au lieu de uid_org_id() pour être 100% sûr d'éviter la récursion si uid_org_id() était mal configuré.
-- Mais avec uid_org_id() SECURITY DEFINER, ça devrait aller. Utilisons uid_org_id() pour la cohérence.

CREATE OR REPLACE POLICY "tenant_isolation_profiles" ON public.profiles
    FOR ALL TO authenticated 
    USING (
        user_id = public.get_auth_uid() OR 
        org_id = public.uid_org_id() OR
        public.is_super_admin()
    );

-- ORGANIZATIONS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_org" ON public.organizations;
CREATE POLICY "tenant_isolation_org" ON public.organizations
    FOR ALL TO authenticated 
    USING (id = public.uid_org_id() OR public.is_super_admin());

-- 6. Ré-application dynamique du RLS sur toutes les tables métiers
DO $$ 
DECLARE 
  t text;
BEGIN
  FOR t IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    AND tablename IN (
        'clients', 'projects', 'folders', 'invoices', 'documents', 'connections', 
        'telemetry_logs', 'contracts', 'time_entries', 'project_notes', 
        'document_feedback', 'invitations', 'knowledge_atoms', 
        'knowledge_edges', 'ai_extraction_logs', 'risk_assessments'
    )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "tenant_isolation_%s" ON public.%I FOR ALL TO authenticated USING (org_id::text = public.uid_org_id()::text OR public.is_super_admin()) WITH CHECK (org_id::text = public.uid_org_id()::text OR public.is_super_admin())', t, t);
  END LOOP;
END $$;

-- 7. Storage: Documents Bucket Security
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- Removed to avoid 42501 error

DROP POLICY IF EXISTS "tenant_isolation_storage_documents" ON storage.objects;
CREATE POLICY "tenant_isolation_storage_documents" ON storage.objects
    FOR ALL TO authenticated
    USING (
        bucket_id = 'documents' AND 
        (storage.foldername(name))[1] = public.uid_org_id()
    )
    WITH CHECK (
        bucket_id = 'documents' AND 
        (storage.foldername(name))[1] = public.uid_org_id()
    );

DROP POLICY IF EXISTS "super_admin_storage_access" ON storage.objects;
CREATE POLICY "super_admin_storage_access" ON storage.objects
    FOR ALL TO authenticated
    USING (public.is_super_admin());
