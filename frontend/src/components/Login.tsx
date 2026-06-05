import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo-white.svg';

interface LoginProps {
  errorInicial?: string;
}

export default function Login({ errorInicial = '' }: LoginProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(errorInicial);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-black p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-fade-in border border-white/10">
        <div className='bg-black flex justify-center px-2 py-4 rounded-xl mb-8'>
          <img src={logo} alt="Logo" className="w-40 self-center" />
        </div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-800 rounded-xl border border-red-200 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Usuario</label>
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                required autoComplete="username" placeholder="usuario"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
            <div className="relative">
              <svg className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="current-password" placeholder="********"
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50 focus:bg-white transition-all" />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all active:scale-[0.97] shadow-lg flex items-center justify-center gap-2 ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 hover:shadow-xl'
            }`}>
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            )}
            {loading ? 'Iniciando sesion...' : 'Iniciar Sesion'}
          </button>
        </form>
      </div>
    </div>
  );
}
