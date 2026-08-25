import React, { useState } from 'react';
import { X, LogIn, UserPlus, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { signInWithEmail, signUpWithEmail, signInDemoUser } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100">
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSignUp ? <UserPlus className="w-5 h-5 text-emerald-400" /> : <LogIn className="w-5 h-5 text-emerald-400" />}
            <h2 className="font-bold text-lg">{isSignUp ? 'Crear Cuenta Firebase' : 'Iniciar Sesión'}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

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
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-950/40"
          >
            {submitting ? 'Procesando...' : isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
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

        </form>
      </div>
    </div>
  );
};
