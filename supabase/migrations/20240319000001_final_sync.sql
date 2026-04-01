-- Fix colonnes manquantes
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing';

-- Fix table folders (hiérarchie fichiers)
CREATE TABLE IF NOT EXISTS public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  path text NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, path)
);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_folders" ON folders
  FOR ALL TO authenticated
  USING (org_id = (SELECT org_id FROM profiles WHERE user_id = auth.uid()));

-- Fix table documents (lien avec folders)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES folders(id) ON DELETE SET NULL;

-- Index performance
CREATE INDEX IF NOT EXISTS idx_folders_org ON folders(org_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
