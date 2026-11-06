import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  WalletCards,
  PieChart,
  HeartHandshake,
  Lightbulb
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export type NavTab = 'dashboard' | 'transactions' | 'accounts' | 'budgets' | 'couple' | 'insights';

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const { insights } = useFinance();
  const alertCount = insights.filter(i => i.severity === 'high' || i.severity === 'medium').length;

  // shortLabel is used in the phone tab bar, where space is tight
  const navItems: { id: NavTab; label: string; shortLabel: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Resumen', shortLabel: 'Inicio', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transacciones', shortLabel: 'Movimientos', icon: ReceiptText },
    { id: 'accounts', label: 'Cuentas', shortLabel: 'Cuentas', icon: WalletCards },
    { id: 'budgets', label: 'Presupuestos', shortLabel: 'Límites', icon: PieChart },
    { id: 'couple', label: 'Pareja', shortLabel: 'Pareja', icon: HeartHandshake },
    { id: 'insights', label: 'Puntos de Mejora', shortLabel: 'Consejos', icon: Lightbulb, badge: alertCount },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="glass glass-sheen hidden md:flex flex-col w-60 shrink-0 self-start sticky top-24 mt-6 ml-4 lg:ml-6 rounded-3xl p-3 space-y-1 text-slate-700">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navegación Principal
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-white/85 text-indigo-700 shadow-md ring-1 ring-white'
                  : 'hover:bg-white/45 hover:text-slate-900 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/25 text-amber-800 border border-amber-300/60">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="glass-strong glass-sheen safe-bottom-nav md:hidden fixed left-2 right-2 z-40 rounded-[1.75rem] px-1 py-1 grid grid-cols-6 gap-0.5" aria-label="Navegación principal">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-2xl transition-all min-w-0 active:scale-95 ${
                isActive
                  ? 'text-indigo-600 font-bold bg-white/85 shadow-md ring-1 ring-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-500'}`} />
              <span className="text-[9.5px] leading-tight tracking-tight truncate max-w-full mt-0.5">{item.shortLabel}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-1 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
