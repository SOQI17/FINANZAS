import React, { useState } from 'react';
import { X, ReceiptText, DollarSign, Calendar, Tag, Wallet, Users, User } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { FinancialScope, TransactionType, SplitMethod } from '../../types';
import { getCurrentDateISO, getYesterdayISO } from '../../utils/dateUtils';

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
  const { addTransaction, accounts, activeScope, setSelectedPeriod } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [scope, setScope] = useState<FinancialScope>(activeScope);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Alimentación y Súper');
  const [date, setDate] = useState<string>(getCurrentDateISO());
  const [accountId, setAccountId] = useState<string>(accounts[0]?.accountId || '');
  const [paidBy, setPaidBy] = useState<string>(user?.uid || '');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('50_50');
  const [customUserPercent, setCustomUserPercent] = useState<number>(50);

  const parsedAmount = parseFloat(amount) || 0;
  const userPercent = splitMethod === '50_50'
    ? 50
    : splitMethod === '60_40'
    ? 60
    : splitMethod === '70_30'
    ? 70
    : splitMethod === '80_20'
    ? 80
    : splitMethod === 'full'
    ? 0
    : customUserPercent;
  const partnerPercent = 100 - userPercent;

  const userShareAmount = (parsedAmount * (userPercent / 100));
  const partnerShareAmount = (parsedAmount * (partnerPercent / 100));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !description.trim()) {
      alert('Por favor ingresa un monto y descripción válidos.');
      return;
    }

    const uRatio = userPercent / 100;
    const pRatio = partnerPercent / 100;

    let splitRatioUser1 = uRatio;
    let splitRatioUser2 = pRatio;

    if (couple && user?.uid === couple.user2Id) {
      splitRatioUser1 = pRatio;
      splitRatioUser2 = uRatio;
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
      splitRatioUser1,
      splitRatioUser2,
      accountId: accountId || null,
    });

    // Auto sync period view to match the movement's month
    if (date) {
      setSelectedPeriod(date.substring(0, 7));
    }

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
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-400 block">Fecha:</label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDate(getCurrentDateISO())}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setDate(getYesterdayISO())}
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition"
                  >
                    Ayer
                  </button>
                </div>
              </div>
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
            <div className="p-4 bg-slate-950 rounded-2xl border border-pink-500/30 space-y-4 shadow-lg shadow-pink-950/20">
              
              {/* Who paid */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-pink-400 mb-1.5 block">
                  ¿Quién pagó el total del gasto?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaidBy(user?.uid || 'user_1')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      paidBy === (user?.uid || 'user_1')
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{user?.displayName || 'Tú'} (Pagó todo)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaidBy(partner?.uid || 'partner_1')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      paidBy === (partner?.uid || 'partner_1')
                        ? 'bg-pink-500/20 border-pink-500 text-pink-300 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-pink-400" />
                    <span>{partner?.displayName || 'Pareja'} (Pagó todo)</span>
                  </button>
                </div>
              </div>

              {/* Division Method Visual Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-pink-400 block">
                    Método de División del Gasto:
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {userPercent}% Tú • {partnerPercent}% Pareja
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: '50_50', label: '50% / 50%', sub: 'Partes Iguales', icon: '⚖️' },
                    { id: '60_40', label: '60% / 40%', sub: '60% Tú - 40% Pareja', icon: '📊' },
                    { id: '70_30', label: '70% / 30%', sub: '70% Tú - 30% Pareja', icon: '📊' },
                    { id: '80_20', label: '80% / 20%', sub: '80% Tú - 20% Pareja', icon: '📊' },
                    { id: 'custom_percentage', label: 'Personalizado', sub: 'Escribir % Exacto', icon: '🎚️' },
                    { id: 'full', label: '100% Pareja', sub: 'Deuda Total', icon: '🤝' },
                  ].map(opt => {
                    const isSelected = splitMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSplitMethod(opt.id as SplitMethod)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between active:scale-95 ${
                          isSelected
                            ? 'bg-pink-500/20 border-pink-500 text-white shadow-md shadow-pink-950/40 ring-1 ring-pink-500/50'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold">
                          <span>{opt.icon}</span>
                          <span className={isSelected ? 'text-pink-300 font-extrabold' : ''}>{opt.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 truncate">{opt.sub}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Percentage Slider & Bar */}
              {splitMethod === 'custom_percentage' && (
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-pink-500/40 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <span>🎚️ Configurar Porcentaje Personalizado:</span>
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customUserPercent}
                        onChange={(e) => setCustomUserPercent(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                        className="w-12 bg-transparent text-emerald-400 font-black text-sm text-center outline-none"
                      />
                      <span className="text-xs text-slate-400 font-bold">% Tú</span>
                    </div>
                  </div>

                  {/* Dual Progress Visualizer Bar */}
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${userPercent}%` }}
                      title={`Tú: ${userPercent}%`}
                    />
                    <div
                      className="bg-pink-500 h-full transition-all duration-300"
                      style={{ width: `${partnerPercent}%` }}
                      title={`Pareja: ${partnerPercent}%`}
                    />
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={customUserPercent}
                    onChange={(e) => setCustomUserPercent(parseInt(e.target.value, 10))}
                    className="w-full accent-pink-500 cursor-pointer h-2 bg-slate-950 rounded-lg appearance-none"
                  />
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-0.5">
                    <span className="text-emerald-400">👤 Tú: {userPercent}%</span>
                    <span className="text-pink-400">❤️ {partner ? partner.displayName : 'Pareja'}: {partnerPercent}%</span>
                  </div>
                </div>
              )}

              {/* Live Dollar Split Breakdown Card */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Cálculo Final del Gasto:</span>
                  <span className="font-extrabold text-white text-sm">${parsedAmount.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-semibold">Tu Cuota ({userPercent}%):</div>
                    <div className="text-base font-black text-emerald-400 mt-0.5">
                      ${userShareAmount.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-semibold">Cuota {partner ? partner.displayName : 'Pareja'} ({partnerPercent}%):</div>
                    <div className="text-base font-black text-pink-400 mt-0.5">
                      ${partnerShareAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
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
