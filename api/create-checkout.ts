
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
  const { org_id, success_url, cancel_url } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Get org details
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', org_id)
    .single();
  
  // Create or retrieve Stripe customer
  let customerId = org?.stripe_customer_id;
  
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: org?.metadata?.owner_email,
      metadata: { org_id }
    });
    
    customerId = customer.id;
    
    await supabase
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', org_id);
  }
  
  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: 'price_1234567890', // Default Enterprise Core Price ID
        quantity: 1
      }
    ],
    success_url,
    cancel_url,
    metadata: { org_id }
  });
  
  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
