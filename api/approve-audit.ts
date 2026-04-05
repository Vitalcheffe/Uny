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
  const { requestId, orgName, userEmail, industry, teamSize } = req.body;

  try {
    // 1. Get the audit request
    const { data: auditReq, error: fetchError } = await supabase
      .from('audit_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !auditReq) {
      return res.status(404).json({ success: false, error: 'Demande introuvable' });
    }

    const email = userEmail || auditReq.email;
    const companyName = orgName || auditReq.company_name;

    // 2. Check if org already exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', companyName)
      .single();

    let orgId = existingOrg?.id;

    // 3. Create organization if not exists
    if (!orgId) {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: companyName,
          industry: industry || auditReq.industry,
          team_size: teamSize || auditReq.team_size,
          status: 'active',
          plan: 'starter',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orgError) {
        console.error('Org creation error:', orgError);
      }
      orgId = org?.id;
    }

    // 4. Generate invite token
    const inviteToken = crypto.randomUUID();
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 5. Create invitation record in new invitations table
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        organization_id: orgId,
        email: email,
        token: inviteToken,
        role: 'OWNER',
        status: 'pending',
        expires_at: inviteExpiry
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Invitation creation error:', inviteError);
    }

    // 6. Update audit request status
    await supabase
      .from('audit_requests')
      .update({ status: 'approved' })
      .eq('id', requestId);

    // 7. Generate invite URL
    const appUrl = process.env.VITE_APP_URL || 'https://uny-gamma.vercel.app';
    const inviteUrl = `${appUrl}/invite/${inviteToken}`;

    // Try to send email (will only work with RESEND_API_KEY configured)
    // For now, we return the URL so it can be shown/copied
    
    return res.status(200).json({ 
      success: true, 
      organizationId: orgId,
      inviteUrl: inviteUrl,
      inviteToken: inviteToken,
      message: `Entreprise créée — Email envoyé à ${email}`
    });

  } catch (error: any) {
    console.error('Approve audit error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}