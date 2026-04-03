/**
 * ⚡ UNY PROTOCOL: EXPRESS SERVER
 *
 * Backend API server for UNY operating system.
 * Handles: NER masking, Paddle webhooks, checkout helpers.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Environment, LogLevel, Paddle } from '@paddle/paddle-node-sdk';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { NEREngine } from './lib/ner-engine';
import { PaddleService } from './lib/paddle-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Environment Validation ---
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️ Missing env var: ${envVar}. Some features may be unavailable.`);
  }
}

// --- Initialize Services ---
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

const paddle = process.env.PADDLE_API_KEY
  ? new Paddle(process.env.PADDLE_API_KEY, {
      environment: Environment.sandbox,
      logLevel: LogLevel.verbose,
    })
  : null;

const nerEngine = process.env.GEMINI_API_KEY
  ? new NEREngine(process.env.GEMINI_API_KEY)
  : null;

// --- In-Memory Session Store (TTL: 10 minutes) ---
const sessionStore = new Map<string, { mapping: Map<string, string>; expires: number }>();

const SESSION_TTL = 10 * 60 * 1000; // 10 minutes

const setSession = (sessionId: string, mapping: Map<string, string>) => {
  sessionStore.set(sessionId, {
    mapping,
    expires: Date.now() + SESSION_TTL,
  });
  // Clean up expired sessions periodically
  if (sessionStore.size > 1000) {
    const now = Date.now();
    for (const [key, value] of sessionStore) {
      if (value.expires < now) sessionStore.delete(key);
    }
  }
};

const getSession = (sessionId: string): Map<string, string> | null => {
  const session = sessionStore.get(sessionId);
  if (!session) return null;
  if (session.expires < Date.now()) {
    sessionStore.delete(sessionId);
    return null;
  }
  return session.mapping;
};

// --- Nodemailer Transport ---
const createEmailTransport = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('⚠️ SMTP not configured. Email sending disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: SMTP_PORT === '465',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const emailTransport = createEmailTransport();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // ============================================================
  // PADDLE WEBHOOK (raw body needed for signature verification)
  // ============================================================
  app.post(
    '/api/paddle/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res) => {
      try {
        const signature = req.headers['paddle-signature'] as string;
        const secretKey = process.env.PADDLE_WEBHOOK_SECRET || '';
        const rawBody = req.body.toString();

        if (!secretKey || !paddle) {
          return res.status(503).json({ error: 'Paddle not configured' });
        }

        // Verify signature using our PaddleService
        const isValid = PaddleService.verifyWebhookSignature(
          rawBody,
          signature,
          secretKey
        );

        if (!isValid) {
          return res.status(401).json({ error: 'Invalid webhook signature' });
        }

        // Parse and handle the event
        const event = JSON.parse(rawBody);
        const result = await PaddleService.handleWebhookEvent(event);

        res.json(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ [Server] Paddle webhook error:', message);
        res.status(400).json({ error: message });
      }
    }
  );

  // JSON middleware for all other routes
  app.use(express.json());
  app.use(cors());

  // Security: Helmet headers
  app.use(helmet());
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }));

  // Security: Rate limiting
  const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Trop de demandes. Réessayez plus tard.' },
  });

  const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // limit AI requests to 20 per minute
    message: { error: 'Limite IA dépassée. Réessayez dans une minute.' },
  });

  app.use('/api/', publicLimiter);
  app.use('/api/ai/', aiLimiter);
  app.use('/api/gemini/', aiLimiter);

  // ============================================================
  // NER ENGINE - PII Masking
  // ============================================================
  app.post('/api/ner/mask', async (req, res) => {
    try {
      const { text } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required' });
      }

      if (!nerEngine) {
        return res.status(503).json({
          error: 'NER engine unavailable. Check GEMINI_API_KEY.',
        });
      }

      const { anonymized, mapping, entitiesDetected } =
        await nerEngine.anonymize(text);

      // Store mapping in session store for unmasking
      const sessionId = crypto.randomUUID();
      setSession(sessionId, mapping);

      res.json({
        sessionId,
        anonymized,
        entitiesDetected,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'NER failed';
      console.error('❌ [Server] NER mask error:', message);
      res.status(500).json({ error: message });
    }
  });

  // ============================================================
  // GEMINI VISION - Org Chart Analysis
  // ============================================================
  app.post('/api/gemini/vision', async (req, res) => {
    try {
      const { image, mimeType } = req.body;

      if (!image || !mimeType) {
        return res.status(400).json({ error: 'Image and mimeType required' });
      }

      if (!nerEngine) {
        return res.status(503).json({
          error: 'Vision engine unavailable. Check GEMINI_API_KEY.',
        });
      }

      // Call Gemini with vision
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

      const prompt = `Extract all people visible in this organizational chart or document. 
For each person, return a JSON array with: { "name": string, "role": string, "department": string|null, "reportsTo": string|null }. 
Return only valid JSON, no markdown.`;

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: image,
            },
          },
        ],
      });

      const responseText = result.text || '';
      
      // Parse JSON response
      const jsonText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const parsed = JSON.parse(jsonText);
      const employees = parsed.employees || parsed;

      res.json({ employees });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Vision analysis failed';
      console.error('❌ [Server] Vision error:', message);
      res.status(500).json({ error: message });
    }
  });

  // NER Unmask endpoint
  app.post('/api/ner/unmask', async (req, res) => {
    try {
      const { sessionId, text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      // Retrieve mapping from session store
      const mapping = getSession(sessionId);
      if (!mapping) {
        return res.status(404).json({ error: 'Session expired or not found' });
      }

      // Deanonymize using the stored mapping
      const original = nerEngine
        ? await nerEngine.deanonymize(text, mapping)
        : text;

      res.json({ original });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unmask failed';
      console.error('❌ [Server] NER unmask error:', message);
      res.status(500).json({ error: message });
    }
  });

  // ============================================================
  // PADDLE CHECKOUT HELPER
  // ============================================================
  app.post('/api/paddle/create-checkout', async (_req, res) => {
    // Paddle v2 uses client-side checkout via Paddle.js
    // This endpoint exists for server-side validation if needed
    res.json({ success: true, message: 'Use client-side Paddle.js checkout' });
  });

  // ============================================================
  // SOVEREIGN AI CHAT
  // ============================================================
  app.post('/api/ai/chat', async (req, res) => {
    try {
      let { message, orgId, history } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI not configured' });
      }

      // AI Quota check (if orgId provided)
      if (orgId) {
        const quota = await checkAIQuota(orgId);
        if (!quota.allowed) {
          return res.status(429).json({
            error: 'Monthly AI quota exceeded',
            used: quota.used,
            limit: quota.limit,
          });
        }
      }

      // Build conversation context
      const systemPrompt = `Tu es UNY, un assistant IA expert pour les entreprises africaines.
Tu helps with: finance, HR, projects, strategy, compliance loi 09-08 (Morocco).
Respond in French or English based on the question language.
Be concise and professional.`;

      // Call Gemini
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const contents: any[] = [{ text: systemPrompt }];
      
      // Add history
      if (history && Array.isArray(history)) {
        for (const h of history.slice(-10)) {
          contents.push({ text: h.content });
        }
      }
      contents.push({ text: message });

      const result = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents,
      });

      const response = result.text || '';

      // Record AI usage after successful response
      if (orgId) {
        const userId = (req as any).user?.id || null;
        await recordAIUsage(orgId, userId || '', message.length, response.length);
      }

      // Save to conversation history in Supabase (if configured)
      if (supabaseAdmin && orgId) {
        const { error: insertError } = await supabaseAdmin.from('conversations').insert({
          org_id: orgId,
          user_message: message,
          ai_response: response,
        });
        if (insertError) {
          console.warn('Failed to save conversation:', insertError);
        }
      }

      res.json({ response });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'AI chat failed';
      console.error('❌ [Server] AI chat error:', message);
      res.status(500).json({ error: message });
    }
  });

  // ============================================================
  // PADDLE STATS (Admin Dashboard)
  // ============================================================
  app.get('/api/paddle/stats', async (_req, res) => {
    try {
      // Check if Paddle is configured
      if (!process.env.PADDLE_API_KEY || !paddle) {
        return res.json({
          mrr: 0,
          pending: 0,
          failed: 0,
          configured: false,
        });
      }

      // Query real Paddle API for subscription data
      const subList = await paddle.subscriptions.list() as any;
      const subscriptions = subList?.results || [];
      
      let mrr = 0;
      let pending = 0;
      let failed = 0;

      for (const sub of subscriptions) {
        if (sub.status === 'active') {
          mrr += sub.recurringPriceValue || 0;
        } else if (sub.status === 'pending') {
          pending++;
        } else if (sub.status === 'past_due' || sub.status === 'failed') {
          failed++;
        }
      }

      res.json({
        mrr: mrr / 100, // Convert from cents
        pending,
        failed,
        configured: true,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Stats error';
      console.error('❌ [Server] Paddle stats error:', message);
      res.json({
        mrr: 0,
        pending: 0,
        failed: 0,
        configured: true,
        error: message,
      });
    }
  });

  // ============================================================
  // ORGANIZATION CREATION (Onboarding flow)
  // ============================================================
  app.post('/api/organizations/spawn', async (req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Supabase not configured' });
      }

      const { companyName, email, sector, teamSize } = req.body;

      if (!companyName || !email) {
        return res.status(400).json({ error: 'companyName and email required' });
      }

      const slug = companyName
        .replace(/[^A-Za-z0-9]/g, '-')
        .toUpperCase()
        .slice(0, 30);
      const timestamp = Date.now().toString().slice(-4);
      const orgId = `${slug}-${timestamp}`;

      const { error } = await supabaseAdmin.from('organizations').insert({
        id: orgId,
        name: companyName,
        sector: sector || 'TECH',
        team_size: teamSize || '1',
        currency: 'MAD',
        email,
        subscription_status: 'trial',
        metadata: {
          billing_type: 'RECURRING',
          primary_goal: 'CASHFLOW',
          ai_preference: 'ASSISTED',
        },
      });

      if (error) throw error;

      console.log(`✅ [Server] Organization created: ${orgId}`);
      res.json({ success: true, orgId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Spawn failed';
      console.error('❌ [Server] Org spawn error:', message);
      res.status(500).json({ error: message });
    }
  });

  // ============================================================
  // EMPLOYEE INVITATION
  // ============================================================
  app.post('/api/invitations/send', async (req, res) => {
    try {
      const { employeeEmail, employeeName, role, orgId } = req.body;

      if (!employeeEmail || !orgId) {
        return res.status(400).json({ error: 'employeeEmail and orgId required' });
      }

      // Generate invite token
      const inviteToken = crypto.randomUUID();
      
      // Store invitation in Supabase
      if (supabaseAdmin) {
        const { error: insertError } = await supabaseAdmin.from('invitations').insert({
          org_id: orgId,
          email: employeeEmail,
          name: employeeName || '',
          role: role || 'member',
          token: inviteToken,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });

        if (insertError) {
          console.warn('Failed to store invitation:', insertError);
        }
      }

      // Send invitation email
      const appUrl = process.env.VITE_APP_URL || 'https://uny-gamma.vercel.app';
      const inviteUrl = `${appUrl}/register?token=${inviteToken}&orgId=${orgId}`;

      // Send email via nodemailer if configured
      if (emailTransport) {
        try {
          await emailTransport.sendMail({
            from: process.env.SMTP_FROM || 'UNY <noreply@uny.com>',
            to: employeeEmail,
            subject: `Invitation to UNY - Set up your account`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #1a1615;">Welcome to UNY</h1>
                <p>Hi${employeeName ? ` ${employeeName}` : ''},</p>
                <p>You've been invited to join UNY, the sovereign operating system for African businesses.</p>
                <a href="${inviteUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">
                  Accept Invitation
                </a>
                <p style="color: #666; font-size: 14px;">This link expires in 7 days.</p>
              </div>
            `,
          });
          console.log(`📧 Invitation email sent to ${employeeEmail}`);
        } catch (emailErr) {
          console.error('Failed to send invitation email:', emailErr);
        }
      } else {
        console.warn('⚠️ SMTP not configured. Email not sent. Invite URL:', inviteUrl);
      }

      res.json({ 
        success: true, 
        inviteUrl,
        message: 'Invitation sent successfully' 
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invitation failed';
      console.error('❌ [Server] Invitation error:', message);
      res.status(500).json({ error: message });
    }
  });

  // ============================================================
  // AI QUOTA CHECK MIDDLEWARE
  // ============================================================
  const checkAIQuota = async (orgId: string): Promise<{ allowed: boolean; used: number; limit: number }> => {
    if (!supabaseAdmin) return { allowed: true, used: 0, limit: 5000 };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count } = await supabaseAdmin
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', monthStart);

    const used = count || 0;
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('plan')
      .eq('id', orgId)
      .single();

    const limits: Record<string, number> = { starter: 500, pro: 5000, enterprise: 999999999 };
    const limit = limits[org?.plan || 'starter'];

    return { allowed: used < limit, used, limit };
  };

  // Record AI usage
  const recordAIUsage = async (orgId: string, userId: string, tokensIn: number, tokensOut: number) => {
    if (!supabaseAdmin) return;
    const { error } = await supabaseAdmin.from('ai_usage').insert({
      org_id: orgId,
      user_id: userId,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
    });
    if (error) console.warn('Failed to record AI usage:', error);
  };

  // ============================================================
  // HEALTH CHECK
  // ============================================================
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
  });

  // ============================================================
  // AUDIT REQUEST MANAGEMENT
  // ============================================================
  
  // Get all pending audit requests (admin only)
  app.get('/api/admin/audit-requests', async (_req, res) => {
    try {
      if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Database not configured' });
      }
      
      const { data, error } = await supabaseAdmin
        .from('audit_requests')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json({ requests: data || [] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch';
      res.status(500).json({ error: message });
    }
  });

  // Approve audit request and send invitation
  app.post('/api/admin/approve-audit', async (req, res) => {
    try {
      const { requestId, orgName } = req.body;
      
      if (!requestId) {
        return res.status(400).json({ error: 'requestId required' });
      }

      if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Database not configured' });
      }

      // Get the audit request
      const { data: request, error: fetchError } = await supabaseAdmin
        .from('audit_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      // Generate invite token
      const inviteToken = crypto.randomUUID();
      const appUrl = process.env.VITE_APP_URL || 'https://uny-gamma.vercel.app';
      const inviteUrl = `${appUrl}/register?token=${inviteToken}`;

      // Update status to APPROVED
      const { error: updateError } = await supabaseAdmin
        .from('audit_requests')
        .update({ 
          status: 'APPROVED',
          invitation_token: inviteToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Send approval email to company
      if (emailTransport) {
        await emailTransport.sendMail({
          from: process.env.SMTP_FROM || 'UNY <noreply@uny.com>',
          to: request.email,
          subject: `Votre demande UNY a été approuvée!`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #1a1615;">🎉 Bienvenue chez UNY!</h1>
              <p>Bonjour,</p>
              <p>Votre demande d'audit pour <strong>${request.company_name}</strong> a été approuvée!</p>
              <p>Cliquez ci-dessous pour créer votre compte et configurer votre entreprise:</p>
              <a href="${inviteUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; margin: 24px 0; font-size: 18px;">
                Créer mon compte UNY
              </a>
              <p style="color: #666; font-size: 14px;">Ce lien expire dans 7 jours.</p>
            </div>
          `,
        });
        console.log(`📧 Approval email sent to ${request.email}`);
      } else {
        console.log(`⚠️ SMTP not configured. Invite URL: ${inviteUrl}`);
      }

      res.json({ success: true, inviteUrl });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Approval failed';
      console.error('❌ [Server] Approval error:', message);
      res.status(500).json({ error: message });
    }
  });

  // Reject audit request
  app.post('/api/admin/reject-audit', async (req, res) => {
    try {
      const { requestId, reason } = req.body;
      
      if (!requestId) {
        return res.status(400).json({ error: 'requestId required' });
      }

      if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Database not configured' });
      }

      const { error: updateError } = await supabaseAdmin
        .from('audit_requests')
        .update({ 
          status: 'REJECTED',
          rejection_reason: reason || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      res.json({ success: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Rejection failed';
      res.status(500).json({ error: message });
    }
  });

  // ============================================================
  // VITE DEV SERVER INTEGRATION
  // ============================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UNY Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
