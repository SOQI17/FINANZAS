import React, { useState } from 'react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInDemoUser } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al conectar con Google.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setErrorMsg('Por favor ingresa tu nombre completo.');
          setSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error en la autenticación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSignUp ? <UserPlus className="w-5 h-5 text-emerald-400" /> : <LogIn className="w-5 h-5 text-emerald-400" />}
            <h2 className="font-bold text-lg">{isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Primary Google Login Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl transition flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-[0.99]"
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
          </div>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">o con correo</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1 block">Nombre Completo:</label>
                <input
                  type="text"
                  placeholder="Ej. Carlos Rodríguez"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required={isSignUp}
                  className="w-full bg-slate-950 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Correo Electrónico:</label>
              <input
                type="email"
                placeholder="tu.email@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 mb-1 block">Contraseña:</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-950 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl transition border border-slate-700"
            >
              {submitting ? 'Procesando...' : isSignUp ? 'Registrarse con Email' : 'Iniciar Sesión con Email'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-slate-400 hover:text-emerald-400 underline"
              >
                {isSignUp ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate gratis'}
              </button>
            </div>
          </form>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-500 text-center uppercase tracking-wider">O prueba con perfiles de demostración:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  signInDemoUser(1);
                  onClose();
                }}
                className="py-2 px-3 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl border border-slate-800 transition text-center"
              >
                Demo: Carlos (U1)
              </button>
              <button
                type="button"
                onClick={() => {
                  signInDemoUser(2);
                  onClose();
                }}
                className="py-2 px-3 bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-medium rounded-xl border border-slate-800 transition text-center"
              >
                Demo: María (U2)
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
