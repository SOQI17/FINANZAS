import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Heart,
  ArrowRightLeft,
  Lightbulb,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { TransactionModal } from './modals/TransactionModal';
import { SettleDebtModal } from './modals/SettleDebtModal';
import { getAvailablePeriods, formatPeriodLabel } from '../utils/dateUtils';

const CATEGORY_COLORS: Record<string, string> = {
  'Alimentación y Súper': '#10b981',
  'Restaurantes y Cafés': '#f59e0b',
  'Transporte y Gasolina': '#3b82f6',
  'Alquiler y Hogar': '#8b5cf6',
  'Servicios (Luz, Agua, Internet)': '#ec4899',
  'Supermercado Compartido': '#14b8a6',
  'Entretenimiento': '#6366f1',
  'Salidas y Viajes': '#f43f5e',
  'Otros': '#64748b',
};

interface DashboardProps {
  onNavigateToTab?: (tab: 'transactions' | 'insights' | 'couple') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToTab }) => {
  const { user, partner, couple } = useAuth();
  const { activeScope, metrics, filteredTransactions, insights, sharedDebt, selectedPeriod, setSelectedPeriod } = useFinance();

  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);

  const availablePeriods = getAvailablePeriods();

  // Prepare Pie Chart Data
  const pieData = Object.entries(metrics.expenseByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
    color: CATEGORY_COLORS[category] || '#94a3b8',
  }));

  const topInsight = insights[0];

  return (
    <div className="space-y-6">
      
      {/* Top Controls: Period Selector & Quick Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            {activeScope === 'individual' ? (
              <>
                <Wallet className="w-6 h-6 text-indigo-600" />
                <span>Panel Financiero Personal</span>
              </>
            ) : (
              <>
                <Heart className="w-6 h-6 text-rose-500" />
                <span>Panel Financiero en Pareja</span>
              </>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {activeScope === 'individual'
              ? `Vista de ingresos, gastos y cuentas de ${user?.displayName || 'Usuario'}`
              : `Vista compartida de ${user?.displayName || 'Usuario'} & ${partner?.displayName || 'Pareja'}`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-indigo-500 cursor-pointer shadow-xs transition truncate"
          >
            {availablePeriods.map(p => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddTxModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-[0.98] shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </div>

      {/* Shared Debt Banner ("¿Quién le debe a quién?") */}
      {(activeScope === 'shared' || couple) && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl border border-slate-800 shadow-sm text-white relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-10 relative">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-300 shrink-0">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Balance de Deuda Compartida (Pareja)
                </span>
                {sharedDebt.isBalanced ? (
                  <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>¡Están al día! Sin deudas pendientes.</span>
                  </h3>
                ) : (
                  <h3 className="text-lg font-bold text-white">
                    <span className="text-pink-400">{sharedDebt.debtorName}</span> le debe{' '}
                    <span className="text-emerald-400">${sharedDebt.amountOwed.toFixed(2)}</span> a{' '}
                    <span className="text-teal-300">{sharedDebt.creditorName}</span>
                  </h3>
                )}
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculado automáticamente según los gastos compartidos del mes.
                </p>
              </div>
            </div>

            {!sharedDebt.isBalanced && (
              <button
                onClick={() => setShowSettleModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs shrink-0"
              >
                Saldar Deuda
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Balance Cuentas</span>
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            ${metrics.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span className="text-indigo-600 font-semibold">Disponible</span> en cuentas registradas
          </p>
        </div>

        {/* Total Ingresos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ingresos Mensuales</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">
            +${metrics.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>{formatPeriodLabel(selectedPeriod)}</span>
          </p>
        </div>

        {/* Total Gastos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gastos Mensuales</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600">
            -${metrics.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
            <span>{formatPeriodLabel(selectedPeriod)}</span>
          </p>
        </div>

        {/* Tasa de Ahorro Mensual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tasa de Ahorro</span>
            <PiggyBank className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              {metrics.savingsRate.toFixed(1)}%
            </div>
            <span className="text-xs font-bold text-slate-600">
              ${metrics.savingsAmount.toFixed(0)} ahorrados
            </span>
          </div>

          {/* Savings Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 border border-slate-200">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.savingsRate >= 20
                  ? 'bg-emerald-500'
                  : metrics.savingsRate >= 10
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, metrics.savingsRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Insight Alert Banner */}
      {topInsight && (
        <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
          topInsight.severity === 'high'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : topInsight.severity === 'medium'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-white shadow-xs shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                Punto de Mejora Recomendado
              </span>
              <h4 className="font-bold text-sm sm:text-base text-slate-900">{topInsight.title}</h4>
              <p className="text-xs mt-1 text-slate-600 leading-relaxed">{topInsight.description}</p>
            </div>
          </div>

          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('insights')}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-xs font-semibold rounded-lg border border-slate-200 shadow-xs transition shrink-0"
            >
              Ver Análisis
            </button>
          )}
        </div>
      )}

      {/* Charts Section: Pie Chart & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Donut Chart: Desglose por Categoría */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center justify-between">
            <span>Desglose de Gastos por Categoría</span>
            <span className="text-xs font-semibold text-slate-500">{formatPeriodLabel(selectedPeriod)}</span>
          </h3>

          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Gasto']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-medium">
              No hay gastos registrados en este período.
            </div>
          )}

          {/* Category Legend Pills */}
          <div className="flex flex-wrap gap-2 mt-4 max-h-24 overflow-y-auto">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-xs text-slate-700 border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate max-w-[120px]">{item.name}</span>
                <span className="font-bold text-slate-900">${Number(item.value).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart: Tendencia Mensual (Comparativa Ingresos vs Gastos) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-4 flex items-center justify-between">
            <span>Comparativa Tendencia Mensual</span>
            <span className="text-xs font-medium text-slate-500">Ingresos vs Gastos</span>
          </h3>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.8} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`]}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Gastos" fill="#f43f5e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Transactions List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-slate-900">Últimos Movimientos</h3>
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="text-xs text-indigo-600 hover:underline font-bold"
            >
              Ver todas las transacciones →
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {filteredTransactions.slice(0, 5).map(tx => (
            <div key={tx.transactionId} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  tx.type === 'income'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}>
                  {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{tx.description || tx.category}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>{tx.category}</span>
                    <span>•</span>
                    <span>{tx.date}</span>
                    {tx.scope === 'shared' && (
                      <span className="px-1.5 py-0.2 bg-pink-50 text-pink-700 text-[10px] rounded border border-pink-200 font-semibold">
                        Pagado por {tx.userName || 'Pareja'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={`text-sm font-extrabold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
              </div>
            </div>
          ))}

          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-500">
              <p className="font-semibold text-slate-700">Sin movimientos en la base de datos.</p>
              <p className="mt-1">Agrega tu primer ingreso o gasto con el botón "Nuevo Movimiento".</p>
            </div>
          )}
        </div>
      </div>

      {showAddTxModal && <TransactionModal onClose={() => setShowAddTxModal(false)} />}
      {showSettleModal && <SettleDebtModal onClose={() => setShowSettleModal(false)} />}
    </div>
  );
};
