// Simple email send via Resend - no external package needed

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, companyName, inviteLink, expiresAt } = req.body;

  if (!to || !companyName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  
  console.log('[Email API] Key exists:', !!apiKey);
  console.log('[Email API] Key value:', apiKey ? apiKey.substring(0, 10) + '...' : 'NONE');

  if (!apiKey) {
    console.error('[Email API] RESEND_API_KEY not set!');
    return res.status(500).json({ success: false, error: 'RESEND_API_KEY not configured' });
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0; padding:0; font-family:Arial,sans-serif;">
  <div style="background:#f8fafc; padding:40px 20px;">
    <div style="max-width:500px; margin:0 auto; background:white; border-radius:16px;">
      <div style="background:#0A0A1A; padding:24px; text-align:center;">
        <span style="color:white; font-size:24px; font-weight:bold;">UNY</span>
      </div>
      <div style="padding:32px; text-align:center;">
        <h1 style="margin:0 0 16px; font-size:24px; color:#0A0A1A;">Bienvenue sur UNY</h1>
        <p style="color:#64748b;">Votre espace pour <strong>${companyName}</strong> est prêt.</p>
        <a href="${inviteLink}" style="display:inline-block; background:#2563EB; color:white; padding:16px 32px; border-radius:12px; text-decoration:none; font-weight:bold; margin:16px 0;">
          Créer mon compte
        </a>
        <p style="color:#94a3b8; font-size:12px;">Lien valable 7 jours</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        from: 'UNY <onboarding@resend.dev>',
        to: to,
        subject: `Votre accès UNY est prêt — ${companyName}`,
        html: htmlContent,
      }),
    });

    const data = await response.json();
    
    console.log('[Email API] Response status:', response.status);
    console.log('[Email API] Response data:', JSON.stringify(data));
    
    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: data });
    }

    return res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('[Email API] Catch error:', error);
    return res.status(500).json({ success: false, error: error?.toString?.() || String(error) });
  }
}