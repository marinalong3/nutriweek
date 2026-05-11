const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CUISINE_LABELS = {
  caseira: 'comida caseira brasileira',
  italiana: 'culinária italiana',
  japonesa: 'culinária japonesa',
  mexicana: 'culinária mexicana',
  arabe: 'culinária árabe',
  nordestina: 'culinária nordestina',
  vegetariana: 'vegetariana',
  vegana: 'vegana',
  'low-carb': 'low-carb (poucos carboidratos)',
  'low-fodmap': 'low-FODMAP',
  fitness: 'fitness e saudável',
  alto_proteina: 'alto em proteína',
  sanduiches: 'sanduíches e wraps',
  saladas: 'saladas e bowls',
  sopas: 'sopas e caldos'
};

const MEAL_LABELS = {
  breakfast: 'Café da manhã',
  morning_snack: 'Lanche da manhã',
  lunch: 'Almoço',
  afternoon_snack: 'Lanche da tarde',
  dinner: 'Jantar',
  supper: 'Ceia'
};

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];

async function generateWeeklyMenu({
  preferences,
  favoriteRecipes = [],
  dislikedRecipes = [],
  ingredientsAtHome = [],
  previousMenuNames = [],
  profileName = null
}) {
  const {
    meals_enabled = ['breakfast','lunch','dinner'],
    people_count = 1,
    cuisine_types = [],
    disliked_foods = [],
    restrictions = [],
    favorite_spices = [],
    appliances = [],
    avoid_frying = false,
    goal = 'variety',
    weekly_budget,
    cooking_time_minutes = 45
  } = preferences;

  const cuisineText = cuisine_types.length > 0
    ? cuisine_types.map(c => CUISINE_LABELS[c] || c).join(', ')
    : 'variada e caseira';

  const mealsText = meals_enabled.map(m => MEAL_LABELS[m] || m).join(', ');

  const favoritesText = favoriteRecipes.length > 0
    ? `Receitas FAVORITAS do usuário (aparecer com mais frequência): ${favoriteRecipes.map(r => r.recipe_name).join(', ')}`
    : '';

  const dislikedText = dislikedRecipes.length > 0
    ? `Receitas que o usuário NÃO GOSTOU (NUNCA incluir): ${dislikedRecipes.map(r => r.recipe_name).join(', ')}`
    : '';

  const previousText = previousMenuNames.length > 0
    ? `Pratos das semanas anteriores (EVITAR repetir): ${previousMenuNames.join(', ')}`
    : '';

  const atHomeText = ingredientsAtHome.length > 0
    ? `Ingredientes que o usuário já tem em casa: ${ingredientsAtHome.join(', ')}. Priorize usar esses ingredientes.`
    : '';

  const appliancesText = appliances.length > 0
    ? `Equipamentos disponíveis: ${appliances.join(', ')}. ${avoid_frying ? 'O usuário EVITA frituras.' : ''}`
    : avoid_frying ? 'O usuário EVITA frituras.' : '';

  const prompt = `Você é um assistente especializado em planejamento de refeições para famílias brasileiras.

Crie um cardápio semanal completo (segunda a domingo) para ${people_count} pessoa(s)${profileName ? ` (perfil: ${profileName})` : ''}.

REFEIÇÕES INCLUÍDAS: ${mealsText}
PREFERÊNCIAS CULINÁRIAS: ${cuisineText}
${restrictions.length > 0 ? `RESTRIÇÕES/ALERGIAS: ${restrictions.join(', ')}` : ''}
${disliked_foods.length > 0 ? `ALIMENTOS QUE NÃO GOSTA: ${disliked_foods.join(', ')}` : ''}
${favorite_spices.length > 0 ? `TEMPEROS FAVORITOS: ${favorite_spices.join(', ')} - use esses temperos com frequência` : ''}
${appliancesText}
OBJETIVO: ${goal}
TEMPO MÁXIMO DE PREPARO: ${cooking_time_minutes} minutos por refeição
${weekly_budget ? `ORÇAMENTO SEMANAL ESTIMADO: R$ ${weekly_budget}` : ''}
${favoritesText}
${dislikedText}
${previousText}
${atHomeText}

IMPORTANTE:
- Varie bastante os pratos entre os dias
- Reaproveite ingredientes quando possível para reduzir desperdício e custo
- Para refeições rápidas (lanches, café da manhã), dê receitas simples e práticas
- NUNCA repita a mesma receita na mesma semana
- ${avoid_frying ? 'EVITE qualquer fritura' : 'Inclua frituras com moderação'}

Responda APENAS com um JSON válido, sem texto antes ou depois, neste formato exato:
{
  "monday": {
    ${meals_enabled.map(m => `"${m}": {
      "name": "Nome do prato",
      "description": "Descrição curta e apetitosa",
      "prep_time_minutes": 30,
      "servings": ${people_count},
      "ingredients": [
        {"name": "ingrediente", "quantity": 200, "unit": "g"},
        {"name": "ingrediente2", "quantity": 1, "unit": "unidade"}
      ],
      "steps": [
        "Passo 1...",
        "Passo 2..."
      ],
      "tags": ["tag1", "tag2"]
    }`).join(',\n    ')}
  },
  "tuesday": { ... },
  "wednesday": { ... },
  "thursday": { ... },
  "friday": { ... },
  "saturday": { ... },
  "sunday": { ... }
}`;

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function generateMealAlternatives({ originalMeal, dislikeReasons, preferences, dislikedRecipes = [] }) {
  const dislikedNames = dislikedRecipes.map(r => r.recipe_name).join(', ');

  const prompt = `O usuário não gostou da refeição: "${originalMeal.name}"
Motivos: ${dislikeReasons.join(', ')}

Preferências do usuário:
- Culinárias: ${preferences.cuisine_types?.join(', ') || 'variada'}
- Não gosta de: ${preferences.disliked_foods?.join(', ') || 'nada especificado'}
- Restrições: ${preferences.restrictions?.join(', ') || 'nenhuma'}
- Receitas que não gostou (NÃO incluir): ${dislikedNames}

Gere EXATAMENTE 3 alternativas diferentes para esta refeição (${originalMeal.meal_type || 'refeição'}).
As alternativas devem ser bem diferentes entre si e do prato original.

Responda APENAS com JSON:
[
  {
    "name": "Nome da alternativa 1",
    "description": "Descrição apetitosa",
    "prep_time_minutes": 25,
    "ingredients": [{"name": "ing", "quantity": 100, "unit": "g"}],
    "steps": ["Passo 1", "Passo 2"],
    "tags": []
  },
  { ... },
  { ... }
]`;

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { generateWeeklyMenu, generateMealAlternatives, MEAL_LABELS, DAYS, DAY_LABELS };
