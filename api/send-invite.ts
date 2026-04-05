// Email send via Resend with guaranteed working template

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

  // Build proper URL - ensure it's absolute
  let fullUrl = inviteLink;
  if (!inviteLink?.startsWith('http')) {
    // It's just a token, build full URL
    const token = inviteLink || '';
    fullUrl = `${appUrl}/invite/${token}`;
  }
  
  console.log('[Email] Final URL:', fullUrl);

  // Hardcoded URL for guaranteed clickability
  const hardcodedUrl = `https://uny-gamma.vercel.app/invite/${inviteLink || ''}`;
  console.log('[Email] Hardcoded URL:', hardcodedUrl);

  // Professional email template (Notion/Linear style)
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
</head>
<body style="margin:0; padding:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background:#F8FAFC;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;">
<tr>
<td align="center" style="padding:48px 16px;">
<div style="max-width:560px; background:white; border-radius:8px; padding:48px; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
<!-- Logo -->
<div style="text-align:center; margin-bottom:24px;">
<span style="font-size:20px; font-weight:700; color:#000000;">UNY</span>
</div>

<!-- Divider -->
<div style="border-top:1px solid #E2E8F0; margin:24px 0;"></div>

<!-- Heading -->
<h2 style="margin:0 0 16px; font-size:28px; font-weight:700; color:#0A0A1A; text-align:center;">Votre espace est prêt</h2>

<!-- Body -->
<p style="margin:0; font-size:16px; color:#64748B; line-height:1.6; text-align:center;">
L'équipe UNY a activé votre espace de travail pour ${companyName}. Créez votre compte pour commencer.
</p>

<!-- Button -->
<div style="text-align:center; margin:32px 0;">
<a href="${hardcodedUrl}" style="display:inline-block; background:#0A0A1A; color:#ffffff; font-size:15px; font-weight:600; padding:14px 32px; border-radius:8px; text-decoration:none;">Créer mon compte →</a>
</div>

<!-- Expiry note -->
<p style="margin:0; font-size:12px; color:#94A3B8; text-align:center;">Ce lien expire dans 7 jours.</p>

<!-- Divider -->
<div style="border-top:1px solid #E2E8F0; margin:24px 0;"></div>

<!-- Footer -->
<p style="margin:0; font-size:12px; color:#CBD5E1; text-align:center;">UNY • Sovereign AI for African Business</p>
</div>
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
        from: 'UNY <onboarding@resend.dev>',
        to: to,
        reply_to: 'team@uny.ai',
        subject: `Votre espace UNY est prêt pour ${companyName}`,
        html: html,
        headers: {
          'List-Unsubscribe': '<mailto:team@uny.ai?subject=unsubscribe>',
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Resend error:', data);
      return res.status(response.status).json({ success: false, error: data });
    }

    console.log('Email sent to:', to);
    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Email error:', error);
    return res.status(500).json({ success: false, error: error?.toString?.() || String(error) });
  }
}
