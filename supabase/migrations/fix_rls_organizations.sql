-- Fix RLS policies for SuperAdmin to see all organizations

-- Grant full access to super admins
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