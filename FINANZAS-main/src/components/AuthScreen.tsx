import React, { useState } from 'react';
import { Wallet, LogIn, UserPlus, KeyRound, ArrowRight, Heart, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, resetPassword, signInDemoUser } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearState = () => {
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleGoogleSignIn = async () => {
    clearState();
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearState();
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else if (mode === 'register') {
        if (!displayName.trim()) {
          setErrorMsg('Por favor ingresa tu nombre completo.');
          setSubmitting(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('Las contraseñas no coinciden.');
          setSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('¡Correo enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 relative overflow-hidden font-sans">
      
      {/* Dynamic Background Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Suma2 Logo"
            className="w-10 h-10 rounded-2xl border border-slate-700/80 shadow-lg object-cover"
          />
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              Suma2
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400">Finanzas Personales & en Pareja</p>
          </div>
        </div>

        <button
          onClick={() => signInDemoUser(1)}
          className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Ver Modo Demo</span>
        </button>
      </header>

      {/* Central Auth Container */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-6">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-950/80">
          
          {/* Card Header Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {mode === 'login' && 'Bienvenido de Nuevo'}
              {mode === 'register' && 'Crea tu Cuenta Gratis'}
              {mode === 'forgot' && 'Recuperar Contraseña'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login' && 'Ingresa a tu cuenta para gestionar tus gastos y presupuestos'}
              {mode === 'register' && 'Empieza a organizar tus finanzas solo o con tu pareja'}
              {mode === 'forgot' && 'Te enviaremos un enlace de restablecimiento a tu email'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); clearState(); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); clearState(); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Quick Login Button (Visible in login & register modes) */}
          {mode !== 'forgot' && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl transition flex items-center justify-center gap-3 shadow-lg active:scale-[0.99]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{submitting ? 'Conectando...' : 'Continuar con Google'}</span>
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">o con correo</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'register' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Nombre Completo:</label>
                <input
                  type="text"
                  placeholder="Ej. Carlos Rodríguez"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-2xl border border-slate-800 focus:border-indigo-500 outline-none transition"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Correo Electrónico:</label>
              <input
                type="email"
                placeholder="tu.email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-2xl border border-slate-800 focus:border-indigo-500 outline-none transition"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400 block">Contraseña:</label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); clearState(); }}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-2xl border border-slate-800 focus:border-indigo-500 outline-none transition"
                />
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Confirmar Contraseña:</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-slate-950 text-white text-sm px-4 py-3 rounded-2xl border border-slate-800 focus:border-indigo-500 outline-none transition"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>
                {submitting
                  ? 'Procesando...'
                  : mode === 'login'
                  ? 'Iniciar Sesión'
                  : mode === 'register'
                  ? 'Crear Cuenta'
                  : 'Enviar Correo de Recuperación'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {mode === 'forgot' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); clearState(); }}
                  className="text-xs text-slate-400 hover:text-indigo-400 underline"
                >
                  ← Volver al Inicio de Sesión
                </button>
              </div>
            )}

          </form>

          {/* Demo Button for Mobile */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => signInDemoUser(1)}
              className="text-xs text-slate-400 hover:text-amber-300 transition flex items-center justify-center gap-1.5 mx-auto font-medium"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>¿Quieres probar la app primero? Entrar en Modo Demo</span>
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-slate-500 py-3">
        DuoFinanzas © {new Date().getFullYear()} • Control Financiero Inteligente
      </footer>

    </div>
  );
};
