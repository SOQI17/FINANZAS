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

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transacciones', icon: ReceiptText },
    { id: 'accounts', label: 'Cuentas', icon: WalletCards },
    { id: 'budgets', label: 'Presupuestos', icon: PieChart },
    { id: 'couple', label: 'Pareja', icon: HeartHandshake },
    { id: 'insights', label: 'Puntos de Mejora', icon: Lightbulb, badge: alertCount },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200/80 p-4 space-y-1.5 text-slate-700 min-h-[calc(100vh-4rem)]">
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs'
                  : 'hover:bg-slate-100/80 hover:text-slate-900 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-md">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-0 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
