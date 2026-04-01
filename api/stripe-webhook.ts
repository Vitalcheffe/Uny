
// Comment: Added Deno declaration to fix "Cannot find name 'Deno'" errors in TypeScript environments
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response>): void;
};
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion
});

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!;
  const body = await req.text();
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.org_id;
      
      if (orgId) {
        await supabase
          .from('organizations')
          .update({
            subscription_status: 'active',
            current_period_end: new Date(session.expires_at * 1000).toISOString()
          })
          .eq('id', orgId);
      }
      break;
    }
    
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as any;
      const orgId = subscription.metadata?.org_id;
      
      if (orgId) {
        await supabase
          .from('organizations')
          .update({
            subscription_status: subscription.status === 'active' ? 'active' : 
                                 subscription.status === 'past_due' ? 'past_due' : 'canceled',
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          })
          .eq('id', orgId);
      }
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();
      
      if (org) {
        await supabase
          .from('organizations')
          .update({ subscription_status: 'past_due' })
          .eq('id', org.id);
      }
      break;
    }
  }
  
  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
