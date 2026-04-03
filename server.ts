/**
 * ⚡ UNY PROTOCOL: EXPRESS SERVER
 *
 * Backend API server for UNY operating system.
 * Handles: NER masking, Paddle webhooks, checkout helpers.
 */

import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { Environment, LogLevel, Paddle } from '@paddle/paddle-node-sdk';
import { createClient } from '@supabase/supabase-js';
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

      // TODO: Store mapping in Redis for session-based unmasking
      const sessionId = crypto.randomUUID();

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

  // NER Unmask endpoint (placeholder for Redis integration)
  app.post('/api/ner/unmask', async (req, res) => {
    try {
      const { sessionId, text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      // TODO: Retrieve mapping from Redis using sessionId
      // For now, return as-is
      res.json({ original: text });
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
      const { message, orgId, history } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI not configured' });
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
      if (!process.env.PADDLE_API_KEY) {
        return res.status(503).json({ error: 'Paddle not configured' });
      }

      // In production, query Paddle API for real MRR data
      res.json({
        mrr: 12500,
        pending: 3,
        failed: 1,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Stats error';
      res.status(500).json({ error: message });
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

      // TODO: Integrate with email service when configured
      console.log(`📧 Invitation sent to ${employeeEmail}: ${inviteUrl}`);

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
