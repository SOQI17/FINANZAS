import React, { useState } from 'react';
import { X, PieChart } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';

interface BudgetModalProps {
  onClose: () => void;
}

const CATEGORIES = [
  'Alimentación y Súper',
  'Restaurantes y Cafés',
  'Transporte y Gasolina',
  'Alquiler y Hogar',
  'Servicios (Luz, Agua, Internet)',
  'Supermercado Compartido',
  'Entretenimiento',
  'Salidas y Viajes',
  'Otros'
];

export const BudgetModal: React.FC<BudgetModalProps> = ({ onClose }) => {
  const { user, couple } = useAuth();
  const { saveBudget, activeScope, selectedPeriod } = useFinance();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [limitAmount, setLimitAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitAmount || parseFloat(limitAmount) <= 0) return;

    await saveBudget({
      targetId: activeScope === 'individual' ? (user?.uid || 'user_1') : (couple?.coupleId || 'couple_1'),
      targetType: activeScope === 'individual' ? 'individual' : 'shared',
      category,
      limitAmount: parseFloat(limitAmount),
      period: selectedPeriod,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100">
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-lg">Definir Presupuesto Mensual</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Categoría de Gasto:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Límite Mensual Máximo ($):</label>
            <input
              type="number"
              step="0.01"
              placeholder="Ej. 300.00"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              required
              className="w-full bg-slate-950 text-white font-mono text-base px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition"
            >
              Guardar Presupuesto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
