import React, { useState } from 'react';
import {
  WalletCards,
  Plus,
  Building2,
  PiggyBank,
  CreditCard,
  Banknote,
  Trash2,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { AccountModal } from './modals/AccountModal';

export const AccountsView: React.FC = () => {
  const { accounts, deleteAccount, activeScope } = useFinance();
  const { user, partner } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return <Building2 className="w-5 h-5 text-emerald-400" />;
      case 'savings': return <PiggyBank className="w-5 h-5 text-teal-400" />;
      case 'credit': return <CreditCard className="w-5 h-5 text-purple-400" />;
      case 'cash': return <Banknote className="w-5 h-5 text-amber-400" />;
      default: return <Building2 className="w-5 h-5 text-slate-400" />;
    }
  };

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'checking': return 'Cuenta Corriente / Nómina';
      case 'savings': return 'Cuenta de Ahorro';
      case 'credit': return 'Tarjeta de Crédito';
      case 'cash': return 'Efectivo / Billetera';
      case 'investment': return 'Inversiones';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <WalletCards className="w-6 h-6 text-emerald-400" />
            <span>Cuentas y Billeteras</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Administra tus cuentas bancarias y fondos {activeScope === 'individual' ? 'individuales' : 'compartidos en pareja'}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Cuenta</span>
        </button>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 p-6 rounded-2xl border border-emerald-500/20 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Total Liquidez Disponible
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Suma de {accounts.length} cuenta(s) activa(s) en modo {activeScope === 'individual' ? 'Individual' : 'Pareja'}.
            </p>
          </div>
        </div>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(acc => (
          <div key={acc.accountId} className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">{acc.name}</h3>
                    <p className="text-xs text-slate-400">{getAccountTypeName(acc.type)}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar la cuenta "${acc.name}"?`)) {
                      deleteAccount(acc.accountId);
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                <span className="text-xs text-slate-400">Saldo Actual:</span>
                <span className="text-2xl font-extrabold text-emerald-400">
                  ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
            <WalletCards className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm">No hay cuentas registradas en este modo.</p>
          </div>
        )}
      </div>

      {showAddModal && <AccountModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
};
