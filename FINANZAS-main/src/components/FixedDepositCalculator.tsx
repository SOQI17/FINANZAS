import React, { useState } from 'react';
import { TrendingUp, Landmark, Calculator, ArrowUpRight, DollarSign, Calendar, Percent, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const FixedDepositCalculator: React.FC = () => {
  const { user, partner } = useAuth();

  const [capital, setCapital] = useState<number>(5000);
  const [interestRate, setInterestRate] = useState<number>(5.25);
  const [days, setDays] = useState<number>(365);
  const [ownershipSplit, setOwnershipSplit] = useState<'individual' | 'equal_50_50'>('equal_50_50');

  // Calculation Logic
  const totalInterestYearly = capital * (interestRate / 100);
  const totalInterestTerm = capital * (interestRate / 100) * (days / 365);
  const monthlyYield = totalInterestYearly / 12;
  const finalTotal = capital + totalInterestTerm;

  const userShareYield = ownershipSplit === 'equal_50_50' ? totalInterestTerm / 2 : totalInterestTerm;
  const partnerShareYield = ownershipSplit === 'equal_50_50' ? totalInterestTerm / 2 : 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 p-6 rounded-2xl border border-emerald-500/30 shadow-xl space-y-6">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Calculadora de Póliza e Inversión a Plazo Fijo</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> 5.25% Anual
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Proyecta los rendimientos mensuales y al vencimiento de tu capital o póliza compartida
            </p>
          </div>
        </div>
      </div>

      {/* Input Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Capital Input */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Capital Invertido ($)
          </label>
          <input
            type="number"
            value={capital || ''}
            onChange={(e) => setCapital(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full text-lg font-extrabold bg-transparent text-white outline-none font-mono"
            placeholder="5000"
          />
        </div>

        {/* Interest Rate % */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-teal-400" /> Tasa Anual (% TNA)
          </label>
          <input
            type="number"
            step="0.01"
            value={interestRate || ''}
            onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full text-lg font-extrabold bg-transparent text-teal-300 outline-none font-mono"
            placeholder="5.25"
          />
        </div>

        {/* Term / Days */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" /> Plazo en Días
          </label>
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="w-full text-sm font-bold bg-slate-900 text-white rounded-lg p-1.5 border border-slate-800 outline-none"
          >
            <option value={30}>30 Días (1 Mes)</option>
            <option value={90}>90 Días (3 Meses)</option>
            <option value={180}>180 Días (6 Meses)</option>
            <option value={365}>365 Días (1 Año)</option>
          </select>
        </div>

        {/* Ownership Split */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Propiedad de Póliza
          </label>
          <select
            value={ownershipSplit}
            onChange={(e) => setOwnershipSplit(e.target.value as any)}
            className="w-full text-sm font-bold bg-slate-900 text-white rounded-lg p-1.5 border border-slate-800 outline-none"
          >
            <option value="equal_50_50">🤝 Compartida 50% / 50%</option>
            <option value="individual">👤 Personal (100%)</option>
          </select>
        </div>

      </div>

      {/* Financial Yield Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Monthly Yield */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Rendimiento Mensual
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 flex items-center gap-1">
            +${monthlyYield.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Estimado por mes a la tasa del {interestRate}%</p>
        </div>

        {/* Term Yield */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Ganancia Total ({days} Días)
          </span>
          <div className="text-2xl font-extrabold text-teal-300 flex items-center gap-1">
            +${totalInterestTerm.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-500">Interés ganado al vencimiento</p>
        </div>

        {/* Final Total */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-500/30 space-y-1">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Monto Final a Recibir
          </span>
          <div className="text-2xl font-black text-white flex items-center gap-1">
            ${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-slate-400">Capital ($`{capital}`) + Rendimiento</p>
        </div>

      </div>

      {/* Partner Dividend Distribution Breakdown */}
      {ownershipSplit === 'equal_50_50' && (
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Reparto de Ganancias en Pareja al Vencimiento:</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-bold">
              Tu parte ({user?.displayName || 'Tú'}): +${userShareYield.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="px-3 py-1 bg-pink-500/10 text-pink-300 border border-pink-500/20 rounded-lg font-bold">
              Pareja ({partner?.displayName || 'Pareja'}): +${partnerShareYield.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
