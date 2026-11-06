import React, { useMemo, useState } from 'react';
import { X, ListChecks, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { getSharedDebtBreakdown } from '../../services/financialInsights';
import { firstName } from '../../utils/splitUtils';

interface DebtBreakdownModalProps {
  onClose: () => void;
}

const money = (n: number) => `$${Math.abs(n).toFixed(2)}`;

export const DebtBreakdownModal: React.FC<DebtBreakdownModalProps> = ({ onClose }) => {
  const { transactions, members, sharedDebt } = useFinance();
  const [showAll, setShowAll] = useState(false);

  const breakdown = useMemo(() => getSharedDebtBreakdown(transactions, members), [transactions, members]);
  const items = breakdown.items.filter(i => Math.abs(i.effect) >= 0.005);
  const visibleItems = showAll ? items : items.slice(0, 20);

  const debtor = firstName(sharedDebt.debtorName);
  const creditor = firstName(sharedDebt.creditorName);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-pink-400" />
            <h2 className="font-bold text-lg">Desglose de la deuda</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {sharedDebt.isBalanced ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-5 h-5" />
              <span>Están al día. No hay deuda pendiente.</span>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-300">
                    Parte de <b className="text-pink-400">{debtor}</b> en gastos que pagó <b className="text-teal-300">{creditor}</b>
                  </span>
                  <span className="font-bold text-rose-300 whitespace-nowrap">+{money(breakdown.creditorPaidShare)}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-slate-300">
                    Parte de <b className="text-teal-300">{creditor}</b> en gastos que pagó <b className="text-pink-400">{debtor}</b>
                  </span>
                  <span className="font-bold text-emerald-300 whitespace-nowrap">−{money(breakdown.debtorPaidShare)}</span>
                </div>
                {Math.abs(breakdown.settlementsTotal) >= 0.005 && (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-slate-300">Pagos de deuda ya hechos</span>
                    <span className={`font-bold whitespace-nowrap ${breakdown.settlementsTotal > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {breakdown.settlementsTotal > 0 ? '+' : '−'}{money(breakdown.settlementsTotal)}
                    </span>
                  </div>
                )}
                <div className="pt-2.5 border-t border-slate-800 flex items-start justify-between gap-3 text-base">
                  <span className="font-bold text-white">
                    {debtor} le debe a {creditor}
                  </span>
                  <span className="font-black text-emerald-400 whitespace-nowrap">{money(sharedDebt.amountOwed)}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Cada gasto compartido se divide según su reparto. Si uno pagó todo, el otro le debe su parte.
                <span className="text-rose-300"> +</span> suma a la deuda, <span className="text-emerald-300">−</span> la reduce.
              </p>

              {/* Movement list */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Movimientos ({items.length})
                </h3>
                {visibleItems.map(({ transaction: tx, kind, payerName, otherShare, effect }) => (
                  <div key={tx.transactionId} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-white truncate">
                        {tx.description || tx.category}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {tx.date} ·{' '}
                        {kind === 'settlement'
                          ? `Pago de deuda de ${firstName(payerName)}`
                          : `Pagó ${firstName(payerName)} ${money(tx.amount)} · parte de ${firstName(payerName === members.a.name ? members.b.name : members.a.name)} ${money(otherShare)}`}
                      </div>
                    </div>
                    <span className={`text-sm font-extrabold whitespace-nowrap shrink-0 ${effect > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                      {effect > 0 ? '+' : '−'}{money(effect)}
                    </span>
                  </div>
                ))}
                {!showAll && items.length > visibleItems.length && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full py-2.5 text-xs font-semibold text-pink-300 hover:text-pink-200 bg-slate-950 rounded-xl border border-slate-800 transition"
                  >
                    Ver los {items.length - visibleItems.length} movimientos restantes
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
