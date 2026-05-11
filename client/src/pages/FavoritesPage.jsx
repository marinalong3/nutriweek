import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Heart, Trash2, Star, Clock } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { loadFavorites(); }, []);

  const loadFavorites = async () => {
    try {
      const { data } = await api.get('/user/favorites');
      setFavorites(data);
    } catch {}
    setLoading(false);
  };

  const removeFavorite = async (id) => {
    try {
      await api.delete(`/user/favorites/${id}`);
      setFavorites(prev => prev.filter(f => f.id !== id));
      toast.success('Removido dos favoritos');
    } catch {}
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream">
      <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-400 hover:text-brand-dark transition-colors">
            <ChevronLeft size={22} />
          </Link>
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-red-400 fill-red-400" />
            <h1 className="font-bold text-brand-dark">Receitas favoritas</h1>
          </div>
          <span className="ml-auto text-sm text-gray-500">{favorites.length} receitas</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {favorites.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Heart size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-medium text-gray-500">Nenhuma receita favorita ainda</p>
            <p className="text-sm mt-1">Salve receitas do cardápio que você mais gostou!</p>
            <Link to="/dashboard" className="btn-primary inline-block mt-6 text-sm">Ver cardápios</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map(fav => (
              <div key={fav.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart size={14} className="text-red-400 fill-red-400 flex-shrink-0" />
                      <p className="font-bold text-brand-dark text-sm">{fav.recipe_name}</p>
                    </div>
                    {fav.recipe_data?.prep_time_minutes && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                        <Clock size={12} />
                        {fav.recipe_data.prep_time_minutes} min de preparo
                      </div>
                    )}
                    {fav.frequency_boost > 1 && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(fav.frequency_boost, 5) }).map((_, i) => (
                          <Star key={i} size={12} className="text-yellow-400 fill-yellow-400" />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">Aparece com frequência</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setExpanded(expanded === fav.id ? null : fav.id)}
                      className="text-xs text-brand-green font-semibold hover:underline">
                      {expanded === fav.id ? 'Fechar' : 'Ver receita'}
                    </button>
                    <button onClick={() => removeFavorite(fav.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {expanded === fav.id && fav.recipe_data && (
                  <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
                    {fav.recipe_data.description && (
                      <p className="text-sm text-gray-600 mb-4 italic">{fav.recipe_data.description}</p>
                    )}
                    {fav.recipe_data.ingredients?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ingredientes</p>
                        <div className="flex flex-wrap gap-1.5">
                          {fav.recipe_data.ingredients.map((ing, i) => (
                            <span key={i} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-lg">
                              {ing.quantity}{ing.unit} {ing.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {fav.recipe_data.steps?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Modo de preparo</p>
                        <ol className="space-y-2">
                          {fav.recipe_data.steps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-sm text-gray-600">
                              <span className="w-5 h-5 bg-brand-green text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
