import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export default function IngredientsAtHomeModal({ onConfirm, onClose }) {
  const [ingredients, setIngredients] = useState([]);
  const [input, setInput] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('g');

  const add = () => {
    if (!input.trim()) return;
    setIngredients(prev => [...prev, { name: input.trim(), quantity: parseFloat(qty) || null, unit }]);
    setInput('');
    setQty('');
  };

  const remove = (i) => setIngredients(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-slide-up">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-brand-dark text-lg">Tem algo em casa?</h3>
            <p className="text-gray-500 text-sm mt-1">Informe ingredientes que você já tem para aproveitá-los no cardápio</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4"><X size={20} /></button>
        </div>

        {/* Add ingredient */}
        <div className="flex gap-2 mb-4">
          <input className="input flex-1" placeholder="Ex: frango, arroz, tomate..." value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()} />
          <input className="input w-20" type="number" placeholder="Qtd" value={qty}
            onChange={e => setQty(e.target.value)} min="0" />
          <select className="input w-20" value={unit} onChange={e => setUnit(e.target.value)}>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="l">L</option>
            <option value="un">un</option>
          </select>
          <button onClick={add} className="btn-primary py-3 px-4"><Plus size={18} /></button>
        </div>

        {/* List */}
        {ingredients.length > 0 && (
          <div className="space-y-2 mb-6 max-h-40 overflow-y-auto">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-center justify-between bg-green-50 rounded-xl px-4 py-2">
                <span className="text-sm font-medium text-brand-dark">
                  {ing.name} {ing.quantity ? `— ${ing.quantity}${ing.unit}` : ''}
                </span>
                <button onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => onConfirm([])} className="btn-secondary flex-1">
            Pular e gerar assim mesmo
          </button>
          <button onClick={() => onConfirm(ingredients)} className="btn-primary flex-1">
            {ingredients.length > 0 ? `Gerar com ${ingredients.length} item(ns)` : 'Gerar cardápio'}
          </button>
        </div>
      </div>
    </div>
  );
}
