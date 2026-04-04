-- Add phone and job_position columns to audit_requests
ALTER TABLE public.audit_requests 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS job_position text;