-- Trigger pour envoyer emails via webhook quand nouvelle demande audit
-- utilise https://webhook.site ouBrevo automation

-- 1. Créer fonction de notification
CREATE OR REPLACE FUNCTION notify_new_audit_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Envoyer à webhook.site (gratuit) pour tester
  PERFORM (
    SELECT http_post(
      'https://webhook.site/YOUR-WEBHOOK-ID', 
      json_build_object(
        'company', NEW.company_name,
        'email', NEW.email,
        'team_size', NEW.team_size,
        'industry', NEW.industry
      )::text,
      'application/json'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer le trigger
DROP TRIGGER IF EXISTS on_new_audit_request ON public.audit_requests;
CREATE TRIGGER on_new_audit_request
AFTER INSERT ON public.audit_requests
FOR EACH ROW EXECUTE FUNCTION notify_new_audit_request();