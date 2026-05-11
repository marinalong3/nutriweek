const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin, supabase } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);

// GET /api/admin/users
router.get('/users', async (req, res) => {
  const { page = 1, limit = 50, plan, search } = req.query;
  let query = supabase.from('profiles').select('*', { count: 'exact' });

  if (plan) query = query.eq('plan', plan);
  if (search) query = query.ilike('email', `%${search}%`);

  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  res.json({ users: data, total: count, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  const [
    { count: total_users },
    { count: trial_users },
    { count: pro_users },
    { count: family_users },
    { count: menus_this_month },
    { count: pending_cancellations }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'trial'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'family'),
    supabase.from('weekly_menus').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().setDate(1)).toISOString()),
    supabase.from('cancellation_requests').select('*', { count: 'exact', head: true })
      .eq('refund_status', 'pending')
  ]);

  const monthly_revenue = (pro_users * 24.90) + (family_users * 34.90);

  res.json({
    total_users, trial_users, pro_users, family_users,
    menus_this_month, monthly_revenue, pending_cancellations
  });
});

// GET /api/admin/coupons
router.get('/coupons', async (req, res) => {
  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  res.json(data);
});

// POST /api/admin/coupons
router.post('/coupons', async (req, res) => {
  const { code, discount_type, discount_value, max_uses, valid_until, applies_to } = req.body;

  const { data, error } = await supabase.from('coupons').insert({
    code: code.toUpperCase(),
    discount_type, discount_value, max_uses,
    valid_until: valid_until || null,
    applies_to: applies_to || 'all'
  }).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// PATCH /api/admin/coupons/:id
router.patch('/coupons/:id', async (req, res) => {
  const { is_active, max_uses, valid_until } = req.body;
  const { data } = await supabase.from('coupons')
    .update({ is_active, max_uses, valid_until })
    .eq('id', req.params.id).select().single();
  res.json(data);
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', async (req, res) => {
  await supabase.from('coupons').delete().eq('id', req.params.id);
  res.json({ message: 'Cupom removido' });
});

// GET /api/admin/referrals
router.get('/referrals', async (req, res) => {
  const { data } = await supabase
    .from('referrals')
    .select('*, referrer:referrer_id(name, email), referred:referred_id(name, email, plan)')
    .order('created_at', { ascending: false });
  res.json(data);
});

// GET /api/admin/cancellations
router.get('/cancellations', async (req, res) => {
  const { data } = await supabase
    .from('cancellation_requests')
    .select('*, user:user_id(name, email)')
    .order('requested_at', { ascending: false });
  res.json(data);
});

// PATCH /api/admin/cancellations/:id
router.patch('/cancellations/:id', async (req, res) => {
  const { refund_status } = req.body;
  const { data } = await supabase.from('cancellation_requests')
    .update({ refund_status, processed_at: new Date() })
    .eq('id', req.params.id).select().single();
  res.json(data);
});

module.exports = router;
