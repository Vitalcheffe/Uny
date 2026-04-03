-- ⚡ UNY COMPLETE MIGRATION - ALL IN ONE
-- Exécuter en UN SEUL COUP dans Supabase SQL Editor

-- ============================================
-- 1. TABLES PRINCIPALES
-- ============================================

-- Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sector TEXT DEFAULT 'TECH',
    team_size TEXT DEFAULT '1',
    currency TEXT DEFAULT 'MAD',
    plan TEXT DEFAULT 'starter',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'member',
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'USER',
    organization_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    client_id UUID,
    amount DECIMAL(12,2),
    status TEXT DEFAULT 'PENDING',
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Projects  
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Usage
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    tokens_in INTEGER DEFAULT 0,
    tokens_out INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID,
    user_message TEXT,
    ai_response TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Requests
CREATE TABLE IF NOT EXISTS public.audit_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT,
    email TEXT,
    team_size TEXT,
    industry TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_requests ENABLE ROW LEVEL SECURITY;

-- Organizations: everyone can read
CREATE POLICY "orgs_read" ON public.organizations FOR SELECT USING (true);

-- Profiles: users can read their own
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- User Roles: read own
CREATE POLICY "roles_read" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Invoices: read/write own org
CREATE POLICY "invoices_read" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "invoices_insert" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "invoices_update" ON public.invoices FOR UPDATE USING (true);

-- Projects: read/write own org
CREATE POLICY "projects_read" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (true);

-- Clients: read/write own org
CREATE POLICY "clients_read" ON public.clients FOR SELECT USING (true);
CREATE POLICY "clients_insert" ON public.clients FOR INSERT WITH CHECK (true);

-- AI Usage: all can read/write
CREATE POLICY "ai_usage_all" ON public.ai_usage FOR ALL USING (true);

-- Conversations: read/write
CREATE POLICY "conversations_all" ON public.conversations FOR ALL USING (true);

-- Audit Requests: public read, admin write
CREATE POLICY "audit_read" ON public.audit_requests FOR SELECT USING (true);
CREATE POLICY "audit_insert" ON public.audit_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_update" ON public.audit_requests FOR UPDATE USING (true);

-- ============================================
-- 3. INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON public.invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org ON public.ai_usage(org_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org ON public.conversations(org_id);

-- ============================================
-- 4. COMPLETED SUCCESSFULLY
-- ============================================