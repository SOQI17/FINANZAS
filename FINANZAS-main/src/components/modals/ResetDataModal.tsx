import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';

interface ResetDataModalProps {
  onClose: () => void;
}

// The exact word the user must type in step 2
const CONFIRM_WORD = 'BORRAR';

/**
 * Two-step confirmation for "Iniciar de 0": first a warning with what will be deleted,
 * then typing a confirmation word. Rendered in a portal so no parent can clip it.
 */
export const ResetDataModal: React.FC<ResetDataModalProps> = ({ onClose }) => {
  const { clearAllData } = useFinance();
  const { partner } = useAuth();
  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [typed, setTyped] = useState('');
  const [clearing, setClearing] = useState(false);

  const canDelete = typed.trim().toUpperCase() === CONFIRM_WORD && !clearing;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !clearing) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearing, onClose]);

  const handleDelete = async () => {
    if (!canDelete) return;
    setClearing(true);
    await clearAllData();
    setClearing(false);
    setStep('done');
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 font-sans"
      onClick={() => !clearing && onClose()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        className="w-full sm:max-w-md bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-rose-200 overflow-hidden pb-[env(safe-area-inset-bottom)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-rose-600 to-red-700 text-white flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              {step === 'done' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-100">
                {step === 'done' ? 'Listo' : `Paso ${step} de 2`}
              </p>
              <h2 id="reset-title" className="text-lg font-black leading-tight">
                {step === 'done' ? 'Tus datos se reiniciaron' : 'Eliminar todo e iniciar de 0'}
              </h2>
            </div>
          </div>
          {!clearing && (
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/15 shrink-0" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4 text-sm">
          {step === 1 && (
            <>
              <p className="text-slate-700">Esto <b>borrará para siempre</b> y no se puede deshacer:</p>
              <ul className="space-y-1.5 text-slate-700">
                <li className="flex gap-2"><span className="text-rose-600 font-bold">•</span> Todas <b>tus cuentas</b> y sus saldos.</li>
                <li className="flex gap-2"><span className="text-rose-600 font-bold">•</span> Todos <b>tus movimientos personales</b>.</li>
                <li className="flex gap-2"><span className="text-rose-600 font-bold">•</span> Todos <b>tus presupuestos</b>.</li>
                {!partner && (
                  <li className="flex gap-2"><span className="text-rose-600 font-bold">•</span> Los movimientos compartidos que registraste.</li>
                )}
              </ul>
              <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                {partner
                  ? `Los gastos compartidos con ${partner.displayName} se conservan, porque forman parte de la deuda de los dos. Los datos de otras personas no se tocan.`
                  : 'Los datos de otras personas no se tocan.'}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold"
                >
                  Continuar
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <label htmlFor="reset-confirm" className="block text-slate-700">
                Para confirmar, escribe <b className="font-mono text-rose-700">{CONFIRM_WORD}</b>:
              </label>
              <input
                id="reset-confirm"
                type="text"
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
                value={typed}
                onChange={e => setTyped(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleDelete(); }}
                placeholder={CONFIRM_WORD}
                className="w-full px-4 py-3 rounded-2xl border-2 border-rose-200 focus:border-rose-500 outline-none font-mono text-base tracking-widest uppercase"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setStep(1); setTyped(''); }}
                  disabled={clearing}
                  className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold disabled:opacity-50"
                >
                  Atrás
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canDelete}
                  className="py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-rose-600/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{clearing ? 'Eliminando...' : 'Eliminar todo'}</span>
                </button>
              </div>
            </>
          )}

          {step === 'done' && (
            <>
              <p className="text-slate-700">Tus cuentas, movimientos y presupuestos se eliminaron. Ya puedes empezar de 0.</p>
              <button onClick={onClose} className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold">
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
