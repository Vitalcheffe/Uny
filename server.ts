import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { Environment, LogLevel, Paddle } from '@paddle/paddle-node-sdk';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Admin Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Paddle Backend SDK
const paddle = new Paddle(process.env.PADDLE_API_KEY || '', {
  environment: Environment.sandbox, // Change to production for live
  logLevel: LogLevel.verbose,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for Paddle Webhooks (needs raw body)
  app.post('/api/paddle/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const signature = req.headers['paddle-signature'] as string;
    const secretKey = process.env.PADDLE_WEBHOOK_SECRET || '';

    if (!secretKey || !process.env.PADDLE_API_KEY) {
      return res.status(400).send('Paddle not configured');
    }

    try {
      if (signature) {
        const eventData = await paddle.webhooks.unmarshal(req.body.toString(), secretKey, signature);
        
        // Handle the event
        if (eventData?.eventType === 'transaction.completed') {
          const transaction = eventData.data;
          const orgId = transaction.customData?.org_id;
          
          console.log('✅ Payment successful for org:', orgId);
          
          if (orgId && supabaseServiceKey) {
            // Update organization subscription status
            const { error } = await supabaseAdmin
              .from('organizations')
              .update({ 
                subscription_status: 'active',
                // Add 30 days for renewal
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
              .eq('id', orgId);
              
            if (error) {
              console.error('❌ Failed to update Supabase:', error);
            } else {
              console.log('✅ Supabase updated successfully.');
            }
          }
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Standard JSON middleware for other routes
  app.use(express.json());
  app.use(cors());

  // --- NER ENGINE (Powered by Gemini) ---
  app.post('/api/ner/mask', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: 'Text required' });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Gemini API Key missing' });

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
      You are an advanced Named Entity Recognition (NER) and Data Anonymization engine.
      Your task is to find and mask PII (Personally Identifiable Information) in the following text.
      
      Mask the following entities with [REDACTED]:
      - Names of people
      - Email addresses
      - Phone numbers
      - National ID numbers (CIN, ICE, SSN)
      - Exact financial amounts (replace with [AMOUNT])
      
      Return ONLY the masked text, nothing else.
      
      Original Text:
      ${text}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      res.json({ maskedText: response.text });
    } catch (error: any) {
      console.error('NER Engine Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- PADDLE CHECKOUT (Optional Backend Helper) ---
  app.post('/api/paddle/create-checkout', async (req, res) => {
    // Paddle v2 uses client-side checkout primarily.
    // This endpoint can be used to generate a transaction if needed,
    // but for now we just return success as the frontend handles it via Paddle.js
    res.json({ success: true });
  });

  // --- PADDLE STATS (Admin Dashboard) ---
  app.get('/api/paddle/stats', async (req, res) => {
    try {
      if (!process.env.PADDLE_API_KEY) {
        return res.status(500).json({ error: 'Paddle not configured' });
      }
      
      // In a real scenario, you would query Paddle API for MRR, Pending, Failed.
      // Paddle Node SDK provides access to transactions, subscriptions, etc.
      // For demonstration, we'll return simulated real data structure.
      res.json({
        mrr: 12500,
        pending: 3,
        failed: 1
      });
    } catch (error: any) {
      console.error('Paddle Stats Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 UNY Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
