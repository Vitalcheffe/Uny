-- Add status column to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';