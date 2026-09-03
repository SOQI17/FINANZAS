import React from 'react';
import {
  ReceiptText,
  X,
  User,
  Users,
  Calendar,
  DollarSign,
  Trash2,
  CheckCircle2,
  ArrowRightLeft,
  PieChart,
  Tag
} from 'lucide-react';
import { Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface TransactionDetailsModalProps {
  tx: Transaction;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  tx,
  onClose,
  onDelete
}) => {
  const { user, partner } = useAuth();

  const paidByClean = (tx.paidBy || tx.userName || '').toLowerCase();
  const isAlexisPaid = paidByClean.includes('alexis') || (!paidByClean.includes('karla') && !paidByClean.includes('karlita'));

  let alexisRatio = 0.5;
  let karlaRatio = 0.5;

  if (tx.scope === 'individual') {
    if (isAlexisPaid) {
      alexisRatio = 1.0;
      karlaRatio = 0.0;
    } else {
      alexisRatio = 0.0;
      karlaRatio = 1.0;
    }
  } else if (tx.splitRatioUser1 !== undefined && tx.splitRatioUser2 !== undefined) {
    if (isAlexisPaid) {
      alexisRatio = tx.splitRatioUser1;
      karlaRatio = tx.splitRatioUser2;
    } else {
      karlaRatio = tx.splitRatioUser1;
      alexisRatio = tx.splitRatioUser2;
    }
  } else if (tx.splitMethod === '60_40') {
    alexisRatio = 0.4;
    karlaRatio = 0.6;
  } else if (tx.splitMethod === '70_30') {
    alexisRatio = 0.3;
    karlaRatio = 0.7;
  } else if (tx.splitMethod === '80_20') {
    alexisRatio = 0.2;
    karlaRatio = 0.8;
  } else if (tx.splitMethod === 'full') {
    if (isAlexisPaid) {
      alexisRatio = 0;
      karlaRatio = 1.0;
    } else {
      alexisRatio = 1.0;
      karlaRatio = 0;
    }
  }

  const alexisAmount = tx.amount * alexisRatio;
  const karlaAmount = tx.amount * karlaRatio;
  const alexisPercent = Math.round(alexisRatio * 100);
  const karlaPercent = Math.round(karlaRatio * 100);

  const payerName = isAlexisPaid ? 'Alexis Guerra' : 'Karla Vizcaíno';
  const debtorName = isAlexisPaid ? 'Karla Vizcaíno' : 'Alexis Guerra';
  const debtAmount = isAlexisPaid ? karlaAmount : alexisAmount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              tx.type === 'income'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                Detalle del Movimiento
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" /> {tx.date}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Main Card */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
            <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold inline-flex items-center gap-1">
              <Tag className="w-3 h-3 text-pink-400" /> {tx.category}
            </span>
            
            <h3 className="text-xl font-black text-white pt-1">{tx.description}</h3>
            
            <div className={`text-3xl font-black font-mono pt-1 ${
              tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
            }`}>
              {tx.type === 'income' ? '+' : '-'}${tx.amount.toFixed(2)}
            </div>

            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Monto Total Facturado
            </div>
          </div>

          {/* Scope & Payer Banner */}
          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-pink-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-pink-400 shrink-0" />
              <span className="text-slate-300 font-semibold">¿Quién pagó el total en caja?</span>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30 shrink-0">
              💳 {payerName}
            </span>
          </div>

          {/* Side-by-Side Breakdown Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
              <span className="flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <span>Desglose por Integrante:</span>
              </span>
              <span className="text-slate-500 text-[11px]">
                {tx.scope === 'shared' ? 'Ámbito Compartido 🤝' : 'Ámbito Personal 👤'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              
              {/* Alexis Breakdown Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">Alexis Guerra</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black text-[11px]">
                    {alexisPercent}%
                  </span>
                </div>
                
                <div className="text-2xl font-black text-white font-mono">
                  ${alexisAmount.toFixed(2)}
                </div>

                <p className="text-[10px] text-slate-400 font-medium">
                  {tx.scope === 'individual'
                    ? (isAlexisPaid ? 'Gasto 100% Personal (Pagado en caja)' : 'Sin cuota (Gasto Personal de Karla)')
                    : (isAlexisPaid ? 'Pagó $ ' + tx.amount.toFixed(2) + ' en caja' : 'Le corresponde abonar')}
                </p>
              </div>

              {/* Karlita Breakdown Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-pink-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-300">Karla Vizcaíno</span>
                  <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 font-black text-[11px]">
                    {karlaPercent}%
                  </span>
                </div>

                <div className="text-2xl font-black text-white font-mono">
                  ${karlaAmount.toFixed(2)}
                </div>

                <p className="text-[10px] text-slate-400 font-medium">
                  {tx.scope === 'individual'
                    ? (!isAlexisPaid ? 'Gasto 100% Personal (Pagado en caja)' : 'Sin cuota (Gasto Personal de Alexis)')
                    : (!isAlexisPaid ? 'Pagó $ ' + tx.amount.toFixed(2) + ' en caja' : 'Le corresponde abonar')}
                </p>
              </div>

            </div>
          </div>

          {/* Debt Summary Transfer Pill vs Personal Pill */}
          {tx.scope === 'shared' && debtAmount > 0 ? (
            <div className="p-3.5 bg-gradient-to-r from-pink-950/40 via-slate-950 to-emerald-950/40 rounded-2xl border border-slate-800 flex items-center gap-3 text-xs">
              <ArrowRightLeft className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-slate-200">
                <span className="font-bold text-pink-300">{debtorName}</span> debe transferir{' '}
                <span className="font-extrabold text-emerald-400 font-mono">${debtAmount.toFixed(2)}</span> a{' '}
                <span className="font-bold text-emerald-300">{payerName}</span> por este gasto.
              </div>
            </div>
          ) : tx.scope === 'individual' ? (
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3 text-xs">
              <User className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="text-slate-300">
                Gasto 100% Personal de <span className="font-bold text-white">{payerName}</span>. No genera deuda compartida ni afecta el balance de pareja.
              </div>
            </div>
          ) : null}

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm('¿Estás seguro de que deseas eliminar este movimiento?')) {
                onDelete(tx.transactionId);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs rounded-xl transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Movimiento</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
