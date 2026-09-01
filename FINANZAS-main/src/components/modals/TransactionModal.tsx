import React, { useState } from 'react';
import { X, ReceiptText, DollarSign, Calendar, Tag, Wallet, Users, User } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { FinancialScope, TransactionType, SplitMethod } from '../../types';

interface TransactionModalProps {
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
  'Salario / Nómina',
  'Otros'
];

export const TransactionModal: React.FC<TransactionModalProps> = ({ onClose }) => {
  const { user, partner, couple } = useAuth();
  const { addTransaction, accounts, activeScope } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [scope, setScope] = useState<FinancialScope>(activeScope);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Alimentación y Súper');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<string>(accounts[0]?.accountId || '');
  const [paidBy, setPaidBy] = useState<string>(user?.uid || '');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('50_50');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !description.trim()) {
      alert('Por favor ingresa un monto y descripción válidos.');
      return;
    }

    await addTransaction({
      userId: user?.uid || 'user_1',
      userName: user?.displayName || 'Usuario',
      coupleId: couple?.coupleId || null,
      scope,
      type,
      amount: parseFloat(amount),
      category,
      date,
      description: description.trim(),
      paidBy: scope === 'shared' ? paidBy : (user?.uid || 'user_1'),
      splitMethod,
      accountId: accountId || null,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base sm:text-lg">Registrar Nuevo Movimiento</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          
          {/* Type Switcher (Income vs Expense) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                type === 'expense' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                type === 'income' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
              }`}
            >
              Ingreso
            </button>
          </div>

          {/* Scope Switcher (Individual vs Shared) */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Alcance del Movimiento:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('individual')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                  scope === 'individual'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" /> Individual
              </button>

              <button
                type="button"
                onClick={() => setScope('shared')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                  scope === 'shared'
                    ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Compartido Pareja
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Monto ($):</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 text-white font-mono text-base pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Descripción:</label>
            <input
              type="text"
              placeholder="Ej. Supermercado Mercadona"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full bg-slate-950 text-white text-sm px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Categoría:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Fecha:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Shared Split Options */}
          {scope === 'shared' && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-semibold text-pink-400 mb-1 block">¿Quién pagó el gasto?</label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:border-pink-500 outline-none"
                >
                  <option value={user?.uid || 'user_1'}>{user?.displayName || 'Tú'}</option>
                  {partner && <option value={partner.uid}>{partner.displayName}</option>}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-pink-400 mb-1 block">Método de División:</label>
                <select
                  value={splitMethod}
                  onChange={(e: any) => setSplitMethod(e.target.value)}
                  className="w-full bg-slate-900 text-white text-xs px-3 py-2 rounded-lg border border-slate-800 focus:border-pink-500 outline-none"
                >
                  <option value="50_50">Dividir 50% / 50% (Partes iguales)</option>
                  <option value="full">Asignar 100% a la Pareja (Deuda Total)</option>
                </select>
              </div>
            </div>
          )}

          {/* Select Account */}
          {accounts.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Cuenta de origen/destino:</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 text-white text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
              >
                {accounts.map(a => (
                  <option key={a.accountId} value={a.accountId}>
                    {a.name} (${a.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Buttons */}
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
              Guardar Movimiento
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
