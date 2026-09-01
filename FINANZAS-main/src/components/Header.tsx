import React, { useState } from 'react';
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
  RotateCcw
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

  const copyInviteCode = () => {
    if (!user?.inviteCode) return;
    navigator.clipboard.writeText(user.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleClearData = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar todas las cuentas, transacciones y presupuestos para iniciar de 0?')) {
      setClearing(true);
      await clearAllData();
      setClearing(false);
      setShowProfileMenu(false);
      alert('¡Base de datos iniciada de 0 exitosamente!');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-0 sm:h-16 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo & Firebase Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                DuoFinanzas
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <Flame className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                Firebase
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden md:block">Gestión Personal y Pareja</p>
          </div>
        </div>

        {/* Dual Mode Switcher (Individual vs Pareja) */}
        <div className="bg-slate-100/90 p-1 rounded-xl border border-slate-200 flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={() => setActiveScope('individual')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-1.5 ${
              activeScope === 'individual'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-xs">Mis Finanzas</span>
          </button>
          
          <button
            onClick={() => setActiveScope('shared')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 sm:gap-1.5 ${
              activeScope === 'shared'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-xs">En Pareja</span>
            {couple?.status === 'active' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* Right Action Menu */}
        <div className="flex items-center gap-2">
          
          {/* Start from 0 Button */}
          <button
            onClick={handleClearData}
            disabled={clearing}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold border border-slate-200 transition"
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
                className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {user.displayName ? user.displayName.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-none">{user.displayName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{partner ? `Con ${partner.displayName}` : 'Individual'}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden lg:block" />
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Ingresar</span>
              </button>
            )}

            {/* Profile Dropdown */}
            {showProfileMenu && user && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-lg p-3 z-50 text-slate-800">
                <div className="pb-2 mb-2 border-b border-slate-100">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Usuario Activo</p>
                  <p className="text-sm font-bold text-slate-900">{user.displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  {isDemoMode && (
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
                      Modo Vista Previa
                    </span>
                  )}
                </div>

                {/* Partner Invite Code */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 mb-2">
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
                  <p className="font-mono text-xs font-bold text-slate-900 tracking-wider bg-white px-2 py-1.5 rounded text-center border border-slate-200">
                    {user.inviteCode}
                  </p>
                </div>

                {/* Actions */}
                <div className="space-y-1">
                  <button
                    onClick={handleClearData}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Eliminar todo e Iniciar de 0</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOutUser();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </header>
  );
};
