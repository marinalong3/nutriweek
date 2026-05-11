const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { MercadoPagoConfig, Payment, PreApproval } = require('mercadopago');
const { requireAuth, supabase } = require('../middleware/auth');

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const PLANS = {
  pro: {
    name: 'NutriWeek Pro',
    price: 2490, // centavos
    price_brl: 24.90,
    stripe_price_id: process.env.STRIPE_PRO_PRICE_ID,
  },
  family: {
    name: 'NutriWeek Família',
    price: 3490,
    price_brl: 34.90,
    stripe_price_id: process.env.STRIPE_FAMILY_PRICE_ID,
  }
};

// POST /api/subscription/validate-coupon
router.post('/validate-coupon', requireAuth, async (req, res) => {
  const { code, plan } = req.body;
  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (!coupon) return res.status(404).json({ error: 'Cupom inválido ou expirado' });
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date())
    return res.status(400).json({ error: 'Cupom expirado' });
  if (coupon.max_uses && coupon.uses_count >= coupon.max_uses)
    return res.status(400).json({ error: 'Cupom esgotado' });
  if (coupon.applies_to !== 'all' && coupon.applies_to !== plan)
    return res.status(400).json({ error: `Cupom válido apenas para o plano ${coupon.applies_to}` });

  // Verifica se usuário já usou este cupom
  const { data: used } = await supabase
    .from('coupon_uses')
    .select('id')
    .eq('coupon_id', coupon.id)
    .eq('user_id', req.user.id)
    .single();

  if (used) return res.status(400).json({ error: 'Você já usou este cupom' });

  const planPrice = PLANS[plan].price_brl;
  const discount = coupon.discount_type === 'percent'
    ? (planPrice * coupon.discount_value / 100).toFixed(2)
    : coupon.discount_value;
  const finalPrice = Math.max(0, planPrice - discount).toFixed(2);

  res.json({
    valid: true,
    coupon_id: coupon.id,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: discount,
    final_price: finalPrice
  });
});

// POST /api/subscription/create-stripe-checkout
router.post('/create-stripe-checkout', requireAuth, async (req, res) => {
  const { plan, coupon_code } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Plano inválido' });

  const profile = req.user.profile;

  // Cria ou recupera customer no Stripe
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      name: profile.name,
      metadata: { user_id: profile.id }
    });
    customerId = customer.id;
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', profile.id);
  }

  // Aplica desconto de indicação se houver
  let discounts = [];
  if (profile.pending_discount > 0) {
    const coupon = await stripe.coupons.create({
      percent_off: profile.pending_discount,
      duration: 'once',
      name: 'Desconto por indicação'
    });
    discounts.push({ coupon: coupon.id });
    await supabase.from('profiles').update({ pending_discount: 0 }).eq('id', profile.id);
  }

  // Aplica cupom promocional
  let stripeCouponId;
  if (coupon_code) {
    const { data: dbCoupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', coupon_code.toUpperCase())
      .single();

    if (dbCoupon) {
      const sc = await stripe.coupons.create({
        ...(dbCoupon.discount_type === 'percent'
          ? { percent_off: dbCoupon.discount_value }
          : { amount_off: dbCoupon.discount_value * 100, currency: 'brl' }),
        duration: 'once',
        name: `Cupom ${coupon_code}`
      });
      stripeCouponId = sc.id;
      discounts.push({ coupon: sc.id });

      // Registra uso
      await supabase.from('coupon_uses').insert({ coupon_id: dbCoupon.id, user_id: profile.id });
      await supabase.from('coupons').update({ uses_count: dbCoupon.uses_count + 1 }).eq('id', dbCoupon.id);
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{ price: PLANS[plan].stripe_price_id, quantity: 1 }],
    discounts: discounts.length > 0 ? discounts : undefined,
    subscription_data: {
      metadata: { user_id: profile.id, plan }
    },
    success_url: `${process.env.FRONTEND_URL}/dashboard?success=true&plan=${plan}`,
    cancel_url: `${process.env.FRONTEND_URL}/planos?canceled=true`,
    metadata: { user_id: profile.id, plan }
  });

  res.json({ checkout_url: session.url });
});

// POST /api/subscription/create-pix
router.post('/create-pix', requireAuth, async (req, res) => {
  const { plan, coupon_code } = req.body;
  if (!PLANS[plan]) return res.status(400).json({ error: 'Plano inválido' });

  const profile = req.user.profile;
  let finalAmount = PLANS[plan].price_brl;

  // Aplica cupom
  if (coupon_code) {
    const { data: dbCoupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', coupon_code.toUpperCase())
      .single();
    if (dbCoupon) {
      finalAmount = dbCoupon.discount_type === 'percent'
        ? finalAmount * (1 - dbCoupon.discount_value / 100)
        : Math.max(0, finalAmount - dbCoupon.discount_value);
      await supabase.from('coupon_uses').insert({ coupon_id: dbCoupon.id, user_id: profile.id });
      await supabase.from('coupons').update({ uses_count: dbCoupon.uses_count + 1 }).eq('id', dbCoupon.id);
    }
  }

  // Aplica desconto de indicação
  if (profile.pending_discount > 0) {
    finalAmount = finalAmount * (1 - profile.pending_discount / 100);
    await supabase.from('profiles').update({ pending_discount: 0 }).eq('id', profile.id);
  }

  const payment = new Payment(mp);
  const pixPayment = await payment.create({
    body: {
      transaction_amount: parseFloat(finalAmount.toFixed(2)),
      description: `NutriWeek ${PLANS[plan].name} - 1 mês`,
      payment_method_id: 'pix',
      payer: { email: profile.email, first_name: profile.name },
      metadata: { user_id: profile.id, plan }
    }
  });

  res.json({
    payment_id: pixPayment.id,
    qr_code: pixPayment.point_of_interaction.transaction_data.qr_code,
    qr_code_base64: pixPayment.point_of_interaction.transaction_data.qr_code_base64,
    amount: finalAmount.toFixed(2),
    expires_at: pixPayment.date_of_expiration
  });
});

// GET /api/subscription/status
router.get('/status', requireAuth, async (req, res) => {
  const profile = req.user.profile;
  res.json({
    plan: profile.plan,
    status: profile.plan_status,
    trial_used: profile.trial_used
  });
});

// POST /api/subscription/cancel
router.post('/cancel', requireAuth, async (req, res) => {
  const { reason } = req.body;
  const profile = req.user.profile;

  // Verifica elegibilidade para estorno (7 dias corridos, apenas 1ª assinatura)
  const subscriptionStart = profile.subscription_start;
  const daysSinceStart = subscriptionStart
    ? Math.floor((Date.now() - new Date(subscriptionStart)) / 86400000)
    : 999;
  const refundEligible = daysSinceStart <= 7 && !profile.has_received_refund;

  // Registra solicitação
  const { data: cancelReq } = await supabase
    .from('cancellation_requests')
    .insert({
      user_id: profile.id,
      reason,
      refund_eligible: refundEligible,
      refund_status: refundEligible ? 'pending' : 'none',
      subscription_start: subscriptionStart
    })
    .select()
    .single();

  if (profile.stripe_subscription_id) {
    if (refundEligible) {
      // Cancela imediatamente com estorno
      await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      // Busca última fatura para estorno
      const invoices = await stripe.invoices.list({
        subscription: profile.stripe_subscription_id,
        limit: 1
      });
      if (invoices.data[0]) {
        await stripe.refunds.create({ payment_intent: invoices.data[0].payment_intent });
      }
      await supabase.from('cancellation_requests')
        .update({ refund_status: 'processed', processed_at: new Date() })
        .eq('id', cancelReq.id);
    } else {
      // Cancela no final do período
      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: true
      });
    }
  }

  await supabase.from('profiles')
    .update({ plan: 'trial', plan_status: refundEligible ? 'canceled' : 'active' })
    .eq('id', profile.id);

  res.json({
    message: refundEligible
      ? 'Assinatura cancelada com estorno. O valor será devolvido em até 5 dias úteis.'
      : 'Assinatura cancelada. Você continua com acesso até o fim do período pago.',
    refund_eligible: refundEligible
  });
});

module.exports = router;
