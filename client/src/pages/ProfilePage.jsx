import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Copy, Crown, AlertTriangle, Check, Share2, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import toast from 'react-hot-toast';

const PLAN_INFO = {
  trial: { label: 'Grátis', color: 'bg-gray-100 text-gray-600', desc: '1 cardápio de demonstração' },
  pro: { label: 'Pro', color: 'bg-green-100 text-green-700', desc: '4 cardápios/mês + lista completa' },
  family: { label: 'Família', color: 'bg-blue-100 text-blue-700', desc: '4 cardápios/mês + 3 perfis + WhatsApp' },
};

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [referralInfo, setReferralInfo] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      loadReferralInfo();
    }
  }, [user]);

  const loadReferralInfo = async () => {
    try {
      const { data } = await api.get('/user/referral-info');
      setReferralInfo(data);
    } catch {}
  };

  const copyReferralLink = () => {
    if (!referralInfo?.referral_link) return;
    navigator.clipboard.writeText(referralInfo.referral_link);
    toast.success('Link copiado!');
  };

  const saveName = async () => {
    if (!name.trim()) return;
    setSavingName(true);
    try {
      await api.put('/user/profile', { name });
      await refreshUser();
      toast.success('Nome atualizado!');
    } catch {
      toast.error('Erro ao salvar');
    } finally {
      setSavingName(false);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      const { data } = await api.post('/subscription/cancel', { reason: cancelReason });
      toast.success(data.message);
      await refreshUser();
      setShowCancel(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cancelar');
    } finally {
      setCanceling(false);
    }
  };

  const plan = user?.plan || 'trial';
  const planInfo = PLAN_INFO[plan];

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-400 hover:text-brand-dark transition-colors">
            <ChevronLeft size={22} />
          </Link>
          <h1 className="font-bold text-brand-dark">Meu perfil</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Profile info */}
        <div className="card">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-brand-green rounded-2xl flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-brand-dark text-lg">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Nome</label>
              <div className="flex gap-2">
                <input className="input flex-1" value={name} onChange={e => setName(e.target.value)} />
                <button onClick={saveName} disabled={savingName || name === user?.name}
                  className="btn-primary py-3 px-4 disabled:opacity-40">
                  {savingName ? '...' : <Check size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-brand-dark flex items-center gap-2">
              <Crown size={18} className="text-brand-green" /> Minha assinatura
            </h2>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${planInfo.color}`}>{planInfo.label}</span>
          </div>
          <p className="text-gray-500 text-sm mb-4">{planInfo.desc}</p>

          {plan === 'trial' ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                {user?.trial_used
                  ? 'Seu cardápio gratuito foi utilizado. Assine para continuar!'
                  : 'Você tem 1 cardápio gratuito disponível.'}
              </p>
              <Link to="/planos" className="btn-orange w-full text-center block">
                Ver planos disponíveis →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <Link to="/planos" className="btn-secondary w-full text-center block text-sm">
                Mudar de plano
              </Link>
              {!showCancel && (
                <button onClick={() => setShowCancel(true)}
                  className="w-full text-sm text-red-400 hover:text-red-600 font-medium py-2 transition-colors">
                  Cancelar assinatura
                </button>
              )}
              {showCancel && (
                <div className="border-2 border-red-100 rounded-xl p-4 bg-red-50 animate-fade-in">
                  <div className="flex gap-2 mb-3">
                    <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-700 text-sm">Cancelar assinatura</p>
                      <p className="text-red-500 text-xs mt-0.5">
                        Se cancelar nos primeiros 7 dias corridos da 1ª assinatura, você recebe o estorno integral.
                      </p>
                    </div>
                  </div>
                  <textarea
                    className="input text-sm mb-3 resize-none"
                    rows={3}
                    placeholder="Nos conte o motivo (opcional)..."
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setShowCancel(false)}
                      className="flex-1 text-sm font-semibold py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                      Manter assinatura
                    </button>
                    <button onClick={handleCancel} disabled={canceling}
                      className="flex-1 text-sm font-semibold py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                      {canceling ? 'Cancelando...' : 'Confirmar cancelamento'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Referral program */}
        {referralInfo && (
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Share2 size={18} className="text-brand-blue" />
              <h2 className="font-bold text-brand-dark">Programa de indicação</h2>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Indique amigos e ganhe <strong>30% de desconto</strong> na próxima mensalidade para cada pessoa que assinar!
            </p>

            {referralInfo.pending_discount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <p className="text-sm font-semibold text-green-700">
                  🎉 Você tem {referralInfo.pending_discount}% de desconto aguardando na próxima renovação!
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-3 mb-3">
              <p className="text-xs text-gray-500 mb-1">Seu link de indicação</p>
              <p className="text-sm font-mono text-brand-dark break-all">{referralInfo.referral_link}</p>
            </div>

            <div className="flex gap-2">
              <button onClick={copyReferralLink} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
                <Copy size={15} /> Copiar link
              </button>
              <button onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'NutriWeek', text: 'Planeje suas refeições da semana com IA!', url: referralInfo.referral_link });
                } else copyReferralLink();
              }} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
                <Share2 size={15} /> Compartilhar
              </button>
            </div>

            {referralInfo.referrals_converted > 0 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                ✓ {referralInfo.referrals_converted} pessoa(s) assinaram pelo seu link
              </p>
            )}
          </div>
        )}

        {/* Preferences shortcut */}
        <Link to="/onboarding" className="card hover:shadow-md transition-all flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <Settings size={18} className="text-brand-green" />
            </div>
            <div>
              <p className="font-semibold text-brand-dark text-sm">Atualizar preferências</p>
              <p className="text-gray-500 text-xs">Culinária, temperos, equipamentos...</p>
            </div>
          </div>
          <ChevronLeft size={18} className="text-gray-400 rotate-180" />
        </Link>

        {/* Logout */}
        <button onClick={() => { logout(); navigate('/'); }}
          className="w-full text-center text-red-400 hover:text-red-600 font-medium py-3 transition-colors text-sm">
          Sair da conta
        </button>
      </div>
    </div>
  );
}
