import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';

const CUISINE_OPTIONS = [
  { id: 'caseira', label: '🍲 Comida caseira' },
  { id: 'italiana', label: '🍝 Italiana' },
  { id: 'japonesa', label: '🍣 Japonesa' },
  { id: 'mexicana', label: '🌮 Mexicana' },
  { id: 'arabe', label: '🧆 Árabe' },
  { id: 'nordestina', label: '🌶️ Nordestina' },
  { id: 'vegetariana', label: '🥦 Vegetariana' },
  { id: 'vegana', label: '🌱 Vegana' },
  { id: 'low-carb', label: '🥩 Low-carb' },
  { id: 'low-fodmap', label: '🫙 Low-FODMAP' },
  { id: 'fitness', label: '💪 Fitness' },
  { id: 'alto_proteina', label: '🏋️ Alto em proteína' },
  { id: 'sanduiches', label: '🥪 Sanduíches e wraps' },
  { id: 'saladas', label: '🥗 Saladas e bowls' },
  { id: 'sopas', label: '🍵 Sopas e caldos' },
];

const RESTRICTION_OPTIONS = [
  { id: 'gluten', label: '🌾 Sem glúten' },
  { id: 'lactose', label: '🥛 Sem lactose' },
  { id: 'amendoim', label: '🥜 Alergia a amendoim' },
  { id: 'frutos_mar', label: '🦐 Sem frutos do mar' },
  { id: 'ovo', label: '🥚 Sem ovo' },
  { id: 'soja', label: '🫘 Sem soja' },
  { id: 'nozes', label: '🌰 Alergia a nozes' },
];

const MEAL_OPTIONS = [
  { id: 'breakfast', label: '☀️ Café da manhã' },
  { id: 'morning_snack', label: '🍎 Lanche da manhã' },
  { id: 'lunch', label: '🍽️ Almoço' },
  { id: 'afternoon_snack', label: '🧃 Lanche da tarde' },
  { id: 'dinner', label: '🌙 Jantar' },
  { id: 'supper', label: '🌟 Ceia' },
];

const SPICE_OPTIONS = [
  { id: 'alho', label: '🧄 Alho' },
  { id: 'cebola', label: '🧅 Cebola' },
  { id: 'coentro', label: '🌿 Coentro' },
  { id: 'salsinha', label: '🌱 Salsinha' },
  { id: 'pimenta', label: '🌶️ Pimenta' },
  { id: 'oregano', label: '🫙 Orégano' },
  { id: 'cominho', label: '🌾 Cominho' },
  { id: 'paprica', label: '🫑 Páprica' },
  { id: 'curry', label: '🟡 Curry' },
  { id: 'tomilho', label: '🌿 Tomilho' },
  { id: 'shoyu', label: '🫗 Shoyu' },
  { id: 'limao', label: '🍋 Limão' },
];

const APPLIANCE_OPTIONS = [
  { id: 'fogao', label: '🔥 Fogão' },
  { id: 'forno', label: '🫕 Forno' },
  { id: 'microondas', label: '📦 Micro-ondas' },
  { id: 'airfryer', label: '🌬️ Air fryer' },
  { id: 'liquidificador', label: '🫙 Liquidificador' },
  { id: 'processador', label: '⚙️ Processador' },
  { id: 'panela_pressao', label: '🫕 Panela de pressão' },
  { id: 'churrasqueira', label: '🔥 Churrasqueira' },
];

const GOAL_OPTIONS = [
  { id: 'variety', label: '🎨 Variedade e praticidade' },
  { id: 'weight_loss', label: '⚖️ Perder peso' },
  { id: 'muscle_gain', label: '💪 Ganhar massa' },
  { id: 'health', label: '❤️ Comer mais saudável' },
  { id: 'budget', label: '💰 Economizar no mercado' },
];

const DISLIKED_FOODS_OPTIONS = [
  'Fígado e vísceras', 'Peixe', 'Frutos do mar', 'Carne vermelha', 'Brócolis',
  'Couve-flor', 'Beterraba', 'Berinjela', 'Jiló', 'Chuchu', 'Quiabo',
  'Coentro', 'Pimenta', 'Cebola crua', 'Alho cru', 'Tofu', 'Grão-de-bico',
  'Lentilha', 'Repolho', 'Sardinha'
];

function MultiSelect({ options, selected, onChange, max }) {
  const toggle = (id) => {
    if (selected.includes(id)) onChange(selected.filter(s => s !== id));
    else if (!max || selected.length < max) onChange([...selected, id]);
    else toast.error(`Máximo de ${max} opções`);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ id, label }) => (
        <button key={id} type="button" onClick={() => toggle(id)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
            selected.includes(id)
              ? 'bg-brand-green border-brand-green text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:border-brand-green'
          }`}>
          {selected.includes(id) && <Check size={12} className="inline mr-1" />}
          {label}
        </button>
      ))}
    </div>
  );
}

const STEPS = [
  'Refeições', 'Culinária', 'Restrições', 'Desgosta', 'Temperos', 'Equipamentos', 'Objetivo', 'Detalhes'
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState({
    meals_enabled: ['breakfast', 'lunch', 'dinner'],
    cuisine_types: [],
    restrictions: [],
    disliked_foods: [],
    favorite_spices: [],
    appliances: ['fogao'],
    avoid_frying: false,
    goal: 'variety',
    people_count: 1,
    cooking_time_minutes: 45,
    weekly_budget: '',
  });

  const update = (key, value) => setPrefs(p => ({ ...p, [key]: value }));

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.put('/user/preferences', {
        ...prefs,
        weekly_budget: prefs.weekly_budget ? parseFloat(prefs.weekly_budget) : null
      });
      toast.success('Preferências salvas! Vamos gerar seu cardápio 🥗');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Erro ao salvar preferências');
    } finally {
      setLoading(false);
    }
  };

  const canNext = () => {
    if (step === 0) return prefs.meals_enabled.length > 0;
    return true;
  };

  const steps = [
    // Step 0 - Refeições
    <div key={0}>
      <h2 className="text-xl font-bold text-brand-dark mb-2">Quais refeições você quer no cardápio?</h2>
      <p className="text-gray-500 text-sm mb-6">Selecione pelo menos uma</p>
      <MultiSelect options={MEAL_OPTIONS} selected={prefs.meals_enabled} onChange={v => update('meals_enabled', v)} />
    </div>,

    // Step 1 - Culinária
    <div key={1}>
      <h2 className="text-xl font-bold text-brand-dark mb-2">Que tipo de culinária você mais gosta?</h2>
      <p className="text-gray-500 text-sm mb-6">Selecione quantas quiser</p>
      <MultiSelect options={CUISINE_OPTIONS} selected={prefs.cuisine_types} onChange={v => update('cuisine_types', v)} />
    </div>,

    // Step 2 - Restrições
    <div key={2}>
      <h2 className="text-xl font-bold text-brand-dark mb-2">Tem alguma restrição alimentar ou alergia?</h2>
      <p className="text-gray-500 text-sm mb-6">Deixe em branco se não houver</p>
      <MultiSelect options={RESTRICTION_OPTIONS} selected={prefs.restrictions} onChange={v => update('restrictions', v)} />
    </div>,

    // Step 3 - Não gosta
    <div key={3}>
      <h2 className="text-xl font-bold text-brand-dark mb-2">O que você não gosta de comer?</h2>
      <p className="text-gray-500 text-sm mb-6">Esses ingredientes serão evitados no cardápio</p>
      <MultiSelect options={DISLIKED_FOODS_OPTIONS.map(f => ({ id: f, label: f }))} selected={prefs.disliked_foods} onChange={v => update('disliked_foods', v)} />
    </div>,

    // Step 4 - Temperos
    <div key={4}>
      <h2 className="text-xl font-bold text-brand-dark mb-2">Quais temperos você mais gosta?</h2>
      <p className="text-gray-500 text-sm mb-6">As receitas vão priorizar esses temperos</p>
      <MultiSelect options={SPICE_OPTIONS} selected={prefs.favorite_spices} onChange={v => update('favorite_spices', v)} />
    </div>,

    // Step 5 - Equipamentos
    <div key={5}>
      <h2 className="text-xl font-bold text-brand-dark mb-2">Quais equipamentos você tem em casa?</h2>
      <p className="text-gray-500 text-sm mb-6">As receitas serão adaptadas para o que você tem</p>
      <MultiSelect options={APPLIANCE_OPTIONS} selected={prefs.appliances} onChange={v => update('appliances', v)} />
      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={() => update('avoid_frying', !prefs.avoid_frying)}
          className={`w-12 h-6 rounded-full transition-all ${prefs.avoid_frying ? 'bg-brand-green' : 'bg-gray-200'}`}>
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${prefs.avoid_frying ? 'translate-x-6' : ''}`} />
        </button>
        <span className="text-sm font-medium text-brand-dark">Evitar frituras</span>
      </div>
    </div>,

    // Step 6 - Objetivo
    <div key={6}>
      <h2 className="text-xl font-bold text-brand-dark mb-2">Qual é o seu principal objetivo?</h2>
      <p className="text-gray-500 text-sm mb-6">Isso vai ajudar a personalizar melhor o cardápio</p>
      <div className="space-y-3">
        {GOAL_OPTIONS.map(({ id, label }) => (
          <button key={id} type="button" onClick={() => update('goal', id)}
            className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${
              prefs.goal === id ? 'border-brand-green bg-green-50 text-brand-green' : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
            {prefs.goal === id && <Check size={16} className="inline mr-2" />}
            {label}
          </button>
        ))}
      </div>
    </div>,

    // Step 7 - Detalhes
    <div key={7}>
      <h2 className="text-xl font-bold text-brand-dark mb-2">Últimos detalhes</h2>
      <p className="text-gray-500 text-sm mb-6">Para deixar o cardápio ainda mais preciso</p>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">Quantas pessoas vão comer?</label>
          <div className="flex items-center gap-4">
            {[1,2,3,4,5,6].map(n => (
              <button key={n} type="button" onClick={() => update('people_count', n)}
                className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                  prefs.people_count === n ? 'bg-brand-green text-white' : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-brand-green'
                }`}>{n}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">
            Tempo disponível para cozinhar (por refeição)
          </label>
          <select className="input" value={prefs.cooking_time_minutes} onChange={e => update('cooking_time_minutes', parseInt(e.target.value))}>
            <option value={15}>Até 15 min (bem rápido)</option>
            <option value={30}>Até 30 min</option>
            <option value={45}>Até 45 min</option>
            <option value={60}>Até 1 hora</option>
            <option value={90}>Sem pressa (até 1h30)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-brand-dark mb-2">
            Orçamento semanal para compras (opcional)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
            <input className="input pl-10" type="number" placeholder="Ex: 300" min="0"
              value={prefs.weekly_budget} onChange={e => update('weekly_budget', e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  ];

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-green rounded-xl flex items-center justify-center">
              <Leaf size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-brand-dark">nutri<span className="text-brand-green">week</span></span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-brand-green">Passo {step + 1} de {STEPS.length}</span>
            <span className="text-sm text-gray-500">{STEPS[step]}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-brand-green rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* Step content */}
        <div className="card animate-fade-in">
          {steps[step]}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => step > 0 && setStep(s => s - 1)}
            className={`flex items-center gap-2 text-gray-500 font-medium transition-all ${step === 0 ? 'opacity-0 pointer-events-none' : 'hover:text-brand-dark'}`}>
            <ChevronLeft size={18} /> Voltar
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={() => canNext() && setStep(s => s + 1)}
              disabled={!canNext()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              Próximo <ChevronRight size={18} />
            </button>
          ) : (
            <button onClick={handleFinish} disabled={loading} className="btn-orange flex items-center gap-2">
              {loading ? 'Salvando...' : '🎉 Finalizar e ir para o dashboard'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
