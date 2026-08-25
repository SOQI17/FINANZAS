import React, { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle2, DollarSign } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface SettleDebtModalProps {
  onClose: () => void;
}

export const SettleDebtModal: React.FC<SettleDebtModalProps> = ({ onClose }) => {
  const { sharedDebt, settleSharedDebt } = useFinance();
  const [amount, setAmount] = useState<string>(sharedDebt.amountOwed.toFixed(2));
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;

    setSubmitting(true);
    await settleSharedDebt(val);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100">
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-pink-400" />
            <h2 className="font-bold text-lg">Saldar Deuda Compartida</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Estado Actual</span>
            <p className="text-base font-bold text-white mt-1">
              <span className="text-pink-400">{sharedDebt.debtorName}</span> le debe{' '}
              <span className="text-emerald-400">${sharedDebt.amountOwed.toFixed(2)}</span> a{' '}
              <span className="text-teal-300">{sharedDebt.creditorName}</span>
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Monto a Saldar ($):</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 text-white font-mono text-base pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 focus:border-pink-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Al confirmar, se registrará una transferencia de compensación para ajustar el saldo a $0.00.
            </p>
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
              disabled={submitting}
              className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-pink-950/40"
            >
              {submitting ? 'Procesando...' : 'Confirmar Pago'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
