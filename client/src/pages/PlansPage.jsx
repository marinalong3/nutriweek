import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Leaf, QrCode, CreditCard, Tag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 24,90',
    period: '/mês',
    description: 'Para quem quer praticidade toda semana',
    features: [
      '4 cardápios por mês',
      'Lista completa por setor do supermercado',
      'Informações nutricionais completas*',
      'Export PDF',
      'Email semanal automático',
      'Receitas passo a passo',
      'Histórico e preferências salvas',
    ],
    highlight: true,
  },
  {
    id: 'family',
    name: 'Família',
    price: 'R$ 34,90',
    period: '/mês',
    description: 'Para toda a família',
    features: [
      'Tudo do Pro',
      'Até 3 perfis individuais',
      'Cardápio por perfil',
      'Integração com WhatsApp',
      'Restrições individuais por pessoa',
    ],
    highlight: false,
  }
];

export default function PlansPage() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [payMethod, setPayMethod] = useState('card');
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);

  const validateCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;
    setValidatingCoupon(true);
    try {
      const { data } = await api.post('/subscription/validate-coupon', {
        code: couponCode, plan: selectedPlan
      });
      setCouponData(data);
      toast.success(`Cupom aplicado! ${data.discount_type === 'percent' ? `${data.discount_value}% de desconto` : `R$ ${data.discount_value} de desconto`}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cupom inválido');
      setCouponData(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleCheckout = async () => {
    if (!selectedPlan) return toast.error('Selecione um plano');
    if (!user) return window.location.href = `/cadastro?plano=${selectedPlan}`;

    setLoading(true);
    try {
      if (payMethod === 'card') {
        const { data } = await api.post('/subscription/create-stripe-checkout', {
          plan: selectedPlan, coupon_code: couponCode || undefined
        });
        window.location.href = data.checkout_url;
      } else {
        const { data } = await api.post('/subscription/create-pix', {
          plan: selectedPlan, coupon_code: couponCode || undefined
        });
        setPixData(data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  if (pixData) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
        <div className="card max-w-sm w-full text-center">
          <h2 className="text-xl font-bold text-brand-dark mb-2">Pague com PIX</h2>
          <p className="text-gray-500 text-sm mb-6">Valor: <strong>R$ {pixData.amount}</strong></p>

          {pixData.qr_code_base64 && (
            <img src={`data:image/png;base64,${pixData.qr_code_base64}`} alt="QR Code PIX"
              className="w-48 h-48 mx-auto mb-4 border-4 border-brand-green rounded-xl" />
          )}

          <div className="bg-gray-50 rounded-xl p-3 mb-4 break-all text-xs text-gray-600 font-mono">
            {pixData.qr_code}
          </div>

          <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); toast.success('Código copiado!'); }}
            className="btn-primary w-full mb-3">
            Copiar código PIX
          </button>
          <p className="text-xs text-gray-400">
            Após o pagamento, aguarde até 5 minutos para a ativação automática.
          </p>
          <button onClick={() => setPixData(null)} className="text-sm text-gray-500 mt-4 hover:underline">Voltar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-brand-green rounded-xl flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-brand-dark">nutri<span className="text-brand-green">week</span></span>
          </Link>
          <h1 className="text-3xl font-bold text-brand-dark mb-3">Escolha seu plano</h1>
          <p className="text-gray-500">Cancele quando quiser · Garantia de 7 dias</p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {PLANS.map(plan => (
            <div key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`card border-2 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-brand-green shadow-lg scale-[1.02]'
                  : 'border-transparent hover:border-gray-200'
              } relative`}>
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-xs font-bold px-4 py-1 rounded-full">
                  MAIS POPULAR
                </span>
              )}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-brand-dark text-lg">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedPlan === plan.id ? 'border-brand-green bg-brand-green' : 'border-gray-300'
                }`}>
                  {selectedPlan === plan.id && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-brand-dark">{plan.price}</span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle size={15} className="text-brand-green mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div className="card mb-6 animate-fade-in">
            {/* Coupon */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-brand-dark mb-2">
                <Tag size={14} className="inline mr-1.5" />Tem um cupom de desconto?
              </label>
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Ex: LANCAMENTO30"
                  value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} />
                <button onClick={validateCoupon} disabled={validatingCoupon || !couponCode}
                  className="btn-secondary py-3 px-4 disabled:opacity-50">
                  {validatingCoupon ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponData && (
                <div className="mt-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
                  ✓ Desconto de R$ {couponData.discount_amount} aplicado → Total: R$ {couponData.final_price}
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-brand-dark mb-3">Forma de pagamento</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'card', icon: <CreditCard size={18} />, label: 'Cartão de crédito' },
                  { id: 'pix', icon: <QrCode size={18} />, label: 'PIX' },
                ].map(({ id, icon, label }) => (
                  <button key={id} type="button" onClick={() => setPayMethod(id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 font-medium transition-all ${
                      payMethod === id ? 'border-brand-green bg-green-50 text-brand-green' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleCheckout} disabled={loading}
              className="btn-orange w-full text-lg py-4 disabled:opacity-50">
              {loading ? 'Processando...' : `Assinar plano ${selectedPlan === 'pro' ? 'Pro' : 'Família'}`}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              🔒 Pagamento seguro · ↩️ Reembolso em até 7 dias se não gostar (1ª assinatura)
            </p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          * Informações nutricionais requerem fotos dos rótulos dos ingredientes para cálculo preciso,<br/>
          ou utilizamos dados genéricos de referência (valores aproximados).
        </p>
      </div>
    </div>
  );
}
