// Simpler email send via Resend with better template

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, companyName, inviteLink, expiresAt } = req.body;

  if (!to || !companyName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://uny-gamma.vercel.app';

  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'RESEND_API_KEY not configured' });
  }

  // Ensure invite link goes to correct URL
  const fullInviteLink = inviteLink?.startsWith('http') 
    ? inviteLink 
    : `${appUrl}/invite/${inviteLink}`;

  console.log('[Email API] Sending to:', to);
  console.log('[Email API] Invite link:', fullInviteLink);

  // Professional HTML email template
  const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre accès UNY est prêt</title>
</head>
<body style="margin:0; padding:0; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color:#f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <!-- Logo -->
        <div style="width:60px; height:60px; background:linear-gradient(135deg, #2563EB, #7C3AED); border-radius:16px; display:flex; align-items:center; justify-content:center; margin-bottom:24px;">
          <span style="color:white; font-size:28px; font-weight:bold;">U</span>
        </div>
        
        <!-- Main Card -->
        <div style="max-width:480px; background:white; border-radius:20px; padding:40px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);">
          <h1 style="margin:0 0 8px; font-size:28px; font-weight:700; color:#0f172a; text-align:center;">
            Bienvenue sur UNY
          </h1>
          
          <p style="margin:0 0 24px; font-size:16px; color:#475569; text-align:center; line-height:1.6;">
            Votre espace de travail souverain pour <strong style="color:#0f172a;">${companyName}</strong> a été créé par notre équipe.
          </p>
          
          <!-- CTA Button -->
          <div style="text-align:center; margin:32px 0;">
            <a href="${fullInviteLink}" style="display:inline-block; background:linear-gradient(135deg, #2563EB, #7C3AED); color:white; font-size:16px; font-weight:600; padding:16px 40px; border-radius:12px; text-decoration:none; box-shadow:0 4px 14px rgba(37,99,235,0.4);">
              Créer mon compte →
            </a>
          </div>
          
          <!-- Info Box -->
          <div style="background:#f8fafc; border-radius:12px; padding:16px; margin-top:24px;">
            <p style="margin:0; font-size:14px; color:#64748b;">
              <strong style="color:#0f172a;">Ce lien expire le ${expiresAt || 'dans 7 jours'}</strong>
            </p>
          </div>
          
          <!-- Footer -->
          <p style="margin:32px 0 0; font-size:13px; color:#94a3b8; text-align:center; line-height:1.5;">
            UNY — Sovereign Operating System for African Businesses<br>
            <a href="${appUrl}" style="color:#2563EB; text-decoration:none;">${appUrl}</a>
          </p>
        </div>
        
        <!-- Spam Notice -->
        <p style="margin:24px 0 0; font-size:12px; color:#94a3b8; text-align:center;">
          Si vous ne trouvez pas cet email, vérifiez votre dossier spam.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        from: 'UNY Team <team@resend.dev>',
        to: to,
        subject: `Votre accès UNY est prêt — ${companyName}`,
        html: htmlContent,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Email API] Resend error:', data);
      return res.status(response.status).json({ success: false, error: data });
    }

    console.log('[Email API] Sent successfully to:', to);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[Email API] Error:', error);
    return res.status(500).json({ success: false, error: error?.toString?.() || String(error) });
  }
}