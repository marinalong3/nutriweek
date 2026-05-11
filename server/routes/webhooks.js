const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../middleware/auth');

// POST /api/webhooks/stripe
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { user_id, plan } = session.metadata;

      await supabase.from('profiles').update({
        plan,
        plan_status: 'active',
        stripe_subscription_id: session.subscription,
        subscription_start: new Date().toISOString(),
        trial_used: true
      }).eq('id', user_id);

      // Processa indicação
      const { data: referral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', user_id)
        .eq('status', 'pending')
        .single();

      if (referral) {
        await supabase.from('referrals').update({
          status: 'converted',
          converted_at: new Date().toISOString()
        }).eq('id', referral.id);

        // Dá 30% de desconto na próxima mensalidade do indicador
        await supabase.from('profiles').update({
          pending_discount: 30
        }).eq('id', referral.referrer_id);
      }

      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
      const userId = subscription.metadata.user_id;
      await supabase.from('profiles')
        .update({ plan_status: 'past_due' })
        .eq('stripe_subscription_id', invoice.subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      await supabase.from('profiles').update({
        plan: 'trial',
        plan_status: 'canceled',
        stripe_subscription_id: null
      }).eq('stripe_subscription_id', subscription.id);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      if (invoice.billing_reason === 'subscription_cycle') {
        await supabase.from('profiles')
          .update({ plan_status: 'active' })
          .eq('stripe_subscription_id', invoice.subscription);
      }
      break;
    }
  }

  res.json({ received: true });
});

// POST /api/webhooks/mercadopago
router.post('/mercadopago', async (req, res) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    const { MercadoPagoConfig, Payment } = require('mercadopago');
    const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
    const paymentClient = new Payment(mp);

    const payment = await paymentClient.get({ id: data.id });

    if (payment.status === 'approved') {
      const { user_id, plan } = payment.metadata;
      await supabase.from('profiles').update({
        plan,
        plan_status: 'active',
        mp_subscription_id: payment.id.toString(),
        subscription_start: new Date().toISOString(),
        trial_used: true
      }).eq('id', user_id);
    }
  }

  res.json({ received: true });
});

module.exports = router;
