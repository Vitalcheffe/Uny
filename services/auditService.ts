import { supabase } from '../lib/supabase';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  DOC_CREATE = 'DOC_CREATE',
  DOC_VIEW = 'DOC_VIEW',
  DOC_DELETE = 'DOC_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  AI_QUERY = 'AI_QUERY',
  WORKFLOW_EXEC = 'WORKFLOW_EXEC',
  ADMIN_ACCESS = 'ADMIN_ACCESS',
  SECURITY_ALERT = 'SECURITY_ALERT'
}

export interface AuditLogDetails {
  [key: string]: any;
}

export const logAuditAction = async (
  action: AuditAction,
  organizationId: string,
  details: AuditLogDetails = {}
) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const { error } = await supabase.from('audit_ledger').insert({
      action,
      actor_id: user.id,
      actor_name: user.user_metadata?.full_name || user.email || 'Unknown',
      actor_email: user.email,
      organization_id: organizationId,
      details: JSON.stringify(details),
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      context: 'UNY_CLIENT_OS'
    });
    if (error) throw error;
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
};
