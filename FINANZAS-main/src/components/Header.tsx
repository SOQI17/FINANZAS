import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Wallet,
  Users,
  User,
  Trash2,
  LogOut,
  LogIn,
  Copy,
  Check,
  Heart,
  ChevronDown,
  Flame,
  RotateCcw,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { AuthModal } from './modals/AuthModal';

export const Header: React.FC = () => {
  const { user, partner, couple, isDemoMode, signOutUser } = useAuth();
  const { activeScope, setActiveScope, clearAllData } = useFinance();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (!showProfileMenu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShowProfileMenu(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showProfileMenu]);

  const copyInviteCode = () => {
    if (!user?.inviteCode) return;
    navigator.clipboard.writeText(user.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleClearData = async () => {
    if (window.confirm('¿Seguro que quieres eliminar tus cuentas, movimientos y presupuestos para empezar de 0? Los datos de otras personas no se tocan.')) {
      setClearing(true);
      await clearAllData();
      setClearing(false);
      setShowProfileMenu(false);
      alert('Listo: tus datos se reiniciaron a 0.');
    }
  };

  return (
    <header className="safe-top sticky top-0 z-40 px-2 sm:px-4 sm:pt-3 text-slate-900">
      <div className="glass glass-sheen max-w-7xl mx-auto rounded-2xl sm:rounded-3xl px-2.5 sm:px-5 h-14 sm:h-16 flex items-center justify-between gap-1 sm:gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <img
            src="/logo.png"
            alt="Suma2 Logo"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover ring-1 ring-white/70 shadow-md shrink-0"
          />
          <div className="hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 font-sans">
                Suma2
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-white/60 text-indigo-700 border border-white/80">
                <Flame className="w-3 h-3 text-indigo-600 fill-indigo-600" />
                Firebase
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden md:block">Finanzas en Pareja & Personal</p>
          </div>
        </div>

        {/* Dual Mode Switcher (Individual vs Pareja) */}
        <div className="bg-slate-900/[0.06] p-1 rounded-full border border-white/60 shadow-inner flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            onClick={() => setActiveScope('individual')}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-sm font-semibold transition-all flex items-center gap-1 ${
              activeScope === 'individual'
                ? 'bg-white/90 text-slate-900 shadow-md ring-1 ring-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600" />
            <span>Mis Finanzas</span>
          </button>
          
          <button
            onClick={() => setActiveScope('shared')}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-sm font-semibold transition-all flex items-center gap-1 ${
              activeScope === 'shared'
                ? 'bg-white/90 text-slate-900 shadow-md ring-1 ring-white font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500" />
            <span>En Pareja</span>
            {couple?.status === 'active' && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Right Action Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          
          {/* Start from 0 Button */}
          <button
            onClick={handleClearData}
            disabled={clearing}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 hover:bg-white/80 text-slate-700 text-xs font-semibold border border-white/70 transition"
            title="Elimina todos los registros y empieza desde cero"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{clearing ? 'Limpiando...' : 'Iniciar de 0'}</span>
          </button>

          {/* User Profile / Auth Button */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 p-1 pr-1.5 rounded-full bg-white/50 hover:bg-white/80 border border-white/70 transition"
                aria-label="Abrir perfil"
                aria-expanded={showProfileMenu}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                  {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-none">{user.displayName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{partner ? `Con ${partner.displayName}` : 'Sin pareja vinculada'}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden lg:block" />
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}

            {/* Profile Menu. Rendered in a portal: the header's glass surface (backdrop-filter +
                overflow hidden) would otherwise clip it, which hid it completely on phones. */}
            {showProfileMenu && user && createPortal(
              <>
              <div className="fixed inset-0 z-[60] bg-slate-950/20" onClick={() => setShowProfileMenu(false)} aria-hidden="true" />
              <div
                role="dialog"
                aria-label="Perfil"
                className="glass-strong profile-menu fixed right-2 left-2 sm:left-auto sm:right-4 sm:w-80 rounded-3xl p-4 z-[61] text-slate-800 font-sans"
              >
                <div className="pb-3 mb-3 border-b border-slate-900/[0.06] flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                    {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Mi perfil</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user.displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{partner ? `En pareja con ${partner.displayName}` : 'Sin pareja vinculada'}</span>
                    </p>
                  {isDemoMode && (
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
                      Modo Vista Previa
                    </span>
                  )}
                  </div>
                  <button
                    onClick={() => setShowProfileMenu(false)}
                    className="p-1.5 -mr-1 -mt-1 text-slate-400 hover:text-slate-700 rounded-full shrink-0"
                    aria-label="Cerrar perfil"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Partner Invite Code */}
                <div className="p-2.5 bg-white/60 rounded-2xl border border-white/80 mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" /> Código Invitación:
                    </span>
                    <button
                      onClick={copyInviteCode}
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-900 tracking-wider bg-white/80 px-2 py-1.5 rounded-xl text-center border border-white">
                    {user.inviteCode}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-1">
                  <button
                    onClick={handleClearData}
                    className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-slate-700 hover:bg-white/70 flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Eliminar todo e Iniciar de 0</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOutUser();
                    }}
                    className="w-full px-3 py-3 rounded-2xl text-sm text-rose-600 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/70 flex items-center justify-center gap-2 font-bold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
              </>,
              document.body
            )}
          </div>

        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </header>
  );
};
