const express = require('express');
const router = express.Router();
const multer = require('multer');
const Anthropic = require('@anthropic-ai/sdk');
const { requireAuth, requirePlan, supabase } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Extrai tabela nutricional de foto usando Claude Vision
async function extractNutritionFromPhoto(imageBuffer, mimeType) {
  const base64 = imageBuffer.toString('base64');
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: base64 }
        },
        {
          type: 'text',
          text: `Analise esta tabela nutricional e extraia os valores. 
Responda APENAS com JSON no formato:
{
  "serving_size_g": 30,
  "energy_kcal": 120,
  "energy_kj": 502,
  "carbohydrates_g": 20.5,
  "sugars_g": 5.0,
  "added_sugars_g": 3.0,
  "total_fat_g": 3.5,
  "saturated_fat_g": 1.2,
  "trans_fat_g": 0,
  "fiber_g": 2.1,
  "protein_g": 4.5,
  "sodium_mg": 180,
  "success": true,
  "confidence": "high"
}
Se não conseguir identificar os valores, retorne {"success": false}.`
        }
      ]
    }]
  });

  const text = response.content[0].text;
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

// Valores diários de referência (ANVISA RDC 429/2020)
const VD = {
  energy_kcal: 2000,
  carbohydrates_g: 300,
  sugars_g: 50,
  added_sugars_g: 50,
  total_fat_g: 65,
  saturated_fat_g: 20,
  fiber_g: 25,
  protein_g: 75,
  sodium_mg: 2300
};

// Arredondamento ANVISA
function roundNutrition(value, nutrient) {
  if (nutrient === 'energy_kcal' || nutrient === 'energy_kj') return Math.round(value);
  if (['carbohydrates_g','sugars_g','added_sugars_g','total_fat_g','saturated_fat_g','protein_g','fiber_g'].includes(nutrient)) {
    if (value < 0.5) return 0;
    return Math.round(value * 10) / 10; // 1 casa decimal
  }
  if (nutrient === 'sodium_mg') return Math.round(value);
  if (nutrient === 'trans_fat_g') {
    if (value < 0.2) return 0;
    return Math.round(value * 10) / 10;
  }
  return Math.round(value * 10) / 10;
}

function calculateVD(value, nutrient) {
  if (!VD[nutrient] || value === 0) return null;
  const pct = (value / VD[nutrient]) * 100;
  return Math.round(pct);
}

// POST /api/nutrition/upload-ingredient
// Upload da foto do rótulo de um ingrediente
router.post('/upload-ingredient', requireAuth, requirePlan(['pro', 'family']), upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhuma foto enviada' });

  const { ingredient_name, quantity_in_recipe, unit } = req.body;
  if (!ingredient_name || !quantity_in_recipe)
    return res.status(400).json({ error: 'Nome do ingrediente e quantidade são obrigatórios' });

  const mimeType = req.file.mimetype;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType))
    return res.status(400).json({ error: 'Formato inválido. Use JPG, PNG ou WebP' });

  try {
    const nutritionData = await extractNutritionFromPhoto(req.file.buffer, mimeType);

    if (!nutritionData.success) {
      return res.status(422).json({
        error: 'Não foi possível identificar os valores nutricionais na foto. Tente uma foto mais nítida da tabela nutricional.'
      });
    }

    // Salva a imagem no Supabase Storage
    const fileName = `nutrition/${req.user.id}/${Date.now()}_${ingredient_name.replace(/\s/g,'_')}.jpg`;
    const { data: uploadData } = await supabase.storage
      .from('nutrition-photos')
      .upload(fileName, req.file.buffer, { contentType: mimeType });

    const { data: { publicUrl } } = supabase.storage
      .from('nutrition-photos')
      .getPublicUrl(fileName);

    res.json({
      ingredient_name,
      quantity_in_recipe: parseFloat(quantity_in_recipe),
      unit,
      photo_url: publicUrl,
      nutrition_per_100g: nutritionData,
      source: 'user_upload'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao processar a imagem' });
  }
});

// POST /api/nutrition/calculate
// Calcula tabela nutricional completa do prato
router.post('/calculate', requireAuth, requirePlan(['pro', 'family']), async (req, res) => {
  const { menu_id, meal_key, recipe_name, ingredients_data, serving_size_g } = req.body;

  if (!ingredients_data?.length)
    return res.status(400).json({ error: 'Dados dos ingredientes são obrigatórios' });

  let isApproximate = false;

  // Para ingredientes sem foto, busca dados genéricos da internet
  const enrichedIngredients = await Promise.all(
    ingredients_data.map(async (ing) => {
      if (ing.source === 'user_upload' && ing.nutrition_per_100g?.success) {
        return ing;
      }

      // Busca dados genéricos via Claude
      isApproximate = true;
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Forneça valores nutricionais médios por 100g para: "${ing.ingredient_name}"
Responda APENAS com JSON:
{
  "serving_size_g": 100,
  "energy_kcal": 0,
  "energy_kj": 0,
  "carbohydrates_g": 0,
  "sugars_g": 0,
  "added_sugars_g": 0,
  "total_fat_g": 0,
  "saturated_fat_g": 0,
  "trans_fat_g": 0,
  "fiber_g": 0,
  "protein_g": 0,
  "sodium_mg": 0
}`
        }]
      });
      const text = response.content[0].text.replace(/```json|```/g, '').trim();
      return { ...ing, nutrition_per_100g: JSON.parse(text), source: 'generic_internet' };
    })
  );

  // Calcula contribuição de cada ingrediente proporcionalmente
  const nutrients = ['energy_kcal','energy_kj','carbohydrates_g','sugars_g','added_sugars_g',
    'total_fat_g','saturated_fat_g','trans_fat_g','fiber_g','protein_g','sodium_mg'];

  const totals = {};
  let totalWeightG = 0;

  nutrients.forEach(n => totals[n] = 0);

  enrichedIngredients.forEach(ing => {
    // Converte quantidade para gramas
    let quantityG = ing.quantity_in_recipe;
    if (ing.unit === 'kg') quantityG *= 1000;
    if (ing.unit === 'ml' || ing.unit === 'l') quantityG = ing.unit === 'l' ? ing.quantity_in_recipe * 1000 : ing.quantity_in_recipe;
    if (ing.unit === 'unidade' || ing.unit === 'fatia') quantityG = ing.quantity_in_recipe * 30; // estimativa

    totalWeightG += quantityG;
    const factor = quantityG / 100;

    nutrients.forEach(n => {
      totals[n] += (ing.nutrition_per_100g?.[n] || 0) * factor;
    });
  });

  // Calcula por porção
  const servingG = serving_size_g || Math.round(totalWeightG / 4); // divide em 4 porções padrão
  const servingFactor = servingG / totalWeightG;

  const per_serving = {};
  const per_100g = {};
  const vd_percent = {};

  nutrients.forEach(n => {
    const per100 = totals[n] / (totalWeightG / 100);
    per_100g[n] = roundNutrition(per100, n);
    per_serving[n] = roundNutrition(totals[n] * servingFactor, n);
    vd_percent[n] = calculateVD(per_serving[n], n);
  });

  const nutritionTable = {
    recipe_name,
    serving_size_g: servingG,
    servings_per_recipe: Math.round(totalWeightG / servingG),
    per_serving,
    per_100g,
    vd_percent,
    is_approximate: isApproximate,
    approximate_warning: isApproximate
      ? '* Valores aproximados baseados em dados genéricos de referência, pois nem todos os ingredientes tiveram suas tabelas nutricionais informadas. Para valores precisos, fotografe os rótulos de todos os ingredientes.'
      : null,
    legal_disclaimer: '** % Valores Diários com base em uma dieta de 2.000 kcal ou 8.400 kJ. Seus valores diários podem ser maiores ou menores dependendo de suas necessidades energéticas.'
  };

  // Salva no banco
  const { data, error } = await supabase.from('nutrition_data').upsert({
    user_id: req.user.id,
    menu_id, meal_key, recipe_name,
    ingredients_data: enrichedIngredients,
    nutrition_table: nutritionTable,
    is_approximate: isApproximate,
    serving_size_g: servingG
  }, { onConflict: 'user_id,menu_id,meal_key' }).select().single();

  if (error) return res.status(400).json({ error: error.message });

  res.json({ nutrition: nutritionTable, saved: data });
});

// GET /api/nutrition/:menu_id/:meal_key
router.get('/:menu_id/:meal_key', requireAuth, async (req, res) => {
  const { data } = await supabase
    .from('nutrition_data').select('*')
    .eq('menu_id', req.params.menu_id)
    .eq('meal_key', req.params.meal_key)
    .eq('user_id', req.user.id).single();

  if (!data) return res.status(404).json({ error: 'Informação nutricional não encontrada' });
  res.json(data);
});

module.exports = router;
