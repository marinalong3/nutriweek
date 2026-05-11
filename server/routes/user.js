const express = require('express');
const router = express.Router();
const { requireAuth, supabase } = require('../middleware/auth');

// GET /api/user/preferences
router.get('/preferences', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', req.user.id)
    .is('profile_id', null)
    .single();

  if (error) return res.status(404).json({ error: 'Preferências não encontradas' });
  res.json(data);
});

// PUT /api/user/preferences
router.put('/preferences', requireAuth, async (req, res) => {
  const {
    meals_enabled, people_count, cuisine_types, disliked_foods,
    restrictions, favorite_spices, appliances, avoid_frying,
    goal, weekly_budget, cooking_time_minutes
  } = req.body;

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: req.user.id,
      profile_id: null,
      meals_enabled, people_count, cuisine_types, disliked_foods,
      restrictions, favorite_spices, appliances, avoid_frying,
      goal, weekly_budget, cooking_time_minutes,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,profile_id' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Preferências salvas!', data });
});

// GET /api/user/profile
router.get('/profile', requireAuth, async (req, res) => {
  res.json(req.user.profile);
});

// PUT /api/user/profile
router.put('/profile', requireAuth, async (req, res) => {
  const { name, phone } = req.body;
  const { data, error } = await supabase
    .from('profiles')
    .update({ name, phone })
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET /api/user/family-profiles (plano família)
router.get('/family-profiles', requireAuth, async (req, res) => {
  if (req.user.profile.plan !== 'family')
    return res.status(403).json({ error: 'Disponível apenas no plano Família' });

  const { data } = await supabase
    .from('family_profiles')
    .select('*')
    .eq('owner_id', req.user.id);

  res.json(data || []);
});

// POST /api/user/family-profiles
router.post('/family-profiles', requireAuth, async (req, res) => {
  if (req.user.profile.plan !== 'family')
    return res.status(403).json({ error: 'Disponível apenas no plano Família' });

  // Limite de 3 perfis adicionais
  const { count } = await supabase
    .from('family_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', req.user.id);

  if (count >= 3)
    return res.status(400).json({ error: 'Limite de 3 perfis adicionais atingido' });

  const { name, preferences } = req.body;
  const { data, error } = await supabase
    .from('family_profiles')
    .insert({ owner_id: req.user.id, name, preferences })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE /api/user/family-profiles/:id
router.delete('/family-profiles/:id', requireAuth, async (req, res) => {
  await supabase
    .from('family_profiles')
    .delete()
    .eq('id', req.params.id)
    .eq('owner_id', req.user.id);
  res.json({ message: 'Perfil removido' });
});

// GET /api/user/referral-info
router.get('/referral-info', requireAuth, async (req, res) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code, pending_discount')
    .eq('id', req.user.id)
    .single();

  const { count: referrals_converted } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', req.user.id)
    .eq('status', 'converted');

  res.json({
    referral_code: profile.referral_code,
    referral_link: `${process.env.FRONTEND_URL}/cadastro?ref=${profile.referral_code}`,
    pending_discount: profile.pending_discount,
    referrals_converted
  });
});

// GET /api/user/favorites
router.get('/favorites', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('favorite_recipes')
    .select('*')
    .eq('user_id', req.user.id)
    .order('frequency_boost', { ascending: false });
  res.json(data || []);
});

// POST /api/user/favorites
router.post('/favorites', requireAuth, async (req, res) => {
  const { recipe_name, recipe_data } = req.body;

  // Verifica se já existe
  const { data: existing } = await supabase
    .from('favorite_recipes')
    .select('id, frequency_boost')
    .eq('user_id', req.user.id)
    .eq('recipe_name', recipe_name)
    .single();

  if (existing) {
    // Aumenta frequência
    await supabase
      .from('favorite_recipes')
      .update({ frequency_boost: existing.frequency_boost + 1 })
      .eq('id', existing.id);
    return res.json({ message: 'Receita já está nos favoritos!' });
  }

  const { data, error } = await supabase
    .from('favorite_recipes')
    .insert({ user_id: req.user.id, recipe_name, recipe_data })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// DELETE /api/user/favorites/:id
router.delete('/favorites/:id', requireAuth, async (req, res) => {
  await supabase
    .from('favorite_recipes')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  res.json({ message: 'Removido dos favoritos' });
});

module.exports = router;
