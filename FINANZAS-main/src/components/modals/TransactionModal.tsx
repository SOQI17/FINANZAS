import React, { useState, useEffect } from 'react';
import { X, ReceiptText, DollarSign, Calendar, Tag, Wallet, Users, User, ChevronDown, Check, ArrowLeftRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { FinancialScope, TransactionType, SplitMethod } from '../../types';
import { getCurrentDateISO, getYesterdayISO } from '../../utils/dateUtils';
import { firstName } from '../../utils/splitUtils';

interface TransactionModalProps {
  onClose: () => void;
  initialType?: TransactionType;
}

const CATEGORY_LIST: { name: string; icon: string }[] = [
  { name: 'Alimentación y Súper', icon: '🛒' },
  { name: 'Restaurantes y Cafés', icon: '🍽️' },
  { name: 'Transporte y Gasolina', icon: '🚗' },
  { name: 'Alquiler y Hogar', icon: '🏠' },
  { name: 'Servicios (Luz, Agua, Internet)', icon: '💡' },
  { name: 'Supermercado Compartido', icon: '🛍️' },
  { name: 'Entretenimiento', icon: '🎬' },
  { name: 'Salidas y Viajes', icon: '✈️' },
  { name: 'Salario / Nómina', icon: '💼' },
  { name: 'Otros', icon: '📦' },
];

// majorShare = the percentage taken by whoever assumes the larger part (chosen in the form)
const SPLIT_PRESETS: { id: SplitMethod; label: string; majorShare: number | null }[] = [
  { id: '50_50', label: '50 / 50', majorShare: 50 },
  { id: '60_40', label: '60 / 40', majorShare: 60 },
  { id: '70_30', label: '70 / 30', majorShare: 70 },
  { id: '80_20', label: '80 / 20', majorShare: 80 },
  { id: 'full', label: '100%', majorShare: 100 },
  { id: 'custom_percentage', label: 'Personalizado', majorShare: null },
];

export const TransactionModal: React.FC<TransactionModalProps> = ({ onClose, initialType }) => {
  const { user, partner, couple } = useAuth();
  const { addTransaction, accounts, activeScope, setSelectedPeriod, members } = useFinance();
  const userDisplayName = user?.displayName || 'Tú';
  const partnerDisplayName = (partner?.displayName && partner.displayName !== user?.displayName)
    ? partner.displayName
    : 'Pareja';

  const [type, setType] = useState<TransactionType>(initialType || 'expense');
  const [scope, setScope] = useState<FinancialScope>(activeScope);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Alimentación y Súper');
  const [date, setDate] = useState<string>(getCurrentDateISO());
  const [accountId, setAccountId] = useState<string>(accounts[0]?.accountId || '');
  const [paidBy, setPaidBy] = useState<string>(user?.uid || '');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('50_50');
  const [customUserPercent, setCustomUserPercent] = useState<number>(50);
  // Whether the current user assumes the larger part of an uneven preset (60/40, 70/30, 80/20, 100%)
  const [userTakesMajor, setUserTakesMajor] = useState<boolean>(true);

  const [showCategoryOpen, setShowCategoryOpen] = useState(false);

  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setAccountId(accounts[0].accountId);
    }
  }, [accounts, accountId]);

  const selectedCategoryObj = CATEGORY_LIST.find(c => c.name === category) || CATEGORY_LIST[0];
  const selectedPreset = SPLIT_PRESETS.find(s => s.id === splitMethod) || SPLIT_PRESETS[0];
  const majorShare = selectedPreset.majorShare;
  const isUnevenPreset = majorShare !== null && majorShare !== 50;

  const parsedAmount = parseFloat(amount) || 0;
  const userPercent = majorShare === null
    ? customUserPercent
    : (userTakesMajor ? majorShare : 100 - majorShare);
  const partnerPercent = 100 - userPercent;

  const userFirstName = firstName(userDisplayName);
  const partnerFirstName = firstName(partnerDisplayName);
  const isUserPayer = paidBy === (user?.uid || 'user_1');

  const selectSplit = (id: SplitMethod) => {
    setSplitMethod(id);
    // "100%" usually means the person who did not pay owes everything
    if (id === 'full') {
      setUserTakesMajor(!isUserPayer);
    }
  };

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

    // splitRatioUser1 = couple member A's share, splitRatioUser2 = member B's share
    const isCurrentMemberB = Boolean(user && members.b.id === user.uid);

    let splitRatioUser1 = uRatio;
    let splitRatioUser2 = pRatio;

    if (isCurrentMemberB) {
      splitRatioUser1 = pRatio;
      splitRatioUser2 = uRatio;
    }

    const isPartnerPayer = scope === 'shared' && (paidBy === partner?.uid || paidBy === 'partner_1');
    const selectedPayerName = isPartnerPayer ? (partner?.displayName || 'Pareja') : (user?.displayName || 'Usuario');

    await addTransaction({
      userId: user?.uid || 'user_1',
      userName: selectedPayerName,
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
      approvalStatus: isPartnerPayer ? 'pending' : 'approved',
      requestedBy: user?.uid,
    });

    if (date) {
      setSelectedPeriod(date.substring(0, 7));
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        
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

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Ámbito del Movimiento:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setScope('individual')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 ${
                  scope === 'individual'
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
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
                autoFocus
                required
                className="w-full bg-slate-950 text-white font-mono text-base pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Categoría:</label>
              <button
                type="button"
                onClick={() => setShowCategoryOpen(!showCategoryOpen)}
                className="w-full bg-slate-950 text-white text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none flex items-center justify-between transition hover:bg-slate-900"
              >
                <span className="flex items-center gap-2 font-medium truncate">
                  <span>{selectedCategoryObj.icon}</span>
                  <span className="truncate">{category}</span>
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${showCategoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {showCategoryOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto p-1.5 divide-y divide-slate-800/50">
                  {CATEGORY_LIST.map(cat => {
                    const isSel = category === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => {
                          setCategory(cat.name);
                          setShowCategoryOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs sm:text-sm flex items-center justify-between transition ${
                          isSel ? 'bg-indigo-600/20 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-base shrink-0">{cat.icon}</span>
                          <span className="truncate">{cat.name}</span>
                        </div>
                        {isSel && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
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

          {scope === 'shared' && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-pink-500/30 space-y-3 shadow-lg shadow-pink-950/20">
              
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
                    <span>{userDisplayName} (Pagó todo)</span>
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
                    <span>{partnerDisplayName} (Pagó todo)</span>
                  </button>
                </div>
              </div>

              {/* Split method: preset chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-pink-400 block">
                    ¿Cómo se divide el gasto?
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {userFirstName} {userPercent}% • {partnerFirstName} {partnerPercent}%
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {SPLIT_PRESETS.map(opt => {
                    const isSelected = splitMethod === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => selectSplit(opt.id)}
                        aria-pressed={isSelected}
                        className={`py-2 px-1 rounded-xl border text-xs font-bold transition ${
                          isSelected
                            ? 'bg-pink-500/20 border-pink-500 text-pink-200 shadow-sm'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Who assumes the larger part */}
              {isUnevenPreset && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
                    {majorShare === 100 ? '¿Quién asume el 100% del gasto?' : `¿Quién asume el ${majorShare}%?`}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUserTakesMajor(true)}
                      aria-pressed={userTakesMajor}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-2 ${
                        userTakesMajor
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{userFirstName}</span>
                      </span>
                      <span className="font-black">{userTakesMajor ? majorShare : 100 - (majorShare || 0)}%</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserTakesMajor(false)}
                      aria-pressed={!userTakesMajor}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between gap-2 ${
                        !userTakesMajor
                          ? 'bg-pink-500/20 border-pink-500 text-pink-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{partnerFirstName}</span>
                      </span>
                      <span className="font-black">{!userTakesMajor ? majorShare : 100 - (majorShare || 0)}%</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Custom percentage */}
              {splitMethod === 'custom_percentage' && (
                <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-emerald-500/40">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customUserPercent}
                        onChange={(e) => setCustomUserPercent(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                        aria-label={`Porcentaje de ${userFirstName}`}
                        className="w-11 bg-transparent text-emerald-400 font-black text-sm text-center outline-none"
                      />
                      <span className="text-[11px] text-slate-400 font-bold truncate">% {userFirstName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomUserPercent(100 - customUserPercent)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white hover:border-slate-700 transition"
                      title="Intercambiar porcentajes"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Intercambiar</span>
                    </button>
                    <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-pink-500/40">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={100 - customUserPercent}
                        onChange={(e) => setCustomUserPercent(100 - Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                        aria-label={`Porcentaje de ${partnerFirstName}`}
                        className="w-11 bg-transparent text-pink-400 font-black text-sm text-center outline-none"
                      />
                      <span className="text-[11px] text-slate-400 font-bold truncate">% {partnerFirstName}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={customUserPercent}
                    onChange={(e) => setCustomUserPercent(parseInt(e.target.value, 10))}
                    aria-label={`Porcentaje de ${userFirstName}`}
                    className="w-full accent-pink-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Visual result */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Reparto del gasto</span>
                  <span className="font-extrabold text-white text-sm normal-case">${parsedAmount.toFixed(2)}</span>
                </div>

                <div className="w-full h-7 rounded-xl overflow-hidden flex bg-slate-950 border border-slate-800 text-[11px] font-black">
                  {userPercent > 0 && (
                    <div
                      className="bg-emerald-500/80 text-emerald-950 h-full flex items-center justify-center transition-all duration-300 truncate px-1"
                      style={{ width: `${userPercent}%` }}
                    >
                      {userPercent >= 15 ? `${userFirstName} ${userPercent}%` : `${userPercent}%`}
                    </div>
                  )}
                  {partnerPercent > 0 && (
                    <div
                      className="bg-pink-500/80 text-pink-950 h-full flex items-center justify-center transition-all duration-300 truncate px-1"
                      style={{ width: `${partnerPercent}%` }}
                    >
                      {partnerPercent >= 15 ? `${partnerFirstName} ${partnerPercent}%` : `${partnerPercent}%`}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-semibold truncate">Le toca a {userFirstName}</div>
                    <div className="text-base font-black text-emerald-400 mt-0.5">${userShareAmount.toFixed(2)}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 font-semibold truncate">Le toca a {partnerFirstName}</div>
                    <div className="text-base font-black text-pink-400 mt-0.5">${partnerShareAmount.toFixed(2)}</div>
                  </div>
                </div>

                {parsedAmount > 0 && (
                  <p className="text-[11px] text-slate-300 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-2">
                    {isUserPayer
                      ? (partnerShareAmount > 0
                        ? <><strong className="text-pink-300">{partnerFirstName}</strong> te deberá <strong className="text-white">${partnerShareAmount.toFixed(2)}</strong> por este gasto.</>
                        : <>Asumes todo el gasto: nadie debe nada.</>)
                      : (userShareAmount > 0
                        ? <>Le deberás <strong className="text-white">${userShareAmount.toFixed(2)}</strong> a <strong className="text-pink-300">{partnerFirstName}</strong> por este gasto.</>
                        : <><strong className="text-pink-300">{partnerFirstName}</strong> asume todo el gasto: nadie debe nada.</>)}
                  </p>
                )}
              </div>
            </div>
          )}

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
