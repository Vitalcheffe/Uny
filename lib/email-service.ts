/**
 * ⚡ UNY PROTOCOL: EMAIL SERVICE
 *
 * Handles transactional emails via Supabase Edge Functions.
 * Supports invitation emails and password reset flows.
 * Falls back to console logging if Edge Functions are unavailable.
 */

import { createClient } from '@supabase/supabase-js';

interface EmailResult {
  success: boolean;
  inviteUrl?: string;
  resetUrl?: string;
  error?: string;
}

/**
 * Create a Supabase admin client for server-side email operations.
 * Requires SUPABASE_SERVICE_ROLE_KEY (never expose in browser).
 */
function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase admin credentials for email service.');
  }

  return createClient(url, serviceKey);
}

/**
 * Send an invitation email when a new organization is approved.
 *
 * @param email - Recipient email address
 * @param organizationName - Name of the approved organization
 * @param inviteToken - One-time invite token for account creation
 * @returns Result with success status and fallback invite URL
 */
export async function sendInvitationEmail(
  email: string,
  organizationName: string,
  inviteToken: string
): Promise<EmailResult> {
  const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
  const inviteUrl = `${appUrl}/register/${inviteToken}`;

  const html = buildInvitationHtml(organizationName, inviteUrl);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: `Bienvenue sur UNY — ${organizationName}`,
        html,
      },
    });

    if (error) throw error;

    console.log(`✅ [Email] Invitation sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ [Email] Invitation failed:', error);
    console.log(`📧 [Email] Fallback invite URL: ${inviteUrl}`);
    return { success: false, inviteUrl, error: String(error) };
  }
}

/**
 * Send a password reset email.
 *
 * @param email - User email address
 * @param resetToken - One-time reset token
 * @returns Result with success status and fallback reset URL
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<EmailResult> {
  const appUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
  const resetUrl = `${appUrl}/reset-password/${resetToken}`;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: 'Réinitialisation de votre mot de passe UNY',
        html: buildPasswordResetHtml(resetUrl),
      },
    });

    if (error) throw error;

    console.log(`✅ [Email] Password reset sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ [Email] Password reset failed:', error);
    console.log(`🔑 [Email] Fallback reset URL: ${resetUrl}`);
    return { success: false, resetUrl, error: String(error) };
  }
}

/**
 * Build the invitation email HTML template.
 */
function buildInvitationHtml(organizationName: string, inviteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;padding:0 20px;">
    <div style="background:#1e3a8a;color:white;padding:32px;border-radius:16px 16px 0 0;">
      <h1 style="margin:0;font-size:28px;font-weight:800;">Bienvenue sur UNY</h1>
      <p style="margin:8px 0 0;opacity:0.85;font-size:14px;">Votre OS souverain pour entreprise</p>
    </div>
    <div style="background:white;padding:40px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
      <p style="font-size:16px;line-height:1.7;color:#334155;">
        Bonjour,
      </p>
      <p style="font-size:16px;line-height:1.7;color:#334155;">
        Votre demande d'audit pour <strong>${organizationName}</strong> a été approuvée.
        Vous êtes maintenant invité(e) à créer votre compte administrateur.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${inviteUrl}"
           style="display:inline-block;padding:16px 40px;background:#1e3a8a;color:white;
                  text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">
          Créer mon compte
        </a>
      </div>
      <p style="font-size:13px;color:#94a3b8;line-height:1.6;">
        Ce lien expire dans 48 heures.<br>
        Si vous n'avez pas demandé cette invitation, ignorez cet email.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build the password reset email HTML template.
 */
function buildPasswordResetHtml(resetUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;padding:0 20px;">
    <div style="background:white;padding:40px;border:1px solid #e2e8f0;border-radius:16px;">
      <h2 style="color:#1e293b;margin:0 0 16px;">Réinitialisation de mot de passe</h2>
      <p style="color:#475569;line-height:1.7;">
        Cliquez sur le bouton ci-dessous pour réinitialiser votre mot de passe UNY.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}"
           style="display:inline-block;padding:14px 32px;background:#1e3a8a;color:white;
                  text-decoration:none;border-radius:10px;font-weight:600;">
          Réinitialiser mon mot de passe
        </a>
      </div>
      <p style="font-size:13px;color:#94a3b8;">
        Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
      </p>
    </div>
  </div>
</body>
</html>`;
}
