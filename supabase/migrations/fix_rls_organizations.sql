-- Fix RLS policies for SuperAdmin to see all organizations

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Allow public read" ON organizations;
DROP POLICY IF EXISTS "Allow authenticated read" ON organizations;

-- Create policy that allows super admins to see all organizations
CREATE POLICY "Allow SUPER_ADMIN full access"
ON organizations
FOR ALL
TO public
USING (
  auth.jwt() ->> 'role' = 'SUPER_ADMIN'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'SUPER_ADMIN'
);

-- Also allow anyone to read their own organization
CREATE POLICY "Allow own org read"
ON organizations
FOR SELECT
TO public
USING (
  id IN (
    SELECT organization_id::uuid
    FROM profiles
    WHERE id = auth.uid()
  )
);