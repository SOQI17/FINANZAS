import React from 'react';
import {
  Lightbulb,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { FinancialInsight } from '../types';

interface InsightsViewProps {
  onNavigateToTab?: (tab: 'transactions' | 'budgets') => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ onNavigateToTab }) => {
  const { insights, metrics, activeScope } = useFinance();

  const getSeverityBadge = (severity: FinancialInsight['severity']) => {
    switch (severity) {
      case 'high':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Alta Prioridad
          </span>
        );
      case 'medium':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Advertencia
          </span>
        );
      case 'success':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Positivo
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>Motor de Puntos de Mejora Financiera</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Recomendaciones automáticas basadas en tu patrones de gastos ({activeScope === 'individual' ? 'Mis Finanzas' : 'Finanzas Pareja'})
          </p>
        </div>
      </div>

      {/* Summary Score Header */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasa de Ahorro Actual</span>
          <div className="text-3xl font-extrabold text-amber-400 mt-1">{metrics.savingsRate.toFixed(1)}%</div>
          <p className="text-xs text-slate-400 mt-1">
            {metrics.savingsRate >= 20 ? 'Meta del 20% superada con éxito' : 'Por debajo del objetivo del 20% mensual'}
          </p>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alertas Detectadas</span>
          <div className="text-3xl font-extrabold text-rose-400 mt-1">
            {insights.filter(i => i.severity === 'high' || i.severity === 'medium').length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Límites de presupuesto o gastos inusuales</p>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Potencial de Ahorro Mensual</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-1">
            +${insights.reduce((sum, i) => sum + (i.impactAmount || 0), 0).toFixed(2)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Estimado ajustando categorías bajo alerta</p>
        </div>
      </div>

      {/* Insights Cards List */}
      <div className="space-y-4">
        {insights.map(item => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              item.severity === 'high'
                ? 'bg-slate-900/90 border-rose-500/30'
                : item.severity === 'medium'
                ? 'bg-slate-900/90 border-amber-500/30'
                : 'bg-slate-900/90 border-emerald-500/30'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 shrink-0 mt-0.5">
                <Lightbulb className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  {getSeverityBadge(item.severity)}
                  {item.categoryName && (
                    <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                      {item.categoryName}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
                  {item.description}
                </p>

                {item.impactAmount && item.impactAmount > 0 && (
                  <p className="text-xs font-semibold text-emerald-400 mt-2">
                    Impacto financiero estimado: +${item.impactAmount.toFixed(2)} / mes
                  </p>
                )}
              </div>
            </div>

            {item.actionText && onNavigateToTab && (
              <button
                onClick={() => {
                  if (item.actionType === 'adjust_budget') {
                    onNavigateToTab('budgets');
                  } else {
                    onNavigateToTab('transactions');
                  }
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition flex items-center gap-1.5 shrink-0 self-start md:self-center"
              >
                <span>{item.actionText}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
