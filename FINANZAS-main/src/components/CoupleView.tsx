import React, { useState } from 'react';
import {
  HeartHandshake,
  Heart,
  Copy,
  Check,
  UserCheck,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  ReceiptText,
  UserPlus,
  ShieldCheck,
  Pencil,
  UserX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { SettleDebtModal } from './modals/SettleDebtModal';

export const CoupleView: React.FC = () => {
  const { user, partner, couple, linkPartnerWithCode, updatePartnerName, unlinkPartner } = useAuth();
  const { sharedDebt, filteredTransactions } = useFinance();

  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkResult, setLinkResult] = useState<{ success?: boolean; message?: string }>({});
  const [showSettleModal, setShowSettleModal] = useState(false);

  const [isEditingPartnerName, setIsEditingPartnerName] = useState(false);
  const [editingName, setEditingName] = useState('');

  const copyCode = () => {
    if (!user?.inviteCode) return;
    navigator.clipboard.writeText(user.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSavePartnerName = async () => {
    if (!editingName.trim()) return;
    await updatePartnerName(editingName.trim());
    setIsEditingPartnerName(false);
  };

  const handleUnlinkPartner = async () => {
    if (window.confirm('¿Estás seguro de que deseas desvincularte de tu pareja? Los datos históricos no se borrarán, pero dejarán de sincronizarse.')) {
      await unlinkPartner();
    }
  };

  const handleLinkPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerCodeInput.trim()) return;

    setLinking(true);
    setLinkResult({});
    const res = await linkPartnerWithCode(partnerCodeInput);
    setLinkResult(res);
    setLinking(false);
    if (res.success) {
      setPartnerCodeInput('');
    }
  };

  const displayCouple = couple || (partner && user ? {
    coupleId: user.coupleId || `couple_${user.uid}`,
    user1Id: user.uid,
    user2Id: partner.uid,
    user1Name: user.displayName,
    user2Name: partner.displayName,
    status: 'active' as const,
    createdAt: new Date().toISOString()
  } : null);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-pink-400" />
            <span>Finanzas en Pareja</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Vinculación de cuentas, gastos compartidos y compensación de saldos
          </p>
        </div>
      </div>

      {/* Couple Relationship Status Card */}
      <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-lg">
        {displayCouple && partner ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600/30 border-2 border-slate-900 text-emerald-400 font-bold flex items-center justify-center">
                  {user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'U1'}
                </div>
                <div className="w-12 h-12 rounded-full bg-pink-600/30 border-2 border-slate-900 text-pink-400 font-bold flex items-center justify-center">
                  {partner.displayName ? partner.displayName.substring(0, 2).toUpperCase() : 'U2'}
                </div>
              </div>

              <div>
                {isEditingPartnerName ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Nombre de tu pareja"
                      className="bg-slate-950 text-white text-xs px-3 py-1.5 rounded-xl border border-pink-500 outline-none font-bold"
                    />
                    <button
                      onClick={handleSavePartnerName}
                      className="px-3 py-1.5 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-xl transition"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setIsEditingPartnerName(false)}
                      className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                      <span>{user?.displayName}</span>
                      <span className="text-slate-400">&</span>
                      <span className="text-pink-300 font-black">{partner.displayName}</span>
                    </h3>

                    <button
                      onClick={() => { setEditingName(partner.displayName); setIsEditingPartnerName(true); }}
                      className="p-1.5 text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition"
                      title="Personalizar nombre de tu pareja"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1 shrink-0">
                      <UserCheck className="w-3 h-3" /> Vinculados
                    </span>
                  </div>
                )}
                
                <p className="text-xs text-slate-400 mt-1">
                  Pareja activa desde {new Date(couple.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 text-right sm:border-l sm:border-slate-800 sm:pl-6">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tu Código de Invitación</span>
                <p className="font-mono text-sm font-bold text-pink-400">{user?.inviteCode}</p>
              </div>
              <button
                onClick={handleUnlinkPartner}
                className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
                title="Desvincular la cuenta de tu pareja"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Desvincular Pareja</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-pink-500/10 text-pink-400 rounded-xl border border-pink-500/20">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Vincular Cuenta de Pareja</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Comparte tu código de invitación con tu pareja o ingresa el código de tu pareja para sincronizar transacciones y saldos en tiempo real.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
              {/* My Code */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-semibold text-slate-400">1. Tu Código de Invitación (Comparte con tu pareja):</label>
                <div className="flex items-center gap-2 mt-2">
                  <div className="font-mono font-bold text-base text-emerald-400 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 flex-1 text-center">
                    {user?.inviteCode}
                  </div>
                  <button
                    onClick={copyCode}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Enter Partner Code */}
              <form onSubmit={handleLinkPartner} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs font-semibold text-slate-400">2. O Ingresa el Código de tu Pareja:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ej. PAREJA-3B14"
                    value={partnerCodeInput}
                    onChange={(e) => setPartnerCodeInput(e.target.value)}
                    className="font-mono uppercase text-sm bg-slate-900 text-white px-3 py-2 rounded-lg border border-slate-800 focus:border-pink-500 outline-none flex-1"
                  />
                  <button
                    type="submit"
                    disabled={linking}
                    className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs rounded-lg transition"
                  >
                    {linking ? 'Vinculando...' : 'Vincular'}
                  </button>
                </div>

                {linkResult.message && (
                  <p className={`text-xs mt-2 ${linkResult.success ? 'text-emerald-400' : 'text-rose-400 font-semibold'}`}>
                    {linkResult.message}
                  </p>
                )}

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-[11px] flex items-start gap-2 mt-3 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <strong className="text-amber-200">¿Problemas al vincular?</strong> Asegúrate de que tu pareja haya iniciado sesión con Google y que ninguno tenga un <em>bloqueador de anuncios (AdBlock/Brave)</em> activo, ya que este bloquea los servidores de Firebase.
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Shared Debt Balance Calculator Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-pink-950/40 p-6 rounded-2xl border border-pink-500/20 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-pink-400">
                Calculadora de Compensación de Saldos
              </span>
              <h3 className="text-xl font-extrabold text-white">¿Quién le debe a quién?</h3>
            </div>
          </div>

          {!sharedDebt.isBalanced && (
            <button
              onClick={() => setShowSettleModal(true)}
              className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-pink-950/40"
            >
              Saldar Deuda
            </button>
          )}
        </div>

        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
          {sharedDebt.isBalanced ? (
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Los gastos están 100% equilibrados. ¡Ninguno le debe al otro!</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-2xl font-black text-white">
                <span className="text-pink-400">{sharedDebt.debtorName}</span> le debe{' '}
                <span className="text-emerald-400">${sharedDebt.amountOwed.toFixed(2)}</span> a{' '}
                <span className="text-teal-300">{sharedDebt.creditorName}</span>
              </div>
              <p className="text-xs text-slate-400">
                Este monto surge de calcular todos los gastos compartidos pagados por cada uno divididos en partes iguales (o según el split configurado).
              </p>
            </div>
          )}
        </div>
      </div>

      {showSettleModal && <SettleDebtModal onClose={() => setShowSettleModal(false)} />}
    </div>
  );
};
