
-- ============================================================
-- UNY HUB - DATABASE SCHEMA v7.1 (BILLING & TRIAL ENHANCEMENTS)
-- ============================================================

-- 1. EXTENSIONS & PERMISSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Migration: Ensure organizations.id is text and handle foreign keys if they are currently uuid
DO $$ 
DECLARE
    fk_record RECORD;
BEGIN 
    -- 1. Check if organizations table exists and its id is uuid
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'id' AND data_type = 'uuid'
    ) THEN
        -- 2. Drop all foreign keys that reference organizations(id)
        FOR fk_record IN (
            SELECT 
                tc.table_name, 
                tc.constraint_name
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND ccu.table_name = 'organizations'
              AND ccu.column_name = 'id'
              AND tc.table_schema = 'public'
        ) LOOP
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', fk_record.table_name, fk_record.constraint_name);
        END LOOP;

        -- 3. Alter organizations.id to text
        ALTER TABLE public.organizations ALTER COLUMN id TYPE text;
        
        -- 4. Alter all referencing columns to text (migration safety for existing tables)
        -- This ensures they match the new type of organizations.id
        BEGIN ALTER TABLE public.profiles ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.clients ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.projects ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.documents ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.connections ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.invoices ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.contracts ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.time_entries ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.project_notes ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.document_feedback ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.invitations ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.knowledge_atoms ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.knowledge_edges ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.ai_extraction_logs ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.risk_assessments ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END;

        -- 5. Re-add foreign keys (migration safety)
        BEGIN ALTER TABLE public.profiles ADD CONSTRAINT profiles_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id); EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.clients ADD CONSTRAINT clients_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.projects ADD CONSTRAINT projects_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.documents ADD CONSTRAINT documents_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.connections ADD CONSTRAINT connections_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.invoices ADD CONSTRAINT invoices_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.contracts ADD CONSTRAINT contracts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.time_entries ADD CONSTRAINT time_entries_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.project_notes ADD CONSTRAINT project_notes_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.document_feedback ADD CONSTRAINT document_feedback_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.invitations ADD CONSTRAINT invitations_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.knowledge_atoms ADD CONSTRAINT knowledge_atoms_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.knowledge_edges ADD CONSTRAINT knowledge_edges_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.ai_extraction_logs ADD CONSTRAINT ai_extraction_logs_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
        BEGIN ALTER TABLE public.risk_assessments ADD CONSTRAINT risk_assessments_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE; EXCEPTION WHEN OTHERS THEN NULL; END;
    END IF;
END $$;

-- Ensure public schema is accessible
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- 2. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
    id text PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name text NOT NULL,
    sector text,
    team_size text,
    annual_revenue_goal bigint DEFAULT 0,
    currency text DEFAULT 'USD',
    trial_ends_at timestamptz,
    subscription_status text DEFAULT 'trialing',
    stripe_customer_id text,
    current_period_end timestamptz,
    ai_usage_count integer DEFAULT 0,
    email text, -- Added for AdminCommand consistency
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Ensure id is text in organizations (migration safety)
DO $$ BEGIN BEGIN ALTER TABLE public.organizations ALTER COLUMN id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;

-- 3. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid UNIQUE, -- Removed direct FK to auth.users if causing permission issues, but kept unique
    org_id text REFERENCES public.organizations(id),
    full_name text,
    avatar_url text,
    role text DEFAULT 'GUEST',
    onboarding_completed boolean DEFAULT false,
    salary numeric DEFAULT 0,
    health_data text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Ensure org_id is text in profiles
DO $$ BEGIN BEGIN ALTER TABLE public.profiles ALTER COLUMN org_id TYPE text; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;

-- Ensure user_id exists in profiles (migration safety for existing tables)
DO $$ 
BEGIN 
  BEGIN
    ALTER TABLE public.profiles ADD COLUMN user_id uuid UNIQUE;
  EXCEPTION WHEN duplicate_column THEN 
    NULL;
  END;
END $$;

-- 4. RLS ENABLING (ALL CORE TABLES)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. SOVEREIGN TENANT IDENTITY HELPERS (PUBLIC WRAPPERS)
-- These functions avoid direct 'auth.' schema calls in policies to bypass some permission restrictions
-- We use dynamic SQL (EXECUTE) to hide 'auth' references from the parser during function creation.

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

CREATE OR REPLACE FUNCTION public.get_auth_email() 
RETURNS text AS $$
BEGIN
    -- 1. Try to get email from JWT claims
    RETURN coalesce(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'email'),
        (auth.jwt() ->> 'email')
    );
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = auth, public;

CREATE OR REPLACE FUNCTION public.is_super_admin() 
RETURNS boolean AS $$
BEGIN
    -- The Root-User: amineharchelkorane5@gmail.com is the UID racine.
    RETURN public.get_auth_email() = 'amineharchelkorane5@gmail.com';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

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

-- 6. POLICIES: ORGANIZATIONS
DROP POLICY IF EXISTS "allow_authenticated_insert_org" ON public.organizations;
CREATE POLICY "allow_authenticated_insert_org" ON public.organizations
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "tenant_isolation_org" ON public.organizations;
CREATE POLICY "tenant_isolation_org" ON public.organizations
    FOR ALL TO authenticated USING (id::text = public.uid_org_id()::text OR public.is_super_admin());

-- 7. POLICIES: PROFILES
DROP POLICY IF EXISTS "tenant_isolation_profiles" ON public.profiles;
CREATE POLICY "tenant_isolation_profiles" ON public.profiles
    FOR ALL TO authenticated 
    USING (
        user_id = public.get_auth_uid() OR 
        org_id = public.uid_org_id() OR
        public.is_super_admin()
    );

-- Trigger to sync org_id from profiles to user_roles (and thus to JWT)
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

-- 8. TRIAL PROTOCOL TRIGGERS
CREATE OR REPLACE FUNCTION set_trial_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := now() + interval '7 days';
  END IF;
  IF NEW.subscription_status IS NULL THEN
    NEW.subscription_status := 'trialing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_trial_on_org_creation ON public.organizations;
CREATE TRIGGER set_trial_on_org_creation
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_end_date();

-- ============================================================
-- TELEMETRY & AUDIT LOGS (v1.0)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.telemetry_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text, -- No foreign key to allow 'GLOBAL' or other non-existent IDs
    event_type text NOT NULL,
    metric_label text NOT NULL,
    context jsonb DEFAULT '{}'::jsonb,
    payload jsonb DEFAULT '{}'::jsonb,
    timestamp timestamptz DEFAULT now(),
    session_id text,
    build text,
    metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_telemetry_org ON telemetry_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_event ON telemetry_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_logs(timestamp);

-- ============================================================
-- CORE BUSINESS ENTITIES
-- ============================================================

-- Table: Clients
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text,
    status text DEFAULT 'LEAD',
    trust_score integer DEFAULT 100,
    revenue_attribution bigint DEFAULT 0,
    sentiment_score integer DEFAULT 80,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
    name text NOT NULL,
    status text DEFAULT 'PLANNING',
    budget bigint DEFAULT 0,
    revenue bigint DEFAULT 0,
    priority text DEFAULT 'Medium',
    deadline timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: Folders
CREATE TABLE IF NOT EXISTS public.folders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: Documents (Updated)
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text REFERENCES public.organizations(id) ON DELETE CASCADE,
    folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
    uploaded_by uuid, -- Links to auth.uid()
    file_name text NOT NULL,
    file_type text,
    file_size bigint,
    storage_path text NOT NULL,
    extracted_text text,
    ai_analysis jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: Connections (AI Graph)
CREATE TABLE IF NOT EXISTS public.connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text REFERENCES public.organizations(id) ON DELETE CASCADE,
    source_type text NOT NULL, -- 'project', 'client', 'document', 'invoice'
    source_id text NOT NULL, -- Polymorphic ID (could be uuid or text)
    target_type text NOT NULL,
    target_id text NOT NULL, -- Polymorphic ID
    connection_type text, -- 'related_to', 'depends_on', 'mentioned_in'
    ai_confidence numeric DEFAULT 0,
    ai_reasoning text,
    created_by text DEFAULT 'ai',
    created_at timestamptz DEFAULT now()
);

-- Table: Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
    amount numeric NOT NULL DEFAULT 0,
    status text DEFAULT 'PENDING',
    due_date timestamptz,
    client_name text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: Contracts
CREATE TABLE IF NOT EXISTS public.contracts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text REFERENCES public.organizations(id) ON DELETE CASCADE,
    title text NOT NULL,
    contract_type text,
    party_name text,
    status text DEFAULT 'ACTIVE',
    start_date timestamptz,
    end_date timestamptz,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: Time Entries
CREATE TABLE IF NOT EXISTS public.time_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid,
    duration_seconds integer DEFAULT 0,
    description text,
    date date DEFAULT CURRENT_DATE,
    created_at timestamptz DEFAULT now()
);

-- Ensure user_id exists in time_entries
DO $$ BEGIN BEGIN ALTER TABLE public.time_entries ADD COLUMN user_id uuid; EXCEPTION WHEN duplicate_column THEN NULL; END; END $$;

-- Table: Project Notes
CREATE TABLE IF NOT EXISTS public.project_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    author_id uuid,
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Table: Document Feedback
CREATE TABLE IF NOT EXISTS public.document_feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text REFERENCES public.organizations(id) ON DELETE CASCADE,
    document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id uuid,
    feedback text NOT NULL,
    rating integer,
    created_at timestamptz DEFAULT now()
);

-- Ensure user_id exists in document_feedback
DO $$ BEGIN BEGIN ALTER TABLE public.document_feedback ADD COLUMN user_id uuid; EXCEPTION WHEN duplicate_column THEN NULL; END; END $$;

-- Table: Invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text REFERENCES public.organizations(id) ON DELETE CASCADE,
    email text NOT NULL,
    role text DEFAULT 'viewer',
    invited_by uuid,
    status text DEFAULT 'PENDING',
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Table: Audit Requests (Pre-onboarding)
CREATE TABLE IF NOT EXISTS public.audit_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_name text NOT NULL,
    email text NOT NULL,
    status text DEFAULT 'PENDING',
    type text DEFAULT 'STANDARD',
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_requests ENABLE ROW LEVEL SECURITY;

-- Policy for audit_requests: Anyone can insert (from landing page), only admins can read
DROP POLICY IF EXISTS "allow_public_insert_audit_requests" ON public.audit_requests;
CREATE POLICY "allow_public_insert_audit_requests" ON public.audit_requests
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "admin_all_audit_requests" ON public.audit_requests;
CREATE POLICY "admin_all_audit_requests" ON public.audit_requests
    FOR ALL TO authenticated USING (
        public.is_super_admin() OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id::uuid = public.get_auth_uid()::uuid AND p.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- ============================================================
-- NEURAL DATA NETWORK SCHEMA (v9.0)
-- ============================================================

-- Table: Extracted Data Points (The Knowledge Atoms)
CREATE TABLE IF NOT EXISTS public.knowledge_atoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Data Classification
  category text NOT NULL, -- 'financial', 'person', 'project', 'contract', 'other'
  entity_type text NOT NULL, -- 'salary', 'revenue', 'deadline', 'contact', etc.
  entity_id text, -- Links to actual entity (employee_id, project_id, etc.)
  
  -- The Actual Data
  key text NOT NULL, -- e.g., 'annual_salary', 'project_deadline', 'client_email'
  value jsonb NOT NULL, -- { "amount": 50000, "currency": "EUR" }
  value_text text, -- Human-readable: "€50,000/year"
  
  -- Source Tracking
  source_document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  source_page integer, -- Which page in the document
  source_location text, -- "Page 3, Section 2.1, Line 12"
  extraction_context text, -- The surrounding text for verification
  
  -- AI Confidence
  confidence_score integer DEFAULT 80, -- 0-100
  ai_reasoning text, -- Why the AI extracted this
  
  -- Human Validation
  validation_status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'corrected'
  validated_by uuid REFERENCES profiles(id),
  validated_at timestamptz,
  correction_note text,
  
  -- Metadata
  extracted_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now(),
  version integer DEFAULT 1 -- Track corrections
);

CREATE INDEX IF NOT EXISTS idx_knowledge_atoms_org ON knowledge_atoms(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_atoms_category ON knowledge_atoms(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_atoms_entity ON knowledge_atoms(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_atoms_source ON knowledge_atoms(source_document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_atoms_validation ON knowledge_atoms(validation_status);

ALTER TABLE knowledge_atoms ENABLE ROW LEVEL SECURITY;

-- Table: KNOWLEDGE GRAPH (Entity Relationships)
CREATE TABLE IF NOT EXISTS public.knowledge_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- The Connection
  from_atom_id uuid REFERENCES knowledge_atoms(id) ON DELETE CASCADE,
  to_atom_id uuid REFERENCES knowledge_atoms(id) ON DELETE CASCADE,
  relationship_type text NOT NULL, -- 'related_to', 'depends_on', 'validates', 'contradicts'
  
  -- Strength
  confidence_score integer DEFAULT 50, -- How strong is this connection
  
  -- Source
  inferred_by text DEFAULT 'ai', -- 'ai' or 'user'
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_edges_org ON knowledge_edges(org_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_from ON knowledge_edges(from_atom_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_edges_to ON knowledge_edges(to_atom_id);

ALTER TABLE knowledge_edges ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- AI EXTRACTION LOGS (Audit Trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_extraction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Processing Info
  status text DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  model_used text DEFAULT 'gemini-3-flash-preview',
  tokens_consumed integer,
  processing_time_ms integer,
  
  -- Results
  atoms_extracted integer DEFAULT 0,
  edges_created integer DEFAULT 0,
  avg_confidence integer,
  
  -- Errors
  error_message text,
  
  -- Timestamps
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_org ON ai_extraction_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_doc ON ai_extraction_logs(document_id);

ALTER TABLE ai_extraction_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TODOS (Demo)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.todos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    is_completed boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage todos" ON public.todos FOR ALL USING (true);

-- ============================================================
-- AUDIT LEDGER
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id text REFERENCES public.organizations(id) ON DELETE CASCADE,
    action text NOT NULL,
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name text,
    actor_email text,
    details text, -- JSON string
    timestamp timestamptz DEFAULT now(),
    user_agent text,
    context text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_ledger FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can view audit logs of their organization" ON public.audit_ledger FOR SELECT USING (organization_id = public.uid_org_id() OR public.is_super_admin());

-- ============================================================
-- FISCAL DEADLINES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fiscal_deadlines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    due_date timestamptz NOT NULL,
    label text NOT NULL,
    type text NOT NULL, -- 'TAX', 'EXPENSE', 'COMPLIANCE', 'INCOME'
    urgent boolean DEFAULT false,
    status text DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED'
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fiscal_deadlines_org ON fiscal_deadlines(org_id);

ALTER TABLE fiscal_deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their org fiscal deadlines" ON public.fiscal_deadlines;
CREATE POLICY "Users can view their org fiscal deadlines" ON public.fiscal_deadlines
    FOR SELECT USING (org_id::text = public.uid_org_id()::text OR public.is_super_admin());

DROP POLICY IF EXISTS "Admins can manage their org fiscal deadlines" ON public.fiscal_deadlines;
CREATE POLICY "Admins can manage their org fiscal deadlines" ON public.fiscal_deadlines
    FOR ALL USING (
        (org_id::text = public.uid_org_id()::text AND EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id::uuid = public.get_auth_uid()::uuid AND p.role IN ('ADMIN', 'SUPER_ADMIN', 'OWNER')
        )) OR public.is_super_admin()
    );

-- ============================================================
-- CONTEXTUAL RELATIONS (GRAPH MEMORY FOUNDATION)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.osint_events_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    event_title text NOT NULL,
    event_description text,
    event_date timestamptz,
    impact_score integer DEFAULT 0, -- -100 to 100
    source_url text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_osint_events_clients_org ON osint_events_clients(org_id);
CREATE INDEX IF NOT EXISTS idx_osint_events_clients_client ON osint_events_clients(client_id);

ALTER TABLE osint_events_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their org osint events" ON public.osint_events_clients;
CREATE POLICY "Users can view their org osint events" ON public.osint_events_clients
    FOR SELECT USING (org_id::text = public.uid_org_id()::text OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can manage their org osint events" ON public.osint_events_clients;
CREATE POLICY "Users can manage their org osint events" ON public.osint_events_clients
    FOR ALL USING (org_id::text = public.uid_org_id()::text OR public.is_super_admin());

CREATE TABLE IF NOT EXISTS public.client_risk_factors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id text NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    risk_category text NOT NULL, -- 'FINANCIAL', 'COMPLIANCE', 'REPUTATION', 'OPERATIONAL'
    risk_level text NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    description text,
    mitigation_strategy text,
    identified_at timestamptz DEFAULT now(),
    resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_client_risk_factors_org ON client_risk_factors(org_id);
CREATE INDEX IF NOT EXISTS idx_client_risk_factors_client ON client_risk_factors(client_id);

ALTER TABLE client_risk_factors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their org client risk factors" ON public.client_risk_factors;
CREATE POLICY "Users can view their org client risk factors" ON public.client_risk_factors
    FOR SELECT USING (org_id::text = public.uid_org_id()::text OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can manage their org client risk factors" ON public.client_risk_factors;
CREATE POLICY "Users can manage their org client risk factors" ON public.client_risk_factors
    FOR ALL USING (org_id::text = public.uid_org_id()::text OR public.is_super_admin());

-- ===============================================================
-- PHASE 3: AUTONOMOUS NERVOUS SYSTEM & PREDICTIVE GOVERNANCE
-- ===============================================================

-- 1. RISK ASSESSMENT & COMPLIANCE ENGINE (CNDP CORE)
CREATE TABLE IF NOT EXISTS public.risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id TEXT NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    vulnerability_score FLOAT NOT NULL DEFAULT 0, -- v_i
    data_weight FLOAT NOT NULL DEFAULT 1, -- w_i
    control_index FLOAT NOT NULL DEFAULT 1, -- c
    calculated_risk FLOAT GENERATED ALWAYS AS ((vulnerability_score * data_weight) / NULLIF(control_index, 0)) STORED,
    findings JSONB DEFAULT '[]'::jsonb,
    last_audit_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. OSINT & GLOBAL EVENT CORRELATION
CREATE TABLE IF NOT EXISTS public.osint_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- e.g., 'CYBER_ATTACK', 'REGULATORY_CHANGE'
    severity TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    sector_target TEXT, -- e.g., 'HEALTH', 'FINANCE'
    description TEXT,
    source_url TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 3. PREDICTIVE SCALING METRICS
CREATE TABLE IF NOT EXISTS public.predictive_scaling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type TEXT NOT NULL, -- 'CPU', 'STORAGE', 'EVENTS'
    current_value FLOAT,
    predicted_value FLOAT,
    confidence_score FLOAT,
    suggested_quota_increase FLOAT,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 4. PL/pgSQL: AUTOMATED RISK CALCULATION TRIGGER
CREATE OR REPLACE FUNCTION public.calculate_org_risk_score()
RETURNS TRIGGER AS $$
BEGIN
    -- This could be expanded to pull from telemetry_logs or audit_requests
    -- For now, it's a placeholder for the autonomous engine
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS HARDENING FOR PHASE 3
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.osint_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_scaling ENABLE ROW LEVEL SECURITY;

-- Risk Assessments: Only Super Admin or Org Admin
DROP POLICY IF EXISTS "Super Admin access to risk_assessments" ON public.risk_assessments;
CREATE POLICY "Super Admin access to risk_assessments" ON public.risk_assessments
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "Org Admin access to risk_assessments" ON public.risk_assessments;
CREATE POLICY "Org Admin access to risk_assessments" ON public.risk_assessments
    FOR SELECT USING (
        public.is_super_admin() OR
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id::uuid = public.get_auth_uid()::uuid 
            AND p.org_id::text = risk_assessments.org_id::text 
            AND p.role IN ('admin', 'owner', 'ADMIN', 'SUPER_ADMIN')
        )
    );

-- OSINT Events: Readable by all authenticated users (Global Intelligence)
DROP POLICY IF EXISTS "Authenticated users can read OSINT events" ON public.osint_events;
CREATE POLICY "Authenticated users can read OSINT events" ON public.osint_events
    FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'authenticated'
        OR public.get_auth_uid() IS NOT NULL
    );

-- Predictive Scaling: Super Admin only
DROP POLICY IF EXISTS "Super Admin access to predictive_scaling" ON public.predictive_scaling;
CREATE POLICY "Super Admin access to predictive_scaling" ON public.predictive_scaling
    FOR ALL USING (public.is_super_admin());

-- 6. REAL-TIME OPTIMIZATION: DELTA-UPDATES VIEW
CREATE OR REPLACE VIEW public.telemetry_deltas AS
SELECT 
    id, 
    org_id, 
    event_type, 
    metric_label, 
    timestamp
FROM public.telemetry_logs
WHERE timestamp > now() - interval '1 minute';

-- ===============================================================
-- AUTOMATIC MULTI-TENANT ENFORCEMENT (FINAL PASS)
-- ===============================================================
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

-- ===============================================================
-- STORAGE BUCKETS & POLICIES (TENANT ISOLATION)
-- ===============================================================

-- 1. Ensure the 'documents' bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS is usually enabled by default or managed via UI
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- Removed to avoid 42501 error

-- 3. Policy: Users can only access files in their organization's folder
-- We assume the folder structure is: {org_id}/{file_name}
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

-- 4. Super Admin access to all storage objects
DROP POLICY IF EXISTS "super_admin_storage_access" ON storage.objects;
CREATE POLICY "super_admin_storage_access" ON storage.objects
    FOR ALL TO authenticated
    USING (public.is_super_admin());
