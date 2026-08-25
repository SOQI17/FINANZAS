import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Calendar
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { BudgetModal } from './modals/BudgetModal';

export const BudgetsView: React.FC = () => {
  const { budgets, filteredTransactions, deleteBudget, activeScope, selectedPeriod } = useFinance();
  const [showAddModal, setShowAddModal] = useState(false);

  // Compute spend per category in selected period
  const categoryExpenses: Record<string, number> = {};
  filteredTransactions
    .filter(t => t.type === 'expense' && t.date.startsWith(selectedPeriod))
    .forEach(t => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-6 h-6 text-emerald-400" />
            <span>Presupuestos Mensuales</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Control de límites de gasto por categoría ({selectedPeriod})
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Definir Presupuesto</span>
        </button>
      </div>

      {/* Budget Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map(b => {
          const spent = categoryExpenses[b.category] || 0;
          const pct = b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0;
          const remaining = b.limitAmount - spent;

          let statusColor = 'bg-emerald-500';
          let textColor = 'text-emerald-400';
          let borderStyle = 'border-slate-800';

          if (pct >= 100) {
            statusColor = 'bg-rose-500';
            textColor = 'text-rose-400';
            borderStyle = 'border-rose-500/30';
          } else if (pct >= 80) {
            statusColor = 'bg-amber-500';
            textColor = 'text-amber-400';
            borderStyle = 'border-amber-500/30';
          }

          return (
            <div key={b.budgetId} className={`bg-slate-900/90 p-5 rounded-2xl border ${borderStyle} shadow-md`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Categoría</span>
                  <h3 className="font-bold text-base text-white">{b.category}</h3>
                </div>

                <div className="flex items-center gap-2">
                  {pct >= 100 ? (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                      <AlertTriangle className="w-3 h-3" /> Excedido
                    </span>
                  ) : pct >= 80 ? (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                      <AlertCircle className="w-3 h-3" /> Alerta (≥80%)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                      <CheckCircle2 className="w-3 h-3" /> En Rango
                    </span>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar presupuesto de ${b.category}?`)) {
                        deleteBudget(b.budgetId);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Numbers */}
              <div className="flex items-baseline justify-between my-3">
                <span className="text-sm font-semibold text-slate-300">
                  Gastado: <span className={textColor}>${spent.toFixed(2)}</span>
                </span>
                <span className="text-xs text-slate-400">
                  Límite: <span className="font-bold text-white">${b.limitAmount.toFixed(2)}</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${statusColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                <span>{pct.toFixed(0)}% Utilizado</span>
                <span>
                  {remaining >= 0 ? `Restante: $${remaining.toFixed(2)}` : `Exceso: $${Math.abs(remaining).toFixed(2)}`}
                </span>
              </div>
            </div>
          );
        })}

        {budgets.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
            <PieChart className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No has definido presupuestos para este modo.</p>
          </div>
        )}
      </div>

      {showAddModal && <BudgetModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};
