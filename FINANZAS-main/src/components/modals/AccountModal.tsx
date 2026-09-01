import React, { useState } from 'react';
import { X, WalletCards, Building2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { AccountType } from '../../types';

interface AccountModalProps {
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ onClose }) => {
  const { user, couple } = useAuth();
  const { addAccount, activeScope } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [balance, setBalance] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !balance) return;

    await addAccount({
      ownerId: activeScope === 'individual' ? (user?.uid || 'user_1') : (couple?.coupleId || 'couple_1'),
      ownerType: activeScope === 'individual' ? 'user' : 'couple',
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      currency: 'USD',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <WalletCards className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base sm:text-lg">Nueva Cuenta o Billetera</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Nombre de la Cuenta:</label>
            <input
              type="text"
              placeholder="Ej. Cuenta Nómina BBVA / Fondo Ahorro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Tipo de Cuenta:</label>
            <select
              value={type}
              onChange={(e: any) => setType(e.target.value)}
              className="w-full bg-slate-950 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
            >
              <option value="checking">Cuenta Corriente / Nómina</option>
              <option value="savings">Cuenta de Ahorro</option>
              <option value="credit">Tarjeta de Crédito</option>
              <option value="cash">Efectivo / Billetera Digital</option>
              <option value="investment">Inversiones</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Saldo Inicial ($):</label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
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
              Crear Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
