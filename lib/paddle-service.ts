import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { toast } from 'sonner';

export class PaddleService {
  private static paddleInstance: Paddle | undefined;

  static async initialize() {
    if (this.paddleInstance) return this.paddleInstance;

    const clientToken = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
    
    if (!clientToken) {
      console.warn('⚠️ PADDLE_CLIENT_TOKEN is missing. Please add it to your environment variables.');
      return null;
    }

    try {
      this.paddleInstance = await initializePaddle({
        environment: 'sandbox', // Use 'production' for live
        token: clientToken,
        eventCallback: (event) => {
          console.log('Paddle Event:', event);
        }
      });
      return this.paddleInstance;
    } catch (error) {
      console.error('Failed to initialize Paddle:', error);
      return null;
    }
  }

  static async openCheckout(priceId: string, orgId: string, email?: string) {
    const paddle = await this.initialize();
    
    if (!paddle) {
      toast.error('Le service de paiement est indisponible. Veuillez configurer Paddle.');
      return;
    }

    try {
      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customData: { org_id: orgId },
        customer: email ? { email } : undefined,
      });
    } catch (error: any) {
      console.error('Paddle Checkout Error:', error);
      toast.error('Erreur lors de l\'ouverture du paiement.');
    }
  }
}
