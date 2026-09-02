import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { TransactionsView } from './components/TransactionsView';
import { AccountsView } from './components/AccountsView';
import { BudgetsView } from './components/BudgetsView';
import { CoupleView } from './components/CoupleView';
import { InsightsView } from './components/InsightsView';
import { AuthScreen } from './components/AuthScreen';
import { Wallet } from 'lucide-react';

import { TransactionModal } from './components/modals/TransactionModal';
import { TransactionType } from './types';
import { Plus, Zap } from 'lucide-react';

function MainAppContent() {
  const { user, isDemoMode, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [quickAddModal, setQuickAddModal] = useState<{ open: boolean; type?: TransactionType }>({ open: false });

  // Handle PWA Shortcut URL Actions (?action=quickExpense or ?action=quickIncome)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'quickExpense') {
      setQuickAddModal({ open: true, type: 'expense' });
    } else if (action === 'quickIncome') {
      setQuickAddModal({ open: true, type: 'income' });
    } else if (action === 'quickAdd') {
      setQuickAddModal({ open: true });
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-3 font-sans">
        <img src="/logo.png" alt="Suma2 Logo" className="w-12 h-12 rounded-2xl animate-bounce shadow-lg shadow-indigo-500/50 object-cover" />
        <p className="text-xs font-semibold text-slate-400">Cargando Suma2...</p>
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative">
      
      {/* Top Header */}
      <Header />

      {/* Main Body Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-24 md:pb-8">
        
        {/* Navigation Sidebar (Desktop) */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content View Area */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-full overflow-x-hidden">
          {activeTab === 'dashboard' && <Dashboard onNavigateToTab={(tab) => setActiveTab(tab)} />}
          {activeTab === 'transactions' && <TransactionsView />}
          {activeTab === 'accounts' && <AccountsView />}
          {activeTab === 'budgets' && <BudgetsView />}
          {activeTab === 'couple' && <CoupleView />}
          {activeTab === 'insights' && <InsightsView onNavigateToTab={(tab) => setActiveTab(tab)} />}
        </main>

      </div>

      {/* Floating Action Button (FAB) for Instant Movement Entry */}
      <button
        onClick={() => setQuickAddModal({ open: true })}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-40 p-3.5 sm:px-5 sm:py-3 bg-gradient-to-r from-indigo-600 via-pink-600 to-rose-600 hover:from-indigo-500 hover:to-pink-500 text-white rounded-full sm:rounded-2xl shadow-2xl shadow-pink-950/60 font-extrabold text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 border border-white/20"
        title="Registrar Movimiento Rápido"
      >
        <Zap className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
        <span className="hidden sm:inline">⚡ Registro Rápido</span>
      </button>

      {quickAddModal.open && (
        <TransactionModal
          initialType={quickAddModal.type}
          onClose={() => setQuickAddModal({ open: false })}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainAppContent />
      </FinanceProvider>
    </AuthProvider>
  );
}
