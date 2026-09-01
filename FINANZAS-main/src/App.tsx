import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { TransactionsView } from './components/TransactionsView';
import { AccountsView } from './components/AccountsView';
import { BudgetsView } from './components/BudgetsView';
import { CoupleView } from './components/CoupleView';
import { InsightsView } from './components/InsightsView';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
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
