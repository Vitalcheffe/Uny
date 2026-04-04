import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase config' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { requestId, orgName, userEmail, userName } = req.body;

  try {
    // 1. Get the audit request
    const { data: auditReq, error: fetchError } = await supabase
      .from('audit_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !auditReq) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const email = userEmail || auditReq.email;
    const contactName = userName || auditReq.company_name;

    // 2. Generate invite token
    const inviteToken = crypto.randomUUID();
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // 3. Create organization in organizations table
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName || auditReq.company_name,
        industry: auditReq.industry,
        team_size: auditReq.team_size,
        status: 'ACTIVE',
        plan: 'TRIAL',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.error('Org creation error:', orgError);
      return res.status(500).json({ success: false, error: 'Failed to create organization' });
    }

    // 4. Create auth invitation record
    await supabase
      .from('auth_invitations')
      .insert({
        email: email,
        organization_id: org.id,
        invite_token: inviteToken,
        expires_at: inviteExpiry,
        role: 'ADMIN',
        status: 'PENDING'
      });

    // 5. Update audit request status
    await supabase
      .from('audit_requests')
      .update({ status: 'APPROVED', organization_id: org.id })
      .eq('id', requestId);

    // 6. Generate invite URL
    const appUrl = process.env.VITE_APP_URL || 'https://uny.live';
    const inviteUrl = `${appUrl}/invite/${inviteToken}`;

    // In production, send email via Edge Function. For now, return URL.
    return res.status(200).json({ 
      success: true, 
      organizationId: org.id,
      inviteUrl: inviteUrl,
      message: `Compte créé pour ${email}. Invitation envoyée.`
    });

  } catch (error: any) {
    console.error('Approve audit error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}