const express = require('express');
const router = express.Router();
const { requireAuth, requirePlan, supabase } = require('../middleware/auth');
const { generateWeeklyMenu, generateMealAlternatives } = require('../services/aiService');

// POST /api/meal/generate
router.post('/generate', requireAuth, async (req, res) => {
  const profile = req.user.profile;
  const { profile_id, ingredients_at_home } = req.body;

  // Verifica limites do plano
  if (profile.plan === 'trial' && profile.trial_used) {
    return res.status(403).json({
      error: 'Seu cardápio gratuito já foi utilizado. Assine um plano para continuar!',
      upgrade_url: `${process.env.FRONTEND_URL}/planos`
    });
  }

  if (profile.plan === 'pro' || profile.plan === 'family') {
    // Conta cardápios gerados este mês
    const startOfMonth = new Date();
    startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

    const { count } = await supabase
      .from('weekly_menus')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('created_at', startOfMonth.toISOString());

    if (count >= 4) {
      return res.status(403).json({
        error: 'Limite de 4 cardápios por mês atingido. Renova em breve!',
        limit: 4, used: count
      });
    }
  }

  // Busca preferências
  const prefQuery = supabase.from('user_preferences').select('*').eq('user_id', profile.id);
  if (profile_id) prefQuery.eq('profile_id', profile_id);
  else prefQuery.is('profile_id', null);

  const { data: preferences } = await prefQuery.single();
  if (!preferences) return res.status(400).json({ error: 'Complete seu perfil antes de gerar o cardápio' });

  // Busca receitas favoritas e rejeitadas
  const { data: favoriteRecipes } = await supabase
    .from('favorite_recipes').select('*').eq('user_id', profile.id);
  const { data: dislikedRecipes } = await supabase
    .from('disliked_recipes').select('*').eq('user_id', profile.id);

  // Busca nomes das receitas das últimas 2 semanas para evitar repetição
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentMenus } = await supabase
    .from('weekly_menus').select('meals')
    .eq('user_id', profile.id)
    .gte('created_at', twoWeeksAgo);

  const previousMenuNames = [];
  recentMenus?.forEach(menu => {
    Object.values(menu.meals || {}).forEach(day => {
      Object.values(day || {}).forEach(meal => {
        if (meal?.name) previousMenuNames.push(meal.name);
      });
    });
  });

  try {
    // Busca nome do perfil família se houver
    let profileName = null;
    if (profile_id) {
      const { data: fp } = await supabase.from('family_profiles').select('name').eq('id', profile_id).single();
      profileName = fp?.name;
    }

    const meals = await generateWeeklyMenu({
      preferences,
      favoriteRecipes: favoriteRecipes || [],
      dislikedRecipes: dislikedRecipes || [],
      ingredientsAtHome: ingredients_at_home || [],
      previousMenuNames,
      profileName
    });

    // Calcula datas da semana atual
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const { data: menu, error } = await supabase
      .from('weekly_menus')
      .insert({
        user_id: profile.id,
        profile_id: profile_id || null,
        week_start: monday.toISOString().split('T')[0],
        week_end: sunday.toISOString().split('T')[0],
        meals,
        ingredients_at_home: ingredients_at_home || [],
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Marca trial como usado
    if (profile.plan === 'trial') {
      await supabase.from('profiles').update({ trial_used: true }).eq('id', profile.id);
    }

    res.json({ menu });
  } catch (err) {
    console.error('Erro ao gerar cardápio:', err);
    res.status(500).json({ error: 'Erro ao gerar cardápio. Tente novamente.' });
  }
});

// GET /api/meal/menus
router.get('/menus', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('weekly_menus')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(12);
  res.json(data || []);
});

// GET /api/meal/menus/:id
router.get('/menus/:id', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('weekly_menus')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .single();
  if (!data) return res.status(404).json({ error: 'Cardápio não encontrado' });
  res.json(data);
});

// POST /api/meal/rate
router.post('/rate', requireAuth, async (req, res) => {
  const {
    menu_id, meal_key, meal_name, status,
    rating, liked, dislike_reasons, is_favorite
  } = req.body;

  // Upsert rating
  const { data: ratingData, error } = await supabase
    .from('meal_ratings')
    .upsert({
      user_id: req.user.id,
      menu_id, meal_key, meal_name,
      status, rating, liked, dislike_reasons,
      is_favorite
    }, { onConflict: 'user_id,menu_id,meal_key' })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Se favoritou, salva nas favoritas
  if (is_favorite) {
    const { data: menu } = await supabase
      .from('weekly_menus').select('meals').eq('id', menu_id).single();
    const [day, mealType] = meal_key.split('_');
    const recipeData = menu?.meals?.[day]?.[mealType];
    if (recipeData) {
      await supabase.from('favorite_recipes').upsert({
        user_id: req.user.id,
        recipe_name: meal_name,
        recipe_data: recipeData
      }, { onConflict: 'user_id,recipe_name' });
    }
  }

  // Se não gostou, salva nas rejeitadas
  if (liked === false) {
    await supabase.from('disliked_recipes').upsert({
      user_id: req.user.id,
      recipe_name: meal_name,
      reasons: dislike_reasons || []
    }, { onConflict: 'user_id,recipe_name' });
  }

  res.json({ rating: ratingData });
});

// POST /api/meal/alternatives
router.post('/alternatives', requireAuth, async (req, res) => {
  const { rating_id, meal_name, meal_type, dislike_reasons } = req.body;

  const { data: preferences } = await supabase
    .from('user_preferences').select('*')
    .eq('user_id', req.user.id).is('profile_id', null).single();

  const { data: dislikedRecipes } = await supabase
    .from('disliked_recipes').select('*').eq('user_id', req.user.id);

  try {
    const alternatives = await generateMealAlternatives({
      originalMeal: { name: meal_name, meal_type },
      dislikeReasons: dislike_reasons || [],
      preferences,
      dislikedRecipes: dislikedRecipes || []
    });

    const { data } = await supabase
      .from('meal_alternatives')
      .insert({ user_id: req.user.id, rating_id, alternatives })
      .select().single();

    res.json({ alternatives, alternative_id: data.id });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao gerar alternativas' });
  }
});

// POST /api/meal/alternatives/:id/choose
router.post('/alternatives/:id/choose', requireAuth, async (req, res) => {
  const { chosen_index, menu_id, meal_key } = req.body;

  const { data: alt } = await supabase
    .from('meal_alternatives').select('*').eq('id', req.params.id).single();

  if (!alt) return res.status(404).json({ error: 'Não encontrado' });

  const chosen = alt.alternatives[chosen_index];
  if (!chosen) return res.status(400).json({ error: 'Índice inválido' });

  // Atualiza o cardápio com a nova receita
  const { data: menu } = await supabase
    .from('weekly_menus').select('meals').eq('id', menu_id).single();

  const [day, mealType] = meal_key.split('_');
  const updatedMeals = { ...menu.meals };
  updatedMeals[day][mealType] = chosen;

  await supabase.from('weekly_menus')
    .update({ meals: updatedMeals }).eq('id', menu_id);

  await supabase.from('meal_alternatives')
    .update({ chosen_index }).eq('id', req.params.id);

  res.json({ message: 'Refeição atualizada!', meal: chosen });
});

// GET /api/meal/ratings/:menu_id
router.get('/ratings/:menu_id', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('meal_ratings').select('*')
    .eq('menu_id', req.params.menu_id)
    .eq('user_id', req.user.id);
  res.json(data || []);
});

module.exports = router;
