// Simple email send using Resend API
// This will be called from the client via POST

const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;

export async function sendInvitationEmail({
  to,
  companyName,
  inviteLink,
  expiresAt
}: {
  to: string;
  companyName: string;
  inviteLink: string;
  expiresAt: string;
}): Promise<{ success: boolean; error?: string }> {
  
  console.log('[Email] Attempting to send to:', to);
  console.log('[Email] API Key exists:', !!RESEND_API_KEY);
  
  if (!RESEND_API_KEY) {
    return { success: false, error: 'No RESEND_API_KEY' };
  }

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  <div style="background: #f8fafc; padding: 40px 20px;">
    <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
      <div style="background: #0A0A1A; padding: 24px; text-align: center;">
        <span style="color: white; font-size: 24px; font-weight: bold;">UNY</span>
      </div>
      <div style="padding: 32px; text-align: center;">
        <h1 style="margin: 0 0 16px; font-size: 24px; color: #0A0A1A;">Bienvenue sur UNY</h1>
        <p style="color: #64748b; margin: 0 0 24px;">
          Votre espace pour <strong>${companyName}</strong> est prêt.
        </p>
        <a href="${inviteLink}" style="display: inline-block; background: #2563EB; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">
          Créer mon compte
        </a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">Lien valable 7 jours</p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY.trim()}`,
      },
      body: JSON.stringify({
        from: 'ONY <onboarding@resend.dev>',
        to: to,
        subject: `Votre accès UNY est prêt — ${companyName}`,
        html: emailHtml,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      console.error('[Email] Resend failed:', res.status, data);
      return { success: false, error: `${res.status}: ${data.message || 'Failed'}` };
    }

    console.log('[Email] Success:', data);
    return { success: true };
  } catch (err: any) {
    console.error('[Email] Catch error:', err.message);
    return { success: false, error: err.message };
  }
}