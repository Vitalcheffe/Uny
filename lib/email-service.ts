/**
 * Email Service for UNY
 * Uses Resend API to send invitation emails
 * Add RESEND_API_KEY to your environment variables
 */

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || import.meta.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
const APP_URL = import.meta.env.VITE_APP_URL || process.env.VITE_APP_URL || process.env.APP_URL || 'https://uny-gamma.vercel.app';

interface SendInvitationParams {
  to: string;
  companyName: string;
  inviteLink: string;
  expiresAt: string;
}

/**
 * Send invitation email using Resend API
 */
export async function sendInvitationEmail({
  to,
  companyName,
  inviteLink,
  expiresAt
}: SendInvitationParams): Promise<{ success: boolean; error?: string }> {
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre accès UNY est prêt</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0A0A1A; padding: 24px 32px; text-align: center;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.05em;">UNY</span>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px; text-align: center;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #0A0A1A;">
                Bienvenue sur UNY
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; color: #475569; line-height: 1.6;">
                Votre espace de travail souverain pour <strong>${companyName}</strong> a été activé.
              </p>
              
              <a href="${inviteLink}" style="display: inline-block; background-color: #2563EB; color: #ffffff; font-size: 16px; font-weight: 600; padding: 16px 32px; border-radius: 12px; text-decoration: none; margin: 8px 0;">
                Accéder à mon espace
              </a>
              
              <p style="margin: 24px 0 0; font-size: 14px; color: #94a3b8;">
                Lien valable 7 jours • ${expiresAt}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © 2026 UNY — Sovereign Operating System for African Businesses
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  // If no RESEND_API_KEY, log and return error
  if (!RESEND_API_KEY) {
    console.log('[Email Service] RESEND_API_KEY is not set!');
    console.log('[Email Service] Available env vars:', Object.keys(import.meta.env).filter(k => k.includes('RESEND')));
    return { success: false, error: 'RESEND_API_KEY not configured in Vercel' };
  }

  console.log('[Email Service] RESEND_API_KEY found, sending to:', to);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'UNY <onboarding@resend.dev>',
        to: [to],
        subject: `Votre accès UNY est prêt — ${companyName}`,
        html: emailHtml
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Email Service] Resend error:', error);
      return { success: false, error: 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Email Service] Error:', error);
    return { success: false, error: String(error) };
  }
}