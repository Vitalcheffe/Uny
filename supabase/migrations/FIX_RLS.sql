-- Disable RLS for audit_requests temporarily
ALTER TABLE public.audit_requests DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_insert ON public.audit_requests;
CREATE POLICY audit_insert ON public.audit_requests FOR INSERT WITH CHECK (true);

