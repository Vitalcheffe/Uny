/**
 * ⚡ UNY PROTOCOL: PADDLE PAYMENT SERVICE
 *
 * Handles Paddle.js client-side checkout and backend webhook verification.
 * Manages subscription lifecycle for multi-tenant organizations.
 */

import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { toast } from 'sonner';

interface PaddleWebhookEvent {
  event_type: string;
  data: {
    customer_id?: string;
    subscription_id?: string;
    status?: string;
    custom_data?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export class PaddleService {
  private static paddleInstance: Paddle | undefined;

  /**
   * Initialize the Paddle.js client SDK (browser-side).
   * Safe to call multiple times — returns cached instance.
   */
  static async initialize(): Promise<Paddle | null> {
    if (this.paddleInstance) return this.paddleInstance;

    const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;

    if (!clientToken) {
      console.warn('⚠️ VITE_PADDLE_CLIENT_TOKEN is missing. Payment features disabled.');
      return null;
    }

    try {
      this.paddleInstance = await initializePaddle({
        environment: 'sandbox',
        token: clientToken,
        eventCallback: (event) => {
          console.log('🏓 [Paddle] Event:', event.name);
        },
      });
      return this.paddleInstance;
    } catch (error) {
      console.error('❌ [Paddle] Initialization failed:', error);
      return null;
    }
  }

  /**
   * Open the Paddle checkout overlay for a subscription purchase.
   *
   * @param priceId - Paddle price/plan ID
   * @param orgId - Organization ID to associate with the subscription
   * @param email - Optional pre-fill customer email
   */
  static async openCheckout(
    priceId: string,
    orgId: string,
    email?: string
  ): Promise<void> {
    const paddle = await this.initialize();

    if (!paddle) {
      toast.error('Le service de paiement est indisponible.');
      return;
    }

    try {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: { org_id: orgId },
        customer: email ? { email } : undefined,
      });
    } catch (error) {
      console.error('❌ [Paddle] Checkout error:', error);
      toast.error("Error during l'ouverture du paiement.");
    }
  }

  /**
   * Verify a Paddle webhook signature (server-side).
   * Uses HMAC-SHA256 to ensure the payload hasn't been tampered with.
   *
   * @param rawBody - Raw request body string
   * @param signature - Paddle-Signature header value
   * @param secret - Webhook secret from Paddle dashboard
   * @returns Whether the signature is valid
   */
  static verifyWebhookSignature(
    rawBody: string,
    signature: string,
    secret: string
  ): boolean {
    if (!signature || !secret) return false;

    try {
      // Paddle v2 signatures use format: ts=timestamp;h1=hash
      const parts = signature.split(';');
      const timestamp = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
      const hash = parts.find((p) => p.startsWith('h1='))?.split('=')[1];

      if (!timestamp || !hash) return false;

      // In Node.js environment, use crypto
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const crypto = require('crypto');
      const signedPayload = `${timestamp}:${rawBody}`;
      const expectedHash = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(hash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Process a Paddle webhook event (server-side).
   * Routes events to appropriate handlers based on event_type.
   */
  static async handleWebhookEvent(
    event: PaddleWebhookEvent
  ): Promise<{ success: boolean; action?: string }> {
    const { event_type, data } = event;

    console.log(`🏓 [Paddle] Processing webhook: ${event_type}`);

    switch (event_type) {
      case 'subscription.created':
        return this.handleSubscriptionChange(data, 'active');

      case 'subscription.updated':
        return this.handleSubscriptionChange(data, data.status || 'active');

      case 'subscription.cancelled':
        return this.handleSubscriptionChange(data, 'cancelled');

      case 'transaction.completed':
        console.log('💰 [Paddle] Transaction completed:', data.subscription_id);
        return { success: true, action: 'transaction_logged' };

      default:
        console.log(`ℹ️ [Paddle] Unhandled event type: ${event_type}`);
        return { success: true, action: 'ignored' };
    }
  }

  /**
   * Update organization subscription status in Supabase.
   */
  private static async handleSubscriptionChange(
    data: PaddleWebhookEvent['data'],
    status: string
  ): Promise<{ success: boolean; action: string }> {
    const orgId = data.custom_data?.org_id as string | undefined;

    if (!orgId) {
      console.warn('⚠️ [Paddle] Webhook missing org_id in custom_data');
      return { success: false, action: 'missing_org_id' };
    }

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error } = await supabase
        .from('organizations')
        .update({
          subscription_status: status,
          stripe_customer_id: data.customer_id,
        })
        .eq('id', orgId);

      if (error) throw error;

      console.log(`✅ [Paddle] Org ${orgId} subscription → ${status}`);
      return { success: true, action: `subscription_${status}` };
    } catch (error) {
      console.error('❌ [Pandle] Failed to update org:', error);
      return { success: false, action: 'db_error' };
    }
  }
}
