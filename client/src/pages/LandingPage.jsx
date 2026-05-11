import { Link } from 'react-router-dom';
import { CheckCircle, Calendar, ShoppingCart, ChefHat, Star, ArrowRight, Leaf } from 'lucide-react';

const PLANS = [
  {
    name: 'Grátis', price: 'R$ 0', period: '',
    description: 'Para experimentar',
    features: ['1 cardápio completo', 'Lista básica de compras', 'Export PDF', 'Receitas passo a passo'],
    cta: 'Começar grátis', ctaLink: '/cadastro', highlight: false, color: 'border-gray-200'
  },
  {
    name: 'Pro', price: 'R$ 24,90', period: '/mês',
    description: 'Para quem quer praticidade toda semana',
    features: ['4 cardápios por mês', 'Lista completa por setor', 'Informações nutricionais*', 'Export PDF', 'Email semanal automático', 'Receitas passo a passo'],
    cta: 'Assinar Pro', ctaLink: '/cadastro?plano=pro', highlight: true, color: 'border-brand-green'
  },
  {
    name: 'Família', price: 'R$ 34,90', period: '/mês',
    description: 'Para toda a família',
    features: ['Tudo do Pro', 'Até 3 perfis individuais', 'Integração WhatsApp', 'Cardápio por perfil'],
    cta: 'Assinar Família', ctaLink: '/cadastro?plano=family', highlight: false, color: 'border-brand-blue'
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-green rounded-xl flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-brand-dark">
              nutri<span className="text-brand-green">week</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-gray-600 hover:text-brand-dark font-medium text-sm transition-colors">Entrar</Link>
            <Link to="/cadastro" className="btn-primary text-sm py-2 px-4">Começar grátis</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-brand-green text-sm font-semibold px-4 py-2 rounded-full mb-8 border border-green-200">
          <Star size={14} fill="currentColor" /> Novo: informações nutricionais por prato
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-brand-dark leading-tight mb-6">
          Sua semana na mesa,<br />
          <span className="text-brand-green">sem esforço.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Cardápio semanal personalizado + lista de compras por setor do mercado, gerados em segundos com inteligência artificial.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/cadastro" className="btn-orange text-lg px-8 py-4 flex items-center justify-center gap-2">
            Criar meu cardápio grátis <ArrowRight size={20} />
          </Link>
          <Link to="#como-funciona" className="btn-secondary text-lg px-8 py-4">
            Como funciona
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">Sem cartão de crédito · 1 cardápio grátis para testar</p>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-brand-dark mb-4">Como funciona</h2>
          <p className="text-gray-500 text-center mb-14">3 passos simples para nunca mais ficar sem saber o que cozinhar</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '👤', step: '1', title: 'Conte sobre você', desc: 'Informe suas preferências, restrições, quantas pessoas e o que tem nos armários.' },
              { icon: '🤖', step: '2', title: 'A IA monta tudo', desc: 'Cardápio da semana completo com café, almoço, jantar e receitas passo a passo.' },
              { icon: '🛒', step: '3', title: 'Leve pro mercado', desc: 'Lista organizada por setor do supermercado, pronta para usar no celular.' }
            ].map(({ icon, step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">{icon}</div>
                <div className="text-brand-green font-bold text-sm mb-2">PASSO {step}</div>
                <h3 className="text-xl font-bold text-brand-dark mb-2">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-brand-dark mb-14">Tudo que você precisa</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Calendar size={24} />, title: 'Cardápio personalizado', desc: 'De acordo com suas preferências, restrições e o que você já tem em casa.' },
              { icon: <ShoppingCart size={24} />, title: 'Lista inteligente', desc: 'Organizada por setor — hortifruti, carnes, laticínios — sem repetir ingredientes.' },
              { icon: <ChefHat size={24} />, title: 'Receitas completas', desc: 'Passo a passo detalhado para 100% dos pratos do cardápio.' },
              { icon: '⭐', title: 'Aprende seus gostos', desc: 'Avalie as receitas e o sistema fica cada vez mais alinhado ao seu gosto.', text: true },
              { icon: '🥗', title: 'Varia toda semana', desc: 'Nunca repete o mesmo prato e evita as receitas que você não gostou.', text: true },
              { icon: '📊', title: 'Informações nutricionais', desc: 'Tabela nutricional completa por prato, seguindo as normas da ANVISA.*', text: true },
            ].map(({ icon, title, desc, text }) => (
              <div key={title} className="card hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 text-brand-green text-2xl">
                  {text ? icon : <span>{icon}</span>}
                </div>
                <h3 className="font-bold text-brand-dark mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-6">* Informações nutricionais disponíveis nos planos pagos</p>
        </div>
      </section>

      {/* Planos */}
      <section className="bg-white py-20" id="planos">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-brand-dark mb-4">Escolha seu plano</h2>
          <p className="text-gray-500 text-center mb-14">Comece grátis, assine quando quiser</p>
          <div className="grid md:grid-cols-3 gap-8">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`card border-2 ${plan.color} relative ${plan.highlight ? 'shadow-lg scale-105' : ''}`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-green text-white text-xs font-bold px-4 py-1.5 rounded-full">MAIS POPULAR</span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-brand-dark">{plan.name}</h3>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-brand-dark">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={16} className="text-brand-green mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.ctaLink} className={`block text-center font-semibold py-3 rounded-xl transition-all ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">
            💳 Cartão de crédito ou PIX · 🔒 Cancelamento fácil · ↩️ Garantia de 7 dias
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark text-white py-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="font-bold">nutri<span className="text-brand-green">week</span></span>
          </div>
          <p className="text-gray-400 text-sm text-center">
            Sua semana na mesa, sem esforço. · © 2025 NutriWeek
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Termos de uso</a>
            <a href="#" className="hover:text-white transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
