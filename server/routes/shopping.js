const express = require('express');
const router = express.Router();
const { requireAuth, supabase } = require('../middleware/auth');

const SUPERMARKET_CATEGORIES = {
  'hortifruti': ['alface', 'tomate', 'cebola', 'alho', 'cenoura', 'batata', 'abobrinha', 'brócolis', 'couve', 'espinafre', 'rúcula', 'pepino', 'pimentão', 'limão', 'laranja', 'banana', 'maçã', 'morango', 'abacate', 'ervas', 'salsinha', 'cebolinha', 'coentro'],
  'carnes_aves_peixes': ['frango', 'carne', 'peixe', 'camarão', 'atum', 'sardinha', 'linguiça', 'presunto', 'bacon', 'costela', 'filé', 'alcatra', 'patinho', 'tilápia', 'salmão', 'ovo'],
  'laticinios_frios': ['leite', 'queijo', 'iogurte', 'manteiga', 'creme de leite', 'requeijão', 'mussarela', 'parmesão', 'ricota', 'cottage'],
  'padaria': ['pão', 'torrada', 'baguete', 'pão de forma', 'bisnaguinha', 'bolo'],
  'mercearia': ['arroz', 'feijão', 'macarrão', 'farinha', 'açúcar', 'sal', 'óleo', 'azeite', 'vinagre', 'molho', 'extrato', 'lentilha', 'grão-de-bico', 'aveia', 'granola', 'mel', 'mostarda', 'maionese', 'ketchup', 'shoyu', 'tempero', 'orégano', 'páprica', 'canela', 'cominho', 'curry'],
  'congelados': ['legumes congelados', 'ervilha congelada', 'milho congelado', 'pão de queijo congelado'],
  'higiene_limpeza': [],
  'outros': []
};

function categorizeIngredient(name) {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(SUPERMARKET_CATEGORIES)) {
    if (keywords.some(k => lower.includes(k) || k.includes(lower.split(' ')[0]))) {
      return category;
    }
  }
  return 'mercearia'; // default
}

function consolidateIngredients(meals, mealsEnabled) {
  const ingredients = {};

  Object.values(meals).forEach(day => {
    Object.entries(day || {}).forEach(([mealType, meal]) => {
      if (!mealsEnabled.includes(mealType) || !meal?.ingredients) return;
      meal.ingredients.forEach(ing => {
        const key = ing.name.toLowerCase().trim();
        if (!ingredients[key]) {
          ingredients[key] = {
            name: ing.name,
            quantity: 0,
            unit: ing.unit,
            category: categorizeIngredient(ing.name)
          };
        }
        // Converte para unidade comum se possível
        if (ingredients[key].unit === ing.unit) {
          ingredients[key].quantity += ing.quantity;
        } else {
          ingredients[key].quantity += ing.quantity;
          // Mantém a unidade do primeiro
        }
      });
    });
  });

  return Object.values(ingredients);
}

// POST /api/shopping/generate
router.post('/generate', requireAuth, async (req, res) => {
  const { menu_id, ingredients_already_have } = req.body;
  const profile = req.user.profile;

  // Basic plan só tem lista básica
  const planType = profile.plan === 'trial' ? 'basic' : 'complete';

  const { data: menu } = await supabase
    .from('weekly_menus').select('*').eq('id', menu_id).eq('user_id', profile.id).single();

  if (!menu) return res.status(404).json({ error: 'Cardápio não encontrado' });

  const { data: preferences } = await supabase
    .from('user_preferences').select('meals_enabled')
    .eq('user_id', profile.id).is('profile_id', null).single();

  const mealsEnabled = preferences?.meals_enabled || ['breakfast','lunch','dinner'];

  // Consolida ingredientes
  let items = consolidateIngredients(menu.meals, mealsEnabled);

  // Remove/reduz o que já tem em casa
  if (ingredients_already_have?.length > 0) {
    items = items.map(item => {
      const atHome = ingredients_already_have.find(h =>
        item.name.toLowerCase().includes(h.name.toLowerCase()) ||
        h.name.toLowerCase().includes(item.name.toLowerCase())
      );
      if (!atHome) return { ...item, checked: false, already_have: false };

      const remaining = Math.max(0, item.quantity - (atHome.quantity || item.quantity));
      return {
        ...item,
        quantity: remaining,
        checked: remaining === 0,
        already_have: remaining === 0,
        have_quantity: atHome.quantity
      };
    }).filter(item => item.quantity > 0 || item.already_have);
  } else {
    items = items.map(item => ({ ...item, checked: false, already_have: false }));
  }

  // Plano básico: sem categorização detalhada, sem estimativa
  if (planType === 'basic') {
    items = items.map(({ name, quantity, unit, checked }) => ({ name, quantity, unit, checked }));
  }

  // Organiza por categoria (apenas plano completo)
  let organizedItems = items;
  if (planType === 'complete') {
    const categoryOrder = ['hortifruti', 'carnes_aves_peixes', 'laticinios_frios', 'padaria', 'mercearia', 'congelados', 'outros'];
    organizedItems = items.sort((a, b) => {
      const ai = categoryOrder.indexOf(a.category);
      const bi = categoryOrder.indexOf(b.category);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }

  // Salva a lista
  const { data: list, error } = await supabase
    .from('shopping_lists')
    .upsert({
      user_id: profile.id,
      menu_id,
      items: organizedItems,
      plan_type: planType
    }, { onConflict: 'user_id,menu_id' })
    .select().single();

  if (error) return res.status(400).json({ error: error.message });

  await supabase.from('weekly_menus')
    .update({ shopping_list_generated: true }).eq('id', menu_id);

  res.json({ list, plan_type: planType });
});

// GET /api/shopping/:menu_id
router.get('/:menu_id', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('shopping_lists').select('*')
    .eq('menu_id', req.params.menu_id)
    .eq('user_id', req.user.id).single();
  if (!data) return res.status(404).json({ error: 'Lista não encontrada' });
  res.json(data);
});

// PATCH /api/shopping/:id/check
router.patch('/:id/check', requireAuth, async (req, res) => {
  const { item_name, checked } = req.body;

  const { data: list } = await supabase
    .from('shopping_lists').select('*').eq('id', req.params.id).single();
  if (!list) return res.status(404).json({ error: 'Lista não encontrada' });

  const updatedItems = list.items.map(item =>
    item.name === item_name ? { ...item, checked } : item
  );

  const allChecked = updatedItems.every(i => i.checked);
  await supabase.from('shopping_lists')
    .update({ items: updatedItems, is_complete: allChecked }).eq('id', req.params.id);

  res.json({ message: 'Atualizado', items: updatedItems });
});

module.exports = router;
