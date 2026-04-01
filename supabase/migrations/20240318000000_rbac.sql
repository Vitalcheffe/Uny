-- ⚡ UNY PROTOCOL: RBAC & SECURITY MIGRATION (V1)
-- Description: Migration pour la gestion des rôles via Custom Claims et RLS strict.

-- 1. Création de l'énumération des rôles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'USER', 'GUEST');
    END IF;
END $$;

-- 2. Table des rôles utilisateurs (Source de vérité)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'USER',
    organization_id text, -- Optionnel pour SUPER_ADMIN, type text pour correspondre à organizations.id
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. Activation du RLS sur user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour user_roles
-- Seul le SUPER_ADMIN peut voir et modifier tous les rôles
-- Les utilisateurs peuvent voir leur propre rôle
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
CREATE POLICY "Users can view their own role" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Super Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Super Admins can manage all roles" 
ON public.user_roles FOR ALL 
USING (
  (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'SUPER_ADMIN'
);

-- 5. Fonction pour synchroniser le rôle et l'org_id dans les Custom Claims du JWT (app_metadata)
-- Cette fonction est déclenchée à chaque modification de la table user_roles
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

-- 6. Trigger pour la synchronisation
DROP TRIGGER IF EXISTS on_role_change ON public.user_roles;
CREATE TRIGGER on_role_change
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_update_user_role();

-- 7. Fonction de création automatique du rôle à l'inscription (Default: USER)
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'USER');
    
    -- Note: Le trigger on_role_change s'occupera de mettre à jour auth.users.raw_app_metadata
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger pour le nouvel utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();

-- 9. Indexation pour la performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
