import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
});

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ status: 'free' }, { headers: corsHeaders });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id, subscription_expires_at')
      .eq('id', userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return Response.json({ status: 'free' }, { headers: corsHeaders });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      return Response.json({ status: 'pro' }, { headers: corsHeaders });
    }

    const payments = await stripe.paymentIntents.list({
      customer: profile.stripe_customer_id,
      limit: 10,
    });

    const hasLifetime = payments.data.some(
      (payment) => payment.metadata?.plan === 'lifetime' && payment.status === 'succeeded',
    );

    return Response.json(
      { status: hasLifetime ? 'lifetime' : 'free' },
      { headers: corsHeaders },
    );
  } catch {
    return Response.json({ status: 'free' }, { headers: corsHeaders });
  }
});
