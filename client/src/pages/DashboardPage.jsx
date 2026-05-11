import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar, ShoppingCart, Star, Plus, Leaf, User, LogOut, Heart, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import toast from 'react-hot-toast';
import IngredientsAtHomeModal from '../components/meal/IngredientsAtHomeModal';

const DAY_LABELS = { monday:'Seg', tuesday:'Ter', wednesday:'Qua', thursday:'Qui', friday:'Sex', saturday:'Sáb', sunday:'Dom' };
const MEAL_LABELS = { breakfast:'Café', morning_snack:'Lanche manhã', lunch:'Almoço', afternoon_snack:'Lanche tarde', dinner:'Jantar', supper:'Ceia' };

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showIngredientsModal, setShowIngredientsModal] = useState(false);
  const [menuStats, setMenuStats] = useState(null);

  useEffect(() => {
    if (params.get('success') === 'true') {
      toast.success('Assinatura ativada! Bem-vindo ao NutriWeek 🎉');
    }
    loadMenus();
    loadStats();
  }, []);

  const loadMenus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/meal/menus');
      setMenus(data);
    } catch {}
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const { data } = await api.get('/subscription/status');
      setMenuStats(data);
    } catch {}
  };

  const generateMenu = async (ingredientsAtHome = []) => {
    setGenerating(true);
    setShowIngredientsModal(false);
    try {
      const { data } = await api.post('/meal/generate', { ingredients_at_home: ingredientsAtHome });
      toast.success('Cardápio gerado com sucesso! 🥗');
      navigate(`/cardapio/${data.menu.id}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro ao gerar cardápio';
      if (err.response?.status === 403) {
        toast.error(msg);
        if (err.response?.data?.upgrade_url) navigate('/planos');
      } else {
        toast.error(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const planLabel = { trial: 'Grátis', pro: 'Pro', family: 'Família' };
  const planColor = { trial: 'badge-orange', pro: 'badge-green', family: 'badge-blue' };

  const currentMenu = menus[0];

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-bold text-brand-dark">nutri<span className="text-brand-green">week</span></span>
          </div>
          <div className="flex items-center gap-3">
            <span className={planColor[user?.plan || 'trial']}>{planLabel[user?.plan || 'trial']}</span>
            <Link to="/favoritos" className="p-2 text-gray-400 hover:text-brand-green transition-colors"><Heart size={20} /></Link>
            <Link to="/perfil" className="p-2 text-gray-400 hover:text-brand-dark transition-colors"><User size={20} /></Link>
            <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-dark">
            Olá, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Pronto para planejar sua semana?</p>
        </div>

        {/* Trial banner */}
        {user?.plan === 'trial' && !user?.trial_used && (
          <div className="bg-gradient-to-r from-brand-green to-brand-blue text-white rounded-2xl p-6 mb-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg mb-1">🎉 Seu cardápio gratuito está esperando!</h3>
                <p className="text-white/80 text-sm">Gere um cardápio completo agora, sem precisar assinar nada.</p>
              </div>
              <button onClick={() => setShowIngredientsModal(true)}
                className="bg-white text-brand-green font-bold px-5 py-2.5 rounded-xl hover:shadow-md transition-all flex-shrink-0">
                Gerar agora
              </button>
            </div>
          </div>
        )}

        {/* Used trial banner */}
        {user?.plan === 'trial' && user?.trial_used && (
          <div className="bg-orange-50 border-2 border-brand-orange rounded-2xl p-6 mb-8 flex items-start gap-4">
            <AlertCircle className="text-brand-orange flex-shrink-0 mt-0.5" size={22} />
            <div className="flex-1">
              <h3 className="font-bold text-brand-dark mb-1">Seu cardápio gratuito foi utilizado</h3>
              <p className="text-gray-500 text-sm mb-3">Assine para ter 4 cardápios por mês, lista completa e muito mais!</p>
              <Link to="/planos" className="btn-orange text-sm py-2 px-4 inline-block">Ver planos →</Link>
            </div>
          </div>
        )}

        {/* Main actions */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          <button onClick={() => setShowIngredientsModal(true)} disabled={generating}
            className="card border-2 border-dashed border-brand-green/40 hover:border-brand-green hover:shadow-md transition-all text-center py-8 disabled:opacity-50">
            {generating ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-brand-green border-t-transparent rounded-full animate-spin" />
                <p className="text-brand-green font-semibold">Gerando cardápio...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-brand-green" size={24} />
                </div>
                <div>
                  <p className="font-bold text-brand-dark">Novo cardápio</p>
                  <p className="text-gray-500 text-sm">Gerar para esta semana</p>
                </div>
              </div>
            )}
          </button>

          {currentMenu && (
            <>
              <Link to={`/cardapio/${currentMenu.id}`} className="card hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Calendar className="text-brand-blue" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-brand-dark">Cardápio atual</p>
                    <p className="text-gray-500 text-sm">{new Date(currentMenu.week_start).toLocaleDateString('pt-BR')} – {new Date(currentMenu.week_end).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(DAY_LABELS).slice(0,5).map(day => (
                    <span key={day} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">
                      {DAY_LABELS[day]}
                    </span>
                  ))}
                </div>
              </Link>

              <Link to={`/lista/${currentMenu.id}`} className="card hover:shadow-md transition-all">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="text-brand-orange" size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-brand-dark">Lista de compras</p>
                    <p className="text-gray-500 text-sm">{currentMenu.shopping_list_generated ? 'Lista gerada' : 'Ainda não gerada'}</p>
                  </div>
                </div>
                <span className={currentMenu.shopping_list_generated ? 'badge-green' : 'badge-orange'}>
                  {currentMenu.shopping_list_generated ? '✓ Pronta' : 'Gerar lista'}
                </span>
              </Link>
            </>
          )}
        </div>

        {/* Menu history */}
        {menus.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-brand-dark mb-4">Histórico de cardápios</h2>
            <div className="space-y-3">
              {menus.map(menu => (
                <Link key={menu.id} to={`/cardapio/${menu.id}`}
                  className="card flex items-center justify-between hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                      <Calendar className="text-brand-green" size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-dark text-sm">
                        {new Date(menu.week_start).toLocaleDateString('pt-BR')} – {new Date(menu.week_end).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-gray-500 text-xs">Gerado em {new Date(menu.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-400" size={18} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {menus.length === 0 && !loading && user?.plan !== 'trial' && (
          <div className="text-center py-16 text-gray-400">
            <Calendar size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nenhum cardápio ainda</p>
            <p className="text-sm">Gere seu primeiro cardápio da semana!</p>
          </div>
        )}
      </div>

      {showIngredientsModal && (
        <IngredientsAtHomeModal
          onConfirm={generateMenu}
          onClose={() => setShowIngredientsModal(false)}
        />
      )}
    </div>
  );
}
