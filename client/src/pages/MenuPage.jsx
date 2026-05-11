import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Star, ThumbsUp, ThumbsDown, ChefHat, ShoppingCart, Heart, RefreshCw, ChevronDown, ChevronUp, Info } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const DAY_KEYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const MEAL_LABELS = {
  breakfast:'☀️ Café da manhã', morning_snack:'🍎 Lanche manhã',
  lunch:'🍽️ Almoço', afternoon_snack:'🧃 Lanche tarde',
  dinner:'🌙 Jantar', supper:'🌟 Ceia'
};

const DISLIKE_REASONS = [
  'Muito temperado', 'Pouco temperado', 'Não gostei da textura',
  'Muito demorado', 'Ingredientes difíceis de achar', 'Muito calórico',
  'Não combinou', 'Prefiro outro tipo de prato'
];

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}>
          <Star size={20} className={`transition-colors ${n <= (hover || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

function MealCard({ day, mealType, meal, menuId, onUpdate }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(null);
  const [dislikeReasons, setDislikeReasons] = useState([]);
  const [alternatives, setAlternatives] = useState(null);
  const [loadingAlt, setLoadingAlt] = useState(false);
  const [saved, setSaved] = useState(false);
  const mealKey = `${day}_${mealType}`;

  const submitRating = async (liked) => {
    setLiked(liked);
    if (!liked) {
      setShowRating(true);
      return;
    }
    try {
      await api.post('/meal/rate', {
        menu_id: menuId, meal_key: mealKey, meal_name: meal.name,
        status: 'made', liked: true, rating, is_favorite: false
      });
      toast.success('Avaliação salva!');
      setSaved(true);
    } catch {}
  };

  const submitDislike = async () => {
    try {
      const { data } = await api.post('/meal/rate', {
        menu_id: menuId, meal_key: mealKey, meal_name: meal.name,
        status: 'made', liked: false, dislike_reasons: dislikeReasons
      });
      toast.success('Ok! Vamos buscar outras opções 🔄');
      setSaved(true);
      loadAlternatives(data.rating.id);
    } catch {}
  };

  const loadAlternatives = async (ratingId) => {
    setLoadingAlt(true);
    try {
      const { data } = await api.post('/meal/alternatives', {
        rating_id: ratingId, meal_name: meal.name, meal_type: mealType, dislike_reasons: dislikeReasons
      });
      setAlternatives(data);
    } catch { toast.error('Erro ao buscar alternativas'); }
    setLoadingAlt(false);
  };

  const chooseAlternative = async (altId, index) => {
    try {
      const { data } = await api.post(`/meal/alternatives/${altId}/choose`, {
        chosen_index: index, menu_id: menuId, meal_key: mealKey
      });
      toast.success('Refeição atualizada! 🎉');
      onUpdate(day, mealType, data.meal);
      setAlternatives(null);
      setSaved(false);
    } catch {}
  };

  const saveFavorite = async () => {
    try {
      await api.post('/user/favorites', { recipe_name: meal.name, recipe_data: meal });
      toast.success('Adicionado aos favoritos! ❤️');
    } catch {}
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-start justify-between p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-500 font-medium">{MEAL_LABELS[mealType]}</span>
            {meal.prep_time_minutes && (
              <span className="text-xs text-gray-400">· {meal.prep_time_minutes}min</span>
            )}
          </div>
          <p className="font-semibold text-brand-dark text-sm leading-snug">{meal.name}</p>
          {meal.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{meal.description}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); saveFavorite(); }}
            className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
            <Heart size={16} />
          </button>
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 pt-3">
          {/* Ingredients */}
          {meal.ingredients?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ingredientes</p>
              <div className="flex flex-wrap gap-1.5">
                {meal.ingredients.map((ing, i) => (
                  <span key={i} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg">
                    {ing.quantity}{ing.unit} {ing.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {meal.steps?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Modo de preparo</p>
              <ol className="space-y-1.5">
                {meal.steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-600">
                    <span className="w-5 h-5 bg-brand-green text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Rating - only if pro/family */}
          {user?.plan !== 'trial' && !saved && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Você fez essa receita?</p>
              {!liked && liked !== false ? (
                <div className="flex items-center gap-2">
                  <StarRating value={rating} onChange={setRating} />
                  <button onClick={() => submitRating(true)} className="text-xs bg-green-50 text-green-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1">
                    <ThumbsUp size={13} /> Gostei
                  </button>
                  <button onClick={() => submitRating(false)} className="text-xs bg-red-50 text-red-500 font-semibold px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1">
                    <ThumbsDown size={13} /> Não gostei
                  </button>
                </div>
              ) : liked === false && showRating && !alternatives && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Por que não gostou?</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {DISLIKE_REASONS.map(r => (
                      <button key={r} onClick={() => setDislikeReasons(prev =>
                        prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
                      )}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                          dislikeReasons.includes(r) ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500'
                        }`}>{r}</button>
                    ))}
                  </div>
                  <button onClick={submitDislike} className="text-xs bg-brand-green text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
                    <RefreshCw size={13} /> Buscar 3 alternativas
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Loading alternatives */}
          {loadingAlt && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-3">
              <div className="w-4 h-4 border-2 border-brand-green border-t-transparent rounded-full animate-spin" />
              Buscando alternativas...
            </div>
          )}

          {/* Alternatives */}
          {alternatives && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-xs font-bold text-brand-dark mb-3">Escolha uma alternativa:</p>
              <div className="space-y-2">
                {alternatives.alternatives.map((alt, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-sm text-brand-dark">{alt.name}</p>
                      <span className="text-xs text-gray-400 flex-shrink-0">{alt.prep_time_minutes}min</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{alt.description}</p>
                    <button onClick={() => chooseAlternative(alternatives.alternative_id, i)}
                      className="text-xs bg-brand-green text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-green-dark transition-colors">
                      Escolher esta
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [menu, setMenu] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMenu(); }, [id]);

  const loadMenu = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/meal/menus/${id}`);
      setMenu(data);
    } catch { toast.error('Cardápio não encontrado'); }
    setLoading(false);
  };

  const updateMeal = (day, mealType, newMeal) => {
    setMenu(prev => ({
      ...prev,
      meals: { ...prev.meals, [day]: { ...prev.meals[day], [mealType]: newMeal } }
    }));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream">
      <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!menu) return null;

  const currentDay = DAY_KEYS[activeDay];
  const dayMeals = menu.meals[currentDay] || {};

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-400 hover:text-brand-dark transition-colors">
            <ChevronLeft size={22} />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-brand-dark text-base">Cardápio da semana</h1>
            <p className="text-gray-500 text-xs">{new Date(menu.week_start).toLocaleDateString('pt-BR')} – {new Date(menu.week_end).toLocaleDateString('pt-BR')}</p>
          </div>
          <Link to={`/lista/${id}`} className="flex items-center gap-1.5 text-brand-green font-semibold text-sm">
            <ShoppingCart size={18} /> Lista
          </Link>
        </div>

        {/* Day tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {DAY_LABELS.map((label, i) => (
            <button key={i} onClick={() => setActiveDay(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeDay === i ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{label}</button>
          ))}
        </div>
      </div>

      {/* Meals */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {Object.keys(dayMeals).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Sem refeições para este dia</p>
          </div>
        ) : (
          Object.entries(dayMeals).map(([mealType, meal]) => (
            <MealCard key={mealType}
              day={currentDay} mealType={mealType} meal={meal}
              menuId={id} onUpdate={updateMeal} />
          ))
        )}

        {/* Nutrition note */}
        {user?.plan !== 'trial' && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Info size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-blue-700 font-semibold mb-0.5">Informações nutricionais*</p>
              <p className="text-xs text-blue-600">
                Para calcular os valores nutricionais de um prato, fotografe os rótulos dos ingredientes na lista de compras.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
