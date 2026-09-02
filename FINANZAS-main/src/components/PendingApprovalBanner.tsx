import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle, BellRing } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { getSplitBadgeText } from '../utils/splitUtils';

export const PendingApprovalBanner: React.FC = () => {
  const { transactions, approveTransaction, rejectTransaction } = useFinance();
  const { user, partner } = useAuth();

  // Find transactions pending approval
  const pendingTxs = transactions.filter(t => t.approvalStatus === 'pending');

  if (pendingTxs.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {pendingTxs.map(tx => {
        const isTarget = tx.requestedBy ? tx.requestedBy !== user?.uid : true;
        const requesterName = tx.requestedBy === partner?.uid ? (partner?.displayName || 'Tu pareja') : 'Tu pareja';

        return (
          <div
            key={tx.transactionId}
            className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-900 rounded-2xl border-2 border-amber-500/50 shadow-xl text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40 shrink-0">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold tracking-wider uppercase border border-amber-500/30">
                    ⚠️ Advertencia: Aprobación Requerida
                  </span>
                </div>

                <h3 className="font-bold text-base text-white mt-1">
                  {requesterName} registró el movimiento: "{tx.description}" por ${tx.amount.toFixed(2)}
                </h3>

                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Asignado como: <strong className="text-pink-300">Pagado por {tx.userName || 'Pareja'}</strong> ({getSplitBadgeText(tx)}).
                  Si aceptas, este movimiento <strong>modificará tu balance de deuda</strong>. Si no aceptas, se cancelará sin afectar tus saldos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
              <button
                onClick={() => approveTransaction(tx.transactionId)}
                className="flex-1 md:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aceptar y Modificar Balance</span>
              </button>

              <button
                onClick={() => rejectTransaction(tx.transactionId)}
                className="flex-1 md:flex-none px-3.5 py-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 font-bold text-xs sm:text-sm rounded-xl border border-rose-500/30 transition flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Rechazar</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
