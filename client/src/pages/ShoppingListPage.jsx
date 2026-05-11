import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Check, Download, Camera, Info, Plus, Minus } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const CATEGORY_LABELS = {
  hortifruti: '🥦 Hortifruti',
  carnes_aves_peixes: '🥩 Carnes, Aves e Peixes',
  laticinios_frios: '🧀 Laticínios e Frios',
  padaria: '🍞 Padaria',
  mercearia: '🛒 Mercearia',
  congelados: '🧊 Congelados',
  outros: '📦 Outros'
};

export default function ShoppingListPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [atHomeItems, setAtHomeItems] = useState([]);
  const [showAtHome, setShowAtHome] = useState(false);
  const [newAtHome, setNewAtHome] = useState({ name: '', quantity: '', unit: 'g' });

  useEffect(() => { loadList(); }, [id]);

  const loadList = async () => {
    try {
      const { data } = await api.get(`/shopping/${id}`);
      setList(data);
    } catch {
      // List not generated yet
    }
    setLoading(false);
  };

  const generateList = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/shopping/generate', {
        menu_id: id, ingredients_already_have: atHomeItems
      });
      setList(data.list);
      toast.success('Lista de compras gerada! 🛒');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao gerar lista');
    } finally {
      setGenerating(false);
    }
  };

  const toggleItem = async (itemName) => {
    if (!list) return;
    const item = list.items.find(i => i.name === itemName);
    try {
      const { data } = await api.patch(`/shopping/${list.id}/check`, {
        item_name: itemName, checked: !item.checked
      });
      setList(prev => ({ ...prev, items: data.items }));
    } catch {}
  };

  const groupByCategory = (items) => {
    const grouped = {};
    items.forEach(item => {
      const cat = item.category || 'outros';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    return grouped;
  };

  const checkedCount = list?.items?.filter(i => i.checked).length || 0;
  const totalCount = list?.items?.length || 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream">
      <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-cream pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={`/cardapio/${id}`} className="text-gray-400 hover:text-brand-dark">
            <ChevronLeft size={22} />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-brand-dark">Lista de compras</h1>
            {list && <p className="text-xs text-gray-500">{checkedCount}/{totalCount} itens</p>}
          </div>
          {list && (
            <button onClick={() => window.print()}
              className="text-brand-green font-semibold text-sm flex items-center gap-1.5">
              <Download size={16} /> PDF
            </button>
          )}
        </div>
        {list && (
          <div className="max-w-2xl mx-auto px-4 pb-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-green rounded-full transition-all"
                style={{ width: `${totalCount ? (checkedCount / totalCount) * 100 : 0}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {!list ? (
          <div>
            {/* Generate list */}
            <div className="card mb-6">
              <h2 className="font-bold text-brand-dark mb-2">Gerar lista de compras</h2>
              <p className="text-gray-500 text-sm mb-4">
                {user?.plan === 'trial'
                  ? 'Lista básica com todos os ingredientes'
                  : 'Lista completa organizada por setor do supermercado, com quantidades precisas e o que já tem em casa descontado.'}
              </p>

              {/* At home items */}
              <button onClick={() => setShowAtHome(!showAtHome)}
                className="text-sm text-brand-green font-semibold mb-4 flex items-center gap-1.5">
                <Plus size={15} /> Informar o que já tenho em casa
              </button>

              {showAtHome && (
                <div className="mb-4 bg-green-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-brand-dark mb-3">Ingredientes que você já tem:</p>
                  <div className="flex gap-2 mb-3">
                    <input className="input flex-1 text-sm" placeholder="Ingrediente" value={newAtHome.name}
                      onChange={e => setNewAtHome(p => ({ ...p, name: e.target.value }))} />
                    <input className="input w-16 text-sm" type="number" placeholder="Qtd" value={newAtHome.quantity}
                      onChange={e => setNewAtHome(p => ({ ...p, quantity: e.target.value }))} />
                    <select className="input w-16 text-sm" value={newAtHome.unit}
                      onChange={e => setNewAtHome(p => ({ ...p, unit: e.target.value }))}>
                      <option value="g">g</option><option value="kg">kg</option>
                      <option value="ml">ml</option><option value="un">un</option>
                    </select>
                    <button onClick={() => {
                      if (!newAtHome.name.trim()) return;
                      setAtHomeItems(p => [...p, { ...newAtHome, quantity: parseFloat(newAtHome.quantity) || null }]);
                      setNewAtHome({ name: '', quantity: '', unit: 'g' });
                    }} className="btn-primary py-2 px-3"><Plus size={16} /></button>
                  </div>
                  {atHomeItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-green-100 last:border-0">
                      <span className="text-brand-dark">{item.name} {item.quantity ? `— ${item.quantity}${item.unit}` : ''}</span>
                      <button onClick={() => setAtHomeItems(p => p.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-500"><Minus size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={generateList} disabled={generating} className="btn-primary w-full">
                {generating ? 'Gerando lista...' : '🛒 Gerar lista de compras'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Nutrition info banner for pro users */}
            {user?.plan !== 'trial' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3">
                <Camera size={18} className="text-brand-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-700 mb-0.5">Quer ver as informações nutricionais?*</p>
                  <p className="text-xs text-blue-600">
                    Fotografe o rótulo de cada ingrediente ao comprá-lo. O sistema calculará os valores nutricionais de cada prato automaticamente.
                  </p>
                  <p className="text-xs text-blue-400 mt-1">* Caso não fotografe todos os ingredientes, usaremos dados genéricos de referência (valores aproximados).</p>
                </div>
              </div>
            )}

            {/* Items by category */}
            {user?.plan === 'trial' ? (
              // Basic list - no categories
              <div className="card">
                <h3 className="font-bold text-brand-dark mb-4">Ingredientes necessários</h3>
                <div className="space-y-2">
                  {list.items.map((item, i) => (
                    <button key={i} onClick={() => toggleItem(item.name)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        item.checked ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
                      }`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        item.checked ? 'bg-brand-green border-brand-green' : 'border-gray-300'
                      }`}>
                        {item.checked && <Check size={12} className="text-white" />}
                      </div>
                      <span className={`text-sm font-medium ${item.checked ? 'line-through text-gray-400' : 'text-brand-dark'}`}>
                        {item.name}
                      </span>
                      {item.quantity && (
                        <span className="ml-auto text-xs text-gray-500 flex-shrink-0">
                          {item.quantity}{item.unit}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 text-center">
                    ✨ Assine o plano Pro para ter a lista organizada por setor, com quantidades precisas e estimativa de custo
                  </p>
                  <Link to="/planos" className="btn-primary w-full mt-3 text-sm py-2.5 text-center block">Ver planos</Link>
                </div>
              </div>
            ) : (
              // Complete list - by category
              Object.entries(groupByCategory(list.items)).map(([category, items]) => (
                <div key={category} className="card mb-4">
                  <h3 className="font-bold text-brand-dark mb-3">{CATEGORY_LABELS[category] || category}</h3>
                  <div className="space-y-1.5">
                    {items.map((item, i) => (
                      <button key={i} onClick={() => toggleItem(item.name)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                          item.checked ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
                        }`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          item.checked ? 'bg-brand-green border-brand-green' : 'border-gray-300'
                        }`}>
                          {item.checked && <Check size={12} className="text-white" />}
                        </div>
                        <span className={`text-sm font-medium flex-1 ${item.checked ? 'line-through text-gray-400' : 'text-brand-dark'}`}>
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {item.quantity}{item.unit}
                        </span>
                        {user?.plan !== 'trial' && (
                          <button className="p-1 text-gray-300 hover:text-brand-blue transition-colors"
                            title="Fotografar rótulo para informação nutricional">
                            <Camera size={15} />
                          </button>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
